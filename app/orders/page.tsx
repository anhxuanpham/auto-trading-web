'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useTradingStore } from '@/lib/store';
import { Order } from '@/lib/types';
import { format } from 'date-fns';

export default function OrdersPage() {
  const { orders, setOrders, setIsLoading, isLoading } = useTradingStore();
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.getOrders();
      setOrders(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Lỗi khi tải lịch sử lệnh');
      console.error('Error fetching orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm:ss');
    } catch {
      return dateString;
    }
  };

  const getOrderTypeBadge = (type: string) => {
    const variants: Record<string, any> = {
      LO: 'default',
      MP: 'secondary',
      ATO: 'outline',
      ATC: 'outline',
    };
    return <Badge variant={variants[type] || 'default'}>{type}</Badge>;
  };

  const getSideBadge = (side: string) => {
    if (side === 'NB') {
      return (
        <Badge variant="success" className="flex items-center gap-1 w-fit">
          <TrendingUp className="h-3 w-3" />
          MUA
        </Badge>
      );
    }
    return (
      <Badge variant="destructive" className="flex items-center gap-1 w-fit">
        <TrendingDown className="h-3 w-3" />
        BÁN
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      pending: { label: 'Chờ khớp', variant: 'warning' },
      filled: { label: 'Đã khớp', variant: 'success' },
      partial: { label: 'Khớp 1 phần', variant: 'secondary' },
      cancelled: { label: 'Đã hủy', variant: 'destructive' },
      rejected: { label: 'Bị từ chối', variant: 'destructive' },
    };

    const statusInfo = statusMap[status.toLowerCase()] || { label: status, variant: 'default' };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lịch sử giao dịch</h1>
          <p className="text-muted-foreground">Danh sách các lệnh đã đặt</p>
        </div>
        <Button onClick={fetchOrders} disabled={isLoading} size="lg">
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

      <Card>
        <CardHeader>
          <CardTitle>Danh sách lệnh</CardTitle>
          <CardDescription>
            {orders.length > 0 ? `Tổng số ${orders.length} lệnh` : 'Chưa có lệnh nào'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã lệnh</TableHead>
                    <TableHead>Mã CK</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Kiểu lệnh</TableHead>
                    <TableHead className="text-right">Giá</TableHead>
                    <TableHead className="text-right">KL đặt</TableHead>
                    <TableHead className="text-right">KL khớp</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Thời gian tạo</TableHead>
                    <TableHead>Cập nhật</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.orderId}>
                      <TableCell className="font-mono text-xs">{order.orderId}</TableCell>
                      <TableCell className="font-bold">{order.symbol}</TableCell>
                      <TableCell>{getSideBadge(order.side)}</TableCell>
                      <TableCell>{getOrderTypeBadge(order.orderType)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {order.price ? formatCurrency(order.price) : '-'}
                      </TableCell>
                      <TableCell className="text-right">{order.quantity.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-medium">
                        {order.filledQuantity.toLocaleString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-sm">{formatDateTime(order.createdAt)}</TableCell>
                      <TableCell className="text-sm">{formatDateTime(order.updatedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Chưa có lệnh giao dịch nào</p>
              {!isLoading && (
                <Button onClick={fetchOrders} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Tải dữ liệu
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chú thích trạng thái</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="warning">Chờ khớp</Badge>
            <span className="text-muted-foreground">- Lệnh đang chờ khớp trên hệ thống</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="success">Đã khớp</Badge>
            <span className="text-muted-foreground">- Lệnh đã được khớp hoàn toàn</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Khớp 1 phần</Badge>
            <span className="text-muted-foreground">- Lệnh đã khớp một phần</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="destructive">Đã hủy</Badge>
            <span className="text-muted-foreground">- Lệnh đã bị hủy</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
