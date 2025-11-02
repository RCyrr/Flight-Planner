import type { Waypoint, FlightParams } from '../types';

/**
 * Generates the content for template.kml.
 * This file acts as a manifest for the wayline file inside the KMZ archive.
 */
export function getTemplateKml(): string {
  const createTime = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:wpml="http://www.dji.com/wpml/1.0">
    <Document>
        <wpml:author>DJI Flight Planner</wpml:author>
        <wpml:createTime>${createTime}</wpml:createTime>
        <wpml:updateTime>${createTime}</wpml:updateTime>
        <Folder>
            <name>Wayline Files</name>
            <Placemark>
                <name>waylines.wpml</name>
                <Point>
                    <coordinates>0,0,0</coordinates>
                </Point>
            </Placemark>
        </Folder>
    </Document>
</kml>`;
}

/**
 * Generates the waylines.wpml file content as a string.
 * This file contains the core mission data, including waypoints and actions.
 */
export function generateWpml(waypoints: Waypoint[], flightParams: FlightParams): string {
    const waypointsXml = waypoints.map((wp, index) => `
          <wpml:waypoint index="${index}"
            latitude="${wp.lat.toFixed(8)}"
            longitude="${wp.lng.toFixed(8)}"
            altitude="${wp.altitude.toFixed(2)}"
            waypointHeadingAngle="${Math.round(wp.heading)}"
            gimbalPitchAngle="${wp.gimbalPitch}">
            <wpml:actionList>
              <wpml:takePhotoAction/>
            </wpml:actionList>
          </wpml:waypoint>`).join('');

    // DJI Mini 4 Pro droneEnumValue is 77, according to official WPML documentation.
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2"
     xmlns:wpml="http://www.dji.com/wpml/1.0">
  <Document>
    <name>DJI_Flight_Plan</name>
    <Folder>
      <name>Waylines</name>
      <wpml:missionConfig
         flyToWaylineMode="safely"
         finishAction="goHome"
         exitOnRCLost="executeLostAction"
         executeRCLostAction="goBack"
         globalTransitionalSpeed="${flightParams.speed}">
        <wpml:droneInfo
           droneEnumValue="77"
           droneSubEnumValue="0" />
      </wpml:missionConfig>
      <Placemark>
        <name>Wayline 1</name>
        <LineString>
            <coordinates>
            ${waypoints.map(wp => `${wp.lng.toFixed(8)},${wp.lat.toFixed(8)},${wp.altitude.toFixed(2)}`).join('\n            ')}
            </coordinates>
        </LineString>
      </Placemark>
      <wpml:wayline id="0"
         autoFlightSpeed="${flightParams.speed}">
        <wpml:waypointList>${waypointsXml}
        </wpml:waypointList>
      </wpml:wayline>
    </Folder>
  </Document>
</kml>`;
    
    return xmlContent.trim();
}
