import { LatLng } from '../lib/types';
export interface LocationPreset {
  id: string;
  name: string;
  shortName: string;
  coordinates: LatLng;
  emoji: string;
  category: 'transit' | 'university' | 'entertainment' | 'business' | 'airport';
}
export const ATHENS_PRESETS: LocationPreset[] = [
  {
    id: 'syntagma-square',
    name: 'Syntagma Square',
    shortName: 'Syntagma',
    coordinates: { latitude: 37.9755, longitude: 23.7348 },
    emoji: '🏛️',
    category: 'transit',
  },
  {
    id: 'acropolis',
    name: 'Acropolis',
    shortName: 'Acropolis',
    coordinates: { latitude: 37.9715, longitude: 23.7267 },
    emoji: '🏛️',
    category: 'entertainment',
  },
  {
    id: 'plaka',
    name: 'Plaka',
    shortName: 'Plaka',
    coordinates: { latitude: 37.9750, longitude: 23.7300 },
    emoji: '🏘️',
    category: 'entertainment',
  },
  {
    id: 'monastiraki',
    name: 'Monastiraki',
    shortName: 'Monastiraki',
    coordinates: { latitude: 37.9764, longitude: 23.7250 },
    emoji: '🚊',
    category: 'transit',
  },
  {
    id: 'kolonaki',
    name: 'Kolonaki',
    shortName: 'Kolonaki',
    coordinates: { latitude: 37.9750, longitude: 23.7400 },
    emoji: '🛍️',
    category: 'business',
  },
  {
    id: 'university-athens',
    name: 'University of Athens',
    shortName: 'UoA',
    coordinates: { latitude: 37.9815, longitude: 23.7320 },
    emoji: '🎓',
    category: 'university',
  },
  {
    id: 'national-garden',
    name: 'National Garden',
    shortName: 'Nat Garden',
    coordinates: { latitude: 37.9730, longitude: 23.7370 },
    emoji: '🌳',
    category: 'entertainment',
  },
  {
    id: 'panathenaic-stadium',
    name: 'Panathenaic Stadium',
    shortName: 'Stadium',
    coordinates: { latitude: 37.9683, longitude: 23.7411 },
    emoji: '🏟️',
    category: 'entertainment',
  },
  {
    id: 'athens-airport',
    name: 'Athens International Airport',
    shortName: 'ATH',
    coordinates: { latitude: 37.9364, longitude: 23.9445 },
    emoji: '✈️',
    category: 'airport',
  },
];
export const PRESET_CATEGORIES = {
  transit: ATHENS_PRESETS.filter(p => p.category === 'transit'),
  entertainment: ATHENS_PRESETS.filter(p => p.category === 'entertainment'),
  university: ATHENS_PRESETS.filter(p => p.category === 'university'),
  business: ATHENS_PRESETS.filter(p => p.category === 'business'),
  airport: ATHENS_PRESETS.filter(p => p.category === 'airport'),
};
export const findPresetById = (id: string): LocationPreset | undefined => {
  return ATHENS_PRESETS.find(preset => preset.id === id);
};