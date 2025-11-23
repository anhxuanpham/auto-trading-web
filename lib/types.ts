// Trading Types
export type OrderSide = 'NB' | 'NS'; // NB = Mua (Buy), NS = Bán (Sell)
export type OrderType = 'LO' | 'MP' | 'ATC' | 'ATO' | 'MTL' | 'MOK' | 'MAK' | 'PLO';

export interface PlaceOrderRequest {
  symbol: string;
  side: OrderSide;
  orderType: OrderType;
  price: number;
  quantity: number;
  loanPackageId?: number;
}

export interface OrderDetail {
  id: number;
  symbol: string;
  side: string;
  orderType: string;
  price: number;
  quantity: number;
  filledQuantity: number;
  remainingQuantity: number;
  orderStatus: string; // "new", "filled", "partiallyFilled", "cancelled"
  createdAt: string;
  updatedAt?: string;
}

// Portfolio Types (from backend)
export interface Deal {
  id: number;
  symbol: string;
  status: 'OPEN' | 'CLOSED';
  side: OrderSide;
  costPrice: number;
  marketPrice: number;
  realizedProfit: number;
  unrealizedProfit: number;
  breakEvenPrice: number;
  accumulateQuantity: number;
  tradeQuantity: number;
  secure: number;
}

// Conditional Orders
export interface ConditionalOrderRequest {
  condition: string; // "price >= 26650" or "price <= 26650"
  symbol: string;
  targetOrder: {
    quantity: number;
    side: OrderSide;
    price: number;
    orderType: OrderType;
    loanPackageId?: number;
  };
  props: {
    stopPrice: number;
    marketId: 'UNDERLYING' | 'DERIVATIVES';
  };
  timeInForce: {
    expireTime: string; // ISO 8601
    kind: 'GTD';
  };
  accountNo: string;
  category: 'STOP';
}

export interface ConditionalOrderResponse {
  orderId: string;
}

export interface GetConditionalOrdersParams {
  daily?: boolean;
  from_date?: string;
  to_date?: string;
  page?: number;
  size?: number;
  status?: string[];
  symbol?: string;
  market_id?: 'UNDERLYING' | 'DERIVATIVES';
}

// Admin Types
export interface UpdateTokenRequest {
  newToken: string;
  adminSecret: string;
}

export interface UpdateTokenResponse {
  message: string;
  token_preview: string;
}

export interface HealthResponse {
  status: string;
  account_no: string;
  api_base_url: string;
}

export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Market Data Types
export type MessageType = 'STOCK_INFO' | 'PRICE_BOARD' | 'ORDER_BOOK';

// Subscribe API (symbols array)
export interface SubscribeRequest {
  symbols: string[];
}

export interface SubscribeResponse {
  message: string;
  symbols: string[];
  count: number;
}

export interface SubscriptionsResponse {
  symbols: string[];
  count: number;
}

// Old single symbol subscribe (for backward compatibility with current WebSocket)
export interface MarketDataSubscribeRequest {
  messageType: MessageType;
  symbol: string;
}

// WebSocket Message Types
export interface MarketDataMessage {
  type: string; // "OD" | "MI" | "MT" | "PD" | "TS" | "TM"
  data: any;
  timestamp: number;
}

export interface OrderBookData {
  symbol: string;
  bid: Array<[number, number]>; // [price, volume]
  ask: Array<[number, number]>;
  _received_at: number;
}

export interface MarketInfoData {
  symbol: string;
  ceiling: number;
  floor: number;
  reference: number;
  lastPrice: number;
  lastVolume: number;
  change: number;
  changePct: number;
  totalVolume: number;
  totalValue: number;
  _received_at: number;
}

export interface MatchData {
  symbol: string;
  price: number;
  volume: number;
  side: 'B' | 'S';
  time: string;
  _received_at: number;
}

// Raw API response from DNSE backend (current format)
export interface StockInfo {
  symbol: string;
  // Price limits
  highLimitPrice: number;
  lowLimitPrice: number;
  referencePrice: number;

  // Current prices
  matchPrice: number;
  matchQuantity: string;
  matchValue: number;

  // Day high/low
  highestPrice: number;
  lowestPrice: number;
  openPrice: number;
  closePrice: number;
  averagePrice: number;

  // Volume and value
  totalVolumeTraded: string;
  grossTradeAmount: number;

  // Change
  changedValue: number;
  changedRatio: number;

  // Trading session info
  tradingTime?: string;
  tradingSessionId?: string;
  securityStatus?: string;

  // Foreign trading
  buyForeignQuantity?: string;
  sellForeignQuantity?: string;
  buyForeignValue?: number;
  sellForeignValue?: number;

  // Market data
  marketId?: string;
  boardId?: string;
  isin?: string;

  // Order book
  bidPrice1?: number;
  bidPrice2?: number;
  bidPrice3?: number;
  bidVolume1?: number;
  bidVolume2?: number;
  bidVolume3?: number;

  askPrice1?: number;
  askPrice2?: number;
  askPrice3?: number;
  askVolume1?: number;
  askVolume2?: number;
  askVolume3?: number;
}

// AI Features Types

export interface AIOrderAnalysisRequest {
  symbol: string;
  price: number;
  quantity: number;
  side: OrderSide;
  order_type: string;
}

export interface AIRiskFactors {
  size_score: number;
  size_weight: number;
  price_score: number;
  price_weight: number;
  type_score: number;
  type_weight: number;
  time_score: number;
  time_weight: number;
  volatility_score: number;
  volatility_weight: number;
}

export interface AIAnomaly {
  type: string;
  severity: string;
  description: string;
}

export interface AIAnomalyDetection {
  is_anomaly: boolean;
  anomalies: AIAnomaly[];
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  should_block: boolean;
}

export interface AIRiskAnalysisResponse {
  risk_score: number; // 0-100
  risk_level: 'low' | 'medium' | 'high' | 'extreme';
  recommendation: string;
  factors: AIRiskFactors;
  anomaly_detection: AIAnomalyDetection;
  timestamp: number;
}

export interface AIPricePredictionResponse {
  symbol: string;
  direction: 'bullish' | 'bearish' | 'neutral';
  confidence: number; // 0-1
  predicted_change_pct: number;
  current_price: number | null;
  horizon_minutes: number;
  timestamp: number;
}

export interface AITradingInsight {
  type: 'recommendation' | 'warning' | 'observation';
  category: 'risk' | 'opportunity' | 'performance' | 'diversification';
  message: string;
  priority: 'high' | 'medium' | 'low';
}

export interface AIPortfolioSummary {
  total_positions: number;
  open_positions: number;
  total_value: number;
  total_unrealized_pnl: number;
  recent_orders_analyzed: number;
}

export interface AIInsightsResponse {
  insights: AITradingInsight[];
  portfolio_summary: AIPortfolioSummary;
  timestamp: number;
}
