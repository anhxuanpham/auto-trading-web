import { create } from 'zustand';
import { Portfolio, Order } from './types';

interface TradingStore {
  portfolio: Portfolio | null;
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  adminSecret: string;

  setPortfolio: (portfolio: Portfolio | null) => void;
  setOrders: (orders: Order[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setAdminSecret: (secret: string) => void;
}

export const useTradingStore = create<TradingStore>((set) => ({
  portfolio: null,
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
