'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, TrendingUp, TrendingDown, Activity, Wifi, WifiOff, Zap } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { StockInfo, MessageType } from '@/lib/types';
import { useMarketDataWebSocket } from '@/hooks/use-market-data-websocket';

export default function MarketDataPage() {
  const [symbol, setSymbol] = useState('VNM');
  const [messageType, setMessageType] = useState<MessageType>('STOCK_INFO');
  const [stockInfo, setStockInfo] = useState<StockInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('');

  // WebSocket connection
  const handleWebSocketMessage = useCallback((data: StockInfo) => {
    console.log('📊 Received WebSocket data:', data);
    setStockInfo(data);
    setIsLoading(false);
  }, []);

  const {
    isConnected,
    lastMessage,
    error: wsError,
    connect: connectWebSocket,
    disconnect: disconnectWebSocket,
  } = useMarketDataWebSocket({
    onMessage: handleWebSocketMessage,
    onConnect: () => {
      console.log('✅ WebSocket connected successfully');
      setError(null);
    },
    onDisconnect: () => {
      console.log('🔌 WebSocket disconnected');
    },
    onError: (err) => {
      console.error('❌ WebSocket error:', err);
      setError('Lỗi kết nối WebSocket');
    },
  });

  // Initialize market data connection on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsInitializing(true);
        console.log('🔧 Initializing market data connection...');
        await apiClient.initializeMarketData();
        console.log('✅ Market data initialized');

        // Connect WebSocket after initialization
        connectWebSocket();
      } catch (err: any) {
        console.error('❌ Failed to initialize market data:', err);
        setError(err.response?.data?.detail || err.message || 'Lỗi khởi tạo kết nối');
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();

    return () => {
      disconnectWebSocket();
    };
  }, [connectWebSocket, disconnectWebSocket]);

  // Auto-subscribe when symbol changes (with debounce)
  useEffect(() => {
    // Don't subscribe if not connected or no symbol
    if (!isConnected || !symbol.trim()) {
      return;
    }

    // Clear old data immediately when symbol changes
    setStockInfo(null);
    setSubscriptionStatus('');

    // Debounce to avoid subscribing while user is still typing
    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('🔄 Auto-subscribing to:', symbol.toUpperCase().trim());
        const response = await apiClient.subscribeMarketData({
          messageType,
          symbol: symbol.toUpperCase().trim(),
        });

        console.log('✅ Subscription response:', response);
        setSubscriptionStatus(`Đang theo dõi ${symbol.toUpperCase()}`);
      } catch (err: any) {
        setError(err.response?.data?.detail || err.message || 'Lỗi khi đăng ký dữ liệu');
        console.error('❌ Error subscribing to market data:', err);
        setIsLoading(false);
      }
    }, 800); // 800ms debounce

    return () => clearTimeout(timer);
  }, [symbol, messageType, isConnected]);

  const formatCurrency = (value?: number | null) => {
    if (value == null) return '-';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value * 1000);
  };

  const formatVolume = (value?: number | null) => {
    if (value == null) return '-';
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  const formatValue = (value?: number | null) => {
    if (value == null) return '-';
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(2)} tỷ`;
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)} triệu`;
    }
    return formatVolume(value);
  };

  const getPriceColor = (price?: number, refPrice?: number) => {
    if (price == null || refPrice == null) return 'text-slate-600';
    if (price > refPrice) return 'text-green-600';
    if (price < refPrice) return 'text-red-600';
    return 'text-amber-600';
  };

  const getPriceBg = (price?: number, refPrice?: number) => {
    if (price == null || refPrice == null) return 'bg-slate-50';
    if (price > refPrice) return 'bg-green-50';
    if (price < refPrice) return 'bg-red-50';
    return 'bg-amber-50';
  };

  const parseVolume = (volume?: string | number) => {
    if (volume == null) return 0;
    return typeof volume === 'string' ? parseInt(volume) : volume;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Simple Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="h-7 w-7 text-blue-600" />
            Market Data
          </h1>
          <p className="text-slate-500 mt-1">Real-time market streaming</p>
        </div>
        <div className="flex items-center gap-3">
          {isConnected ? (
            <Badge variant="default" className="gap-1.5 px-3 py-1.5">
              <Wifi className="h-3.5 w-3.5" />
              Live
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1.5 px-3 py-1.5">
              <WifiOff className="h-3.5 w-3.5" />
              {isInitializing ? 'Connecting' : 'Offline'}
            </Badge>
          )}
        </div>
      </div>

      {/* Clean Search Form */}
      <Card>
        <CardContent className="pt-6">
          <div>
            <Label htmlFor="symbol" className="text-sm font-medium text-slate-700 mb-2 block">
              Mã chứng khoán
            </Label>
            <Input
              id="symbol"
              placeholder="VNM, HPG, VCB..."
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              className="h-11 text-base font-semibold uppercase"
              disabled={!isConnected || isInitializing}
              autoFocus
            />
          </div>

          {isLoading && (
            <p className="text-sm text-blue-600 flex items-center gap-2 mt-3">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Đang tải dữ liệu...
            </p>
          )}

          {subscriptionStatus && (
            <div className="mt-3 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              {subscriptionStatus}
            </div>
          )}

          {error && (
            <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock Info Display */}
      {stockInfo && (
        <div className="space-y-6">
          {/* Main Price Card */}
          <Card className={`border-2 ${getPriceBg(stockInfo.matchPrice, stockInfo.referencePrice)}`}>
            <CardContent className="pt-6">
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <h2 className="text-sm font-medium text-slate-600 mb-1">{stockInfo.symbol}</h2>
                  <div className={`text-5xl font-bold ${getPriceColor(stockInfo.matchPrice, stockInfo.referencePrice)}`}>
                    {formatCurrency(stockInfo.matchPrice)}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-semibold ${(stockInfo.changedValue ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center gap-1`}>
                    {(stockInfo.changedValue ?? 0) >= 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
                    {(stockInfo.changedValue ?? 0) >= 0 ? '+' : ''}{(stockInfo.changedValue ?? 0).toFixed(2)}
                  </div>
                  <div className={`text-lg font-medium ${(stockInfo.changedRatio ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(stockInfo.changedRatio ?? 0) >= 0 ? '+' : ''}{(stockInfo.changedRatio ?? 0).toFixed(2)}%
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Khối lượng</p>
                  <p className="text-base font-semibold text-slate-900">
                    {formatVolume(parseVolume(stockInfo.matchQuantity))}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Giá TB</p>
                  <p className="text-base font-semibold text-slate-900">
                    {formatCurrency(stockInfo.averagePrice)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Tổng KL</p>
                  <p className="text-base font-semibold text-slate-900">
                    {formatVolume(parseVolume(stockInfo.totalVolumeTraded))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Price Range */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Biên độ giá</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-3 rounded-lg bg-purple-50 border border-purple-200">
                  <p className="text-xs text-purple-600 font-medium mb-1">Trần</p>
                  <p className="text-sm font-bold text-purple-700">{formatCurrency(stockInfo.highLimitPrice)}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-xs text-green-600 font-medium mb-1">Cao</p>
                  <p className="text-sm font-bold text-green-700">{formatCurrency(stockInfo.highestPrice)}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-xs text-red-600 font-medium mb-1">Thấp</p>
                  <p className="text-sm font-bold text-red-700">{formatCurrency(stockInfo.lowestPrice)}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-xs text-blue-600 font-medium mb-1">Sàn</p>
                  <p className="text-sm font-bold text-blue-700">{formatCurrency(stockInfo.lowLimitPrice)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Book */}
          {(stockInfo.bidPrice1 || stockInfo.askPrice1) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Giá mua/bán tốt nhất</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                    <p className="text-xs text-green-600 font-medium mb-2 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Mua (Bid)
                    </p>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xl font-bold text-green-700">
                        {stockInfo.bidPrice1 ? formatCurrency(stockInfo.bidPrice1) : '-'}
                      </span>
                      <span className="text-sm font-semibold text-green-600">
                        {stockInfo.bidVolume1 ? formatVolume(stockInfo.bidVolume1) : '-'}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-xs text-red-600 font-medium mb-2 flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" />
                      Bán (Ask)
                    </p>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xl font-bold text-red-700">
                        {stockInfo.askPrice1 ? formatCurrency(stockInfo.askPrice1) : '-'}
                      </span>
                      <span className="text-sm font-semibold text-red-600">
                        {stockInfo.askVolume1 ? formatVolume(stockInfo.askVolume1) : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Clean Instructions */}
      {!stockInfo && !error && (
        <Card className="bg-blue-50/50 border-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 text-sm text-slate-700">
              <Zap className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="font-medium">Chỉ cần nhập mã chứng khoán để bắt đầu</p>
                <p className="text-slate-600">Dữ liệu sẽ được cập nhật real-time qua WebSocket</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
