import React, { useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, FeatureGroup, Polyline, CircleMarker, GeoJSON, LayersControl, useMap } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L, { LatLngBoundsExpression } from 'leaflet';
import 'leaflet-draw';
import * as turf from '@turf/turf';
import type { Waypoint, DisplayParams } from '../types';
import type { FeatureCollection } from 'geojson';
import GeoSearchControlComponent from './GeoSearchControl';

// Fix for default icon issue with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});


interface MapComponentProps {
    surveyArea: FeatureCollection | null;
    setSurveyArea: (area: FeatureCollection | null) => void;
    waypoints: Waypoint[];
    footprints: FeatureCollection | null;
    clearFlightPlan: () => void;
    displayParams: DisplayParams;
    mapBounds: LatLngBoundsExpression | null;
}

const MapUpdater: React.FC<{ mapBounds: LatLngBoundsExpression | null }> = ({ mapBounds }) => {
    const map = useMap();
    useEffect(() => {
        if (mapBounds) {
            map.fitBounds(mapBounds, { padding: [50, 50] });
        }
    }, [mapBounds, map]);
    return null;
}

export const MapComponent: React.FC<MapComponentProps> = ({ surveyArea, setSurveyArea, waypoints, footprints, clearFlightPlan, displayParams, mapBounds }) => {
    const featureGroupRef = useRef<L.FeatureGroup>(null);
  
    const updateStateFromMap = useCallback(() => {
        const fg = featureGroupRef.current;
        if (!fg) return;

        const features: GeoJSON.Feature[] = [];
        fg.eachLayer((layer: any) => {
            if (layer.toGeoJSON) {
                features.push(layer.toGeoJSON());
            }
        });

        if (features.length > 0) {
            setSurveyArea(turf.featureCollection(features));
        } else {
            setSurveyArea(null);
        }
        clearFlightPlan();
    }, [setSurveyArea, clearFlightPlan]);

    const onCreated = (e: any) => {
        // When drawing a new polygon, it replaces all existing ones.
        const layer = e.layer;
        const geoJSON = layer.toGeoJSON();
        setSurveyArea(turf.featureCollection([geoJSON]));
        clearFlightPlan();
    };
    
    const onEdited = () => {
        updateStateFromMap();
    };
    
    const onDeleted = () => {
        updateStateFromMap();
    };

    // This effect syncs the surveyArea state (source of truth) to the map layers.
    // This is crucial for showing imported polygons.
    useEffect(() => {
        const fg = featureGroupRef.current;
        if (!fg) return;

        // Don't modify layers while drawing
        const drawControl = (fg as any)._map.pm;
        if (drawControl && drawControl.globalDrawModeEnabled()) {
            return;
        }

        fg.clearLayers();
        if (surveyArea) {
            const surveyLayer = L.geoJSON(surveyArea, {
                style: {
                    color: '#4f46e5',
                    weight: 2,
                    fillOpacity: 0.1
                }
            });
            surveyLayer.eachLayer(layer => fg.addLayer(layer));
        }
    }, [surveyArea]);


    return (
        <MapContainer center={[51.505, -0.09]} zoom={13} style={{ height: '100%', width: '100%', backgroundColor: '#1a202c' }}>
            <MapUpdater mapBounds={mapBounds} />
            <LayersControl position="topright">
                <LayersControl.BaseLayer checked name="Satellite Imagery">
                    <TileLayer
                        attribution='&copy; <a href="https://www.esri.com/en-us/home">Esri</a>, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Street Map">
                     <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Topographic Map">
                    <TileLayer
                        attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
                        url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                    />
                </LayersControl.BaseLayer>
            </LayersControl>
            
            <GeoSearchControlComponent />

            <FeatureGroup ref={featureGroupRef}>
                <EditControl
                    position="topright"
                    onCreated={onCreated}
                    onEdited={onEdited}
                    onDeleted={onDeleted}
                    draw={{
                        rectangle: false,
                        circle: false,
                        circlemarker: false,
                        marker: false,
                        polyline: false,
                        polygon: {
                            allowIntersection: false,
                            shapeOptions: {
                                color: '#4f46e5',
                                weight: 2,
                                fillOpacity: 0.1
                            },
                        },
                    }}
                />
            </FeatureGroup>
            
            {footprints && (
                <GeoJSON 
                    key={JSON.stringify(footprints)} // Force re-render on data change
                    data={footprints}
                    style={() => ({
                        color: '#f59e0b', // amber-500
                        weight: 0.5,
                        fillOpacity: 0.1,
                    })}
                />
            )}

            {waypoints.length > 0 && (
                <>
                    <Polyline
                        pathOptions={{ color: '#34d399', weight: displayParams.pathWidth, opacity: 0.8 }}
                        positions={waypoints.map(wp => [wp.lat, wp.lng])}
                    />
                    {waypoints.map((wp, index) => (
                        <CircleMarker
                            key={index}
                            center={[wp.lat, wp.lng]}
                            pathOptions={{ color: '#34d399', fillColor: '#a7f3d0', fillOpacity: 1 }}
                            radius={displayParams.waypointRadius}
                        >
                        </CircleMarker>
                    ))}
                </>
            )}
        </MapContainer>
    );
};