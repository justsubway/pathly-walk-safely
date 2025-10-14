import React from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { LatLng, RouteResult } from '../lib/types';
import { getRouteColorByIndex, getRouteNumber } from '../utils/routeColors';

const { width, height } = Dimensions.get('window');

type WebMapViewProps = {
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

export default function WebMapView({ 
  origin, 
  destination, 
  routes, 
  selectedRouteId,
  onMapPress 
}: WebMapViewProps) {
  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        {/* Athens Map Background */}
        <View style={styles.mapBackground}>
          <Text style={styles.mapTitle}>Athens, Greece</Text>
          <Text style={styles.mapSubtitle}>Interactive Map View</Text>
        </View>
        
        {/* Origin Marker */}
        {origin && (
          <View style={[styles.marker, styles.originMarker, { 
            left: getMarkerPosition(origin).x, 
            top: getMarkerPosition(origin).y 
          }]}>
            <Text style={styles.markerText}>📍</Text>
            <Text style={styles.markerLabel}>Start</Text>
          </View>
        )}
        
        {/* Destination Marker */}
        {destination && (
          <View style={[styles.marker, styles.destinationMarker, { 
            left: getMarkerPosition(destination).x, 
            top: getMarkerPosition(destination).y 
          }]}>
            <Text style={styles.markerText}>🎯</Text>
            <Text style={styles.markerLabel}>End</Text>
          </View>
        )}
        
        {/* Route Lines */}
        {routes.map((route, index) => {
          const isSelected = route.id === selectedRouteId;
          const routeColor = getRouteColorByIndex(index);
          const routeNumber = getRouteNumber(index);
          
          return (
            <View key={`route_${route.id}_${index}`}>
              {/* Route Line */}
              <View style={[
                styles.routeLine,
                { 
                  backgroundColor: routeColor,
                  opacity: isSelected ? 1 : 0.7,
                  transform: [{ rotate: `${getRouteAngle(route.coords)}deg` }]
                }
              ]} />
              
              {/* Route Number Badge */}
              <View style={[
                styles.routeBadge,
                { 
                  backgroundColor: routeColor,
                  left: getRouteMidPoint(route.coords).x,
                  top: getRouteMidPoint(route.coords).y
                }
              ]}>
                <Text style={styles.routeBadgeText}>{routeNumber}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// Helper function to convert lat/lng to screen coordinates
function getMarkerPosition(coordinate: LatLng) {
  const mapWidth = width - 32; // Account for margins
  const mapHeight = height * 0.4; // Map takes 40% of screen height
  
  const x = ((coordinate.longitude - ATHENS_REGION.longitude) / ATHENS_REGION.longitudeDelta) * mapWidth + mapWidth / 2;
  const y = ((ATHENS_REGION.latitude - coordinate.latitude) / ATHENS_REGION.latitudeDelta) * mapHeight + mapHeight / 2;
  
  return {
    x: Math.max(20, Math.min(mapWidth - 20, x)),
    y: Math.max(20, Math.min(mapHeight - 20, y))
  };
}

function getRouteMidPoint(coords: LatLng[]): { x: number; y: number } {
  if (coords.length === 0) return { x: 0, y: 0 };
  const midIndex = Math.floor(coords.length / 2);
  return getMarkerPosition(coords[midIndex]);
}

function getRouteAngle(coords: LatLng[]): number {
  if (coords.length < 2) return 0;
  const start = coords[0];
  const end = coords[coords.length - 1];
  return Math.atan2(end.longitude - start.longitude, end.latitude - start.latitude) * 180 / Math.PI;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f7',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    margin: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#e8f4fd',
  },
  mapBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e8f4fd',
  },
  mapTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 4,
  },
  mapSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  marker: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  originMarker: {
    backgroundColor: '#10b981',
  },
  destinationMarker: {
    backgroundColor: '#ef4444',
  },
  markerText: {
    fontSize: 20,
  },
  markerLabel: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
    marginTop: 2,
  },
  routeLine: {
    position: 'absolute',
    height: 4,
    width: 100,
    borderRadius: 2,
    left: '50%',
    top: '50%',
    marginLeft: -50,
    marginTop: -2,
  },
  routeBadge: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 4,
  },
  routeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
});





