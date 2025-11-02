import type { Waypoint } from '../types';

/**
 * Generates a KML string for visualizing the flight plan in Google Earth.
 * Includes styled start/end points and a 3D path.
 */
export function generateKml(waypoints: Waypoint[]): string {
  if (waypoints.length === 0) {
    return '';
  }

  const startPoint = waypoints[0];
  const endPoint = waypoints[waypoints.length - 1];

  const coordinatesString = waypoints
    .map(wp => `${wp.lng.toFixed(8)},${wp.lat.toFixed(8)},${wp.altitude.toFixed(4)}`)
    .join(' ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2" xmlns:kml="http://www.opengis.net/kml/2.2" xmlns:atom="http://www.w3.org/2005/Atom">
<Document>
	<name>DJI Flight Plan - 3D Path</name>
	<StyleMap id="startpin-style">
		<Pair>
			<key>normal</key>
			<styleUrl>#startpin-style-normal</styleUrl>
		</Pair>
		<Pair>
			<key>highlight</key>
			<styleUrl>#startpin-style-highlight</styleUrl>
		</Pair>
	</StyleMap>
	<Style id="startpin-style-normal">
		<IconStyle>
			<color>ff00ff00</color>
			<scale>1.1</scale>
			<Icon>
				<href>http://maps.google.com/mapfiles/kml/paddle/wht-blank.png</href>
			</Icon>
		</IconStyle>
	</Style>
	<Style id="startpin-style-highlight">
		<IconStyle>
			<color>ff00ff00</color>
			<scale>1.3</scale>
			<Icon>
				<href>http://maps.google.com/mapfiles/kml/paddle/wht-blank.png</href>
			</Icon>
		</IconStyle>
	</Style>
	<Placemark>
		<name>Start Point</name>
		<styleUrl>#startpin-style</styleUrl>
		<Point>
			<altitudeMode>absolute</altitudeMode>
			<gx:drawOrder>1</gx:drawOrder>
			<coordinates>${startPoint.lng.toFixed(8)},${startPoint.lat.toFixed(8)},${startPoint.altitude.toFixed(4)}</coordinates>
		</Point>
	</Placemark>
	<StyleMap id="endpin-style">
		<Pair>
			<key>normal</key>
			<styleUrl>#endpin-style-normal</styleUrl>
		</Pair>
		<Pair>
			<key>highlight</key>
			<styleUrl>#endpin-style-highlight</styleUrl>
		</Pair>
	</StyleMap>
	<Style id="endpin-style-normal">
		<IconStyle>
			<color>ff0000ff</color>
			<scale>1.1</scale>
			<Icon>
				<href>http://maps.google.com/mapfiles/kml/paddle/wht-blank.png</href>
			</Icon>
		</IconStyle>
	</Style>
	<Style id="endpin-style-highlight">
		<IconStyle>
			<color>ff0000ff</color>
			<scale>1.3</scale>
			<Icon>
				<href>http://maps.google.com/mapfiles/kml/paddle/wht-blank.png</href>
			</Icon>
		</IconStyle>
	</Style>
	<Placemark>
		<name>End Point</name>
		<styleUrl>#endpin-style</styleUrl>
		<Point>
			<altitudeMode>absolute</altitudeMode>
			<gx:drawOrder>1</gx:drawOrder>
			<coordinates>${endPoint.lng.toFixed(8)},${endPoint.lat.toFixed(8)},${endPoint.altitude.toFixed(4)}</coordinates>
		</Point>
	</Placemark>
	<StyleMap id="wpline-style">
		<Pair>
			<key>normal</key>
			<styleUrl>#wpline-style-normal</styleUrl>
		</Pair>
		<Pair>
			<key>highlight</key>
			<styleUrl>#wpline-style-highlight</styleUrl>
		</Pair>
	</StyleMap>
	<Style id="wpline-style-normal">
		<LineStyle>
			<color>ff00ffff</color>
			<width>3</width>
		</LineStyle>
		<PolyStyle>
			<color>5000ffff</color>
			<outline>0</outline>
		</PolyStyle>
	</Style>
	<Style id="wpline-style-highlight">
		<LineStyle>
			<color>ff00ffff</color>
			<width>3</width>
		</LineStyle>
		<PolyStyle>
			<color>5000ffff</color>
		</PolyStyle>
	</Style>
	<Placemark>
		<name>3D Path</name>
		<styleUrl>#wpline-style</styleUrl>
		<LineString>
			<extrude>1</extrude>
			<tessellate>1</tessellate>
			<altitudeMode>absolute</altitudeMode>
			<coordinates>${coordinatesString}</coordinates>
		</LineString>
	</Placemark>
</Document>
</kml>`;
}
