import { LatLng, RouteResult } from '../lib/types';

export interface AISafetyPrediction {
  riskPercentage: number;
  confidence: number;
  explanation: string;
  factors: {
    timeOfDay: number;
    areaType: number;
    historicalData: number;
    weather: number;
    lighting: number;
  };
  recommendations: string[];
}

export class AISafetyPredictor {
  private modelWeights = {
    timeOfDay: 0.25,
    areaType: 0.20,
    historicalData: 0.30,
    weather: 0.15,
    lighting: 0.10
  };

  async predictSafety(route: RouteResult, selectedHour: number, location: LatLng): Promise<AISafetyPrediction> {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const factors = await this.analyzeFactors(route, selectedHour, location);
    const riskPercentage = this.calculateRiskPercentage(factors);
    const confidence = this.calculateConfidence(factors);
    const explanation = this.generateExplanation(factors, riskPercentage);
    const recommendations = this.generateRecommendations(factors, riskPercentage);

    return {
      riskPercentage,
      confidence,
      explanation,
      factors,
      recommendations
    };
  }

  private async analyzeFactors(route: RouteResult, selectedHour: number, location: LatLng) {
    return {
      timeOfDay: this.analyzeTimeOfDay(selectedHour),
      areaType: this.analyzeAreaType(location),
      historicalData: await this.analyzeHistoricalData(location),
      weather: this.analyzeWeatherConditions(),
      lighting: this.analyzeLightingConditions(selectedHour)
    };
  }

  private analyzeTimeOfDay(hour: number): number {
    // Risk score 0-100 (higher = more risky)
    if (hour >= 6 && hour < 12) return 10; // Morning - very safe
    if (hour >= 12 && hour < 18) return 15; // Afternoon - safe
    if (hour >= 18 && hour < 22) return 35; // Evening - moderate risk
    if (hour >= 22 && hour < 24) return 70; // Late night - high risk
    return 85; // Very late night/early morning - very high risk
  }

  private analyzeAreaType(location: LatLng): number {
    // Analyze based on Athens geography
    const { latitude, longitude } = location;
    
    // Syntagma/Plaka area (tourist, well-lit)
    if (latitude > 37.975 && latitude < 37.978 && longitude > 23.730 && longitude < 23.740) {
      return 20;
    }
    
    // Acropolis area (tourist, safe)
    if (latitude > 37.970 && latitude < 37.975 && longitude > 23.720 && longitude < 23.730) {
      return 15;
    }
    
    // Omonia area (higher risk)
    if (latitude > 37.980 && latitude < 37.985 && longitude > 23.725 && longitude < 23.735) {
      return 60;
    }
    
    // Residential areas
    if (latitude > 37.985 && latitude < 37.995) {
      return 30;
    }
    
    // Industrial/isolated areas
    if (latitude < 37.970 || longitude < 23.720) {
      return 50;
    }
    
    return 40; // Default moderate risk
  }

  private async analyzeHistoricalData(location: LatLng): Promise<number> {
    // Simulate historical crime data analysis
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Mock historical analysis based on location
    const baseRisk = 30;
    const randomVariation = (Math.random() - 0.5) * 20;
    const timeVariation = Math.random() * 15;
    
    return Math.max(0, Math.min(100, baseRisk + randomVariation + timeVariation));
  }

  private analyzeWeatherConditions(): number {
    // Mock weather analysis (in real app, would use weather API)
    const weatherConditions = ['clear', 'cloudy', 'rainy', 'foggy'][Math.floor(Math.random() * 4)];
    
    switch (weatherConditions) {
      case 'clear': return 20;
      case 'cloudy': return 30;
      case 'rainy': return 50;
      case 'foggy': return 60;
      default: return 40;
    }
  }

  private analyzeLightingConditions(hour: number): number {
    if (hour >= 6 && hour < 19) return 10; // Daylight
    if (hour >= 19 && hour < 21) return 30; // Dusk
    if (hour >= 21 && hour < 23) return 60; // Evening
    return 80; // Night time
  }

  private calculateRiskPercentage(factors: any): number {
    const weightedRisk = 
      (factors.timeOfDay * this.modelWeights.timeOfDay) +
      (factors.areaType * this.modelWeights.areaType) +
      (factors.historicalData * this.modelWeights.historicalData) +
      (factors.weather * this.modelWeights.weather) +
      (factors.lighting * this.modelWeights.lighting);

    return Math.round(Math.max(0, Math.min(100, weightedRisk)));
  }

  private calculateConfidence(factors: any): number {
    // Higher confidence when factors are consistent
    const variance = this.calculateVariance(Object.values(factors));
    const baseConfidence = 85;
    const variancePenalty = Math.min(20, variance);
    
    return Math.max(60, baseConfidence - variancePenalty);
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private generateExplanation(factors: any, riskPercentage: number): string {
    const explanations = [];
    
    if (factors.timeOfDay > 60) {
      explanations.push("Night time significantly increases risk");
    }
    
    if (factors.areaType > 50) {
      explanations.push("Area has higher crime rates");
    }
    
    if (factors.historicalData > 60) {
      explanations.push("Recent incidents reported nearby");
    }
    
    if (factors.weather > 50) {
      explanations.push("Weather conditions reduce visibility");
    }
    
    if (factors.lighting > 60) {
      explanations.push("Poor lighting conditions");
    }
    
    if (riskPercentage < 30) {
      explanations.push("Generally safe conditions");
    }
    
    return explanations.length > 0 
      ? explanations.join(". ") + "."
      : "Standard safety conditions apply.";
  }

  private generateRecommendations(factors: any, riskPercentage: number): string[] {
    const recommendations = [];
    
    if (riskPercentage > 70) {
      recommendations.push("Consider alternative transportation");
      recommendations.push("Walk with a companion");
      recommendations.push("Stay in well-lit areas");
    } else if (riskPercentage > 50) {
      recommendations.push("Stay alert and aware of surroundings");
      recommendations.push("Keep phone charged and accessible");
    } else if (riskPercentage > 30) {
      recommendations.push("Standard safety precautions apply");
    } else {
      recommendations.push("Route appears safe for walking");
    }
    
    if (factors.timeOfDay > 60) {
      recommendations.push("Use main roads and avoid shortcuts");
    }
    
    if (factors.weather > 50) {
      recommendations.push("Wear visible clothing");
    }
    
    return recommendations;
  }
}

export const aiSafetyPredictor = new AISafetyPredictor();





