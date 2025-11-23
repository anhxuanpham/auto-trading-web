'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown, Wallet, BarChart3 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useTradingStore } from '@/lib/store';
import { Deal } from '@/lib/types';

export default function DashboardPage() {
  const { portfolio, setPortfolio, setIsLoading, isLoading } = useTradingStore();
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolio = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.getPortfolio();
      setPortfolio(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Lỗi khi tải dữ liệu portfolio');
      console.error('Error fetching portfolio:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Calculate summary statistics from deals
  const totalUnrealizedPnL = portfolio.reduce((sum, deal) => sum + deal.unrealizedProfit, 0);
  const totalRealizedPnL = portfolio.reduce((sum, deal) => sum + deal.realizedProfit, 0);
  const totalPnL = totalUnrealizedPnL + totalRealizedPnL;
  const openDeals = portfolio.filter(deal => deal.status === 'OPEN');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Tổng quan tài khoản và danh mục đầu tư</p>
        </div>
        <Button onClick={fetchPortfolio} disabled={isLoading} size="lg">
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-destructive font-medium">{error}</p>
          </CardContent>
        </Card>
      )}

      {portfolio.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng vị thế</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{portfolio.length}</div>
                <p className="text-xs text-muted-foreground mt-1">{openDeals.length} đang mở</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lãi/Lỗ chưa chốt</CardTitle>
                {totalUnrealizedPnL >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${
                    totalUnrealizedPnL >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {formatCurrency(totalUnrealizedPnL)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lãi/Lỗ đã chốt</CardTitle>
                {totalRealizedPnL >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${
                    totalRealizedPnL >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {formatCurrency(totalRealizedPnL)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng Lãi/Lỗ</CardTitle>
                {totalPnL >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${
                    totalPnL >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {formatCurrency(totalPnL)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Danh mục đầu tư</CardTitle>
              <CardDescription>Các vị thế hiện tại của bạn</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã CK</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Số lượng</TableHead>
                    <TableHead className="text-right">Giá cost</TableHead>
                    <TableHead className="text-right">Giá thị trường</TableHead>
                    <TableHead className="text-right">Hòa vốn</TableHead>
                    <TableHead className="text-right">Lãi/Lỗ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {portfolio.map((deal) => (
                    <TableRow key={deal.id}>
                      <TableCell className="font-bold">{deal.symbol}</TableCell>
                      <TableCell>
                        <Badge variant={deal.status === 'OPEN' ? 'default' : 'secondary'}>
                          {deal.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{deal.accumulateQuantity.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{formatCurrency(deal.costPrice)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(deal.marketPrice)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(deal.breakEvenPrice)}</TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          deal.unrealizedProfit >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}
                      >
                        {formatCurrency(deal.unrealizedProfit)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {portfolio.length === 0 && !error && !isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Nhấn nút "Làm mới" để tải dữ liệu portfolio</p>
              <Button onClick={fetchPortfolio}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Tải dữ liệu
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
