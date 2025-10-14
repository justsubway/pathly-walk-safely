import { LatLng } from '../lib/types';
import { API_CONFIG, ATHENS_BOUNDS } from './api-config';
interface PlacesAutocompleteResponse {
  predictions: PlacePrediction[];
  status: string;
}
interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types: string[];
}
interface PlaceDetailsResponse {
  result: {
    place_id: string;
    name: string;
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    types: string[];
  };
  status: string;
}
export interface PlaceSuggestion {
  place_id: string;
  name: string;
  address: string;
  coordinates: LatLng;
}
export async function getPlaceAutocomplete(input: string): Promise<PlaceSuggestion[]> {
  if (!API_CONFIG.GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API key not configured');
  }
  if (input.length < 2) {
    return [];
  }
  const params = new URLSearchParams({
    input: input,
    location: `${(ATHENS_BOUNDS.north + ATHENS_BOUNDS.south) / 2},${(ATHENS_BOUNDS.east + ATHENS_BOUNDS.west) / 2}`,
    radius: '50000', // 50km around Athens
    strictbounds: 'true',
    types: 'establishment|geocode',
    key: API_CONFIG.GOOGLE_MAPS_API_KEY,
  });
  const url = `${API_CONFIG.GOOGLE_MAPS_BASE_URL}/place/autocomplete/json?${params}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`);
    }
    const data: PlacesAutocompleteResponse = await response.json();
    if (data.status !== 'OK' || !data.predictions) {
      return [];
    }
    const suggestions = await Promise.all(
      data.predictions.slice(0, 5).map(async (prediction) => {
        try {
          const details = await getPlaceDetails(prediction.place_id);
          return {
            place_id: prediction.place_id,
            name: prediction.structured_formatting.main_text,
            address: prediction.description,
            coordinates: details.coordinates,
          };
        } catch (error) {
          console.warn(`Failed to get details for place ${prediction.place_id}:`, error);
          return null;
        }
      })
    );
    return suggestions.filter((suggestion): suggestion is PlaceSuggestion => suggestion !== null);
  } catch (error) {
    console.error('Error getting place autocomplete:', error);
    return [];
  }
}
export async function getPlaceDetails(placeId: string): Promise<{ coordinates: LatLng; name: string; address: string }> {
  if (!API_CONFIG.GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API key not configured');
  }
  const params = new URLSearchParams({
    place_id: placeId,
    fields: 'place_id,name,formatted_address,geometry',
    key: API_CONFIG.GOOGLE_MAPS_API_KEY,
  });
  const url = `${API_CONFIG.GOOGLE_MAPS_BASE_URL}/place/details/json?${params}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Places Details API error: ${response.status}`);
    }
    const data: PlaceDetailsResponse = await response.json();
    if (data.status !== 'OK' || !data.result) {
      throw new Error('Place details not found');
    }
    return {
      coordinates: {
        latitude: data.result.geometry.location.lat,
        longitude: data.result.geometry.location.lng,
      },
      name: data.result.name,
      address: data.result.formatted_address,
    };
  } catch (error) {
    console.error('Error getting place details:', error);
    throw error;
  }
}