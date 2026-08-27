import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from '../types';

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  total: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (newItem) => {
        const current = get().items;
        const exists = current.find((i) => i.cartItemId === newItem.cartItemId);
        if (exists) {
          set({
            items: current.map((i) =>
              i.cartItemId === newItem.cartItemId
                ? { ...i, quantity: i.quantity + newItem.quantity }
                : i
            ),
          });
        } else {
          set({ items: [...current, newItem] });
        }
      },
      removeItem: (cartItemId) =>
        set({ items: get().items.filter((i) => i.cartItemId !== cartItemId) }),
      updateQuantity: (cartItemId, delta) =>
        set({
          items: get().items
            .map((i) =>
              i.cartItemId === cartItemId ? { ...i, quantity: i.quantity + delta } : i
            )
            .filter((i) => i.quantity > 0),
        }),
      clearCart: () => set({ items: [] }),
      total: () =>
        get().items.reduce((acc, item) => acc + item.price * item.quantity, 0),
    }),
    { name: 'prime-cart-storage' }
  )
);