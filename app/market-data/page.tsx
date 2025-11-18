'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, TrendingUp, TrendingDown, Activity, DollarSign, BarChart2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { StockInfo, MessageType } from '@/lib/types';

export default function MarketDataPage() {
  const [symbol, setSymbol] = useState('VNM');
  const [messageType, setMessageType] = useState<MessageType>('STOCK_INFO');
  const [stockInfo, setStockInfo] = useState<StockInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMarketData = async () => {
    if (!symbol.trim()) {
      setError('Vui lòng nhập mã chứng khoán');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.subscribeMarketData({
        messageType,
        symbol: symbol.toUpperCase().trim(),
      });
      setStockInfo(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Lỗi khi lấy dữ liệu thị trường');
      console.error('Error fetching market data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value * 1000); // Giá cổ phiếu thường tính bằng nghìn đồng
  };

  const formatVolume = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  const formatValue = (value: number) => {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(2)} tỷ`;
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)} triệu`;
    }
    return formatVolume(value);
  };

  const getPriceColor = (price: number, refPrice: number) => {
    if (price > refPrice) return 'text-green-500';
    if (price < refPrice) return 'text-red-500';
    return 'text-yellow-500';
  };

  const messageTypes: { value: MessageType; label: string }[] = [
    { value: 'STOCK_INFO', label: 'Thông tin cổ phiếu' },
    { value: 'PRICE_BOARD', label: 'Bảng giá' },
    { value: 'ORDER_BOOK', label: 'Sổ lệnh' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Market Data</h1>
        <p className="text-muted-foreground">Dữ liệu thị trường real-time</p>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle>Tra cứu thông tin chứng khoán</CardTitle>
          <CardDescription>Nhập mã chứng khoán để xem thông tin chi tiết</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="symbol">Mã chứng khoán</Label>
                <Input
                  id="symbol"
                  placeholder="VD: VNM, HPG, VCB..."
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && fetchMarketData()}
                  className="uppercase"
                />
              </div>

              <div className="space-y-2">
                <Label>Loại dữ liệu</Label>
                <div className="flex gap-2">
                  {messageTypes.map((type) => (
                    <Button
                      key={type.value}
                      type="button"
                      size="sm"
                      variant={messageType === type.value ? 'default' : 'outline'}
                      onClick={() => setMessageType(type.value)}
                    >
                      {type.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-end">
                <Button onClick={fetchMarketData} disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Đang tải...
                    </>
                  ) : (
                    <>
                      <Activity className="mr-2 h-4 w-4" />
                      Xem dữ liệu
                    </>
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-md bg-red-500/10 text-red-600 text-sm">
                {error}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stock Info Display */}
      {stockInfo && (
        <>
          {/* Price Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Giá hiện tại</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getPriceColor(stockInfo.lastPrice, stockInfo.refPrice)}`}>
                  {formatCurrency(stockInfo.lastPrice)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Khối lượng: {formatVolume(stockInfo.lastVolume)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Thay đổi</CardTitle>
                {stockInfo.change >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stockInfo.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {stockInfo.change >= 0 ? '+' : ''}{stockInfo.change.toFixed(2)}
                </div>
                <p className={`text-xs mt-1 ${stockInfo.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {stockInfo.changePercent >= 0 ? '+' : ''}{stockInfo.changePercent.toFixed(2)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Khối lượng GD</CardTitle>
                <BarChart2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatVolume(stockInfo.totalVolume)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Giá trị: {formatValue(stockInfo.totalValue)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Giá TB</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stockInfo.avgPrice)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Tham chiếu: {formatCurrency(stockInfo.refPrice)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Info */}
          <Card>
            <CardHeader>
              <CardTitle>Chi tiết {stockInfo.symbol}</CardTitle>
              <CardDescription>Thông tin chi tiết về giá và khối lượng giao dịch</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Trần</p>
                  <p className="text-lg font-semibold text-purple-500">{formatCurrency(stockInfo.ceiling)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sàn</p>
                  <p className="text-lg font-semibold text-blue-500">{formatCurrency(stockInfo.floor)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cao nhất</p>
                  <p className="text-lg font-semibold text-green-500">{formatCurrency(stockInfo.high)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Thấp nhất</p>
                  <p className="text-lg font-semibold text-red-500">{formatCurrency(stockInfo.low)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Book Preview */}
          {(stockInfo.bidPrice1 || stockInfo.askPrice1) && (
            <Card>
              <CardHeader>
                <CardTitle>Giá mua/bán tốt nhất</CardTitle>
                <CardDescription>Best bid/ask prices</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-green-600">Mua (Bid)</p>
                    <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg">
                      <span className="text-lg font-bold text-green-600">
                        {stockInfo.bidPrice1 ? formatCurrency(stockInfo.bidPrice1) : '-'}
                      </span>
                      <Badge variant="success">
                        {stockInfo.bidVolume1 ? formatVolume(stockInfo.bidVolume1) : '-'}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-red-600">Bán (Ask)</p>
                    <div className="flex justify-between items-center p-3 bg-red-500/10 rounded-lg">
                      <span className="text-lg font-bold text-red-600">
                        {stockInfo.askPrice1 ? formatCurrency(stockInfo.askPrice1) : '-'}
                      </span>
                      <Badge variant="destructive">
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

      {/* Instructions */}
      {!stockInfo && !error && (
        <Card>
          <CardHeader>
            <CardTitle>Hướng dẫn sử dụng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. Nhập mã chứng khoán bạn muốn tra cứu (VD: VNM, HPG, VCB)</p>
            <p>2. Chọn loại dữ liệu muốn xem (mặc định: Thông tin cổ phiếu)</p>
            <p>3. Nhấn "Xem dữ liệu" hoặc Enter để lấy thông tin real-time</p>
            <p className="mt-4 text-yellow-600">
              <strong>Lưu ý:</strong> Dữ liệu được cung cấp bởi DNSE Lightspeed API và có thể có độ trễ vài giây.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
