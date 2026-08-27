'use client';

import React from 'react';
import { useCartStore } from '@/store/useCartStore';
import { CartItem } from '@/types';
import { ShoppingBag } from 'lucide-react';

interface FloatingCartButtonProps {
  onClick: () => void;
}

export default function FloatingCartButton({ onClick }: FloatingCartButtonProps) {
  const items = useCartStore((state) => state.items);
  const totalQuantity = items.reduce((acc: number, item: CartItem) => acc + item.quantity, 0);

  if (totalQuantity === 0) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 bg-amber-500 hover:bg-amber-400 text-black p-4 rounded-full shadow-2xl flex items-center gap-2.5 transition active:scale-95"
    >
      <div className="relative">
        <ShoppingBag className="w-5 h-5" />
        <span className="absolute -top-2 -right-2 bg-black text-amber-400 border border-amber-400 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
          {totalQuantity}
        </span>
      </div>
      <span className="text-xs font-bold pr-1">Ver Sacola</span>
    </button>
  );
}