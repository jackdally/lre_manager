import { useRef, useCallback } from 'react';

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

interface PerformanceStats {
  totalOperations: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  cacheHits: number;
  cacheMisses: number;
}

export const usePerformanceMonitor = () => {
  const metricsRef = useRef<Map<string, PerformanceMetric[]>>(new Map());
  const statsRef = useRef<PerformanceStats>({
    totalOperations: 0,
    averageDuration: 0,
    minDuration: Infinity,
    maxDuration: 0,
    cacheHits: 0,
    cacheMisses: 0,
  });

  const startTimer = useCallback((name: string) => {
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
    };

    if (!metricsRef.current.has(name)) {
      metricsRef.current.set(name, []);
    }
    metricsRef.current.get(name)!.push(metric);
  }, []);

  const endTimer = useCallback((name: string) => {
    const metrics = metricsRef.current.get(name);
    if (!metrics || metrics.length === 0) return;

    const metric = metrics[metrics.length - 1];
    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    // Update stats
    const stats = statsRef.current;
    stats.totalOperations++;
    stats.averageDuration = (stats.averageDuration * (stats.totalOperations - 1) + metric.duration!) / stats.totalOperations;
    stats.minDuration = Math.min(stats.minDuration, metric.duration!);
    stats.maxDuration = Math.max(stats.maxDuration, metric.duration!);
  }, []);

  const recordCacheHit = useCallback(() => {
    statsRef.current.cacheHits++;
  }, []);

  const recordCacheMiss = useCallback(() => {
    statsRef.current.cacheMisses++;
  }, []);

  const getMetrics = useCallback((name?: string) => {
    if (name) {
      return metricsRef.current.get(name) || [];
    }
    return Array.from(metricsRef.current.values()).flat();
  }, []);

  const getStats = useCallback(() => {
    return { ...statsRef.current };
  }, []);

  const clearMetrics = useCallback(() => {
    metricsRef.current.clear();
    statsRef.current = {
      totalOperations: 0,
      averageDuration: 0,
      minDuration: Infinity,
      maxDuration: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }, []);

  const logPerformanceReport = useCallback(() => {
    const stats = getStats();
    const metrics = getMetrics();
    
    console.group('🚀 Performance Report');
    console.log('📊 Overall Stats:', stats);
    console.log('📈 Cache Hit Rate:', stats.cacheHits / (stats.cacheHits + stats.cacheMisses) * 100, '%');
    console.log('⏱️ Average Duration:', stats.averageDuration.toFixed(2), 'ms');
    console.log('📋 Total Operations:', stats.totalOperations);
    
    // Group metrics by name
    const groupedMetrics = metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) acc[metric.name] = [];
      acc[metric.name].push(metric);
      return acc;
    }, {} as Record<string, PerformanceMetric[]>);

    console.log('📝 Detailed Metrics:', groupedMetrics);
    console.groupEnd();
  }, [getStats, getMetrics]);

  return {
    startTimer,
    endTimer,
    recordCacheHit,
    recordCacheMiss,
    getMetrics,
    getStats,
    clearMetrics,
    logPerformanceReport,
  };
}; 