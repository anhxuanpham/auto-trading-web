import { useState, useCallback, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import { AIPricePredictionResponse } from '@/lib/types';

interface UsePricePredictionOptions {
  symbol?: string;
  horizonMinutes?: number;
  autoPredict?: boolean;
  refreshInterval?: number; // in milliseconds, 0 to disable
}

export function usePricePrediction(options: UsePricePredictionOptions = {}) {
  const {
    symbol: initialSymbol,
    horizonMinutes = 15,
    autoPredict = false,
    refreshInterval = 0, // Default: no auto-refresh
  } = options;

  const [prediction, setPrediction] = useState<AIPricePredictionResponse | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [symbol, setSymbol] = useState<string | undefined>(initialSymbol);

  const refreshTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const cacheRef = useRef<Map<string, { prediction: AIPricePredictionResponse; timestamp: number }>>(new Map());
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  const predictPrice = useCallback(async (targetSymbol: string, horizon: number = horizonMinutes) => {
    if (!targetSymbol) {
      setError('Symbol is required');
      return null;
    }

    // Check cache first
    const cacheKey = `${targetSymbol}-${horizon}`;
    const cached = cacheRef.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setPrediction(cached.prediction);
      return cached.prediction;
    }

    setIsPredicting(true);
    setError(null);

    try {
      const result = await apiClient.predictPrice(targetSymbol, horizon);
      setPrediction(result);

      // Update cache
      cacheRef.current.set(cacheKey, { prediction: result, timestamp: Date.now() });

      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Lỗi khi dự đoán giá';
      setError(errorMessage);
      return null;
    } finally {
      setIsPredicting(false);
    }
  }, [horizonMinutes]);

  const refresh = useCallback(() => {
    if (symbol) {
      return predictPrice(symbol, horizonMinutes);
    }
    return Promise.resolve(null);
  }, [symbol, horizonMinutes, predictPrice]);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  // Auto-predict on symbol change
  useEffect(() => {
    if (autoPredict && symbol) {
      predictPrice(symbol, horizonMinutes);
    }
  }, [autoPredict, symbol, horizonMinutes, predictPrice]);

  // Auto-refresh interval
  useEffect(() => {
    if (refreshInterval > 0 && symbol) {
      refreshTimeoutRef.current = setInterval(() => {
        predictPrice(symbol, horizonMinutes);
      }, refreshInterval);

      return () => {
        if (refreshTimeoutRef.current) {
          clearInterval(refreshTimeoutRef.current);
        }
      };
    }
  }, [refreshInterval, symbol, horizonMinutes, predictPrice]);

  const isBullish = prediction?.direction === 'bullish';
  const isBearish = prediction?.direction === 'bearish';
  const isNeutral = prediction?.direction === 'neutral';
  const confidence = prediction?.confidence || 0;
  const hasHighConfidence = confidence >= 0.7;

  return {
    prediction,
    isPredicting,
    error,
    symbol,
    setSymbol,
    predictPrice,
    refresh,
    clearCache,
    // Helper flags
    isBullish,
    isBearish,
    isNeutral,
    confidence,
    hasHighConfidence,
    direction: prediction?.direction || null,
    predictedChangePct: prediction?.predicted_change_pct || null,
  };
}
