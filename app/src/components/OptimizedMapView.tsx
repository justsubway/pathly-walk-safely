import React, { memo, useMemo, useCallback } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { LatLng, RouteResult } from '../lib/types';
import { getRouteColorByIndex, getRouteNumber } from '../utils/routeColors';

// Conditional import for react-native-maps
let MapView: any;
let Marker: any;
let Polyline: any;
let PROVIDER_GOOGLE: any;

try {
  const MapsModule = require('react-native-maps');
  MapView = MapsModule.default;
  Marker = MapsModule.Marker;
  Polyline = MapsModule.Polyline;
  PROVIDER_GOOGLE = MapsModule.PROVIDER_GOOGLE;
} catch (error) {
  // react-native-maps not available, using fallback
}

type OptimizedMapViewProps = {
  origin: LatLng | null;
  destination: LatLng | null;
  routes: RouteResult[];
  selectedRouteId: string | null;
  onMapPress?: (coordinate: LatLng) => void;
};

const ATHENS_REGION = {
  latitude: 37.9755,
  longitude: 23.7348,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

// Memoized marker component
const OriginMarker = memo(({ origin }: { origin: LatLng }) => (
  <Marker
    coordinate={origin}
    title="Αρχή"
    description="Σημείο εκκίνησης"
    pinColor="#22c55e"
  />
));

const DestinationMarker = memo(({ destination }: { destination: LatLng }) => (
  <Marker
    coordinate={destination}
    title="Προορισμός"
    description="Τελικός προορισμός"
    pinColor="#ef4444"
  />
));

// Memoized polyline component with optimized coordinates
const RoutePolyline = memo(({ 
  route, 
  index, 
  isSelected 
}: { 
  route: RouteResult; 
  index: number; 
  isSelected: boolean; 
}) => {
  const routeColor = getRouteColorByIndex(index);
  
  // Heavily optimize polyline coordinates for performance
  const optimizedCoords = useMemo(() => {
    if (!route.coords || route.coords.length === 0) return [];
    
    // Reduce coordinates to max 20 points for better performance
    const maxPoints = 20;
    if (route.coords.length <= maxPoints) return route.coords;
    
    const step = Math.floor(route.coords.length / maxPoints);
    return route.coords.filter((_, coordIndex) => 
      coordIndex % step === 0 || coordIndex === route.coords.length - 1
    );
  }, [route.coords]);

  if (optimizedCoords.length === 0) return null;

  return (
    <Polyline
      key={route.id}
      coordinates={optimizedCoords}
      strokeColor={routeColor}
      strokeWidth={isSelected ? 4 : 2}
      lineCap="round"
      lineJoin="round"
    />
  );
});

export default function OptimizedMapView({ 
  origin, 
  destination, 
  routes, 
  selectedRouteId,
  onMapPress 
}: OptimizedMapViewProps) {
  // Memoize route polylines to prevent unnecessary re-renders
  const routePolylines = useMemo(() => {
    return routes.slice(0, 3).map((route, index) => (
      <RoutePolyline
        key={route.id}
        route={route}
        index={index}
        isSelected={route.id === selectedRouteId}
      />
    ));
  }, [routes, selectedRouteId]);

  // Memoize map press handler
  const handleMapPress = useCallback((event: any) => {
    if (onMapPress && event.nativeEvent.coordinate) {
      onMapPress(event.nativeEvent.coordinate);
    }
  }, [onMapPress]);

  // If react-native-maps is not available, show fallback
  if (!MapView) {
    return (
      <View style={styles.container}>
        <View style={styles.fallbackContainer}>
          <Text style={styles.fallbackTitle}>🗺️ Map View</Text>
          <Text style={styles.fallbackSubtitle}>Athens, Greece</Text>
          {origin && (
            <View style={styles.fallbackInfo}>
              <Text style={styles.fallbackText}>
                📍 Origin: {origin.latitude.toFixed(4)}, {origin.longitude.toFixed(4)}
              </Text>
            </View>
          )}
          {destination && (
            <View style={styles.fallbackInfo}>
              <Text style={styles.fallbackText}>
                🎯 Destination: {destination.latitude.toFixed(4)}, {destination.longitude.toFixed(4)}
              </Text>
            </View>
          )}
          {routes.length > 0 && (
            <View style={styles.fallbackInfo}>
              <Text style={styles.fallbackText}>🛣️ {routes.length} routes available</Text>
            </View>
          )}
          <Text style={styles.fallbackNote}>
            {Platform.OS === 'web' 
              ? 'For full map functionality, run on iOS or Android' 
              : 'Map module loading...'
            }
          </Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={ATHENS_REGION}
        showsUserLocation={true}
        showsMyLocationButton={true}
        onPress={handleMapPress}
        mapType="standard"
        // Performance optimizations
        moveOnMarkerPress={false}
        showsBuildings={false}
        showsTraffic={false}
        showsIndoors={false}
        showsPointsOfInterest={false}
        loadingEnabled={true}
        loadingIndicatorColor="#22c55e"
        loadingBackgroundColor="#0a0a0a"
      >
        {origin && <OriginMarker origin={origin} />}
        {destination && <DestinationMarker destination={destination} />}
        {routePolylines}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  map: {
    flex: 1,
    borderRadius: 8,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  fallbackTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  fallbackSubtitle: {
    fontSize: 16,
    color: '#a1a1aa',
    marginBottom: 20,
  },
  fallbackInfo: {
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  fallbackText: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
  },
  fallbackNote: {
    fontSize: 12,
    color: '#a1a1aa',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
});
