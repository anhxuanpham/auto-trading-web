# 🚀 Hướng dẫn Setup Cloudflare Tunnel

Guide này sẽ hướng dẫn bạn expose backend FastAPI đang chạy local lên internet để frontend trên Vercel có thể kết nối.

## 📋 Yêu cầu

- Backend FastAPI đang chạy ở `http://localhost:8000`
- Tài khoản Cloudflare (miễn phí)
- Terminal/Command Line access

---

## 🔧 Phần 1: Cài đặt cloudflared

### Linux/WSL
```bash
# Download cloudflared
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb

# Install
sudo dpkg -i cloudflared.deb

# Verify installation
cloudflared --version
```

### macOS
```bash
# Using Homebrew
brew install cloudflared

# Verify installation
cloudflared --version
```

### Windows
```powershell
# Option 1: Download exe từ GitHub
# https://github.com/cloudflare/cloudflared/releases/latest

# Option 2: Using Chocolatey
choco install cloudflared

# Verify installation
cloudflared --version
```

---

## 🚀 Phần 2: Quick Start (Cách nhanh nhất - Tunnel tạm thời)

**Phù hợp cho:** Testing, development

```bash
# Chạy backend trước
cd path/to/your/backend
python main.py  # hoặc uvicorn main:app --reload

# Trong terminal khác, chạy tunnel
cloudflared tunnel --url http://localhost:8000
```

Output sẽ giống:
```
2025-01-23 10:00:00 INFO  Your quick tunnel is available at:
https://random-name-abc123.trycloudflare.com
```

**✅ Copy URL này và update vào `.env.local`:**
```bash
NEXT_PUBLIC_API_BASE_URL=https://random-name-abc123.trycloudflare.com
```

**⚠️ Lưu ý:** URL này sẽ thay đổi mỗi khi restart tunnel!

---

## 🏗️ Phần 3: Persistent Tunnel (Production - Tunnel cố định)

**Phù hợp cho:** Production, stable URL

### Bước 1: Login Cloudflare
```bash
cloudflared tunnel login
```

- Browser sẽ tự động mở
- Đăng nhập Cloudflare account
- Chọn domain (nếu có)
- Cert sẽ được lưu vào `~/.cloudflared/cert.pem`

### Bước 2: Tạo Tunnel
```bash
# Tạo tunnel với tên "auto-trading"
cloudflared tunnel create auto-trading
```

Output:
```
Tunnel credentials written to /home/user/.cloudflared/<TUNNEL_ID>.json
Created tunnel auto-trading with id <TUNNEL_ID>
```

**📝 Lưu lại TUNNEL_ID này!**

### Bước 3: Tạo Config File
```bash
# Tạo config file
nano ~/.cloudflared/config.yml
```

**Paste config này vào** (thay `<TUNNEL_ID>` bằng ID thực tế từ bước 2):

```yaml
tunnel: <TUNNEL_ID>
credentials-file: /home/user/.cloudflared/<TUNNEL_ID>.json

ingress:
  # Backend API
  - service: http://localhost:8000
```

**Lưu file:** `Ctrl+O`, Enter, `Ctrl+X`

### Bước 4: Route DNS (Nếu dùng custom domain)

**Nếu bạn có domain trên Cloudflare:**

```bash
# Tạo DNS record trỏ về tunnel
cloudflared tunnel route dns auto-trading api.william.io.vn
```

**Nếu KHÔNG có domain:**
Skip bước này, bạn sẽ dùng URL `.trycloudflare.com`

### Bước 5: Chạy Tunnel
```bash
cloudflared tunnel run auto-trading
```

Output:
```
2025-01-23 INF  Registered tunnel connection
2025-01-23 INF  Tunnel running at: https://api.william.io.vn
```

---

## 🔄 Phần 4: Chạy Tunnel như Service (Auto-start)

Để tunnel tự động chạy khi khởi động máy:

### Linux/macOS
```bash
# Install as service
sudo cloudflared service install

# Start service
sudo systemctl start cloudflared

# Enable auto-start
sudo systemctl enable cloudflared

# Check status
sudo systemctl status cloudflared
```

### Windows
```powershell
# Install as service
cloudflared service install

# Start service
sc start cloudflared
```

---

## ⚙️ Phần 5: Update Frontend

### 1. Update `.env.local`

```bash
# === CLOUDFLARE TUNNEL ===
# Option 1: Custom domain
NEXT_PUBLIC_API_BASE_URL=https://api.william.io.vn

# Option 2: Quick tunnel (thay URL)
# NEXT_PUBLIC_API_BASE_URL=https://your-random-name.trycloudflare.com

NEXT_PUBLIC_ADMIN_SECRET=your-admin-secret-here
```

