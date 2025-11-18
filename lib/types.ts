// Trading Types
export type OrderSide = 'NB' | 'NS'; // NB = Mua (Buy), NS = Bán (Sell)
export type OrderType = 'LO' | 'MP' | 'ATC' | 'ATO'; // LO = Limit Order, MP = Market Price, ATC = At Close, ATO = At Open

export interface PlaceOrderRequest {
  symbol: string;
  side: OrderSide;
  orderType: OrderType;
  price?: number;
  quantity: number;
  loanPackageId?: string;
}

export interface Order {
  orderId: string;
  symbol: string;
  side: OrderSide;
  orderType: OrderType;
  price: number;
  quantity: number;
  filledQuantity: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioPosition {
  symbol: string;
  quantity: number;
  availableQuantity: number;
  avgPrice: number;
  currentPrice: number;
  marketValue: number;
  profitLoss: number;
  profitLossPercent: number;
}

export interface Portfolio {
  accountBalance: number;
  totalAssets: number;
  buyingPower: number;
  totalProfitLoss: number;
  positions: PortfolioPosition[];
}

export interface UpdateTokenRequest {
  new_trading_token: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
