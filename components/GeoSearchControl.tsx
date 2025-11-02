import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import L from 'leaflet';

// leaflet-geosearch's TS types might not be perfectly aligned with leaflet's, this helps.
type GeoSearchControlInstance = L.Control & {
    // This is an empty interface, but it helps satisfy TypeScript's type checking
};

const GeoSearchControlComponent = () => {
  const map = useMap();

  useEffect(() => {
    const provider = new OpenStreetMapProvider();
    
    // The type assertion is needed because the library's Control is not directly L.Control
    const searchControl = new GeoSearchControl({
      provider: provider,
      style: 'bar',
      showMarker: true,
      showPopup: false,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
      keepResult: true,
    }) as GeoSearchControlInstance;
    
    map.addControl(searchControl);
    
    return () => {
      map.removeControl(searchControl);
    };
  }, [map]);

  return null;
};

export default GeoSearchControlComponent;
