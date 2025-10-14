import { LatLng, RouteResult } from '../lib/types';
import { crimeDataService } from './crimeDataService';

export interface SafetyAnalysis {
  overallScore: number;
  timeBasedScore: number;
  crimeBasedScore: number;
  areaBasedScore: number;
  recommendations: string[];
  warnings: string[];
}

export class RouteSafetyCalculator {
  async analyzeRoute(route: RouteResult, selectedHour: number): Promise<SafetyAnalysis> {
    // Load crime data
    await crimeDataService.loadCrimeData();
    
    const timeBasedScore = this.calculateTimeBasedSafety(selectedHour);
    const crimeBasedScore = this.calculateCrimeBasedSafety(route.coords, selectedHour);
    const areaBasedScore = this.calculateAreaBasedSafety(route.coords);
    
    // Weighted average
    const overallScore = Math.round(
      (timeBasedScore * 0.3) + 
      (crimeBasedScore * 0.5) + 
      (areaBasedScore * 0.2)
    );
    
    const recommendations = this.generateRecommendations(overallScore, selectedHour, route);
    const warnings = this.generateWarnings(overallScore, crimeBasedScore, selectedHour);
    
    return {
      overallScore,
      timeBasedScore,
      crimeBasedScore,
      areaBasedScore,
      recommendations,
      warnings
    };
  }
  
  private calculateTimeBasedSafety(hour: number): number {
    if (hour >= 6 && hour < 12) {
      return 90; // Morning is very safe
    } else if (hour >= 12 && hour < 18) {
      return 85; // Afternoon is safe
    } else if (hour >= 18 && hour < 22) {
      return 75; // Evening is moderately safe
    } else {
      return 50; // Night time is less safe
    }
  }
  
  private calculateCrimeBasedSafety(coords: LatLng[], hour: number): number {
    let totalScore = 0;
    let samplePoints = 0;
    
    // Sample points along the route
    const sampleCount = Math.min(8, coords.length);
    for (let i = 0; i < sampleCount; i++) {
      const index = Math.floor((i / (sampleCount - 1)) * (coords.length - 1));
      const point = coords[index];
      
      const pointScore = crimeDataService.getLocationSafetyScore(point, hour);
      totalScore += pointScore;
      samplePoints++;
    }
    
    return samplePoints > 0 ? totalScore / samplePoints : 75;
  }
  
  private calculateAreaBasedSafety(coords: LatLng[]): number {
    // Analyze the type of areas the route passes through
    let score = 80; // Base score
    
    // Check if route passes through commercial areas (generally safer)
    const hasCommercialAreas = this.checkForCommercialAreas(coords);
    if (hasCommercialAreas) {
      score += 10;
    }
    
    // Check if route passes through residential areas (moderately safe)
    const hasResidentialAreas = this.checkForResidentialAreas(coords);
    if (hasResidentialAreas) {
      score += 5;
    }
    
    // Check if route passes through isolated areas (less safe)
    const hasIsolatedAreas = this.checkForIsolatedAreas(coords);
    if (hasIsolatedAreas) {
      score -= 15;
    }
    
    return Math.max(0, Math.min(100, score));
  }
  
  private checkForCommercialAreas(coords: LatLng[]): boolean {
    // Simplified check - in a real app, this would use more sophisticated area detection
    // For now, we'll assume areas near the center of Athens are commercial
    return coords.some(coord => 
      Math.abs(coord.latitude - 37.9755) < 0.01 && 
      Math.abs(coord.longitude - 23.7348) < 0.01
    );
  }
  
  private checkForResidentialAreas(coords: LatLng[]): boolean {
    // Simplified check for residential areas
    return coords.some(coord => 
      coord.latitude > 37.98 && coord.latitude < 37.99 &&
      coord.longitude > 23.72 && coord.longitude < 23.74
    );
  }
  
  private checkForIsolatedAreas(coords: LatLng[]): boolean {
    // Check for areas with fewer nearby coordinates (isolated)
    const isolatedThreshold = 0.005; // 500m
    let isolatedCount = 0;
    
    for (let i = 0; i < coords.length; i++) {
      const coord = coords[i];
      const nearbyCoords = coords.filter(otherCoord => 
        this.calculateDistance(coord, otherCoord) < isolatedThreshold
      );
      
      if (nearbyCoords.length < 3) {
        isolatedCount++;
      }
    }
    
    return isolatedCount > coords.length * 0.3; // More than 30% isolated
  }
  
  private generateRecommendations(overallScore: number, hour: number, route: RouteResult): string[] {
    const recommendations: string[] = [];
    
    if (overallScore < 60) {
      recommendations.push('Consider taking a different route or using public transport');
      recommendations.push('Walk with a friend if possible');
    }
    
    if (hour >= 22 || hour <= 5) {
      recommendations.push('Stay in well-lit areas');
      recommendations.push('Keep your phone charged and accessible');
    }
    
    if (route.distance > 2) {
      recommendations.push('Consider breaking this into shorter segments');
    }
    
    if (overallScore > 80) {
      recommendations.push('This route looks safe for walking');
    }
    
    return recommendations;
  }
  
  private generateWarnings(overallScore: number, crimeScore: number, hour: number): string[] {
    const warnings: string[] = [];
    
    if (overallScore < 50) {
      warnings.push('High risk area - avoid if possible');
    } else if (overallScore < 70) {
      warnings.push('Moderate risk - stay alert');
    }
    
    if (crimeScore < 60) {
      warnings.push('Recent crime activity in this area');
    }
    
    if (hour >= 22 || hour <= 5) {
      warnings.push('Night time walking - extra caution advised');
    }
    
    return warnings;
  }
  
  private calculateDistance(point1: LatLng, point2: LatLng): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(point2.latitude - point1.latitude);
    const dLon = this.toRad(point2.longitude - point1.longitude);
    const lat1 = this.toRad(point1.latitude);
    const lat2 = this.toRad(point2.latitude);

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  private toRad(deg: number): number {
    return deg * (Math.PI/180);
  }
}

export const routeSafetyCalculator = new RouteSafetyCalculator();