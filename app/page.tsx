'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown, Wallet, BarChart3 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useTradingStore } from '@/lib/store';
import { Portfolio } from '@/lib/types';

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

      {portfolio && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Số dư tài khoản</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(portfolio.accountBalance)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng tài sản</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(portfolio.totalAssets)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sức mua</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(portfolio.buyingPower)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lãi/Lỗ</CardTitle>
                {portfolio.totalProfitLoss >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${
                    portfolio.totalProfitLoss >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {formatCurrency(portfolio.totalProfitLoss)}
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
              {portfolio.positions && portfolio.positions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã CK</TableHead>
                      <TableHead className="text-right">Số lượng</TableHead>
                      <TableHead className="text-right">KL khả dụng</TableHead>
                      <TableHead className="text-right">Giá TB</TableHead>
                      <TableHead className="text-right">Giá hiện tại</TableHead>
                      <TableHead className="text-right">Giá trị</TableHead>
                      <TableHead className="text-right">Lãi/Lỗ</TableHead>
                      <TableHead className="text-right">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {portfolio.positions.map((position) => (
                      <TableRow key={position.symbol}>
                        <TableCell className="font-bold">{position.symbol}</TableCell>
                        <TableCell className="text-right">{position.quantity.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{position.availableQuantity.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{formatCurrency(position.avgPrice)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(position.currentPrice)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(position.marketValue)}</TableCell>
                        <TableCell
                          className={`text-right font-medium ${
                            position.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}
                        >
                          {formatCurrency(position.profitLoss)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={position.profitLossPercent >= 0 ? 'success' : 'destructive'}
                          >
                            {formatPercent(position.profitLossPercent)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Chưa có vị thế nào trong danh mục
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!portfolio && !error && !isLoading && (
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
