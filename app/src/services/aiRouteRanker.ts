import { RouteResult, LatLng } from '../lib/types';
import { aiSafetyPredictor, AISafetyPrediction } from './aiSafetyPredictor';
import { realCrimeDataService, CrimeStatistics } from './realCrimeDataService';

export interface RouteRanking {
  routeId: string;
  overallScore: number;
  safetyScore: number;
  efficiencyScore: number;
  aiPrediction: AISafetyPrediction;
  crimeStats: CrimeStatistics;
  ranking: number;
  confidence: number;
  recommendations: string[];
  warnings: string[];
}

export class AIRouteRanker {
  async rankRoutes(routes: RouteResult[], selectedHour: number): Promise<RouteRanking[]> {
    const rankings: RouteRanking[] = [];

    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      const midPoint = this.getRouteMidPoint(route.coords);
      
      // Get AI safety prediction
      const aiPrediction = await aiSafetyPredictor.predictSafety(route, selectedHour, midPoint);
      
      // Get crime statistics for the route area
      const crimeStats = await realCrimeDataService.getCrimeStatistics(midPoint, 0.5);
      
      // Calculate efficiency score
      const efficiencyScore = this.calculateEfficiencyScore(route);
      
      // Calculate overall score (weighted combination)
      const overallScore = this.calculateOverallScore(
        aiPrediction.riskPercentage,
        efficiencyScore,
        crimeStats,
        selectedHour
      );
      
      // Generate recommendations and warnings
      const recommendations = this.generateRecommendations(aiPrediction, crimeStats, route);
      const warnings = this.generateWarnings(aiPrediction, crimeStats, selectedHour);
      
      rankings.push({
        routeId: route.id,
        overallScore,
        safetyScore: 100 - aiPrediction.riskPercentage, // Convert risk to safety
        efficiencyScore,
        aiPrediction,
        crimeStats,
        ranking: 0, // Will be set after sorting
        confidence: aiPrediction.confidence,
        recommendations,
        warnings
      });
    }

    // Sort by overall score (highest first) and assign rankings
    rankings.sort((a, b) => b.overallScore - a.overallScore);
    rankings.forEach((ranking, index) => {
      ranking.ranking = index + 1;
    });