### 2. Update Vercel Environment Variables

**Vào Vercel Dashboard:**
1. Project Settings → Environment Variables
2. Add variable:
   - **Name:** `NEXT_PUBLIC_API_BASE_URL`
   - **Value:** `https://api.william.io.vn` (hoặc tunnel URL)
   - **Environments:** Production, Preview, Development
3. Click **Save**
4. **Redeploy** frontend

### 3. Test Local
```bash
# Test local trước khi deploy
npm run dev

# Mở browser, check console logs
# WebSocket phải connect tới tunnel URL
```

---

## 🧪 Phần 6: Testing

### Test API Endpoint
```bash
# Health check
curl https://api.william.io.vn/health

# Expected response:
# {"status":"ok","timestamp":"..."}
```

### Test WebSocket
```bash
# Dùng wscat (install: npm i -g wscat)
wscat -c wss://api.william.io.vn/market-data/ws
```

### Test từ Frontend
1. Deploy lên Vercel
2. Mở browser DevTools → Console
3. Kiểm tra logs:
```
🔌 Connecting to WebSocket: wss://api.william.io.vn/market-data/ws
✅ WebSocket connected
```

---

## 🎯 Phần 7: Setup cho Multiple Services (Advanced)

Nếu bạn có nhiều services (API, WebSocket riêng, etc.):

**Update `~/.cloudflared/config.yml`:**

```yaml
tunnel: <TUNNEL_ID>
credentials-file: /home/user/.cloudflared/<TUNNEL_ID>.json

ingress:
  # API endpoint
  - hostname: api.william.io.vn
    service: http://localhost:8000
    originRequest:
      noTLSVerify: true

  # WebSocket endpoint (nếu backend WS chạy port khác)
  - hostname: ws.william.io.vn
    service: http://localhost:8001
    originRequest:
      noTLSVerify: true
      connectTimeout: 10s

  # Catch-all rule (required)
  - service: http_status:404
```

**Tạo DNS records:**
```bash
cloudflared tunnel route dns auto-trading api.william.io.vn
cloudflared tunnel route dns auto-trading ws.william.io.vn
```

---

## 🐛 Troubleshooting

### 1. Tunnel không connect
```bash
# Check tunnel status
cloudflared tunnel info auto-trading

# Check logs
cloudflared tunnel run auto-trading --loglevel debug
```

### 2. WebSocket lỗi 403/502
**Nguyên nhân:** Cloudflare block WebSocket

**Giải pháp:** Enable WebSocket trong config:
```yaml
ingress:
  - service: http://localhost:8000
    originRequest:
      noTLSVerify: true
      # Enable WebSocket
      http2Origin: true
```

### 3. CORS errors
**Backend phải allow domain:**

```python
# main.py (FastAPI)
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://your-app.vercel.app",
        "https://api.william.io.vn"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 4. Tunnel URL thay đổi
**Quick tunnel (`--url`):** URL thay đổi mỗi lần restart

**Giải pháp:** Dùng persistent tunnel (Phần 3)

---

## 📊 So sánh Options

| Feature | Quick Tunnel | Persistent Tunnel | Tunnel + Custom Domain |
|---------|--------------|-------------------|------------------------|
| Setup time | 30 giây | 5 phút | 10 phút |
| URL cố định | ❌ | ✅ | ✅ |
| Custom domain | ❌ | ❌ | ✅ |
| Auto-restart | ❌ | ✅ | ✅ |
| Production-ready | ❌ | ⚠️ | ✅ |

---

## 🎉 Done!

Sau khi setup xong:
1. ✅ Backend local expose lên internet
2. ✅ Frontend Vercel connect được backend
3. ✅ WebSocket hoạt động bình thường
4. ✅ HTTPS tự động (từ Cloudflare)

**Lệnh hay dùng:**
```bash
# Start tunnel
cloudflared tunnel run auto-trading

# Quick tunnel (testing)
cloudflared tunnel --url http://localhost:8000

# Check status
cloudflared tunnel info auto-trading

# Stop tunnel
Ctrl+C

# Stop service
sudo systemctl stop cloudflared
```

---

## 📚 Resources

- [Cloudflare Tunnel Docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [GitHub Releases](https://github.com/cloudflare/cloudflared/releases)
- [Troubleshooting Guide](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/troubleshooting/)

---

**Questions?** Check backend logs và tunnel logs để debug! 🚀
