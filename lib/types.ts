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

// Market Data Types
export type MessageType = 'STOCK_INFO' | 'PRICE_BOARD' | 'ORDER_BOOK';

export interface MarketDataSubscribeRequest {
  messageType: MessageType;
  symbol: string;
}

// Raw API response from DNSE backend
export interface StockInfo {
  symbol: string;
  // Price limits
  highLimitPrice: number;  // Giá trần
  lowLimitPrice: number;   // Giá sàn
  referencePrice: number;  // Giá tham chiếu

  // Current prices
  matchPrice: number;      // Giá khớp lệnh hiện tại
  matchQuantity: string;   // Khối lượng khớp
  matchValue: number;      // Giá trị khớp

  // Day high/low
  highestPrice: number;    // Giá cao nhất
  lowestPrice: number;     // Giá thấp nhất
  openPrice: number;       // Giá mở cửa
  closePrice: number;      // Giá đóng cửa
  averagePrice: number;    // Giá trung bình

  // Volume and value
  totalVolumeTraded: string;  // Tổng khối lượng giao dịch
  grossTradeAmount: number;   // Tổng giá trị giao dịch

  // Change
  changedValue: number;    // Thay đổi giá trị
  changedRatio: number;    // Thay đổi %

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
}

export interface MarketDataResponse {
  messageType: string;
  symbol: string;
  data: StockInfo;
}
