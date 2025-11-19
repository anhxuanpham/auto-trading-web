'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, TrendingUp, TrendingDown, Activity, DollarSign, BarChart2, Wifi, WifiOff, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react';
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
    if (price == null || refPrice == null) return '';
    if (price > refPrice) return 'text-emerald-500';
    if (price < refPrice) return 'text-rose-500';
    return 'text-amber-500';
  };

  const getPriceBg = (price?: number, refPrice?: number) => {
    if (price == null || refPrice == null) return 'from-slate-500/20 to-slate-600/20';
    if (price > refPrice) return 'from-emerald-500/20 to-green-600/20';
    if (price < refPrice) return 'from-rose-500/20 to-red-600/20';
    return 'from-amber-500/20 to-yellow-600/20';
  };

  const parseVolume = (volume?: string | number) => {
    if (volume == null) return 0;
    return typeof volume === 'string' ? parseInt(volume) : volume;
  };

  const messageTypes: { value: MessageType; label: string }[] = [
    { value: 'STOCK_INFO', label: 'Thông tin cổ phiếu' },
    { value: 'PRICE_BOARD', label: 'Bảng giá' },
    { value: 'ORDER_BOOK', label: 'Sổ lệnh' },
  ];

  return (
    <div className="space-y-8 pb-8">
      {/* Header with gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]"></div>
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white flex items-center gap-3">
              <Zap className="h-8 w-8 text-yellow-300 animate-pulse" />
              Market Data Live
            </h1>
            <p className="text-blue-100 mt-2 text-lg">Dữ liệu thị trường real-time từ DNSE</p>
          </div>
          <div className="flex items-center gap-3">
            {isConnected ? (
              <Badge className="gap-2 px-4 py-2 text-sm bg-green-500/20 text-green-100 border-green-400/50 animate-pulse">
                <Wifi className="h-4 w-4" />
                <span className="font-semibold">Connected</span>
              </Badge>
            ) : (
              <Badge className="gap-2 px-4 py-2 text-sm bg-red-500/20 text-red-100 border-red-400/50">
                <WifiOff className="h-4 w-4" />
                <span className="font-semibold">{isInitializing ? 'Connecting...' : 'Disconnected'}</span>
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Search Form with glass morphism */}
      <Card className="border-2 shadow-xl backdrop-blur-sm bg-white/50 dark:bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-600" />
            Tra cứu chứng khoán
          </CardTitle>
          <CardDescription className="text-base">Nhập mã và nhận dữ liệu tự động</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="symbol" className="text-base font-semibold">Mã chứng khoán</Label>
                <Input
                  id="symbol"
                  placeholder="VNM, HPG, VCB..."
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  className="uppercase h-12 text-lg font-bold border-2 focus:ring-4 transition-all"
                  disabled={!isConnected || isInitializing}
                  autoFocus
                />
                {isLoading && (
                  <p className="text-sm text-blue-600 flex items-center gap-2 font-medium">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Đang đăng ký dữ liệu...
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Loại dữ liệu</Label>
                <div className="flex gap-2 flex-wrap">
                  {messageTypes.map((type) => (
                    <Button
                      key={type.value}
                      type="button"
                      size="lg"
                      variant={messageType === type.value ? 'default' : 'outline'}
                      onClick={() => setMessageType(type.value)}
                      disabled={!isConnected || isInitializing}
                      className={messageType === type.value ? 'shadow-lg shadow-blue-500/50' : ''}
                    >
                      {type.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {subscriptionStatus && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-2 border-green-500/20 text-green-700 font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4" />
                {subscriptionStatus}
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-red-500/10 to-rose-500/10 border-2 border-red-500/20 text-red-700 font-semibold">
                {error}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stock Info Display */}
      {stockInfo && (
        <>
          {/* Price Overview with gradients */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Current Price Card */}
            <Card className={`border-2 shadow-2xl bg-gradient-to-br ${getPriceBg(stockInfo.matchPrice, stockInfo.referencePrice)} hover:scale-105 transition-transform duration-300`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-wide">Giá hiện tại</CardTitle>
                <Activity className="h-5 w-5 text-blue-600 animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className={`text-4xl font-black ${getPriceColor(stockInfo.matchPrice, stockInfo.referencePrice)} transition-all duration-500`}>
                  {formatCurrency(stockInfo.matchPrice)}
                </div>
                <p className="text-sm font-semibold text-slate-600 mt-2">
                  Vol: {formatVolume(parseVolume(stockInfo.matchQuantity))}
                </p>
              </CardContent>
            </Card>

            {/* Change Card */}
            <Card className={`border-2 shadow-2xl ${(stockInfo.changedValue ?? 0) >= 0 ? 'bg-gradient-to-br from-green-500/20 to-emerald-600/20' : 'bg-gradient-to-br from-red-500/20 to-rose-600/20'} hover:scale-105 transition-transform duration-300`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-wide">Thay đổi</CardTitle>
                {(stockInfo.changedValue ?? 0) >= 0 ? (
                  <ArrowUpRight className="h-6 w-6 text-green-600 animate-bounce" />
                ) : (
                  <ArrowDownRight className="h-6 w-6 text-red-600 animate-bounce" />
                )}
              </CardHeader>
              <CardContent>
                <div className={`text-4xl font-black ${(stockInfo.changedValue ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'} transition-all duration-500`}>
                  {(stockInfo.changedValue ?? 0) >= 0 ? '+' : ''}{(stockInfo.changedValue ?? 0).toFixed(2)}
                </div>
                <p className={`text-lg font-bold mt-2 ${(stockInfo.changedRatio ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(stockInfo.changedRatio ?? 0) >= 0 ? '+' : ''}{(stockInfo.changedRatio ?? 0).toFixed(2)}%
                </p>
              </CardContent>
            </Card>

            {/* Volume Card */}
            <Card className="border-2 shadow-2xl bg-gradient-to-br from-purple-500/20 to-pink-600/20 hover:scale-105 transition-transform duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-wide">Khối lượng GD</CardTitle>
                <BarChart2 className="h-5 w-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-purple-700 transition-all duration-500">
                  {formatVolume(parseVolume(stockInfo.totalVolumeTraded))}
                </div>
                <p className="text-sm font-semibold text-slate-600 mt-2">
                  {formatValue(stockInfo.grossTradeAmount * 1000000000)}
                </p>
              </CardContent>
            </Card>

            {/* Average Price Card */}
            <Card className="border-2 shadow-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 hover:scale-105 transition-transform duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-wide">Giá TB</CardTitle>
                <DollarSign className="h-5 w-5 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-amber-700 transition-all duration-500">
                  {formatCurrency(stockInfo.averagePrice)}
                </div>
                <p className="text-sm font-semibold text-slate-600 mt-2">
                  TC: {formatCurrency(stockInfo.referencePrice)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Info with better styling */}
          <Card className="border-2 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
              <CardTitle className="text-2xl flex items-center gap-2">
                📊 Chi tiết {stockInfo.symbol}
              </CardTitle>
              <CardDescription className="text-base">Thông tin đầy đủ về giá giao dịch</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/20 dark:to-purple-800/20 border-2 border-purple-200 dark:border-purple-700">
                  <p className="text-sm font-bold text-purple-600 mb-2">⬆️ TRẦN</p>
                  <p className="text-2xl font-black text-purple-700">{formatCurrency(stockInfo.highLimitPrice)}</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/20 dark:to-blue-800/20 border-2 border-blue-200 dark:border-blue-700">
                  <p className="text-sm font-bold text-blue-600 mb-2">⬇️ SÀN</p>
                  <p className="text-2xl font-black text-blue-700">{formatCurrency(stockInfo.lowLimitPrice)}</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/20 dark:to-green-800/20 border-2 border-green-200 dark:border-green-700">
                  <p className="text-sm font-bold text-green-600 mb-2">📈 CAO NHẤT</p>
                  <p className="text-2xl font-black text-green-700">{formatCurrency(stockInfo.highestPrice)}</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/20 dark:to-red-800/20 border-2 border-red-200 dark:border-red-700">
                  <p className="text-sm font-bold text-red-600 mb-2">📉 THẤP NHẤT</p>
                  <p className="text-2xl font-black text-red-700">{formatCurrency(stockInfo.lowestPrice)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Book Preview with enhanced styling */}
          {(stockInfo.bidPrice1 || stockInfo.askPrice1) && (
            <Card className="border-2 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                <CardTitle className="text-2xl">🎯 Giá mua/bán tốt nhất</CardTitle>
                <CardDescription className="text-base">Best Bid/Ask Prices</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Bid */}
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-green-600 uppercase tracking-wide flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Mua (Bid)
                    </p>
                    <div className="flex justify-between items-center p-6 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-2xl border-2 border-green-500/30 shadow-lg hover:shadow-green-500/50 transition-all">
                      <span className="text-3xl font-black text-green-700">
                        {stockInfo.bidPrice1 ? formatCurrency(stockInfo.bidPrice1) : '-'}
                      </span>
                      <Badge className="text-base px-4 py-2 bg-green-600 text-white font-bold">
                        {stockInfo.bidVolume1 ? formatVolume(stockInfo.bidVolume1) : '-'}
                      </Badge>
                    </div>
                  </div>
                  {/* Ask */}
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-red-600 uppercase tracking-wide flex items-center gap-2">
                      <TrendingDown className="h-4 w-4" />
                      Bán (Ask)
                    </p>
                    <div className="flex justify-between items-center p-6 bg-gradient-to-br from-red-500/20 to-rose-600/20 rounded-2xl border-2 border-red-500/30 shadow-lg hover:shadow-red-500/50 transition-all">
                      <span className="text-3xl font-black text-red-700">
                        {stockInfo.askPrice1 ? formatCurrency(stockInfo.askPrice1) : '-'}
                      </span>
                      <Badge className="text-base px-4 py-2 bg-red-600 text-white font-bold">
                        {stockInfo.askVolume1 ? formatVolume(stockInfo.askVolume1) : '-'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Instructions with better design */}
      {!stockInfo && !error && (
        <Card className="border-2 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              💡 Hướng dẫn sử dụng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-base">
            <div className="flex items-start gap-3 p-4 bg-white/50 dark:bg-slate-800/50 rounded-xl">
              <span className="text-2xl">1️⃣</span>
              <p className="text-slate-700 dark:text-slate-300">
                Đợi hệ thống kết nối WebSocket (biểu tượng <Wifi className="inline h-4 w-4 text-green-500" /> màu xanh)
              </p>
            </div>
            <div className="flex items-start gap-3 p-4 bg-white/50 dark:bg-slate-800/50 rounded-xl">
              <span className="text-2xl">2️⃣</span>
              <p className="text-slate-700 dark:text-slate-300">
                Nhập mã chứng khoán (VD: <strong className="text-blue-600">VNM, HPG, VCB</strong>) - hệ thống sẽ <strong className="text-green-600">tự động đăng ký</strong> sau 0.8 giây
              </p>
            </div>
            <div className="flex items-start gap-3 p-4 bg-white/50 dark:bg-slate-800/50 rounded-xl">
              <span className="text-2xl">3️⃣</span>
              <p className="text-slate-700 dark:text-slate-300">
                Dữ liệu sẽ được <strong className="text-purple-600">stream real-time</strong> và tự động cập nhật liên tục!
              </p>
            </div>
            <div className="mt-6 p-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <p className="font-bold text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-300" />
                ✨ Auto-subscribe: Chỉ cần nhập mã, hệ thống tự động xử lý tất cả!
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
