/**
 * Performance monitoring utilities for Pathly app
 * Helps identify and track performance bottlenecks
 */

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private isEnabled: boolean = __DEV__; // Only enable in development

  startTiming(name: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata,
    });
  }

  endTiming(name: string): number | null {
    if (!this.isEnabled) return null;

    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance metric "${name}" not found`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;

    // Log slow operations
    if (duration > 100) {
      console.warn(`🐌 Slow operation: ${name} took ${duration.toFixed(2)}ms`, metric.metadata);
    } else if (duration > 50) {
      console.log(`⚡ ${name}: ${duration.toFixed(2)}ms`, metric.metadata);
    }

    return duration;
  }

  getMetric(name: string): PerformanceMetric | undefined {
    return this.metrics.get(name);
  }

  getAllMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  clearMetrics(): void {
    this.metrics.clear();
  }

  // Helper function to measure async operations
  async measureAsync<T>(
    name: string, 
    operation: () => Promise<T>, 
    metadata?: Record<string, any>
  ): Promise<T> {
    this.startTiming(name, metadata);
    try {
      const result = await operation();
      this.endTiming(name);
      return result;
    } catch (error) {
      this.endTiming(name);
      throw error;
    }
  }

  // Helper function to measure sync operations
  measure<T>(
    name: string, 
    operation: () => T, 
    metadata?: Record<string, any>
  ): T {
    this.startTiming(name, metadata);
    try {
      const result = operation();
      this.endTiming(name);
      return result;
    } catch (error) {
      this.endTiming(name);
      throw error;
    }
  }

  // Generate performance report
  generateReport(): string {
    const metrics = this.getAllMetrics();
    const completedMetrics = metrics.filter(m => m.duration !== undefined);
    
    if (completedMetrics.length === 0) {
      return 'No performance metrics recorded';
    }

    const totalTime = completedMetrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    const avgTime = totalTime / completedMetrics.length;
    const slowest = completedMetrics.reduce((max, m) => 
      (m.duration || 0) > (max.duration || 0) ? m : max
    );

    return `
📊 Performance Report:
  Total operations: ${completedMetrics.length}
  Total time: ${totalTime.toFixed(2)}ms
  Average time: ${avgTime.toFixed(2)}ms
  Slowest operation: ${slowest.name} (${slowest.duration?.toFixed(2)}ms)
  
  All metrics:
${completedMetrics.map(m => `  - ${m.name}: ${m.duration?.toFixed(2)}ms`).join('\n')}
    `.trim();
  }
}

export const performanceMonitor = new PerformanceMonitor();

// React hook for measuring component render times
export function usePerformanceMeasure(componentName: string) {
  const startRender = () => {
    performanceMonitor.startTiming(`${componentName}_render`);
  };

  const endRender = () => {
    performanceMonitor.endTiming(`${componentName}_render`);
  };

  return { startRender, endRender };
}
