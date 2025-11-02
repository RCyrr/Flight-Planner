import type { CameraParams, FlightParams, Waypoint } from '../types';
import type { Polygon, MultiPolygon } from 'geojson';
import * as turf from '@turf/turf';

interface FlightPlanResult {
    waypoints: Waypoint[][];
    footprints: turf.helpers.FeatureCollection<turf.helpers.Polygon>;
}

export function generateFlightPlan(
  geometry: Polygon | MultiPolygon,
  flightParams: FlightParams,
  cameraParams: CameraParams
): FlightPlanResult {
  // 1. Calculate Ground Sample Distance (GSD) and footprint
  const gsd = (flightParams.altitude * cameraParams.sensorWidth) / (cameraParams.focalLength * cameraParams.imageWidth);
  const footprintWidth = gsd * cameraParams.imageWidth; // across track
  const footprintHeight = gsd * cameraParams.imageHeight; // along track

  // 2. Calculate distances between photos (along-track) and lines (across-track)
  const distanceAlongTrack = footprintHeight * (1 - flightParams.frontOverlap / 100);
  const distanceSideTrack = footprintWidth * (1 - flightParams.sideOverlap / 100);

  if (distanceSideTrack <= 0 || distanceAlongTrack <= 0) {
      throw new Error("Overlap values must be less than 100%.");
  }

  const surveyFeature = turf.feature(geometry);

  // 3. Use the user-defined flight direction
  const bearing = flightParams.flightDirection;

  // 4. Create a bounding box and rotate it to align with flight direction
  const center = turf.centerOfMass(surveyFeature);
  // Rotate polygon so that flight lines are horizontal
  const rotatedFeature = turf.transformRotate(surveyFeature, -bearing, { pivot: center.geometry.coordinates });
  const rotatedBbox = turf.bbox(rotatedFeature);

  // 5. Generate flight lines across the rotated bounding box
  const flightLines: turf.helpers.Feature<turf.helpers.LineString>[] = [];
  const [minX, minY, maxX, maxY] = rotatedBbox;
  
  let currentY = minY;
  while (currentY <= maxY) {
    const startPoint = turf.point([minX, currentY]);
    const endPoint = turf.point([maxX, currentY]);
    
    const line = turf.lineString([startPoint.geometry.coordinates, endPoint.geometry.coordinates]);
    const intersection = turf.lineIntersect(line, rotatedFeature);

    if (intersection.features.length > 0) {
        const coords = intersection.features.map(f => f.geometry.coordinates);
        if (coords.length > 1) {
            coords.sort((a, b) => a[0] - b[0]);
            for (let i = 0; i < coords.length; i += 2) {
                if (coords[i+1]) {
                    flightLines.push(turf.lineString([coords[i], coords[i+1]]));
                }
            }
        }
    }
    
    currentY += turf.lengthToDegrees(distanceSideTrack, 'meters');
  }

  // 6. Generate waypoints along each flight line segment
  const waypointsByLine: turf.helpers.Feature<turf.helpers.Point>[][] = [];
  flightLines.forEach((line, index) => {
    const lineLength = turf.length(line, { units: 'meters' });
    const waypointsOnLine: turf.helpers.Feature<turf.helpers.Point>[] = [];
    
    for (let d = 0; d <= lineLength; d += distanceAlongTrack) {
        waypointsOnLine.push(turf.along(line, d, { units: 'meters' }));
    }
    // Ensure the last point of the line is included if it wasn't reached by the step
    if (lineLength > 0 && turf.distance(waypointsOnLine[waypointsOnLine.length-1], turf.point(line.geometry.coordinates[1]), {units: 'meters'}) > 1) {
        waypointsOnLine.push(turf.point(line.geometry.coordinates[1]));
    }

    if (index % 2 !== 0) {
      waypointsOnLine.reverse();
    }
    waypointsByLine.push(waypointsOnLine);
  });

  const allWaypoints = waypointsByLine.flat();

  // 7. Rotate waypoints back to original orientation
  const finalWaypoints = allWaypoints.map(wp => turf.transformRotate(wp, bearing, { pivot: center.geometry.coordinates }));
  
  if (finalWaypoints.length === 0) {
      throw new Error("Could not generate waypoints. The survey area may be too small for the given parameters.");
  }

  // 8. Format waypoints and calculate footprints
  const footprintPolygons: turf.helpers.Feature<turf.helpers.Polygon>[] = [];
  const formattedWaypoints: Waypoint[] = finalWaypoints.map((wp, i) => {
    const nextWp = finalWaypoints[i + 1] || finalWaypoints[i-1] || wp;
    const heading = turf.bearing(wp, nextWp);
    
    const coords = wp.geometry.coordinates;

    // Calculate footprint corners
    const halfAlongTrackM = footprintHeight / 2;
    const halfAcrossTrackM = footprintWidth / 2;

    const forwardCenter = turf.destination(coords, halfAlongTrackM, heading, { units: 'meters' });
    const backwardCenter = turf.destination(coords, halfAlongTrackM, heading - 180, { units: 'meters' });
    
    const tl = turf.destination(forwardCenter, halfAcrossTrackM, heading - 90, { units: 'meters' });
    const tr = turf.destination(forwardCenter, halfAcrossTrackM, heading + 90, { units: 'meters' });
    const br = turf.destination(backwardCenter, halfAcrossTrackM, heading + 90, { units: 'meters' });
    const bl = turf.destination(backwardCenter, halfAcrossTrackM, heading - 90, { units: 'meters' });

    const footprintPoly = turf.polygon([[
        tl.geometry.coordinates,
        tr.geometry.coordinates,
        br.geometry.coordinates,
        bl.geometry.coordinates,
        tl.geometry.coordinates,
    ]]);
    footprintPolygons.push(footprintPoly);

    return {
      lat: coords[1],
      lng: coords[0],
      altitude: flightParams.altitude,
      heading: heading < 0 ? heading + 360 : heading,
      gimbalPitch: flightParams.gimbalPitch,
      speed: flightParams.speed,
    };
  });
  
  // Re-structure formatted waypoints into lines
  const finalWaypointsByLine: Waypoint[][] = [];
  let currentIndex = 0;
  waypointsByLine.forEach(line => {
      const lineWaypoints = formattedWaypoints.slice(currentIndex, currentIndex + line.length);
      finalWaypointsByLine.push(lineWaypoints);
      currentIndex += line.length;
  });


  return {
      waypoints: finalWaypointsByLine,
      footprints: turf.featureCollection(footprintPolygons),
  };
}