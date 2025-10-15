import React, { useState, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Animated, Dimensions, PanResponder, Image } from 'react-native';
import { LatLng, RouteResult } from '../lib/types';
import TimeSlider from '../components/TimeSlider';
import LocationInput from '../components/LocationInput';
import RouteList from '../components/RouteList';
import MapView from '../components/MapView';
import { generateMultipleRoutes, EnhancedRoute } from '../services/multipleRouteGenerator';
import { apiService } from '../services/apiService';
import { crimeDataService } from '../services/crimeDataService';
import { greekTranslations } from '../translations/greek';

// Athens downtown coordinates for AI risk prediction
const ATHENS_DOWNTOWN = {
  latitude: 37.9755,
  longitude: 23.7348
};

function getLocalAIRiskPrediction(latitude: number, longitude: number, hour: number): {riskPercentage: number, explanation: string} {
  let riskScore = 2; // Base risk: 2% (realistic baseline)
  
  if (hour >= 22 || hour <= 5) {
    riskScore += 6; // Late night: +6%
  } else if (hour >= 18 && hour <= 21) {
    riskScore += 3; // Evening: +3%
  } else if (hour >= 6 && hour <= 9) {
    riskScore -= 1; // Morning rush: safer
  } else if (hour >= 10 && hour <= 16) {
    riskScore -= 1.5; // Daytime: safest
  }

  const distanceFromDowntown = Math.sqrt(
    Math.pow(latitude - ATHENS_DOWNTOWN.latitude, 2) + Math.pow(longitude - ATHENS_DOWNTOWN.longitude, 2)
  );
  
  if (distanceFromDowntown < 0.01) {
    riskScore += 4; // Downtown: +4%
  } else if (distanceFromDowntown > 0.05) {
    riskScore -= 1; // Suburbs: -1%
  }

  const dayOfWeek = new Date().getDay();
  if (dayOfWeek === 5 || dayOfWeek === 6) { // Friday/Saturday
    riskScore += 2; // Weekend: +2%
  }

  riskScore = Math.max(0.1, Math.min(15, riskScore));

  let explanation = '';
  if (riskScore <= 3) {
    explanation = 'Very Low Risk - Excellent safety conditions detected';
  } else if (riskScore <= 6) {
    explanation = 'Low Risk - Generally safe, normal precautions advised';
  } else if (riskScore <= 10) {
    explanation = 'Moderate Risk - Stay alert, avoid isolated areas';
  } else {
    explanation = 'Higher Risk - Consider alternative route or time';
  }

  return {
    riskPercentage: riskScore,
    explanation: explanation
  };
}

function convertEnhancedRoutesToRouteResults(
  enhancedRoutes: EnhancedRoute[],
  selectedHour: number,
  useCrimeData: boolean = false
): RouteResult[] {
  const routes = enhancedRoutes
    .filter(route => route.status === 'success')
    .map((route, index) => {
      // Simplified safety calculation - much faster
      let safetyScore = 75; // Default placeholder
      
      if (useCrimeData && route.coordinates.length > 0) {
        // Only check 3 key points instead of 8 for performance
        const keyPoints = [
          route.coordinates[0], // Start
          route.coordinates[Math.floor(route.coordinates.length / 2)], // Middle
          route.coordinates[route.coordinates.length - 1] // End
        ];
        
        let totalScore = 0;
        for (const point of keyPoints) {
          totalScore += crimeDataService.getLocationSafetyScore(point, selectedHour);
        }
        safetyScore = Math.round(totalScore / keyPoints.length);
      }

      // Simplified AI prediction - only for middle point
      let aiRiskPercentage = undefined;
      let aiExplanation = undefined;
      
      if (route.coordinates.length > 0) {
        const midIndex = Math.floor(route.coordinates.length / 2);
        const midPoint = route.coordinates[midIndex];
        const localAI = getLocalAIRiskPrediction(midPoint.latitude, midPoint.longitude, selectedHour);
        aiRiskPercentage = localAI.riskPercentage;
        aiExplanation = localAI.explanation;
      }

      return {
        id: route.id,
        name: route.summary || `Route ${index + 1}`,
        coords: route.coordinates,
        segments: [],
        distanceKm: route.distance_km,
        etaMin: route.duration_minutes,
        safetyScore: safetyScore,
        aiRiskPercentage: aiRiskPercentage,
        aiExplanation: aiExplanation
      };
    });

  // Simplified sorting - just by safety score
  return routes.sort((a, b) => b.safetyScore - a.safetyScore);
}

