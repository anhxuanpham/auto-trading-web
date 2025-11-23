'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings, Key, CheckCircle2, AlertCircle, Server } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useTradingStore } from '@/lib/store';

export default function AdminPage() {
  const { adminSecret, setAdminSecret } = useTradingStore();
  const [localAdminSecret, setLocalAdminSecret] = useState(adminSecret);
  const [newTradingToken, setNewTradingToken] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateResult, setUpdateResult] = useState<{ success: boolean; message: string } | null>(null);

  const [healthStatus, setHealthStatus] = useState<{
    main: boolean | null;
    trading: any;
    admin: any;
  }>({
    main: null,
    trading: null,
    admin: null,
  });
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  useEffect(() => {
    setLocalAdminSecret(adminSecret);
  }, [adminSecret]);

  const handleSaveAdminSecret = () => {
    setAdminSecret(localAdminSecret);
    apiClient.setAdminSecret(localAdminSecret);
    alert('Admin secret đã được lưu vào localStorage');
  };

  const handleUpdateToken = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!localAdminSecret) {
      setUpdateResult({
        success: false,
        message: 'Vui lòng nhập Admin Secret trước',
      });
      return;
    }

    setIsUpdating(true);
    setUpdateResult(null);

    try {
      const result = await apiClient.updateTradingToken({
        newToken: newTradingToken,
        adminSecret: localAdminSecret,
      });

      setUpdateResult({
        success: true,
        message: result.message || 'Cập nhật trading token thành công!',
      });
      setNewTradingToken('');
    } catch (err: any) {
      setUpdateResult({
        success: false,
        message: err.response?.data?.detail || err.message || 'Lỗi khi cập nhật token',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const checkHealth = async () => {
    setIsCheckingHealth(true);

    try {
      const [mainHealth, tradingHealth, adminHealth] = await Promise.allSettled([
        apiClient.healthCheck(),
        apiClient.tradingHealthCheck(),
        apiClient.adminHealthCheck(),
      ]);

      setHealthStatus({
        main: mainHealth.status === 'fulfilled' && mainHealth.value?.status === 'ok',
        trading: tradingHealth.status === 'fulfilled' ? tradingHealth.value : null,
        admin: adminHealth.status === 'fulfilled' ? adminHealth.value : null,
      });
    } catch (err) {
      console.error('Health check error:', err);
    } finally {
      setIsCheckingHealth(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-muted-foreground">Quản lý cấu hình hệ thống và token</p>
      </div>

      {/* Health Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              <CardTitle>Trạng thái hệ thống</CardTitle>
            </div>
            <Button onClick={checkHealth} disabled={isCheckingHealth} size="sm" variant="outline">
              Kiểm tra lại
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
            <span className="font-medium">Main API</span>
            <Badge variant={healthStatus.main ? 'success' : 'destructive'}>
              {healthStatus.main ? 'Online' : 'Offline'}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
            <span className="font-medium">Trading API</span>
            <Badge variant={healthStatus.trading ? 'success' : 'destructive'}>
              {healthStatus.trading ? 'Online' : 'Offline'}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
            <span className="font-medium">Admin API</span>
            <Badge variant={healthStatus.admin ? 'success' : 'destructive'}>
              {healthStatus.admin ? 'Online' : 'Offline'}
            </Badge>
          </div>

          {healthStatus.trading && typeof healthStatus.trading === 'object' && (
            <div className="mt-4 p-3 bg-blue-500/10 rounded-md">
              <p className="text-sm text-muted-foreground">
                <strong>Trading Status:</strong> {JSON.stringify(healthStatus.trading, null, 2)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Secret Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Cấu hình Admin Secret
          </CardTitle>
          <CardDescription>
            Nhập Admin Secret để có quyền cập nhật trading token
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-secret">Admin Secret</Label>
            <Input
              id="admin-secret"
              type="password"
              placeholder="Nhập admin secret của backend"
              value={localAdminSecret}
              onChange={(e) => setLocalAdminSecret(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Secret này phải khớp với X-Admin-Secret trong backend API
            </p>
          </div>

          <Button onClick={handleSaveAdminSecret} variant="outline">
            Lưu Admin Secret
          </Button>

          {adminSecret && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              Admin secret đã được cấu hình
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Trading Token */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Cập nhật Trading Token
          </CardTitle>
          <CardDescription>
            Cập nhật JWT token mới khi token hiện tại hết hạn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateToken} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="trading-token">Trading Token (JWT) mới</Label>
              <Input
                id="trading-token"
                type="password"
                placeholder="Nhập JWT token mới từ DNSE"
                value={newTradingToken}
                onChange={(e) => setNewTradingToken(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Token này có hiệu lực 8 giờ và sẽ được backend tự động quản lý
              </p>
            </div>

            {updateResult && (
              <div
                className={`p-3 rounded-md flex items-start gap-2 ${
                  updateResult.success ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                }`}
              >
                {updateResult.success ? (
                  <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                )}
                <p className="text-sm">{updateResult.message}</p>
              </div>
            )}

            <Button type="submit" disabled={isUpdating || !localAdminSecret} className="w-full">
              {isUpdating ? 'Đang cập nhật...' : 'Cập nhật Trading Token'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Hướng dẫn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div>
            <h4 className="font-semibold text-foreground mb-1">1. Cấu hình Admin Secret</h4>
            <p>
              Nhập admin secret từ backend (environment variable X_ADMIN_SECRET). Secret này được lưu trong localStorage của trình duyệt.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-1">2. Lấy Trading Token</h4>
            <p>
              Đăng nhập vào DNSE Lightspeed API và lấy JWT token. Token này có hiệu lực 8 giờ.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-1">3. Cập nhật Token</h4>
            <p>
              Paste JWT token vào form và submit. Backend sẽ tự động quản lý và refresh token khi cần.
            </p>
          </div>

          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
            <p className="text-yellow-700 dark:text-yellow-500">
              <strong>Lưu ý bảo mật:</strong> Không chia sẻ admin secret và trading token với người khác.
              Các thông tin này rất quan trọng cho bảo mật tài khoản giao dịch của bạn.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
