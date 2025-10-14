import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { RouteResult, LatLng } from '../lib/types';
import { getSafetyLevel } from '../services/routes';
import { getRouteColorByIndex, getRouteNumber } from '../utils/routeColors';
import { getSafetyColor } from '../utils/safetyColors';
import { greekTranslations } from '../translations/greek';
import RouteExportService from '../services/routeExportService';
interface RouteListProps {
  routes: RouteResult[];
  selectedRouteId: string | null;
  onRouteSelect: (routeId: string) => void;
  origin?: LatLng | null;
  destination?: LatLng | null;
}
export default function RouteList({ 
  routes, 
  selectedRouteId, 
  onRouteSelect,
  origin,
  destination
}: RouteListProps): React.JSX.Element {
  if (routes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Image source={require('../../assets/icons/map.png')} style={styles.emptyIcon} />
        <Text style={styles.emptyText}>No routes found</Text>
        <Text style={styles.emptySubtext}>Select origin and destination to find routes</Text>
      </View>
    );
  }
  const formatETA = (minutes: number | undefined): string => {
    if (!minutes || isNaN(minutes)) return 'N/A';
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  };
  const formatDistance = (km: number | undefined): string => {
    if (!km || isNaN(km)) return 'N/A';
    const miles = km * 0.621371; // Convert km to miles
    return `${miles.toFixed(1)} mi`;
  };
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Image source={require('../../assets/icons/list.png')} style={styles.headerIcon} />
        <Text style={styles.header}>Route Options</Text>
      </View>
      {routes.map((route, index) => {
          const isSelected = route.id === selectedRouteId;
          const safetyScore = route.safetyScore || 0;
          const safetyLevel = getSafetyLevel(safetyScore);
          const routeColor = getRouteColorByIndex(index);
          const routeNumber = getRouteNumber(index);
          const safetyColor = getSafetyColor(safetyScore);
          return (
            <TouchableOpacity
              key={route.id}
              style={[
                styles.routeCard,
                isSelected && styles.routeCardSelected,
                { borderLeftColor: routeColor }
              ]}
              onPress={() => onRouteSelect(route.id)}
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
              {}
              <Text style={styles.safetyExplanation}>
                Safety assessment based on historical crime data and time patterns
              </Text>
              {}
              {route.aiRiskPercentage !== undefined && (
                <View style={styles.aiRiskContainer}>
                  <Text style={styles.aiRiskLabel}>🤖 AI Predictive Risk: </Text>
                  <Text style={[
                    styles.aiRiskValue,
                    { color: route.aiRiskPercentage <= 3 ? '#34c759' : 
                             route.aiRiskPercentage <= 6 ? '#84cc16' :
                             route.aiRiskPercentage <= 10 ? '#ff9500' : '#ff3b30' }
                  ]}>
                    {route.aiRiskPercentage.toFixed(1)}% ({route.aiRiskPercentage <= 3 ? 'Very Low Risk' : 
                                                          route.aiRiskPercentage <= 6 ? 'Low Risk' :
                                                          route.aiRiskPercentage <= 10 ? 'Moderate Risk' : 'Higher Risk'})
                  </Text>
                  {route.aiExplanation && (
                    <Text style={styles.aiExplanation}>
                      {route.aiExplanation}
                    </Text>
                  )}
                </View>
              )}
              <View style={styles.routeDetails}>
                <View style={styles.detailItem}>
                  <Image source={require('../../assets/icons/target.png')} style={styles.detailIcon} />
                  <Text style={styles.detailText}>{formatETA(route.duration)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Image source={require('../../assets/icons/point.png')} style={styles.detailIcon} />
                  <Text style={styles.detailText}>{formatDistance(route.distance)}</Text>
                </View>
                {}
                <TouchableOpacity
                  style={styles.exportButton}
                  onPress={() => {
                    if (origin && destination) {
                      RouteExportService.showExportOptions(route, origin, destination);
                    }
                  }}
                >
                  <Image source={require('../../assets/icons/out.png')} style={styles.exportIcon} />
                  <Text style={styles.exportButtonText}>Export</Text>
                </TouchableOpacity>
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
        })}
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
  },
  headerIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
    tintColor: '#22c55e',
  },
  header: {
    fontSize: 20,
    fontFamily: 'SF Pro Display',
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    marginBottom: 12,
    tintColor: '#a1a1aa',
  },
  emptyText: {
    fontSize: 17,
    fontFamily: 'SF Pro Display',
    fontWeight: '700',
    color: '#a1a1aa',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  emptySubtext: {
    fontSize: 15,
    fontFamily: 'SF Pro Text',
    color: '#a1a1aa',
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  routeCard: {
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    borderLeftWidth: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  routeCardSelected: {
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
    borderWidth: 1.5,
    borderLeftWidth: 5,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    borderLeftColor: '#22c55e',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
    transform: [{ scale: 1.02 }],
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
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
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  routeNumberIndicatorText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  routeName: {
    fontSize: 18,
    fontFamily: 'SF Pro Display',
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.3,
    lineHeight: 24,
    flex: 1,
  },
  routeRank: {
    fontSize: 12,
    fontFamily: 'SF Pro Text',
    fontWeight: '700',
    opacity: 0.6,
    letterSpacing: 0.2,
  },
  bestRouteBadge: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  bestRouteText: {
    fontSize: 10,
    fontFamily: 'SF Pro Display',
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  safetyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    minWidth: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  safetyScore: {
    fontSize: 16,
    fontFamily: 'SF Pro Display',
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  safetyLevelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  safetyLevel: {
    fontSize: 14,
    fontFamily: 'SF Pro Text',
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  routeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailIcon: {
    width: 14,
    height: 14,
    marginRight: 4,
    tintColor: '#a1a1aa',
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'SF Pro Text',
    color: '#a1a1aa',
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  selectedIndicator: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedIcon: {
    width: 14,
    height: 14,
    marginRight: 6,
    tintColor: '#22c55e',
  },
  selectedText: {
    fontSize: 13,
    fontFamily: 'SF Pro Text',
    color: '#22c55e',
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  selectedBestRoute: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: '#22c55e',
  },
  aiRiskContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  aiRiskLabel: {
    fontSize: 13,
    fontFamily: 'SF Pro Text',
    color: '#a1a1aa',
    fontWeight: '600',
  },
  aiRiskValue: {
    fontSize: 13,
    fontFamily: 'SF Pro Text',
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  aiExplanation: {
    fontSize: 11,
    fontFamily: 'SF Pro Text',
    color: '#a1a1aa',
    fontStyle: 'italic',
    marginTop: 2,
    flexBasis: '100%',
  },
  safetyExplanation: {
    fontSize: 11,
    fontFamily: 'SF Pro Text',
    color: '#a1a1aa',
    fontStyle: 'italic',
    marginTop: 2,
    marginBottom: 8,
  },
  exportButton: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: '#22c55e',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
    flexDirection: 'row',
  },
  exportIcon: {
    width: 12,
    height: 12,
    marginRight: 4,
    tintColor: '#22c55e',
  },
  exportButtonText: {
    fontSize: 12,
    fontFamily: 'SF Pro Text',
    fontWeight: '600',
    color: '#22c55e',
  },
});