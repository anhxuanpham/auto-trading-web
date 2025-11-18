# 🚀 DNSE Auto Trading - Frontend

Giao diện web hiện đại cho hệ thống giao dịch chứng khoán tự động thông qua DNSE Lightspeed API.

## ✨ Tính năng

### 📊 Dashboard
- Tổng quan tài khoản với số dư, tổng tài sản, sức mua
- Hiển thị lãi/lỗ real-time
- Bảng danh mục đầu tư chi tiết với các vị thế hiện tại
- Tính toán tự động phần trăm lãi/lỗ cho từng mã chứng khoán

### 💼 Đặt lệnh giao dịch
- **Lệnh MUA (NB)** và **BÁN (NS)** trong giao diện trực quan
- Hỗ trợ đầy đủ các loại lệnh:
  - **LO (Limit Order)**: Lệnh giới hạn
  - **MP (Market Price)**: Lệnh thị trường
  - **ATO (At The Open)**: Khớp lúc mở cửa
  - **ATC (At The Close)**: Khớp lúc đóng cửa
- Form validation và feedback ngay lập tức
- Giao diện màu sắc trực quan (xanh cho mua, đỏ cho bán)

### 📈 Lịch sử giao dịch
- Xem danh sách tất cả các lệnh đã đặt
- Trạng thái chi tiết: Chờ khớp, Đã khớp, Khớp 1 phần, Đã hủy
- Hiển thị số lượng đã khớp vs đặt ban đầu
- Thời gian tạo và cập nhật lệnh

### ⚙️ Admin Panel
- Kiểm tra health status của backend APIs
- Quản lý Admin Secret an toàn
- Cập nhật Trading Token (JWT) khi hết hạn
- Hướng dẫn chi tiết cho từng bước cấu hình

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) với App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components với shadcn/ui design system
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Date Formatting**: date-fns

## 📋 Yêu cầu

- Node.js 18+
- npm/yarn/pnpm
- Backend API đang chạy (xem [auto-trading backend](https://github.com/anhxuanpham/auto-trading))

## 🚀 Cài đặt

### 1. Clone repository

```bash
git clone https://github.com/anhxuanpham/auto-trading-web.git
cd auto-trading-web
```

### 2. Cài đặt dependencies

```bash
npm install
# hoặc
yarn install
# hoặc
pnpm install
```

### 3. Cấu hình environment variables

Tạo file `.env.local` từ template:

```bash
cp .env.example .env.local
```

Chỉnh sửa `.env.local`:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Admin Secret (phải khớp với backend)
NEXT_PUBLIC_ADMIN_SECRET=your-admin-secret-here
```

### 4. Chạy development server

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) để xem ứng dụng.

## 📁 Cấu trúc dự án

```
auto-trading-web/
├── app/
│   ├── page.tsx              # Dashboard - Tổng quan portfolio
│   ├── trading/
│   │   └── page.tsx          # Trang đặt lệnh mua/bán
│   ├── orders/
│   │   └── page.tsx          # Lịch sử giao dịch
│   ├── admin/
│   │   └── page.tsx          # Admin panel
│   ├── layout.tsx            # Root layout với navigation
│   └── globals.css           # Global styles & theme variables
├── components/
│   ├── navigation.tsx        # Navigation bar
│   └── ui/                   # Reusable UI components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── badge.tsx
│       └── table.tsx
├── lib/
│   ├── api-client.ts         # API client với axios
│   ├── types.ts              # TypeScript types & interfaces
│   ├── store.ts              # Zustand store
│   └── utils.ts              # Utility functions
└── .env.local                # Environment variables (not committed)
```

## 🔐 Bảo mật

- **Admin Secret**: Được lưu trong localStorage, cần thiết để cập nhật trading token
- **Trading Token**: Tự động được backend quản lý, có hiệu lực 8 giờ
- **Environment Variables**: Không commit `.env.local` vào git
- **API Authentication**: JWT tự động được backend xử lý

## 🎨 UI/UX Features

- **Responsive Design**: Hoạt động mượt mà trên desktop, tablet và mobile
- **Dark Mode Support**: Tự động theo system preferences
- **Loading States**: Spinner và disabled states rõ ràng
- **Error Handling**: Hiển thị lỗi thân thiện với người dùng
- **Success Feedback**: Thông báo thành công sau mỗi hành động
- **Color Coding**:
  - Xanh cho lãi/mua
  - Đỏ cho lỗ/bán
  - Vàng cho cảnh báo
- **Icons**: Lucide icons cho UI trực quan

## 📡 API Integration

Frontend tích hợp với các endpoint sau từ backend:

### Trading Endpoints
- `POST /trading/orders` - Đặt lệnh mới
- `GET /trading/orders` - Lấy danh sách lệnh
- `GET /trading/portfolio` - Lấy thông tin portfolio

### Admin Endpoints
- `POST /admin/update-token` - Cập nhật trading token
- `GET /health` - Kiểm tra health status
- `GET /trading/health` - Trading API health
- `GET /admin/health` - Admin API health

## 🔧 Scripts

```bash
# Development
npm run dev          # Chạy dev server tại localhost:3000

# Production
npm run build        # Build production
npm run start        # Chạy production server

# Linting
npm run lint         # Chạy ESLint
```

## 📦 Build & Deploy

### Build production

```bash
npm run build
```

### Deploy trên Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/anhxuanpham/auto-trading-web)

Hoặc manual:

```bash
npm i -g vercel
vercel
```

Nhớ cấu hình environment variables trên Vercel dashboard.

## 🐛 Troubleshooting

### Backend connection error
- Kiểm tra backend đang chạy tại đúng port (mặc định 8000)
- Verify `NEXT_PUBLIC_API_BASE_URL` trong `.env.local`

### Admin token update fails
- Kiểm tra `NEXT_PUBLIC_ADMIN_SECRET` khớp với backend
- Xem browser console để debug chi tiết

### CORS errors
- Backend cần cấu hình CORS cho phép origin của frontend
- Thêm `http://localhost:3000` vào allowed origins

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

[MIT License](LICENSE)

## 🔗 Links

- Backend Repository: [auto-trading](https://github.com/anhxuanpham/auto-trading)
- DNSE API Documentation: [DNSE Lightspeed API](https://lightspeed.dnse.com.vn/)

## 💡 Tips

1. **Admin Secret**: Lưu admin secret ở trang Admin trước khi thực hiện bất kỳ thao tác nào
2. **Token Expiry**: Trading token có hiệu lực 8h, cần cập nhật khi hết hạn
3. **Real-time Data**: Nhấn nút "Làm mới" để cập nhật dữ liệu mới nhất
4. **Order Types**: Chọn đúng loại lệnh phù hợp với chiến lược giao dịch

---

Made with ❤️ by [anhxuanpham](https://github.com/anhxuanpham)
