import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { AIRiskAnalysisResponse, AIOrderAnalysisRequest, OrderSide } from '@/lib/types';

interface UseRiskAnalysisOptions {
  autoAnalyze?: boolean;
}

export function useRiskAnalysis(options: UseRiskAnalysisOptions = {}) {
  const { autoAnalyze = false } = options;

  const [analysis, setAnalysis] = useState<AIRiskAnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeOrder = useCallback(async (request: AIOrderAnalysisRequest) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await apiClient.analyzeOrder(request);
      setAnalysis(result);
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Lỗi khi phân tích rủi ro';
      setError(errorMessage);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const analyzeOrderData = useCallback(async (
    symbol: string,
    price: number,
    quantity: number,
    side: OrderSide,
    orderType: string
  ) => {
    return analyzeOrder({
      symbol,
      price,
      quantity,
      side,
      order_type: orderType,
    });
  }, [analyzeOrder]);

  const reset = useCallback(() => {
    setAnalysis(null);
    setError(null);
  }, []);

  const shouldBlockOrder = analysis?.anomaly_detection?.should_block || false;
  const hasHighRisk = analysis ? ['high', 'extreme'].includes(analysis.risk_level) : false;
  const hasAnomalies = analysis?.anomaly_detection?.is_anomaly || false;

  return {
    analysis,
    isAnalyzing,
    error,
    analyzeOrder,
    analyzeOrderData,
    reset,
    // Helper flags
    shouldBlockOrder,
    hasHighRisk,
    hasAnomalies,
    riskLevel: analysis?.risk_level || null,
    riskScore: analysis?.risk_score || null,
  };
}
