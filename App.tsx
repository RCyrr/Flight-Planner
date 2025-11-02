import React, { useState, useCallback, useEffect } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { MapComponent } from './components/MapComponent';
import { generateFlightPlan } from './services/flightPlanner';
import { generateCsv } from './services/csvGenerator';
import { generateWpml, getTemplateKml } from './services/wpmlGenerator';
import { generateKml } from './services/kmlGenerator';
import { getElevations } from './services/elevationService';
import { DJI_MINI_4_PRO_CAMERA } from './constants';
import type { CameraParams, FlightParams, Waypoint, DisplayParams, FilterParams, Stats, LogMessage } from './types';
import type { FeatureCollection, Feature, Polygon as TurfPolygon, MultiPolygon as TurfMultiPolygon } from 'geojson';
import type { LatLngBoundsExpression } from 'leaflet';
import saveAs from 'file-saver';
import * as turf from '@turf/turf';
import JSZip from 'jszip';
import shp from 'shpjs';
import LogPanel from './components/LogPanel';


const App: React.FC = () => {
  const [flightParams, setFlightParams] = useState<FlightParams>({
    altitude: 100,
    frontOverlap: 80,
    sideOverlap: 70,
    speed: 10,
    gimbalPitch: -90,
    flightDirection: 0,
    altitudeMode: 'relative',
  });

  const [displayParams, setDisplayParams] = useState<DisplayParams>({
    pathWidth: 2,
    waypointRadius: 3,
  });
  
  const [filterParams, setFilterParams] = useState<FilterParams>({
    enabled: false,
    keepStart: 2,
    keepEnd: 2,
  });

  const [cameraParams, setCameraParams] = useState<CameraParams>(DJI_MINI_4_PRO_CAMERA);
  const [surveyArea, setSurveyArea] = useState<FeatureCollection<TurfPolygon | TurfMultiPolygon> | null>(null);
  
  // States for the final, potentially filtered, data to be displayed
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [footprints, setFootprints] = useState<FeatureCollection | null>(null);

  // States for the original, unfiltered flight plan
  const [originalWaypoints, setOriginalWaypoints] = useState<Waypoint[][]>([]);
  const [originalFootprints, setOriginalFootprints] = useState<FeatureCollection<TurfPolygon> | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingTerrain, setIsFetchingTerrain] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  // State for map zoom
  const [mapBounds, setMapBounds] = useState<LatLngBoundsExpression | null>(null);
  
  // State for logging
  const [logMessages, setLogMessages] = useState<LogMessage[]>([]);
  const [isLogVisible, setIsLogVisible] = useState(false);

  const addLogMessage = (message: string, type: 'success' | 'error' | 'info') => {
    const newLog: LogMessage = {
        id: Date.now() + Math.random(), // Add random number to avoid key collision on rapid calls
        timestamp: new Date().toLocaleTimeString(),
        type,
        message,
    };
    setLogMessages(prev => [newLog, ...prev]);
    setIsLogVisible(true);
  };

  // Effect to calculate mission statistics
  useEffect(() => {
    if (waypoints.length === 0 || !originalWaypoints.length) {
      setStats(null);
      return;
    }

    // Calculate total distance
    let totalDistance = 0;
    if (waypoints.length > 1) {
      for (let i = 0; i < waypoints.length - 1; i++) {
        const from = turf.point([waypoints[i].lng, waypoints[i].lat]);
        const to = turf.point([waypoints[i + 1].lng, waypoints[i + 1].lat]);
        totalDistance += turf.distance(from, to, { units: 'meters' });
      }
    }

    // Calculate flight time
    const flightTimeSeconds = totalDistance / flightParams.speed;
    const minutes = Math.floor(flightTimeSeconds / 60);
    const seconds = Math.floor(flightTimeSeconds % 60);
    const flightTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Calculate data volume
    const photoCount = waypoints.length;
    const totalPixels = photoCount * cameraParams.imageWidth * cameraParams.imageHeight;
    const dataVolume = (totalPixels / 1e9).toFixed(2); // Gigapixels

    setStats({
      totalWaypoints: waypoints.length,
      flightLines: originalWaypoints.length,
      flightTime,
      totalDistance: (totalDistance / 1000).toFixed(2), // in km
      photoCount,
      dataVolume,
    });
  }, [waypoints, originalWaypoints, flightParams.speed, cameraParams]);

  // Effect to apply filtering when parameters or original data change
  useEffect(() => {
    if (!originalWaypoints.length || !originalFootprints) {
      setWaypoints([]);
      setFootprints(null);
      return;
    }

    if (!filterParams.enabled) {
      setWaypoints(originalWaypoints.flat());
      setFootprints(originalFootprints);
      return;
    }

    const newFilteredWaypoints: Waypoint[] = [];
    const newFilteredFootprints: Feature<TurfPolygon>[] = [];
    
    let flatWaypointIndex = 0;
    
    originalWaypoints.forEach(line => {
      const lineLength = line.length;
      if (lineLength <= filterParams.keepStart + filterParams.keepEnd) {
        newFilteredWaypoints.push(...line);
        for (let i = 0; i < lineLength; i++) {
          if (originalFootprints.features[flatWaypointIndex + i]) {
             newFilteredFootprints.push(originalFootprints.features[flatWaypointIndex + i]);
          }
        }
      } else {
        const startWps = line.slice(0, filterParams.keepStart);
        const endWps = line.slice(lineLength - filterParams.keepEnd);
        
        newFilteredWaypoints.push(...startWps, ...endWps);
        
        for (let i = 0; i < filterParams.keepStart; i++) {
            if (originalFootprints.features[flatWaypointIndex + i]) {
                newFilteredFootprints.push(originalFootprints.features[flatWaypointIndex + i]);
            }
        }
        for (let i = 0; i < filterParams.keepEnd; i++) {
            const indexInLine = lineLength - filterParams.keepEnd + i;
             if (originalFootprints.features[flatWaypointIndex + indexInLine]) {
                newFilteredFootprints.push(originalFootprints.features[flatWaypointIndex + indexInLine]);
            }
        }
      }
      flatWaypointIndex += lineLength;
    });

    setWaypoints(newFilteredWaypoints);
    setFootprints(turf.featureCollection(newFilteredFootprints));

  }, [filterParams, originalWaypoints, originalFootprints]);


  const handleGeneratePlan = useCallback(() => {
    if (!surveyArea || surveyArea.features.length === 0) {
      setError("Please draw or import a survey area on the map first.");
      return;
    }
    setError(null);
    setIsLoading(true);
    
    setTimeout(() => {
        try {
            let combinedGeometry: TurfPolygon | TurfMultiPolygon | null = null;
            const polygons = surveyArea.features.filter(
                (f): f is Feature<TurfPolygon | TurfMultiPolygon> =>
                    f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'
            );

            if (polygons.length === 0) {
                throw new Error("Survey area contains no valid polygon features.");
            }

            if (polygons.length > 1) {
                // Use spread operator with turf.union
                const unionResult = turf.union(...polygons);
                combinedGeometry = unionResult.geometry;
            } else {
                combinedGeometry = polygons[0].geometry;
            }
            
            if (combinedGeometry) {
                const { waypoints: generatedWaypoints, footprints: generatedFootprints } = generateFlightPlan(combinedGeometry, flightParams, cameraParams);
                setOriginalWaypoints(generatedWaypoints);
                setOriginalFootprints(generatedFootprints);
                addLogMessage(`Flight plan generated with ${generatedWaypoints.flat().length} waypoints.`, 'success');
            } else {
                 throw new Error("Failed to process survey area geometry.");
            }

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during flight plan generation.";
            addLogMessage(errorMessage, 'error');
            setOriginalWaypoints([]);
            setOriginalFootprints(null);
            setWaypoints([]);
            setFootprints(null);
        } finally {
            setIsLoading(false);
        }
    }, 50);

  }, [surveyArea, flightParams, cameraParams]);

  const handleFetchTerrainData = useCallback(async () => {
    if (originalWaypoints.flat().length === 0) {
        setError("Generate a flight plan before fetching terrain data.");
        return;
    }
    setIsFetchingTerrain(true);
    setError(null);

    try {
        const flatWaypoints = originalWaypoints.flat();
        addLogMessage(`Fetching terrain data for ${flatWaypoints.length} waypoints...`, 'info');
        const elevations = await getElevations(flatWaypoints);

        let waypointIndex = 0;
        const newOriginalWaypoints = originalWaypoints.map(line => {
            return line.map(wp => {
                const elevation = elevations[waypointIndex];
                waypointIndex++;
                if (elevation === null) {
                    console.warn(`Could not fetch elevation for waypoint at ${wp.lat}, ${wp.lng}. Using original relative altitude.`);
                    return wp;
                }
                return {
                    ...wp,
                    altitude: Number((elevation + flightParams.altitude).toFixed(2)),
                };
            });
        });

        setOriginalWaypoints(newOriginalWaypoints);
        addLogMessage('Terrain data fetched and applied successfully.', 'success');

    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred while fetching terrain data.";
        addLogMessage(errorMessage, 'error');
    } finally {
        setIsFetchingTerrain(false);
    }
  }, [originalWaypoints, flightParams.altitude]);

  const handleDownloadCsv = () => {
    if (waypoints.length === 0) {
      setError("No waypoints generated to download.");
      return;
    }
    setError(null);
    try {
      const csvString = generateCsv(waypoints, flightParams);
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, 'dji_flight_plan.csv');
      addLogMessage('Downloaded Litchi (.csv) file.', 'info');
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Failed to generate CSV file.";
      addLogMessage(errorMessage, 'error');
    }
  };

  const handleDownloadKmz = async () => {
    if (waypoints.length === 0) {
      setError("No waypoints generated to download.");
      return;
    }
    setError(null);
    try {
      const zip = new JSZip();
      const templateKmlContent = getTemplateKml();
      const waylinesWpmlContent = generateWpml(waypoints, flightParams);

      zip.file('template.kml', templateKmlContent);
      zip.file('waylines.wpml', waylinesWpmlContent);
      
      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, 'dji_flight_plan.kmz');
      addLogMessage('Downloaded DJI WPML (.kmz) file.', 'info');

    } catch(e) {
      const errorMessage = e instanceof Error ? e.message : "Failed to generate KMZ file.";
      addLogMessage(errorMessage, 'error');
    }
  };

  const handleDownloadKml = () => {
    if (waypoints.length === 0) {
      setError("No waypoints to download.");
      return;
    }
    setError(null);
    try {
      const kmlString = generateKml(waypoints);
      const blob = new Blob([kmlString], { type: 'application/vnd.google-earth.kml+xml;charset=utf-8;' });
      saveAs(blob, 'google_earth_flight_plan.kml');
      addLogMessage('Downloaded Google Earth (.kml) file.', 'info');
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Failed to generate KML file.";
      addLogMessage(errorMessage, 'error');
    }
  };

  const handleImportShapefile = async (file: File) => {
    setError(null);
    setIsLoading(true);
    addLogMessage(`Importing ${file.name}...`, 'info');
    try {
      const buffer = await file.arrayBuffer();
      
      const zip = await JSZip.loadAsync(buffer);
      const filesInZip = Object.keys(zip.files).map(f => f.toLowerCase());
      
      const hasShp = filesInZip.some(name => name.endsWith('.shp'));
      const hasShx = filesInZip.some(name => name.endsWith('.shx'));
      const hasDbf = filesInZip.some(name => name.endsWith('.dbf'));

      if (!hasShp || !hasShx || !hasDbf) {
          throw new Error("Invalid shapefile .zip. It must contain at least .shp, .shx, and .dbf files.");
      }

      const prjFile = Object.keys(zip.files).find(name => name.toLowerCase().endsWith('.prj'));
      if (prjFile) {
          const prjContent = await zip.files[prjFile].async('string');
          const isWGS84 = /WGS_1984|WGS 84|4326/.test(prjContent);
          if (!isWGS84) {
              throw new Error("Invalid Coordinate System. Please ensure the shapefile uses WGS84 (EPSG:4326).");
          }
      } 

      const geojson = await shp(buffer) as FeatureCollection;
      
      const polygons = geojson.features.filter(
        f => f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'
      ) as Feature<TurfPolygon | TurfMultiPolygon>[];

      if (polygons.length === 0) {
        throw new Error("The imported shapefile contains no valid polygon features. Please ensure it contains polygons, not points or polylines.");
      }

      const newFeatures = turf.featureCollection(polygons);
      setSurveyArea(prev => turf.featureCollection([...(prev?.features || []), ...newFeatures.features]));
      addLogMessage(`Successfully imported ${polygons.length} polygon(s).`, 'success');
      
      // Zoom to extent of newly imported polygons
      const bbox = turf.bbox(newFeatures);
      const [minLng, minLat, maxLng, maxLat] = bbox;
      setMapBounds([[minLat, minLng], [maxLat, maxLng]]);
      
      clearFlightPlan(); // Clear previous flight plan if any
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Failed to import or parse shapefile.";
      addLogMessage(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const clearPlan = () => {
    setWaypoints([]);
    setFootprints(null);
    setOriginalWaypoints([]);
    setOriginalFootprints(null);
    setSurveyArea(null);
    setError(null);
    setStats(null);
    setMapBounds(null);
    addLogMessage('Cleared all data.', 'info');
  };
  
  const clearFlightPlan = () => {
    setWaypoints([]);
    setFootprints(null);
    setOriginalWaypoints([]);
    setOriginalFootprints(null);
    setStats(null);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen font-sans text-white bg-gray-900">
      <ControlPanel
        params={flightParams}
        setParams={setFlightParams}
        cameraParams={cameraParams}
        setCameraParams={setCameraParams}
        displayParams={displayParams}
        setDisplayParams={setDisplayParams}
        filterParams={filterParams}
        setFilterParams={setFilterParams}
        onGenerate={handleGeneratePlan}
        onDownloadCsv={handleDownloadCsv}
        onDownloadKmz={handleDownloadKmz}
        onDownloadKml={handleDownloadKml}
        onClear={clearPlan}
        onFetchTerrain={handleFetchTerrainData}
        onImportShapefile={handleImportShapefile}
        isLoading={isLoading}
        isFetchingTerrain={isFetchingTerrain}
        error={error}
        hasPolygon={!!surveyArea && surveyArea.features.length > 0}
        hasWaypoints={waypoints.length > 0}
        stats={stats}
      />
      <main className="flex-grow h-full w-full relative">
        <MapComponent 
            surveyArea={surveyArea} 
            setSurveyArea={setSurveyArea} 
            waypoints={waypoints}
            footprints={footprints}
            clearFlightPlan={clearFlightPlan}
            displayParams={displayParams}
            mapBounds={mapBounds}
        />
      </main>
      <LogPanel 
        messages={logMessages}
        isVisible={isLogVisible}
        onToggle={() => setIsLogVisible(!isLogVisible)}
        onClear={() => setLogMessages([])}
      />
    </div>
  );
};

export default App;