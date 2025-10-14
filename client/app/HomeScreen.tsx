import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Animated, Dimensions, PanResponder } from 'react-native';
import { LatLng, RouteResult } from '../lib/types';
import TimeSlider from './components/TimeSlider';
import LocationInput from './components/LocationInput';
import RouteList from './components/RouteList';
import MapView from './components/MapView';
import { generateMockRoutes } from '../services/routes';
import { testGoogleIntegration } from '../services/simpleGoogleDirections';
import { testMultipleRouteGeneration, generateMultipleRoutes, EnhancedRoute } from '../services/multipleRouteGenerator';
import { crimeDataService } from '../services/crimeDataService';
import { routeSafetyCalculator } from '../services/routeSafetyCalculator';
import { hybridRouteService } from '../services/hybridRouteService';
import { apiService } from '../services/apiService';
function getLocalAIRiskPrediction(latitude: number, longitude: number, hour: number): {riskPercentage: number, explanation: string} {
  let riskScore = 2; // Base risk: 2% (realistic baseline)
  if (hour >= 22 || hour <= 5) {
    riskScore += 6; // Late night: +6% (still under 10%)
  } else if (hour >= 18 && hour <= 21) {
    riskScore += 3; // Evening: +3%
  } else if (hour >= 6 && hour <= 9) {
    riskScore -= 1; // Morning rush: safer
  } else if (hour >= 10 && hour <= 16) {
    riskScore -= 1.5; // Daytime: safest
  }
  const downtownLat = 25.7617;
  const downtownLng = -80.1918;
  const distanceFromDowntown = Math.sqrt(
    Math.pow(latitude - downtownLat, 2) + Math.pow(longitude - downtownLng, 2)
  );
  if (distanceFromDowntown < 0.01) {
    riskScore += 4; // Downtown: +4% (still reasonable)
  } else if (distanceFromDowntown > 0.05) {
    riskScore -= 1; // Suburbs: -1%
  }
  const dayOfWeek = new Date().getDay();
  if (dayOfWeek === 5 || dayOfWeek === 6) { // Friday/Saturday
    riskScore += 2; // Weekend: +2% (realistic increase)
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
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_SHEET_MIN_HEIGHT = 120; // Small pull-up tab
const BOTTOM_SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.8; // 80% of screen
function getSafetyRankedName(route: RouteResult, index: number, totalRoutes: number): string {
  const originalName = route.name;
  return originalName;
}
function getSafetyLevel(safetyScore: number, index: number): 'safest' | 'safe' | 'moderate' | 'risky' {
  if (index === 0) return 'safest';
  if (safetyScore >= 80) return 'safe';
  if (safetyScore >= 65) return 'moderate';
  return 'risky';
}
function convertEnhancedRoutesToRouteResults(
  enhancedRoutes: EnhancedRoute[],
  selectedHour: number,
  useCrimeData: boolean = false
): RouteResult[] {
  const routes = enhancedRoutes
    .filter(route => route.status === 'success')
    .map((route, index) => {
      let safetyScore = 75; // Default placeholder
      if (useCrimeData && route.coordinates.length > 0) {
        let totalScore = 0;
        let worstSegmentScore = 100;
        const samplePoints = Math.min(8, route.coordinates.length); // More sample points for accuracy
        for (let i = 0; i < samplePoints; i++) {
          const progress = i / (samplePoints - 1);
          const pointIndex = Math.floor((route.coordinates.length - 1) * progress);
          const point = route.coordinates[pointIndex];
          const score = crimeDataService.getLocationSafetyScore(point, selectedHour);
          totalScore += score;
          if (score < worstSegmentScore) {
            worstSegmentScore = score;
          }
        }
        const avgScore = totalScore / samplePoints;
        safetyScore = Math.round(avgScore * 0.7 + worstSegmentScore * 0.3);
        console.log(`🛡️ Route ${index + 1} (${route.summary}): Safety ${safetyScore}/100 (avg: ${Math.round(avgScore)}, worst: ${worstSegmentScore})`);
      }
      let aiRiskPercentage = undefined;
      let aiExplanation = undefined;
      if (route.coordinates.length > 0) {
        const midIndex = Math.floor(route.coordinates.length / 2);
        const midPoint = route.coordinates[midIndex];
        const localAI = getLocalAIRiskPrediction(midPoint.latitude, midPoint.longitude, selectedHour);
        aiRiskPercentage = localAI.riskPercentage;
        aiExplanation = localAI.explanation;
        console.log(`🤖 Route ${index + 1} Local AI: ${aiRiskPercentage}% - ${aiExplanation}`);
      }
      return {
        id: route.id,
        name: route.summary || 'Route',
        coords: route.coordinates,
        segments: [], // We'll populate this when we add crime grid system
        distanceKm: route.distance_km,
        etaMin: route.duration_minutes,
        safetyScore: safetyScore,
        aiRiskPercentage: aiRiskPercentage,
        aiExplanation: aiExplanation
      };
    });
  const sortedRoutes = routes.sort((a, b) => b.safetyScore - a.safetyScore);
  return sortedRoutes.map((route, index) => ({
    ...route,
    name: getSafetyRankedName(route, index, sortedRoutes.length),
    safetyRank: index + 1,
    safetyLevel: getSafetyLevel(route.safetyScore, index)
  }));
}
export default function HomeScreen(): React.JSX.Element {
  const [selectedHour, setSelectedHour] = useState<number>(12); // Default to noon
  const [origin, setOrigin] = useState<{ location: LatLng; name: string } | null>(null);
  const [destination, setDestination] = useState<{ location: LatLng; name: string } | null>(null);
  const [routes, setRoutes] = useState<RouteResult[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false);
  const [enhancedRoutes, setEnhancedRoutes] = useState<EnhancedRoute[]>([]);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const bottomSheetAnimation = useRef(new Animated.Value(BOTTOM_SHEET_MIN_HEIGHT)).current;
  const loadingOpacity = useRef(new Animated.Value(0)).current;
  const loadingScale = useRef(new Animated.Value(0.8)).current;
  const loadingRotation = useRef(new Animated.Value(0)).current;
  const recalculationTimeout = useRef<NodeJS.Timeout | null>(null);
  const handleOriginSelect = (location: LatLng, name: string) => {
    setOrigin({ location, name });
  };
  const handleDestinationSelect = (location: LatLng, name: string) => {
    setDestination({ location, name });
  };
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
      Alert.alert('Missing Locations', 'Please select both origin and destination');
      return;
    }
    showLoading();
    setRoutes([]);
    setSelectedRouteId(null);
    try {
      console.log('🏠 Generating routes locally with your crime data...');
      const multipleRoutesResult = await generateMultipleRoutes(
        origin.location,
        destination.location,
        3 // Keep it simple with 3 routes
      );
      if (multipleRoutesResult.status === 'success') {
        const crimeLoaded = await crimeDataService.loadCrimeData();
        const routesWithSafety = convertEnhancedRoutesToRouteResults(
          multipleRoutesResult.routes,
          selectedHour,
          crimeLoaded // Use your local crime data
        );
        setRoutes(routesWithSafety);
        setEnhancedRoutes(multipleRoutesResult.routes); // For time slider
        if (routesWithSafety.length > 0) {
          setSelectedRouteId(routesWithSafety[0].id);
        }
        Alert.alert('Routes Generated! 🏠', 
          `Generated 3 routes using recent data`
        );
      } else {
        Alert.alert('Error', 'Failed to generate routes locally');
      }
    } catch (error) {
      console.error('❌ Local route generation failed:', error);
      Alert.alert('Error', 'Local route generation failed. Check console for details.');
    } finally {
      hideLoading();
    }
  };
  const handleGenerateFlask = async () => {
    if (!origin || !destination) {
      Alert.alert('Missing Locations', 'Please select both origin and destination');
      return;
    }
    showLoading();
    setRoutes([]);
    setSelectedRouteId(null);
    try {
      console.log('🌐 Testing Flask backend integration...');
      const hybridResult = await hybridRouteService.generateRoutes(
        origin.location,
        destination.location,
        selectedHour
      );
      setRoutes(hybridResult.routes);
      setEnhancedRoutes([]); // Flask routes don't need enhanced format
      if (hybridResult.source === 'local') {
        try {
          const multipleRoutesResult = await generateMultipleRoutes(
            origin.location,
            destination.location,
            10
          );
          if (multipleRoutesResult.status === 'success') {
            setEnhancedRoutes(multipleRoutesResult.routes.slice(0, 3));
          }
        } catch (enhancedError) {
          console.log('⚠️ Could not store enhanced routes for time slider');
          setEnhancedRoutes([]);
        }
      } else {
        setEnhancedRoutes([]);
      }
      if (hybridResult.routes.length > 0) {
        setSelectedRouteId(hybridResult.routes[0].id);
      }
      let sortingDebug = 'Route Safety Scores:\n';
      hybridResult.routes.forEach((route, index) => {
        sortingDebug += `${index + 1}. ${route.safetyScore}/100 - ${route.name}\n`;
      });
      Alert.alert('Flask Test! 🌐', 
        `Generated ${hybridResult.routes.length} routes\n` +
        `Source: ${hybridResult.source}\n` +
        `API Available: ${hybridResult.api_available}\n\n` +
        sortingDebug
      );
    } catch (error) {
      console.error('❌ Flask generation failed:', error);
      Alert.alert('Flask Error', 'Flask backend not available or failed. Check server.');
    } finally {
      hideLoading();
    }
  };
  const handleRouteSelect = (routeId: string) => {
    setSelectedRouteId(routeId);
  };
  const recalculateRouteSafety = async (newHour: number) => {
    if (enhancedRoutes.length === 0) {
      console.log('⏰ Time changed to', newHour, 'but no routes to recalculate');
      return;
    }
    console.log(`⏰ Time slider moved to ${newHour}:00 - Recalculating safety scores...`);
    try {
      const crimeLoaded = await crimeDataService.loadCrimeData();
      if (crimeLoaded) {
        const updatedRoutes = convertEnhancedRoutesToRouteResults(
          enhancedRoutes,
          newHour,
          true // Use crime data
        );
        const routesWithPreservedAI = updatedRoutes.map((updatedRoute, index) => {
          const existingRoute = routes[index];
          return {
            ...updatedRoute,
            aiRiskPercentage: existingRoute?.aiRiskPercentage,
            aiExplanation: existingRoute?.aiExplanation
          };
        });
        setRoutes(routesWithPreservedAI);
        console.log(`🔄 Updated ${updatedRoutes.length} route safety scores for ${newHour}:00`);
        console.log('📋 Routes in order after recalculation:');
        updatedRoutes.forEach((route, index) => {
          console.log(`   ${index + 1}. ${route.name} (Safety: ${route.safetyScore}/100)`);
        });
        if (updatedRoutes.length > 0) {
          console.log(`🏆 Safest route at ${newHour}:00: "${updatedRoutes[0].name}" (${updatedRoutes[0].safetyScore}/100)`);
        }
      }
    } catch (error) {
      console.error('❌ Route safety recalculation failed:', error);
    }
  };
  const handleTimeChange = useCallback((newHour: number) => {
    setSelectedHour(newHour);
    if (recalculationTimeout.current) {
      clearTimeout(recalculationTimeout.current);
    }
    recalculationTimeout.current = setTimeout(() => {
      recalculateRouteSafety(newHour);
    }, 300); // 300ms delay for smooth UX
  }, [enhancedRoutes.length]);
  const canFindRoutes = origin && destination;
  const handleTestGoogle = async () => {
    if (!origin || !destination) {
      Alert.alert('Missing Locations', 'Please select both origin and destination first');
      return;
    }
    console.log('🧪 Testing Google Directions API...');
    const success = await testGoogleIntegration(origin.location, destination.location);
    if (success) {
      Alert.alert('Success! 🎉', 'Google Directions API is working! Check console for details.');
    } else {
      Alert.alert('API Issue', 'Google Directions API not working. Enable Directions API in Google Cloud Console.');
    }
  };
  const handleTestMultipleRoutes = async () => {
    console.log('🧪 Testing Multiple Route Generation...');
    Alert.alert('Testing Started', 'Multiple route generation test started. Check console for progress...');
    try {
      const testOrigin = { latitude: 25.7617, longitude: -80.1918 }; // Downtown Miami
      const testDestination = { latitude: 25.8010, longitude: -80.1993 }; // Wynwood
      console.log('📍 Test locations:', testOrigin, '→', testDestination);
      const result = await generateMultipleRoutes(testOrigin, testDestination, 8);
      console.log('📊 Route Generation Results:');
      console.log(`   Total Routes: ${result.total_routes}`);
      console.log(`   Successful: ${result.successful_routes}`);
      console.log(`   Failed: ${result.failed_routes}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Strategies: ${result.generation_strategies.join(', ')}`);
      result.routes.forEach((route, index) => {
        if (route.status === 'success') {
          console.log(`🛣️ Route ${index + 1}: ${route.summary}`);
          console.log(`   Distance: ${(route.distance_km * 0.621371).toFixed(1)}mi | Duration: ${route.duration_minutes}min`);
          console.log(`   Strategy: ${route.strategy} | Type: ${route.route_type}`);
        }
      });
      let routeDetails = '';
      result.routes.slice(0, 3).forEach((route, index) => { // Show first 3 routes in alert
        if (route.status === 'success') {
          routeDetails += `\n${index + 1}. ${route.summary}\n`;
          routeDetails += `   ${(route.distance_km * 0.621371).toFixed(1)}mi, ${route.duration_minutes}min\n`;
          routeDetails += `   Strategy: ${route.strategy}\n`;
        }
      });
      Alert.alert('Success! 🎉', 
        `Generated ${result.successful_routes} routes successfully!\n\n` +
        `Strategies: ${result.generation_strategies.join(', ')}\n\n` +
        `Routes (first 5):${routeDetails}\n` +
        `Check console for all ${result.total_routes} routes.`
      );
    } catch (error) {
      console.error('❌ Multiple route test failed:', error);
      Alert.alert('Test Failed ❌', 
        `Multiple route generation failed.\n\nError: ${error instanceof Error ? error.message : String(error)}\n\nCheck console for details.`
      );
    }
  };
  const handleTestCrimeData = async () => {
    console.log('🧪 Testing Crime Data Service...');
    Alert.alert('Testing Started', 'Crime data loading test started. Check console for progress...');
    try {
      await crimeDataService.testCrimeDataService();
      Alert.alert('Success! 🎉', 'Crime data loaded successfully! Check console for statistics.');
    } catch (error) {
      console.error('❌ Crime data test failed:', error);
      Alert.alert('Test Failed ❌', 
        `Crime data loading failed.\n\nError: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };
  const handleTestSafetyScoring = async () => {
    console.log('🧪 Testing Route Safety Scoring Algorithm...');
    Alert.alert('Testing Started', 'Safety scoring algorithm test started. This may take a moment...');
    try {
      await routeSafetyCalculator.testSafetyAlgorithm();
      Alert.alert('Success! 🎉', 'Safety scoring algorithm working! Check console for detailed performance metrics.');
    } catch (error) {
      console.error('❌ Safety scoring test failed:', error);
      Alert.alert('Test Failed ❌', 
        `Safety scoring failed.\n\nError: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };
  const handleTestCompleteWorkflow = async () => {
    try {
      Alert.alert('Starting Test', 'Generating routes and calculating crime scores...');
      const testOrigin = { latitude: 25.7617, longitude: -80.1918 }; // Downtown Miami
      const testDestination = { latitude: 25.8010, longitude: -80.1993 }; // Wynwood
      const routeResult = await generateMultipleRoutes(testOrigin, testDestination, 10);
      if (routeResult.status === 'error') {
        Alert.alert('Error', 'Failed to generate routes');
        return;
      }
      const crimeLoaded = await crimeDataService.loadCrimeData();
      if (!crimeLoaded) {
        Alert.alert('Error', 'Failed to load crime data');
        return;
      }
      let results = `Generated ${routeResult.successful_routes} routes:\n\n`;
      for (let i = 0; i < Math.min(routeResult.routes.length, 3); i++) {
        const route = routeResult.routes[i];
        let totalCrimes = 0;
        let totalScore = 0;
        const samplePoints = 5; // Check 5 points along the route
        for (let j = 0; j < samplePoints; j++) {
          const pointIndex = Math.floor((route.coordinates.length - 1) * (j / (samplePoints - 1)));
          const point = route.coordinates[pointIndex];
          const nearbyBrimes = crimeDataService.getCrimesNearLocation(point, 0.3); // 300m radius
          const score = crimeDataService.getLocationSafetyScore(point, selectedHour);
          totalCrimes += nearbyBrimes.length;
          totalScore += score;
        }
        const avgSafetyScore = Math.round(totalScore / samplePoints);
        results += `Route ${i + 1}: ${route.summary}\n`;
        results += `  Distance: ${(route.distance_km * 0.621371).toFixed(1)}mi\n`;
        results += `  Safety Score: ${avgSafetyScore}/100\n`;
        results += `  Crimes Nearby: ${totalCrimes}\n\n`;
      }
      Alert.alert('Route Safety Analysis', results);
    } catch (error) {
      Alert.alert('Error', `Test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  const handleTestFlaskAPI = async () => {
    console.log('🧪 Testing Flask API directly...');
    Alert.alert('Testing Started', 'Flask API test started. Check console for progress...');
    try {
      const success = await apiService.testAPIWorkflow();
      if (success) {
        Alert.alert('Flask API Success! 🌐', 
          'Flask backend is working correctly!\n\n' +
          '✅ Health check passed\n' +
          '✅ Route generation working\n' +
          '✅ Safety calculation working\n\n' +
          'Check console for detailed results.'
        );
      } else {
        Alert.alert('Flask API Failed ❌', 
          'Flask backend is not responding.\n\n' +
          'Debug Steps:\n' +
          '1. Check Flask is running (see console)\n' +
          '2. Try different network endpoints\n' +
          '3. Check simulator network settings\n\n' +
          'Flask Status: See detailed logs in console'
        );
      }
    } catch (error) {
      console.error('❌ Flask API test failed:', error);
      Alert.alert('Flask API Error ❌', 
        `Flask API test failed.\n\nError: ${error instanceof Error ? error.message : String(error)}\n\nCheck console for details.`
      );
    }
  };
  const handleTestHybridService = async () => {
    console.log('🧪 Testing Hybrid Service (API + Local)...');
    Alert.alert('Testing Started', 'Hybrid service test started. This tests both API and local fallback...');
    try {
      await hybridRouteService.testHybridWorkflow();
      const apiStatus = hybridRouteService.getAPIStatus();
      const statusText = apiStatus === true ? 'API Available 🌐' 
                      : apiStatus === false ? 'API Unavailable (Local Fallback) 🏠'
                      : 'API Status Unknown ❓';
      Alert.alert('Hybrid Service Success! 🔄', 
        `Hybrid service test completed!\n\n` +
        `Status: ${statusText}\n\n` +
        `✅ Route generation working\n` +
        `✅ Safety calculation working\n` +
        `✅ Fallback system tested\n\n` +
        `Check console for detailed results.`
      );
    } catch (error) {
      console.error('❌ Hybrid service test failed:', error);
      Alert.alert('Hybrid Service Error ❌', 
        `Hybrid service test failed.\n\nError: ${error instanceof Error ? error.message : String(error)}\n\nCheck console for details.`
      );
    }
  };
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
      {}
      <Animated.View
        style={[
          styles.bottomSheet,
          { height: bottomSheetAnimation }
        ]}
      >
        {}
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
          {}
          <View style={styles.headerContainer}>
            <View style={styles.logoContainer}>
              <View style={styles.logoIcon}>
                <Text style={styles.logoEmoji}>🛡️</Text>
              </View>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>Safe2Walk</Text>
                <Text style={styles.subtitle}>Navigate Miami Safely</Text>
              </View>
            </View>
            <View style={styles.statusIndicator}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Live</Text>
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📍 Route Planning</Text>
            <LocationInput
              label="From"
              placeholder="Choose start"
              selectedLocation={origin?.location || null}
              onLocationSelect={handleOriginSelect}
              emoji="🚀"
            />
            <LocationInput
              label="To"
              placeholder="Choose destination"
              selectedLocation={destination?.location || null}
              onLocationSelect={handleDestinationSelect}
              emoji="🎯"
            />
          </View>
          <View style={styles.section}>
            <View style={styles.sectionHeaderWithIndicator}>
              <Text style={styles.sectionTitle}>⏰ Time</Text>
              {isRecalculating && routes.length > 0 && (
                <Text style={styles.recalculatingText}>🔄 Updating safety...</Text>
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
              <Text style={[
                styles.searchButtonText,
                !canFindRoutes && styles.searchButtonTextDisabled
              ]}>
                {isLoading ? '🔍 Searching...' : '🔍 Find Safe Routes'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.section}>
            <RouteList 
              routes={routes}
              selectedRouteId={selectedRouteId}
              onRouteSelect={handleRouteSelect}
              origin={origin?.location}
              destination={destination?.location}
            />
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.98)', // Enhanced glass effect
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
    backgroundColor: 'rgba(60, 60, 67, 0.3)',
    borderRadius: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 60,
    paddingBottom: 100,
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
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  logoEmoji: {
    fontSize: 24,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    letterSpacing: -0.1,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
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
    backgroundColor: 'rgba(248, 250, 252, 0.8)', // Subtle translucent background
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700', // SF Pro Display semibold
    color: '#1a1a1a',
    marginBottom: 12,
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
    color: '#007AFF',
    fontStyle: 'italic',
  },
  placeholder: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  actionSection: {
    marginVertical: 8,
  },
  searchButton: {
    backgroundColor: '#22c55e', // Modern green gradient base
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
  },
  searchButtonDisabled: {
    backgroundColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    elevation: 2,
    borderColor: 'rgba(0, 0, 0, 0.06)',
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
    color: '#9ca3af',
    textShadowColor: 'transparent',
  },
  testButton: {
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    borderWidth: 1,
    borderColor: '#ff9500',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  testButtonDisabled: {
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
    borderColor: '#9ca3af',
  },
  testButtonText: {
    fontSize: 15,
    fontFamily: 'SF Pro Text',
    fontWeight: '700',
    color: '#ff9500',
    letterSpacing: -0.1,
  },
  multiTestButton: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderWidth: 1,
    borderColor: '#34c759',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  multiTestButtonText: {
    fontSize: 15,
    fontFamily: 'SF Pro Text',
    fontWeight: '700',
    color: '#34c759',
    letterSpacing: -0.1,
  },
  crimeTestButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderWidth: 1,
    borderColor: '#ff3b30',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  crimeTestButtonText: {
    fontSize: 15,
    fontFamily: 'SF Pro Text',
    fontWeight: '700',
    color: '#ff3b30',
    letterSpacing: -0.1,
  },
  safetyTestButton: {
    backgroundColor: 'rgba(142, 142, 147, 0.1)',
    borderWidth: 1,
    borderColor: '#8e8e93',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  safetyTestButtonText: {
    fontSize: 15,
    fontFamily: 'SF Pro Text',
    fontWeight: '700',
    color: '#8e8e93',
    letterSpacing: -0.1,
  },
  workflowTestButton: {
    backgroundColor: 'rgba(88, 86, 214, 0.1)',
    borderWidth: 1,
    borderColor: '#5856d6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  workflowTestButtonText: {
    fontSize: 15,
    fontFamily: 'SF Pro Text',
    fontWeight: '700',
    color: '#5856d6',
    letterSpacing: -0.1,
  },
  apiTestButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  apiTestButtonText: {
    fontSize: 15,
    fontFamily: 'SF Pro Text',
    fontWeight: '700',
    color: '#007AFF',
    letterSpacing: -0.1,
  },
  hybridTestButton: {
    backgroundColor: 'rgba(175, 82, 222, 0.1)',
    borderWidth: 1,
    borderColor: '#af52de',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  hybridTestButtonText: {
    fontSize: 15,
    fontFamily: 'SF Pro Text',
    fontWeight: '700',
    color: '#af52de',
    letterSpacing: -0.1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 20,
    minWidth: 280,
  },
  loadingSpinner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  loadingSpinnerText: {
    fontSize: 28,
    transform: [{ rotate: '0deg' }], // You could add rotation animation here
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  loadingSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
    letterSpacing: -0.1,
  },
  loadingProgress: {
    width: '100%',
    height: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingProgressBar: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 2,
    width: '70%',
  },
});