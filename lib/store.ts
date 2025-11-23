import { create } from 'zustand';
import { Deal, OrderDetail } from './types';

interface TradingStore {
  portfolio: Deal[];
  orders: OrderDetail[];
  isLoading: boolean;
  error: string | null;
  adminSecret: string;

  setPortfolio: (portfolio: Deal[]) => void;
  setOrders: (orders: OrderDetail[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setAdminSecret: (secret: string) => void;
}

export const useTradingStore = create<TradingStore>((set) => ({
  portfolio: [],
  orders: [],
  isLoading: false,
  error: null,
  adminSecret: typeof window !== 'undefined' ? localStorage.getItem('adminSecret') || '' : '',

  setPortfolio: (portfolio) => set({ portfolio }),
  setOrders: (orders) => set({ orders }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setAdminSecret: (secret) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminSecret', secret);
    }
    set({ adminSecret: secret });
  },
}));
