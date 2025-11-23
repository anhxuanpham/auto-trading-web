'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, CheckCircle2, AlertCircle, Shield, AlertTriangle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { OrderSide, OrderType, PlaceOrderRequest, AIRiskAnalysisResponse } from '@/lib/types';
import { useRiskAnalysis } from '@/hooks/useRiskAnalysis';

type FormData = {
  symbol: string;
  quantity: string;
  price: string;
  loanPackageId: string;
};

export default function TradingPage() {
  const [buyForm, setBuyForm] = useState<FormData>({
    symbol: '',
    quantity: '',
    price: '',
    loanPackageId: '',
  });

  const [sellForm, setSellForm] = useState<FormData>({
    symbol: '',
    quantity: '',
    price: '',
    loanPackageId: '',
  });

  const [buyOrderType, setBuyOrderType] = useState<OrderType>('LO');
  const [sellOrderType, setSellOrderType] = useState<OrderType>('LO');

  const [buyLoading, setBuyLoading] = useState(false);
  const [sellLoading, setSellLoading] = useState(false);

  const [buyResult, setBuyResult] = useState<{ success: boolean; message: string } | null>(null);
  const [sellResult, setSellResult] = useState<{ success: boolean; message: string } | null>(null);

  const [buyRiskAnalysis, setBuyRiskAnalysis] = useState<AIRiskAnalysisResponse | null>(null);
  const [sellRiskAnalysis, setSellRiskAnalysis] = useState<AIRiskAnalysisResponse | null>(null);

  const { analyzeOrderData, isAnalyzing } = useRiskAnalysis();

  const orderTypes: { value: OrderType; label: string }[] = [
    { value: 'LO', label: 'LO - Lệnh giới hạn' },
    { value: 'MP', label: 'MP - Thị trường' },
    { value: 'ATO', label: 'ATO - Khớp mở cửa' },
    { value: 'ATC', label: 'ATC - Khớp đóng cửa' },
  ];

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'extreme': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-muted';
    }
  };

  const getRiskBadgeVariant = (level: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (level) {
      case 'low': return 'outline';
      case 'medium': return 'secondary';
      case 'high': return 'destructive';
      case 'extreme': return 'destructive';
      default: return 'default';
    }
  };

  const RiskAnalysisDisplay = ({ analysis }: { analysis: AIRiskAnalysisResponse }) => (
    <div className={`p-4 rounded-md border ${getRiskColor(analysis.risk_level)} space-y-3`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <span className="font-semibold">Phân tích rủi ro AI</span>
        </div>
        <Badge variant={getRiskBadgeVariant(analysis.risk_level)}>
          {analysis.risk_level.toUpperCase()} - {analysis.risk_score}/100
        </Badge>
      </div>

      <div className="text-sm">
        <p className="font-medium">Khuyến nghị:</p>
        <p className="mt-1">{analysis.recommendation}</p>
      </div>

      {analysis.anomaly_detection.is_anomaly && (
        <div className="bg-red-500/20 p-3 rounded border border-red-500/30">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-red-600">Phát hiện bất thường:</p>
              <ul className="mt-1 space-y-1">
                {analysis.anomaly_detection.anomalies.map((anomaly, idx) => (
                  <li key={idx} className="text-red-600">
                    • {anomaly.description} ({anomaly.severity})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const handleBuyOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setBuyLoading(true);
    setBuyResult(null);
    setBuyRiskAnalysis(null);

    try {
      const symbol = buyForm.symbol.toUpperCase();
      const quantity = parseInt(buyForm.quantity);
      const price = buyOrderType === 'LO' ? parseFloat(buyForm.price) : 0;

      // Step 1: Analyze risk
      const riskAnalysis = await analyzeOrderData(
        symbol,
        price,
        quantity,
        'NB',
        buyOrderType
      );

      setBuyRiskAnalysis(riskAnalysis);

      // Step 2: Check if order should be blocked
      if (riskAnalysis.anomaly_detection.should_block) {
        setBuyResult({
          success: false,
          message: '⛔ Lệnh bị chặn do phát hiện bất thường nghiêm trọng. Vui lòng kiểm tra lại thông tin lệnh.',
        });
        setBuyLoading(false);
        return;
      }

      // Step 3: Warn on high risk
      if (riskAnalysis.risk_level === 'extreme' || riskAnalysis.risk_level === 'high') {
        const confirmed = window.confirm(
          `⚠️ Cảnh báo rủi ro ${riskAnalysis.risk_level.toUpperCase()}\n\n` +
          `Risk Score: ${riskAnalysis.risk_score}/100\n` +
          `Khuyến nghị: ${riskAnalysis.recommendation}\n\n` +
          `Bạn có chắc chắn muốn tiếp tục đặt lệnh?`
        );

        if (!confirmed) {
          setBuyResult({
            success: false,
            message: 'Lệnh đã bị hủy bởi người dùng do rủi ro cao.',
          });
          setBuyLoading(false);
          return;
        }
      }

      // Step 4: Place order
      const orderData: PlaceOrderRequest = {
        symbol,
        side: 'NB',
        orderType: buyOrderType,
        quantity,
        price: buyOrderType === 'LO' ? price : 0,
        loanPackageId: buyForm.loanPackageId ? parseInt(buyForm.loanPackageId) : undefined,
      };

      const result = await apiClient.placeOrder(orderData);
      setBuyResult({
        success: true,
        message: `✅ Đặt lệnh MUA thành công! Order ID: ${result.id}`,
      });

      // Reset form
      setBuyForm({ symbol: '', quantity: '', price: '', loanPackageId: '' });
      setBuyRiskAnalysis(null);
    } catch (err: any) {
      setBuyResult({
        success: false,
        message: err.response?.data?.detail || err.message || 'Lỗi khi đặt lệnh mua',
      });
    } finally {
      setBuyLoading(false);
    }
  };

  const handleSellOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSellLoading(true);
    setSellResult(null);
    setSellRiskAnalysis(null);

    try {
      const symbol = sellForm.symbol.toUpperCase();
      const quantity = parseInt(sellForm.quantity);
      const price = sellOrderType === 'LO' ? parseFloat(sellForm.price) : 0;

      // Step 1: Analyze risk
      const riskAnalysis = await analyzeOrderData(
        symbol,
        price,
        quantity,
        'NS',
        sellOrderType
      );

      setSellRiskAnalysis(riskAnalysis);

      // Step 2: Check if order should be blocked
      if (riskAnalysis.anomaly_detection.should_block) {
        setSellResult({
          success: false,
          message: '⛔ Lệnh bị chặn do phát hiện bất thường nghiêm trọng. Vui lòng kiểm tra lại thông tin lệnh.',
        });
        setSellLoading(false);
        return;
      }

      // Step 3: Warn on high risk
      if (riskAnalysis.risk_level === 'extreme' || riskAnalysis.risk_level === 'high') {
        const confirmed = window.confirm(
          `⚠️ Cảnh báo rủi ro ${riskAnalysis.risk_level.toUpperCase()}\n\n` +
          `Risk Score: ${riskAnalysis.risk_score}/100\n` +
          `Khuyến nghị: ${riskAnalysis.recommendation}\n\n` +
          `Bạn có chắc chắn muốn tiếp tục đặt lệnh?`
        );

        if (!confirmed) {
          setSellResult({
            success: false,
            message: 'Lệnh đã bị hủy bởi người dùng do rủi ro cao.',
          });
          setSellLoading(false);
          return;
        }
      }

      // Step 4: Place order
      const orderData: PlaceOrderRequest = {
        symbol,
        side: 'NS',
        orderType: sellOrderType,
        quantity,
        price: sellOrderType === 'LO' ? price : 0,
        loanPackageId: sellForm.loanPackageId ? parseInt(sellForm.loanPackageId) : undefined,
      };

      const result = await apiClient.placeOrder(orderData);
      setSellResult({
        success: true,
        message: `✅ Đặt lệnh BÁN thành công! Order ID: ${result.id}`,
      });

      // Reset form
      setSellForm({ symbol: '', quantity: '', price: '', loanPackageId: '' });
      setSellRiskAnalysis(null);
    } catch (err: any) {
      setSellResult({
        success: false,
        message: err.response?.data?.detail || err.message || 'Lỗi khi đặt lệnh bán',
      });
    } finally {
      setSellLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Đặt lệnh giao dịch</h1>
        <p className="text-muted-foreground">Thực hiện lệnh mua/bán chứng khoán</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* BUY FORM */}
        <Card className="border-green-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <TrendingUp className="h-5 w-5" />
              Lệnh MUA (NB)
            </CardTitle>
            <CardDescription>Đặt lệnh mua chứng khoán</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBuyOrder} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="buy-symbol">Mã chứng khoán *</Label>
                <Input
                  id="buy-symbol"
                  placeholder="VD: VNM, HPG, VCB..."
                  value={buyForm.symbol}
                  onChange={(e) => setBuyForm({ ...buyForm, symbol: e.target.value.toUpperCase() })}
                  required
                  className="uppercase"
                />
              </div>

              <div className="space-y-2">
                <Label>Loại lệnh *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {orderTypes.map((type) => (
                    <Button
                      key={type.value}
                      type="button"
                      variant={buyOrderType === type.value ? 'default' : 'outline'}
                      onClick={() => setBuyOrderType(type.value)}
                      className="justify-start"
                    >
                      {type.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="buy-quantity">Số lượng *</Label>
                  <Input
                    id="buy-quantity"
                    type="number"
                    placeholder="100"
                    value={buyForm.quantity}
                    onChange={(e) => setBuyForm({ ...buyForm, quantity: e.target.value })}
                    required
                    min="1"
                  />
                </div>

                {buyOrderType === 'LO' && (
                  <div className="space-y-2">
                    <Label htmlFor="buy-price">Giá (VNĐ) *</Label>
                    <Input
                      id="buy-price"
                      type="number"
                      step="0.1"
                      placeholder="85.5"
                      value={buyForm.price}
                      onChange={(e) => setBuyForm({ ...buyForm, price: e.target.value })}
                      required
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="buy-loan">Loan Package ID (tùy chọn)</Label>
                <Input
                  id="buy-loan"
                  placeholder="Nhập nếu có"
                  value={buyForm.loanPackageId}
                  onChange={(e) => setBuyForm({ ...buyForm, loanPackageId: e.target.value })}
                />
              </div>

              {buyRiskAnalysis && <RiskAnalysisDisplay analysis={buyRiskAnalysis} />}

              {buyResult && (
                <div
                  className={`p-3 rounded-md flex items-start gap-2 ${
                    buyResult.success ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                  }`}
                >
                  {buyResult.success ? (
                    <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  )}
                  <p className="text-sm">{buyResult.message}</p>
                </div>
              )}

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={buyLoading || isAnalyzing}>
                {buyLoading ? 'Đang xử lý...' : isAnalyzing ? 'Đang phân tích rủi ro...' : 'Đặt lệnh MUA'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* SELL FORM */}
        <Card className="border-red-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <TrendingDown className="h-5 w-5" />
              Lệnh BÁN (NS)
            </CardTitle>
            <CardDescription>Đặt lệnh bán chứng khoán</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSellOrder} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sell-symbol">Mã chứng khoán *</Label>
                <Input
                  id="sell-symbol"
                  placeholder="VD: VNM, HPG, VCB..."
                  value={sellForm.symbol}
                  onChange={(e) => setSellForm({ ...sellForm, symbol: e.target.value.toUpperCase() })}
                  required
                  className="uppercase"
                />
              </div>

              <div className="space-y-2">
                <Label>Loại lệnh *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {orderTypes.map((type) => (
                    <Button
                      key={type.value}
                      type="button"
                      variant={sellOrderType === type.value ? 'default' : 'outline'}
                      onClick={() => setSellOrderType(type.value)}
                      className="justify-start"
                    >
                      {type.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sell-quantity">Số lượng *</Label>
                  <Input
                    id="sell-quantity"
                    type="number"
                    placeholder="100"
                    value={sellForm.quantity}
                    onChange={(e) => setSellForm({ ...sellForm, quantity: e.target.value })}
                    required
                    min="1"
                  />
                </div>

                {sellOrderType === 'LO' && (
                  <div className="space-y-2">
                    <Label htmlFor="sell-price">Giá (VNĐ) *</Label>
                    <Input
                      id="sell-price"
                      type="number"
                      step="0.1"
                      placeholder="85.5"
                      value={sellForm.price}
                      onChange={(e) => setSellForm({ ...sellForm, price: e.target.value })}
                      required
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sell-loan">Loan Package ID (tùy chọn)</Label>
                <Input
                  id="sell-loan"
                  placeholder="Nhập nếu có"
                  value={sellForm.loanPackageId}
                  onChange={(e) => setSellForm({ ...sellForm, loanPackageId: e.target.value })}
                />
              </div>

              {sellRiskAnalysis && <RiskAnalysisDisplay analysis={sellRiskAnalysis} />}

              {sellResult && (
                <div
                  className={`p-3 rounded-md flex items-start gap-2 ${
                    sellResult.success ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                  }`}
                >
                  {sellResult.success ? (
                    <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  )}
                  <p className="text-sm">{sellResult.message}</p>
                </div>
              )}

              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={sellLoading || isAnalyzing}>
                {sellLoading ? 'Đang xử lý...' : isAnalyzing ? 'Đang phân tích rủi ro...' : 'Đặt lệnh BÁN'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hướng dẫn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p><strong>NB (Mua):</strong> Lệnh mua chứng khoán</p>
          <p><strong>NS (Bán):</strong> Lệnh bán chứng khoán</p>
          <p><strong>LO (Limit Order):</strong> Lệnh giới hạn - Cần nhập giá mong muốn</p>
          <p><strong>MP (Market Price):</strong> Lệnh thị trường - Khớp ngay theo giá thị trường</p>
          <p><strong>ATO (At The Open):</strong> Lệnh khớp lúc mở cửa</p>
          <p><strong>ATC (At The Close):</strong> Lệnh khớp lúc đóng cửa</p>
        </CardContent>
      </Card>
    </div>
  );
}