function getSafetyLevel(safetyScore: number, index: number): 'safest' | 'safe' | 'moderate' | 'risky' {
  if (index === 0) return 'safest';
  if (safetyScore >= 80) return 'safe';
  if (safetyScore >= 65) return 'moderate';
  return 'risky';
}

// Remove complex service imports to avoid crashes
// import { testGoogleIntegration } from '../services/simpleGoogleDirections';
// import { testMultipleRouteGeneration, generateMultipleRoutes, EnhancedRoute } from '../services/multipleRouteGenerator';
// import { crimeDataService } from '../services/crimeDataService';
// import { routeSafetyCalculator } from '../services/routeSafetyCalculator';
// import { hybridRouteService } from '../services/hybridRouteService';
// import { apiService } from '../services/apiService';


const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_SHEET_MIN_HEIGHT = 120; // Small pull-up tab
const BOTTOM_SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.8; // 80% of screen

function getSafetyRankedName(route: RouteResult, index: number, totalRoutes: number): string {
  const originalName = route.name;
  return originalName;
}

// Removed complex route conversion function

export default function HomeScreen(): React.JSX.Element {
  const [selectedHour, setSelectedHour] = useState<number>(12); // Default to noon
  const [origin, setOrigin] = useState<{ location: LatLng; name: string } | null>(null);
  const [destination, setDestination] = useState<{ location: LatLng; name: string } | null>(null);
  const [routes, setRoutes] = useState<RouteResult[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [routeRankings, setRouteRankings] = useState<any[]>([]);
  const [isProcessingRoutes, setIsProcessingRoutes] = useState(false);
  
  const bottomSheetAnimation = useRef(new Animated.Value(BOTTOM_SHEET_MIN_HEIGHT)).current;
  const loadingOpacity = useRef(new Animated.Value(0)).current;
  const loadingScale = useRef(new Animated.Value(0.8)).current;
  const loadingRotation = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  // Removed recalculationTimeout

  const handleOriginSelect = (location: LatLng, name: string) => {
    setOrigin({ location, name });
  };

  const handleDestinationSelect = (location: LatLng, name: string) => {
    setDestination({ location, name });
  };

  // Animate logo on component mount
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const showLoading = () => {
    setIsLoading(true);
    const rotateAnimation = Animated.loop(
      Animated.timing(loadingRotation, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );
    Animated.parallel([
      Animated.timing(loadingOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(loadingScale, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
    rotateAnimation.start();
  };

  const hideLoading = () => {
    loadingRotation.stopAnimation();
    loadingRotation.setValue(0);
    Animated.parallel([
      Animated.timing(loadingOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(loadingScale, {
        toValue: 0.8,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsLoading(false);
    });
  };

  const handleGenerateLocal = async () => {
    if (!origin || !destination) {
      Alert.alert('Λείπουν Τοποθεσίες', 'Παρακαλώ επιλέξτε τόσο την αρχή όσο και τον προορισμό');
      return;
    }
    
    showLoading();
    setRoutes([]);
    setSelectedRouteId(null);
    
    try {
      // Prefer backend routes with AI/crime data; fallback to local generation
      const backendHealthy = await apiService.checkHealth();
      if (backendHealthy) {
        const backendResp = await apiService.generateRoutes(origin.location, destination.location, selectedHour);
        if (backendResp && backendResp.status === 'success' && backendResp.routes.length > 0) {
          setIsProcessingRoutes(true);
          requestAnimationFrame(() => {
            const converted = apiService.convertAPIRoutesToRouteResults(backendResp.routes);
            setRoutes(converted);
            setIsProcessingRoutes(false);
            if (converted.length > 0) {
              setSelectedRouteId(converted[0].id);
            }
            setTimeout(() => {
              Alert.alert('Διαδρομές Δημιουργήθηκαν! 🏠', `Λήφθηκαν ${converted.length} διαδρομές από τον διακομιστή AI`);
            }, 300);
          });
          return;
        }
      }

      // Fallback: local route generation + local crime scoring
      const [multipleRoutesResult, crimeLoaded] = await Promise.all([
        generateMultipleRoutes(origin.location, destination.location, 3),
        crimeDataService.loadCrimeData()
      ]);

      if (multipleRoutesResult.status === 'success') {
        setIsProcessingRoutes(true);
        requestAnimationFrame(() => {
          const routesWithSafety = convertEnhancedRoutesToRouteResults(
            multipleRoutesResult.routes,
            selectedHour,
            crimeLoaded
          );
          setRoutes(routesWithSafety);
          setIsProcessingRoutes(false);
          if (routesWithSafety.length > 0) {
            setSelectedRouteId(routesWithSafety[0].id);
          }
          setTimeout(() => {
            Alert.alert('Διαδρομές Δημιουργήθηκαν! 🏠', `Δημιουργήθηκαν ${routesWithSafety.length} διαδρομές τοπικά`);
          }, 300);
        });
      } else {
        Alert.alert('Σφάλμα', 'Αποτυχία δημιουργίας διαδρομών');
      }
    } catch (error) {
      console.error('❌ Route generation failed:', error);
      Alert.alert('Σφάλμα', 'Η δημιουργία διαδρομών απέτυχε. Παρακαλώ δοκιμάστε ξανά.');
    } finally {
      hideLoading();
    }
  };

  const handleRouteSelect = (routeId: string) => {
    setSelectedRouteId(routeId);
  };

  // Removed AI enhancement functions as they reference undefined services

  // Removed complex route recalculation function

  const handleTimeChange = useCallback((newHour: number) => {
    setSelectedHour(newHour);
  }, []);

  // Memoize expensive calculations
  const canFindRoutes = useMemo(() => {
    return origin && destination;
  }, [origin, destination]);

  const sortedRoutes = useMemo(() => {
    return routes.sort((a, b) => b.safetyScore - a.safetyScore);
  }, [routes]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        const newHeight = SCREEN_HEIGHT - evt.nativeEvent.pageY;
        const clampedHeight = Math.max(
          BOTTOM_SHEET_MIN_HEIGHT,
          Math.min(BOTTOM_SHEET_MAX_HEIGHT, newHeight)
        );
        bottomSheetAnimation.setValue(clampedHeight);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const currentHeight = SCREEN_HEIGHT - evt.nativeEvent.pageY;
        const targetHeight = gestureState.dy < -50 
          ? BOTTOM_SHEET_MAX_HEIGHT 
          : BOTTOM_SHEET_MIN_HEIGHT;
        Animated.spring(bottomSheetAnimation, {
          toValue: targetHeight,
          useNativeDriver: false,
        }).start(() => {
          setIsBottomSheetExpanded(targetHeight >= BOTTOM_SHEET_MAX_HEIGHT - 50);
        });
      },
    })
  ).current;

  const toggleBottomSheet = () => {
    const currentValue = (bottomSheetAnimation as any)._value;
    const targetHeight = currentValue > BOTTOM_SHEET_MIN_HEIGHT + 50
      ? BOTTOM_SHEET_MIN_HEIGHT
      : BOTTOM_SHEET_MAX_HEIGHT;
    Animated.spring(bottomSheetAnimation, {
      toValue: targetHeight,
      useNativeDriver: false,
    }).start(() => {
      setIsBottomSheetExpanded(targetHeight >= BOTTOM_SHEET_MAX_HEIGHT - 50);
    });
  };

  return (
    <View style={styles.container}>
      {}
      <MapView
        origin={origin?.location || null}
        destination={destination?.location || null}
        routes={routes}
        selectedRouteId={selectedRouteId}
      />
      {}
      {isLoading && (
        <Animated.View 
          style={[
            styles.loadingOverlay,
            {
              opacity: loadingOpacity,
            }
          ]}
        >
          <Animated.View 
            style={[
              styles.loadingContainer,
              {
                transform: [{ scale: loadingScale }],
              }
            ]}
          >
            <View style={styles.loadingSpinner}>
              <Animated.Text 
                style={[
                  styles.loadingSpinnerText,
                  {
                    transform: [{
                      rotate: loadingRotation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    }],
                  }
                ]}
              >
                🔍
              </Animated.Text>
            </View>
            <Text style={styles.loadingTitle}>Finding Safe Routes</Text>
            <Text style={styles.loadingSubtitle}>Analyzing crime data and calculating optimal paths...</Text>
            <View style={styles.loadingProgress}>
              <View style={styles.loadingProgressBar} />
            </View>
          </Animated.View>
        </Animated.View>
      )}
      
      <Animated.View
        style={[
          styles.bottomSheet,
          { height: bottomSheetAnimation }
        ]}
      >
        <View 
          style={styles.pullTab}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity 
            style={styles.pullTabButton}
            onPress={toggleBottomSheet}
          >
            <View style={styles.pullIndicator} />
          </TouchableOpacity>
        </View>
        <ScrollView 
          style={styles.bottomSheetContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={isBottomSheetExpanded}
        >
          <View style={styles.headerContainer}>
            <View style={styles.logoContainer}>
              <Animated.View 
                style={[
                  styles.logoIcon,
                  {
                    opacity: logoOpacity,
                    transform: [{ scale: logoScale }],
                  }
                ]}
              >
                <Image source={require('../../assets/icons/Pathly_NoBG.png')} style={styles.logoIconImage} />
              </Animated.View>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>{greekTranslations.appName}</Text>
                <Text style={styles.subtitle}>{greekTranslations.appSubtitle}</Text>
              </View>
            </View>
            <View style={styles.statusIndicator}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>{greekTranslations.live}</Text>
            </View>
          </View>
          
          <View style={styles.section}>
            <View style={styles.sectionTitleContainer}>
              <Image source={require('../../assets/icons/map.png')} style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>{greekTranslations.routeOptions}</Text>
            </View>
            <LocationInput
              label={greekTranslations.from}
              placeholder={greekTranslations.chooseStart}
              selectedLocation={origin?.location || null}
              onLocationSelect={handleOriginSelect}
              emoji="🚀"
            />
            <LocationInput
              label={greekTranslations.to}
              placeholder={greekTranslations.chooseDestination}
              selectedLocation={destination?.location || null}
              onLocationSelect={handleDestinationSelect}
              emoji="🎯"
            />
          </View>
          
          <View style={styles.section}>
            <View style={styles.sectionHeaderWithIndicator}>
              <View style={styles.sectionTitleContainer}>
                <Image source={require('../../assets/icons/target.png')} style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>{greekTranslations.leaveAt}</Text>
              </View>
              {isRecalculating && routes.length > 0 && (
                <Text style={styles.recalculatingText}>🔄 {greekTranslations.loading}...</Text>
              )}
            </View>
            <TimeSlider 
              selectedHour={selectedHour}
              onHourChange={handleTimeChange}
            />
          </View>
          
          
          <View style={styles.actionSection}>
            {}
            <TouchableOpacity
              style={[
                styles.searchButton,
                !canFindRoutes && styles.searchButtonDisabled
              ]}
              onPress={handleGenerateLocal}
              disabled={!canFindRoutes || isLoading}
            >
              <Image source={require('../../assets/icons/search.png')} style={styles.searchButtonIcon} />
              <Text style={[
                styles.searchButtonText,
                !canFindRoutes && styles.searchButtonTextDisabled
              ]}>
                {isLoading ? greekTranslations.generatingRoutes : greekTranslations.findRoutes}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.section}>
            {isProcessingRoutes ? (
              <View style={styles.processingContainer}>
                <Text style={styles.processingText}>Processing routes...</Text>
              </View>
            ) : (
              <RouteList 
                routes={sortedRoutes}
                selectedRouteId={selectedRouteId}
                onRouteSelect={handleRouteSelect}
                origin={origin?.location}
                destination={destination?.location}
              />
            )}
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(20, 20, 20, 0.98)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  pullTab: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingTop: 16,
  },
  pullTabButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 60,
  },
  pullIndicator: {
    width: 40,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  logoIconImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#a1a1aa',
    letterSpacing: -0.1,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
    marginRight: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#22c55e',
    letterSpacing: 0.5,
  },
  section: {
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
    tintColor: '#22c55e',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  sectionHeaderWithIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recalculatingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22c55e',
    fontStyle: 'italic',
  },
  actionSection: {
    marginVertical: 8,
  },
  searchButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
    flexDirection: 'row',
  },
  searchButtonIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
    tintColor: '#ffffff',
  },
  searchButtonDisabled: {
    backgroundColor: '#404040',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    elevation: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  searchButtonTextDisabled: {
    color: '#a1a1aa',
    textShadowColor: 'transparent',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
    minWidth: 280,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  loadingSpinner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#22c55e',
  },
  loadingSpinnerText: {
    fontSize: 28,
    transform: [{ rotate: '0deg' }],
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  loadingSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#a1a1aa',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
    letterSpacing: -0.1,
  },
  loadingProgress: {
    width: '100%',
    height: 4,
    backgroundColor: '#404040',
    borderRadius: 2,
    overflow: 'hidden',
  },
  processingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  processingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#22c55e',
    fontFamily: 'System',
  },
  loadingProgressBar: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 2,
    width: '70%',
  },
});
