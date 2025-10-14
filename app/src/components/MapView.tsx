import React from 'react';
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

type SafeWalkMapViewProps = {
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

// Dark mode map style - clean text without outlines
const darkMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [{"color": "#212121"}]
  },
  {
    "elementType": "labels.icon",
    "stylers": [{"visibility": "off"}]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#757575"}]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{"visibility": "off"}]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [{"color": "#757575"}]
  },
  {
    "featureType": "administrative.country",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#9e9e9e"}]
  },
  {
    "featureType": "administrative.country",
    "elementType": "labels.text.stroke",
    "stylers": [{"visibility": "off"}]
  },
  {
    "featureType": "administrative.land_parcel",
    "stylers": [{"visibility": "off"}]
  },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#bdbdbd"}]
  },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.stroke",
    "stylers": [{"visibility": "off"}]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#757575"}]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.stroke",
    "stylers": [{"visibility": "off"}]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [{"color": "#181818"}]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#616161"}]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.stroke",
    "stylers": [{"visibility": "off"}]
  },
  {
    "featureType": "road",
    "elementType": "geometry.fill",
    "stylers": [{"color": "#2c2c2c"}]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#8a8a8a"}]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.stroke",
    "stylers": [{"visibility": "off"}]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry",
    "stylers": [{"color": "#373737"}]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{"color": "#3c3c3c"}]
  },
  {
    "featureType": "road.highway.controlled_access",
    "elementType": "geometry",
    "stylers": [{"color": "#4e4e4e"}]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#616161"}]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.stroke",
    "stylers": [{"visibility": "off"}]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#757575"}]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.stroke",
    "stylers": [{"visibility": "off"}]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{"color": "#000000"}]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#3d3d3d"}]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.stroke",
    "stylers": [{"visibility": "off"}]
  }
];

export default function SafeWalkMapView({ 
  origin, 
  destination, 
  routes, 
  selectedRouteId,
  onMapPress 
}: SafeWalkMapViewProps) {
  // If react-native-maps is not available, show fallback
  if (!MapView) {
    return (
      <View style={styles.container}>
        <View style={styles.fallbackContainer}>
          <Text style={styles.fallbackTitle}>🗺️ Map View</Text>
          <Text style={styles.fallbackSubtitle}>Athens, Greece</Text>
          {origin && (
            <View style={styles.fallbackInfo}>
              <Text style={styles.fallbackText}>📍 Origin: {origin.latitude.toFixed(4)}, {origin.longitude.toFixed(4)}</Text>
            </View>
          )}
          {destination && (
            <View style={styles.fallbackInfo}>
              <Text style={styles.fallbackText}>🎯 Destination: {destination.latitude.toFixed(4)}, {destination.longitude.toFixed(4)}</Text>
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
        onPress={onMapPress}
        customMapStyle={darkMapStyle}
        mapType="standard"
      >
        {origin && (
          <Marker
            coordinate={origin}
            title="Αρχή"
            description="Σημείο εκκίνησης"
            pinColor="#22c55e"
          />
        )}
        {destination && (
          <Marker
            coordinate={destination}
            title="Προορισμός"
            description="Τελικός προορισμός"
            pinColor="#ef4444"
          />
        )}
        {routes.slice(0, 3).map((route, index) => {
          const isSelected = route.id === selectedRouteId;
          const routeColor = getRouteColorByIndex(index);
          const routeNumber = getRouteNumber(index);
          
          // Optimize polyline coordinates - reduce points for better performance
          const optimizedCoords = route.coords.filter((_, coordIndex) => 
            coordIndex % Math.max(1, Math.floor(route.coords.length / 15)) === 0
          );
          
          return (
            <React.Fragment key={route.id}>
              {/* Route Polyline - Optimized */}
              <Polyline
                coordinates={optimizedCoords}
                strokeColor={routeColor}
                strokeWidth={isSelected ? 4 : 3}
                lineCap="round"
                lineJoin="round"
              />
              {/* Route Number Badge - Only for selected route to reduce markers */}
              {isSelected && optimizedCoords.length > 0 && (
                <Marker
                  coordinate={optimizedCoords[Math.floor(optimizedCoords.length / 2)]}
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  <View style={[
                    styles.routeNumberBadge,
                    { backgroundColor: routeColor },
                    isSelected && styles.routeNumberBadgeSelected
                  ]}>
                    <Text style={styles.routeNumberText}>{routeNumber}</Text>
                  </View>
                </Marker>
              )}
            </React.Fragment>
          );
        })}
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
  routeNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  routeNumberBadgeSelected: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    transform: [{ scale: 1.1 }],
  },
  routeNumberText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});