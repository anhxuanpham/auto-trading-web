import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  PlaceOrderRequest,
  OrderDetail,
  Deal,
  UpdateTokenRequest,
  UpdateTokenResponse,
  HealthResponse,
  ApiResponse,
  SubscribeRequest,
  SubscribeResponse,
  SubscriptionsResponse,
  MarketDataSubscribeRequest,
  ConditionalOrderRequest,
  ConditionalOrderResponse,
  GetConditionalOrdersParams,
  AIOrderAnalysisRequest,
  AIRiskAnalysisResponse,
  AIPricePredictionResponse,
  AIInsightsResponse,
} from './types';

// Always use environment variable for API base URL
// This allows seamless switching between local dev and Cloudflare Tunnel
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

class ApiClient {
  private client: AxiosInstance;
  private adminSecret: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  setAdminSecret(secret: string) {
    this.adminSecret = secret;
  }

  // ============================================
  // Health Checks
  // ============================================

  async healthCheck(): Promise<HealthResponse> {
    const response = await this.client.get<HealthResponse>('/health');
    return response.data;
  }

  async tradingHealthCheck(): Promise<any> {
    const response = await this.client.get('/trading/health');
    return response.data;
  }

  async adminHealthCheck(): Promise<any> {
    const response = await this.client.get('/admin/health');
    return response.data;
  }

  // ============================================
  // Admin Operations
  // ============================================

  async updateTradingToken(request: UpdateTokenRequest): Promise<UpdateTokenResponse> {
    const response = await this.client.post<UpdateTokenResponse>(
      '/admin/update-token',
      {
        newToken: request.newToken,
      },
      {
        headers: {
          'X-Admin-Secret': request.adminSecret,
        },
      }
    );
    return response.data;
  }

  // ============================================
  // Trading Operations
  // ============================================

  async placeOrder(orderData: PlaceOrderRequest): Promise<OrderDetail> {
    const response = await this.client.post<OrderDetail>('/trading/orders', orderData);
    return response.data;
  }

  async getOrders(): Promise<OrderDetail[]> {
    const response = await this.client.get<OrderDetail[]>('/trading/orders');
    return response.data;
  }

  async getOrderById(orderId: number): Promise<OrderDetail> {
    const response = await this.client.get<OrderDetail>(`/trading/orders/${orderId}`);
    return response.data;
  }

  async cancelOrder(orderId: number): Promise<OrderDetail> {
    const response = await this.client.delete<OrderDetail>(`/trading/orders/${orderId}`);
    return response.data;
  }

  async getPortfolio(): Promise<Deal[]> {
    const response = await this.client.get<Deal[]>('/trading/portfolio');
    return response.data;
  }

  async placeConditionalOrder(order: ConditionalOrderRequest): Promise<ConditionalOrderResponse> {
    const response = await this.client.post<ConditionalOrderResponse>(
      '/trading/conditional-orders',
      order
    );
    return response.data;
  }

  async getConditionalOrders(params?: GetConditionalOrdersParams): Promise<any> {
    const response = await this.client.get('/trading/conditional-orders', { params });
    return response.data;
  }

  // ============================================
  // Market Data Operations
  // ============================================

  /**
   * Subscribe to multiple symbols for market data
   */
  async subscribeSymbols(symbols: string[]): Promise<SubscribeResponse> {
    const response = await this.client.post<SubscribeResponse>(
      '/market-data/subscribe',
      { symbols }
    );
    return response.data;
  }

  /**
   * Get currently subscribed symbols
   */
  async getSubscriptions(): Promise<SubscriptionsResponse> {
    const response = await this.client.get<SubscriptionsResponse>('/market-data/subscriptions');
    return response.data;
  }

  /**
   * Initialize market data connection (for WebSocket)
   * Keep for backward compatibility
   */
  async initializeMarketData(): Promise<ApiResponse<any>> {
    const response = await this.client.post<ApiResponse<any>>('/market-data/initialize');
    return response.data;
  }

  /**
   * Subscribe to single symbol (for WebSocket)
   * Keep for backward compatibility
   */
  async subscribeMarketData(request: MarketDataSubscribeRequest): Promise<ApiResponse<any>> {
    const response = await this.client.post<ApiResponse<any>>('/market-data/subscribe', request);
    return response.data;
  }

  // ============================================
  // AI Features
  // ============================================

  /**
   * Analyze order risk before placing
   */
  async analyzeOrder(request: AIOrderAnalysisRequest): Promise<AIRiskAnalysisResponse> {
    const response = await this.client.post<AIRiskAnalysisResponse>(
      '/ai/analyze-order',
      request
    );
    return response.data;
  }

  /**
   * Get price prediction for a symbol
   */
  async predictPrice(symbol: string, horizonMinutes: number = 15): Promise<AIPricePredictionResponse> {
    const response = await this.client.get<AIPricePredictionResponse>(
      `/ai/predict/${symbol}`,
      { params: { horizon: horizonMinutes } }
    );
    return response.data;
  }

  /**
   * Get trading insights and recommendations
   */
  async getTradingInsights(limit: number = 10): Promise<AIInsightsResponse> {
    const response = await this.client.get<AIInsightsResponse>(
      '/ai/insights',
      { params: { limit } }
    );
    return response.data;
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Place order with AI risk check (Safe wrapper)
   */
  async placeOrderSafe(orderData: PlaceOrderRequest): Promise<{
    order: OrderDetail;
    riskAnalysis: AIRiskAnalysisResponse;
  }> {
    // Step 1: Analyze risk
    const riskAnalysis = await this.analyzeOrder({
      symbol: orderData.symbol,
      price: orderData.price,
      quantity: orderData.quantity,
      side: orderData.side,
      order_type: orderData.orderType,
    });

    // Step 2: Check if should block
    if (riskAnalysis.anomaly_detection.should_block) {
      throw new Error('Order blocked due to detected anomalies');
    }

    // Step 3: Place order
    const order = await this.placeOrder(orderData);

    return { order, riskAnalysis };
  }

  /**
   * Get portfolio with insights
   */
  async getPortfolioWithInsights(): Promise<{
    portfolio: Deal[];
    insights: AIInsightsResponse;
  }> {
    const [portfolio, insights] = await Promise.all([
      this.getPortfolio(),
      this.getTradingInsights(20),
    ]);

    return { portfolio, insights };
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default ApiClient;
