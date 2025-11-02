export interface CameraParams {
    sensorWidth: number;   // in mm
    sensorHeight: number;  // in mm
    focalLength: number;   // in mm
    imageWidth: number;    // in pixels
    imageHeight: number;   // in pixels
}

export interface FlightParams {
    altitude: number;      // in meters
    frontOverlap: number;  // in percentage
    sideOverlap: number;   // in percentage
    speed: number;         // in m/s
    gimbalPitch: number;   // in degrees
    flightDirection: number; // in degrees from North
    altitudeMode: 'relative' | 'agl';
}

export interface Waypoint {
    lat: number;
    lng: number;
    altitude: number;
    heading: number;
    gimbalPitch: number;
    speed: number;
}

export interface DisplayParams {
    pathWidth: number;     // in pixels
    waypointRadius: number;// in pixels
}

export interface FilterParams {
    enabled: boolean;
    keepStart: number;
    keepEnd: number;
}

export interface Stats {
    totalWaypoints: number;
    flightLines: number;
    flightTime: string; // Formatted as MM:SS
    totalDistance: string; // Formatted as X.XX km
    photoCount: number;
    dataVolume: string; // Formatted as X.XX GP
}

export interface LogMessage {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
  timestamp: string;
}