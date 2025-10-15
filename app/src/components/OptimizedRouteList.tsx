import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { RouteResult } from '../lib/types';
import { getRouteColorByIndex, getRouteNumber } from '../utils/routeColors';
import { getSafetyColor, getSafetyLevel } from '../utils/safetyColors';

interface OptimizedRouteListProps {
  routes: RouteResult[];
  selectedRouteId: string | null;
  onRouteSelect: (routeId: string) => void;
  origin?: { latitude: number; longitude: number } | null;
  destination?: { latitude: number; longitude: number } | null;
}

// Memoized route card component to prevent unnecessary re-renders
const RouteCard = memo(({ 
  route, 
  index, 
  isSelected, 
  onSelect 
}: {
  route: RouteResult;
  index: number;
  isSelected: boolean;
  onSelect: (routeId: string) => void;
}) => {
  const routeColor = getRouteColorByIndex(index);
  const routeNumber = getRouteNumber(index);
  const safetyScore = route.safetyScore || 0;
  const safetyLevel = getSafetyLevel(safetyScore);
  const safetyColor = getSafetyColor(safetyScore);

  const formatETA = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatDistance = (km: number) => {
    const miles = km * 0.621371;
    return `${miles.toFixed(1)} mi`;
  };

  return (
    <TouchableOpacity
      style={[
        styles.routeCard,
        isSelected && styles.routeCardSelected,
        { borderLeftColor: routeColor }
      ]}
      onPress={() => onSelect(route.id)}
    >
      <View style={styles.routeHeader}>
        <View style={styles.routeTitle}>
          <View style={[styles.routeNumberIndicator, { backgroundColor: routeColor }]}>
            <Text style={styles.routeNumberIndicatorText}>{routeNumber}</Text>
          </View>
          <Text style={styles.routeName}>{route.name}</Text>
        </View>
        <View style={[styles.safetyBadge, { backgroundColor: safetyColor }]}>
          <Text style={styles.safetyScore}>{Math.round(safetyScore)}</Text>
        </View>
      </View>
      
      <View style={styles.safetyLevelRow}>
        <Text style={[styles.safetyLevel, { color: safetyColor }]}>
          {safetyLevel}
        </Text>
        {route.safetyRank === 1 && (
          <View style={styles.bestRouteBadge}>
            <Text style={styles.bestRouteText}>RECOMMENDED</Text>
          </View>
        )}
      </View>

      <View style={styles.routeDetails}>
        <View style={styles.detailItem}>
          <Image source={require('../../assets/icons/target.png')} style={styles.detailIcon} />
          <Text style={styles.detailText}>{formatETA(route.etaMin)}</Text>
        </View>
        <View style={styles.detailItem}>
          <Image source={require('../../assets/icons/point.png')} style={styles.detailIcon} />
          <Text style={styles.detailText}>{formatDistance(route.distanceKm)}</Text>
        </View>
      </View>

      {isSelected && (
        <View style={[
          styles.selectedIndicator,
          route.safetyRank === 1 && styles.selectedBestRoute
        ]}>
          <Image source={require('../../assets/icons/check.png')} style={styles.selectedIcon} />
          <Text style={styles.selectedText}>
            {route.safetyRank === 1 ? 'Selected (Safest Route)' : 'Selected Route'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

export default function OptimizedRouteList({ 
  routes, 
  selectedRouteId, 
  onRouteSelect,
  origin,
  destination
}: OptimizedRouteListProps) {
  // Memoize sorted routes to prevent unnecessary sorting on every render
  const sortedRoutes = useMemo(() => {
    return [...routes].sort((a, b) => (b.safetyScore || 0) - (a.safetyScore || 0));
  }, [routes]);

  // Memoize route cards to prevent unnecessary re-renders
  const routeCards = useMemo(() => {
    return sortedRoutes.map((route, index) => (
      <RouteCard
        key={route.id}
        route={route}
        index={index}
        isSelected={route.id === selectedRouteId}
        onSelect={onRouteSelect}
      />
    ));
  }, [sortedRoutes, selectedRouteId, onRouteSelect]);

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Image source={require('../../assets/icons/list.png')} style={styles.headerIcon} />
        <Text style={styles.header}>Route Options</Text>
      </View>
      {routeCards}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  headerIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
    tintColor: '#22c55e',
  },
  header: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  routeCard: {
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  routeCardSelected: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
    borderWidth: 1,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  routeNumberIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  routeNumberIndicatorText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  routeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  safetyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safetyScore: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  safetyLevelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  safetyLevel: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bestRouteBadge: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 12,
  },
  bestRouteText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  routeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
    tintColor: '#a1a1aa',
  },
  detailText: {
    fontSize: 14,
    color: '#a1a1aa',
    fontWeight: '600',
  },
  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  selectedBestRoute: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: 'rgba(34, 197, 94, 0.5)',
  },
  selectedIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
    tintColor: '#22c55e',
  },
  selectedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22c55e',
  },
});