    return rankings;
  }

  private getRouteMidPoint(coords: LatLng[]): LatLng {
    const midIndex = Math.floor(coords.length / 2);
    return coords[midIndex];
  }

  private calculateEfficiencyScore(route: RouteResult): number {
    // Factors: distance, duration, number of turns, elevation changes
    let score = 100;
    
    // Distance factor (shorter is better, but not too short)
    const optimalDistance = 1.5; // km
    const distanceDiff = Math.abs(route.distance - optimalDistance);
    score -= distanceDiff * 10;
    
    // Duration factor (shorter is better)
    const optimalDuration = 20; // minutes
    const durationDiff = Math.abs(route.duration - optimalDuration);
    score -= durationDiff * 2;
    
    // Route complexity (fewer turns is better)
    const complexity = this.calculateRouteComplexity(route.coords);
    score -= complexity * 5;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private calculateRouteComplexity(coords: LatLng[]): number {
    if (coords.length < 3) return 0;
    
    let directionChanges = 0;
    let prevDirection = this.getDirection(coords[0], coords[1]);
    
    for (let i = 1; i < coords.length - 1; i++) {
      const currentDirection = this.getDirection(coords[i], coords[i + 1]);
      if (Math.abs(currentDirection - prevDirection) > 45) { // Significant direction change
        directionChanges++;
      }
      prevDirection = currentDirection;
    }
    
    return directionChanges;
  }

  private getDirection(point1: LatLng, point2: LatLng): number {
    const latDiff = point2.latitude - point1.latitude;
    const lngDiff = point2.longitude - point1.longitude;
    return Math.atan2(lngDiff, latDiff) * 180 / Math.PI;
  }

  private calculateOverallScore(
    riskPercentage: number,
    efficiencyScore: number,
    crimeStats: CrimeStatistics,
    selectedHour: number
  ): number {
    // Weighted scoring
    const safetyWeight = 0.5;
    const efficiencyWeight = 0.3;
    const crimeWeight = 0.2;
    
    const safetyScore = 100 - riskPercentage;
    const crimeScore = this.calculateCrimeScore(crimeStats);
    const timeBonus = this.calculateTimeBonus(selectedHour);
    
    const weightedScore = 
      (safetyScore * safetyWeight) +
      (efficiencyScore * efficiencyWeight) +
      (crimeScore * crimeWeight) +
      timeBonus;
    
    return Math.max(0, Math.min(100, Math.round(weightedScore)));
  }

  private calculateCrimeScore(crimeStats: CrimeStatistics): number {
    let score = 100;
    
    // Penalty for high crime rates
    score -= crimeStats.totalIncidents * 2;
    score -= crimeStats.recentIncidents * 5;
    
    // Penalty for high severity crimes
    score -= crimeStats.severityBreakdown.high * 10;
    score -= crimeStats.severityBreakdown.medium * 5;
    
    // Penalty for dangerous crime types
    score -= crimeStats.typeBreakdown.assault * 15;
    score -= crimeStats.typeBreakdown.robbery * 20;
    
    return Math.max(0, Math.min(100, score));
  }

  private calculateTimeBonus(selectedHour: number): number {
    // Bonus for safer times
    if (selectedHour >= 6 && selectedHour < 12) return 5; // Morning
    if (selectedHour >= 12 && selectedHour < 18) return 3; // Afternoon
    if (selectedHour >= 18 && selectedHour < 22) return 0; // Evening
    return -10; // Night time penalty
  }

  private generateRecommendations(
    aiPrediction: AISafetyPrediction,
    crimeStats: CrimeStatistics,
    route: RouteResult
  ): string[] {
    const recommendations = [...aiPrediction.recommendations];
    
    if (crimeStats.recentIncidents > 3) {
      recommendations.push('High recent crime activity - consider alternative route');
    }
    
    if (crimeStats.severityBreakdown.high > 0) {
      recommendations.push('Serious crimes reported in this area recently');
    }
    
    if (route.distance > 3) {
      recommendations.push('Long route - consider breaking into segments');
    }
    
    if (route.duration > 45) {
      recommendations.push('Extended walking time - ensure you have water and comfortable shoes');
    }
    
    return recommendations;
  }

  private generateWarnings(
    aiPrediction: AISafetyPrediction,
    crimeStats: CrimeStatistics,
    selectedHour: number
  ): string[] {
    const warnings = [];
    
    if (aiPrediction.riskPercentage > 70) {
      warnings.push('HIGH RISK: Consider alternative transportation');
    }
    
    if (crimeStats.recentIncidents > 5) {
      warnings.push('Multiple recent incidents in this area');
    }
    
    if (crimeStats.severityBreakdown.high > 2) {
      warnings.push('Serious crimes reported recently');
    }
    
    if (selectedHour >= 22 || selectedHour <= 5) {
      warnings.push('Night time walking - extra caution required');
    }
    
    if (aiPrediction.confidence < 70) {
      warnings.push('Limited data available for this route');
    }
    
    return warnings;
  }

  // Method to get route ranking summary
  getRankingSummary(rankings: RouteRanking[]): {
    bestRoute: RouteRanking | null;
    averageScore: number;
    safetyRange: { min: number; max: number };
    recommendations: string[];
  } {
    if (rankings.length === 0) {
      return {
        bestRoute: null,
        averageScore: 0,
        safetyRange: { min: 0, max: 0 },
        recommendations: []
      };
    }

    const bestRoute = rankings[0];
    const averageScore = rankings.reduce((sum, r) => sum + r.overallScore, 0) / rankings.length;
    const safetyScores = rankings.map(r => r.safetyScore);
    const safetyRange = {
      min: Math.min(...safetyScores),
      max: Math.max(...safetyScores)
    };

    const recommendations = [
      `Best route: ${bestRoute.overallScore}% overall score`,
      `Safety range: ${safetyRange.min}% - ${safetyRange.max}%`,
      `Average confidence: ${Math.round(rankings.reduce((sum, r) => sum + r.confidence, 0) / rankings.length)}%`
    ];

    return {
      bestRoute,
      averageScore: Math.round(averageScore),
      safetyRange,
      recommendations
    };
  }
}

export const aiRouteRanker = new AIRouteRanker();





