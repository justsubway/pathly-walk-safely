export type LatLng = {
  latitude: number;
  longitude: number;
};
export type Segment = {
  id: string;
  coords: LatLng[];
  baseIncidentRisk: number;  // 0..1 baseline
  lengthM: number;
  gridCellId: string;        // H3 or custom grid id
  lit: boolean;              // Whether the segment is well-lit
};
export type RouteResult = {
  id: string;
  name: string;
  coords: LatLng[];
  segments: Segment[];
  distanceKm: number;
  etaMin: number;
  safetyScore: number;       // 0..100 for selected hour
  safetyRank?: number;       // 1 = safest, 2 = second safest, etc.
  safetyLevel?: 'safest' | 'safe' | 'moderate' | 'risky';
  aiRiskPercentage?: number; // 0..100 AI-predicted risk
  aiExplanation?: string;    // AI explanation
};
export type HeatPoint = {
  latitude: number;
  longitude: number;
  weight: number;            // 0..1 for selected hour
};
export type CrimeIncident = {
  id: string;
  lat: number;
  lon: number;
  timestamp: number;
  category: string;
  hourOfWeek: number;        // 0..167 (7 days * 24 hours)
  gridId: string;
};
export type AppState = {
  selectedHour: number;      // 0-23
  origin: LatLng | null;
  destination: LatLng | null;
  routes: RouteResult[];
  selectedRouteId: string | null;
  heatmapVisible: boolean;
  lastSyncTime: Date | null;
  isLoading: boolean;
};