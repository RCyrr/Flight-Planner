import type { Waypoint, FlightParams } from '../types';

/**
 * Generates a CSV string in the detailed Litchi format from an array of waypoints.
 * This format includes 47 columns, uses a semicolon delimiter, and supports multiple actions.
 */
export function generateCsv(waypoints: Waypoint[], flightParams: FlightParams): string {
  const header = [
    'latitude', 'longitude', 'altitude(m)', 'heading(deg)', 'curvesize(m)',
    'rotationdir', 'gimbalmode', 'gimbalpitchangle',
    ...Array.from({ length: 15 }, (_, i) => [`actiontype${i + 1}`, `actionparam${i + 1}`]).flat(),
    'altitudemode', 'speed(m/s)', 'poi_latitude', 'poi_longitude', 'poi_altitude(m)',
    'poi_altitudemode', 'photo_timeinterval', 'photo_distinterval'
  ].join(';');

  const rows = waypoints.map((wp) => {
    // Litchi altitude mode: 0 for Above Ground (relative), 1 for Above Sea Level (for AGL terrain following)
    const altitudeMode = flightParams.altitudeMode === 'agl' ? 1 : 0;
    
    // Initialize all 15 actions to "No Action"
    const actions = Array(15).fill([-1, 0]);

    // Action 1: Tilt Gimbal to the specified pitch
    actions[0] = [5, wp.gimbalPitch]; // 5 = TILT_GIMBAL
    
    // Action 2: Take a photo
    actions[1] = [1, 0]; // 1 = TAKE_PHOTO
    
    const rowData = [
      wp.lat.toFixed(8),
      wp.lng.toFixed(8),
      wp.altitude.toFixed(4),
      Math.round(wp.heading),
      0.2, // curvesize (0.2 for smoother turns, as per example)
      0, // rotationdir (0 for default)
      0, // gimbalmode (0 for Disabled, allowing manual pitch control)
      wp.gimbalPitch,
      ...actions.flat(),
      altitudeMode,
      wp.speed.toFixed(2),
      0, // poi_latitude
      0, // poi_longitude
      0, // poi_altitude(m)
      0, // poi_altitudemode
      -1, // photo_timeinterval (disabled)
      -1, // photo_distinterval (disabled)
    ];

    return rowData.join(';');
  });

  return [header, ...rows].join('\n');
}