import type { Waypoint } from '../types';

// Switched to Open-Meteo's Elevation API, which is more reliable and has clear CORS support.
const API_URL = 'https://api.open-meteo.com/v1/elevation';
// A smaller batch size is needed for GET requests to avoid exceeding URL length limits.
const BATCH_SIZE = 50;

interface ElevationResponse {
    elevation: (number | null)[];
}

/**
 * Fetches ground elevation for a list of waypoints using the Open-Meteo Elevation API.
 * @param waypoints An array of Waypoint objects.
 * @returns A promise that resolves to an array of numbers or nulls, where each entry is the elevation in meters.
 */
export async function getElevations(waypoints: Waypoint[]): Promise<(number | null)[]> {
    if (waypoints.length === 0) {
        return [];
    }
    
    const allElevations: (number | null)[] = Array(waypoints.length).fill(null);

    for (let i = 0; i < waypoints.length; i += BATCH_SIZE) {
        const batch = waypoints.slice(i, i + BATCH_SIZE);
        
        const latitudes = batch.map(wp => wp.lat.toFixed(6)).join(',');
        const longitudes = batch.map(wp => wp.lng.toFixed(6)).join(',');
        
        const requestUrl = `${API_URL}?latitude=${latitudes}&longitude=${longitudes}`;
        
        try {
            const response = await fetch(requestUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Elevation API error: ${response.status} ${response.statusText}`, errorText);
                continue; // Continue to the next batch
            }
            
            const data: ElevationResponse = await response.json();

            if (!data.elevation || data.elevation.length !== batch.length) {
                 console.error(`Elevation API returned malformed data or incorrect result count.`);
                 continue; // Continue to the next batch
            }
            
            // Map results back to our main array
            data.elevation.forEach((elevation, index) => {
                const originalIndex = i + index;
                // The API returns null for points over the ocean, which is handled directly.
                allElevations[originalIndex] = elevation;
            });
            
        } catch (error) {
            console.error("Failed to fetch elevations:", error);
            // This catch block handles network errors. The elevations for this batch will remain null.
        }
    }

    const failedCount = allElevations.filter(e => e === null).length;
    if (failedCount > 0) {
        // This is now expected for points over water, so it's a warning, not an error.
        console.warn(`${failedCount} out of ${waypoints.length} waypoint elevations could not be fetched (e.g., points over water).`);
    }

    return allElevations;
}