import { useState, useCallback, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import { AIInsightsResponse, AITradingInsight } from '@/lib/types';

interface UseTradingInsightsOptions {
  limit?: number;
  autoFetch?: boolean;
  refreshInterval?: number; // in milliseconds, 0 to disable
}

export function useTradingInsights(options: UseTradingInsightsOptions = {}) {
  const {
    limit = 10,
    autoFetch = false,
    refreshInterval = 0, // Default: no auto-refresh
  } = options;

  const [insights, setInsights] = useState<AIInsightsResponse | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const fetchInsights = useCallback(async (insightLimit: number = limit) => {
    setIsFetching(true);
    setError(null);

    try {
      const result = await apiClient.getTradingInsights(insightLimit);
      setInsights(result);
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Lỗi khi lấy trading insights';
      setError(errorMessage);
      return null;
    } finally {
      setIsFetching(false);
    }
  }, [limit]);

  const refresh = useCallback(() => {
    return fetchInsights(limit);
  }, [limit, fetchInsights]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchInsights(limit);
    }
  }, [autoFetch, limit, fetchInsights]);

  // Auto-refresh interval
  useEffect(() => {
    if (refreshInterval > 0) {
      refreshTimeoutRef.current = setInterval(() => {
        fetchInsights(limit);
      }, refreshInterval);

      return () => {
        if (refreshTimeoutRef.current) {
          clearInterval(refreshTimeoutRef.current);
        }
      };
    }
  }, [refreshInterval, limit, fetchInsights]);

  // Helper computed values
  const highPriorityInsights = insights?.insights.filter(i => i.priority === 'high') || [];
  const recommendations = insights?.insights.filter(i => i.type === 'recommendation') || [];
  const warnings = insights?.insights.filter(i => i.type === 'warning') || [];
  const observations = insights?.insights.filter(i => i.type === 'observation') || [];

  const riskInsights = insights?.insights.filter(i => i.category === 'risk') || [];
  const opportunityInsights = insights?.insights.filter(i => i.category === 'opportunity') || [];
  const performanceInsights = insights?.insights.filter(i => i.category === 'performance') || [];
  const diversificationInsights = insights?.insights.filter(i => i.category === 'diversification') || [];

  const portfolioSummary = insights?.portfolio_summary || null;
  const hasWarnings = warnings.length > 0;
  const hasHighPriorityInsights = highPriorityInsights.length > 0;

  return {
    insights: insights?.insights || [],
    portfolioSummary,
    isFetching,
    error,
    fetchInsights,
    refresh,
    // Filtered insights
    highPriorityInsights,
    recommendations,
    warnings,
    observations,
    riskInsights,
    opportunityInsights,
    performanceInsights,
    diversificationInsights,
    // Helper flags
    hasWarnings,
    hasHighPriorityInsights,
    totalInsights: insights?.insights.length || 0,
  };
}
