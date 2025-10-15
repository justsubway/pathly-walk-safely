import { RouteResult, LatLng } from '../lib/types';
import { crimeDataService } from './crimeDataService';

/**
 * Optimized route processing service
 * Reduces computational overhead and improves performance
 */

// Cache for route calculations to avoid recomputation
const routeCache = new Map<string, RouteResult>();
const safetyScoreCache = new Map<string, number>();

export interface OptimizedRouteProcessor {
  processRoutes: (routes: RouteResult[], selectedHour: number) => Promise<RouteResult[]>;
  calculateSafetyScore: (coords: LatLng[], selectedHour: number) => number;
  clearCache: () => void;
}

class OptimizedRouteProcessorImpl implements OptimizedRouteProcessor {
  private readonly MAX_CACHE_SIZE = 100;
  private readonly COORDINATE_SAMPLE_SIZE = 5; // Reduced from 10 for performance

  async processRoutes(routes: RouteResult[], selectedHour: number): Promise<RouteResult[]> {
    const startTime = performance.now();
    
    // Process routes in parallel for better performance
    const processedRoutes = await Promise.all(
      routes.map(route => this.processSingleRoute(route, selectedHour))
    );

    // Sort by safety score (highest first)
    const sortedRoutes = processedRoutes.sort((a, b) => (b.safetyScore || 0) - (a.safetyScore || 0));
    
    // Assign safety ranks
    sortedRoutes.forEach((route, index) => {
      route.safetyRank = index + 1;
    });

    const endTime = performance.now();
    console.log(`⚡ Route processing completed in ${(endTime - startTime).toFixed(2)}ms`);

    return sortedRoutes;
  }

  private async processSingleRoute(route: RouteResult, selectedHour: number): Promise<RouteResult> {
    const cacheKey = `${route.id}_${selectedHour}`;
    
    // Check cache first
    if (routeCache.has(cacheKey)) {
      return routeCache.get(cacheKey)!;
    }

    // Calculate safety score with caching
    const safetyScore = this.calculateSafetyScore(route.coords, selectedHour);
    
    // Create optimized route result
    const optimizedRoute: RouteResult = {
      ...route,
      safetyScore,
      // Add performance optimizations
      coords: this.optimizeCoordinates(route.coords),
    };

    // Cache the result
    this.cacheRoute(cacheKey, optimizedRoute);
    
    return optimizedRoute;
  }

  calculateSafetyScore(coords: LatLng[], selectedHour: number): number {
    if (!coords || coords.length === 0) return 75; // Default score

    const cacheKey = `${coords.length}_${selectedHour}_${coords[0].latitude}_${coords[0].longitude}`;
    
    if (safetyScoreCache.has(cacheKey)) {
      return safetyScoreCache.get(cacheKey)!;
    }

    // Sample fewer points for better performance
    const samplePoints = this.sampleCoordinates(coords, this.COORDINATE_SAMPLE_SIZE);
    let totalScore = 0;
    let validPoints = 0;

    for (const point of samplePoints) {
      try {
        const pointScore = crimeDataService.getLocationSafetyScore(point, selectedHour);
        totalScore += pointScore;
        validPoints++;
      } catch (error) {
        // Skip invalid points
        continue;
      }
    }

    const averageScore = validPoints > 0 ? totalScore / validPoints : 75;
    const finalScore = Math.max(0, Math.min(100, Math.round(averageScore)));

    // Cache the result
    this.cacheSafetyScore(cacheKey, finalScore);
    
    return finalScore;
  }

  private sampleCoordinates(coords: LatLng[], sampleSize: number): LatLng[] {
    if (coords.length <= sampleSize) return coords;
    
    const step = Math.floor(coords.length / sampleSize);
    const samples: LatLng[] = [];
    
    for (let i = 0; i < coords.length; i += step) {
      samples.push(coords[i]);
      if (samples.length >= sampleSize) break;
    }
    
    // Always include the last coordinate
    if (samples[samples.length - 1] !== coords[coords.length - 1]) {
      samples.push(coords[coords.length - 1]);
    }
    
    return samples;
  }

  private optimizeCoordinates(coords: LatLng[]): LatLng[] {
    if (!coords || coords.length <= 20) return coords;
    
    // Reduce coordinate density for better performance
    const step = Math.max(1, Math.floor(coords.length / 20));
    const optimized: LatLng[] = [];
    
    for (let i = 0; i < coords.length; i += step) {
      optimized.push(coords[i]);
    }
    
    // Always include the last coordinate
    if (optimized[optimized.length - 1] !== coords[coords.length - 1]) {
      optimized.push(coords[coords.length - 1]);
    }
    
    return optimized;
  }

  private cacheRoute(key: string, route: RouteResult): void {
    if (routeCache.size >= this.MAX_CACHE_SIZE) {
      // Remove oldest entry
      const firstKey = routeCache.keys().next().value;
      routeCache.delete(firstKey);
    }
    routeCache.set(key, route);
  }

  private cacheSafetyScore(key: string, score: number): void {
    if (safetyScoreCache.size >= this.MAX_CACHE_SIZE) {
      // Remove oldest entry
      const firstKey = safetyScoreCache.keys().next().value;
      safetyScoreCache.delete(firstKey);
    }
    safetyScoreCache.set(key, score);
  }

  clearCache(): void {
    routeCache.clear();
    safetyScoreCache.clear();
    console.log('🗑️ Route processing cache cleared');
  }
}

export const optimizedRouteProcessor = new OptimizedRouteProcessorImpl();
