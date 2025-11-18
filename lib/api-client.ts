import axios, { AxiosInstance, AxiosError } from 'axios';
import { PlaceOrderRequest, Order, Portfolio, UpdateTokenRequest, ApiResponse } from './types';

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

  // Health Checks
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async tradingHealthCheck(): Promise<any> {
    const response = await this.client.get('/trading/health');
    return response.data;
  }

  async adminHealthCheck(): Promise<any> {
    const response = await this.client.get('/admin/health');
    return response.data;
  }

  // Trading Operations
  async placeOrder(orderData: PlaceOrderRequest): Promise<Order> {
    const response = await this.client.post<Order>('/trading/orders', orderData);
    return response.data;
  }

  async getOrders(): Promise<Order[]> {
    const response = await this.client.get<Order[]>('/trading/orders');
    return response.data;
  }

  async getPortfolio(): Promise<Portfolio> {
    const response = await this.client.get<Portfolio>('/trading/portfolio');
    return response.data;
  }

  // Admin Operations
  async updateTradingToken(newToken: string): Promise<ApiResponse<any>> {
    if (!this.adminSecret) {
      throw new Error('Admin secret not set');
    }

    const response = await this.client.post<ApiResponse<any>>(
      '/admin/update-token',
      { new_trading_token: newToken },
      {
        headers: {
          'X-Admin-Secret': this.adminSecret,
        },
      }
    );
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default ApiClient;
