/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { generateWhatsAppLink } from '@/utils/whatsapp';
import { CartItem } from '@/types';
import { X, Trash2, Plus, Minus, Send, ShoppingBag } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, updateQuantity, removeItem, total } = useCartStore();
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleCheckout = () => {
    if (!customerName.trim()) {
      alert('Por favor, informe seu nome para o pedido.');
      return;
    }

    const url = generateWhatsAppLink(items, {
      name: customerName,
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
      <div className="bg-[#15171c] border-l border-neutral-800 text-white w-full max-w-md h-full flex flex-col justify-between shadow-2xl">
        
        {/* Topo */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-500" />
            <h2 className="font-bold text-white text-base">Sua Sacola</h2>
            <span className="text-xs bg-neutral-800 text-amber-400 px-2 py-0.5 rounded-full font-semibold">
              {items.length}
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-neutral-800 text-neutral-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Itens */}
        <div className="p-4 overflow-y-auto flex-grow space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-500 py-12">
              <ShoppingBag className="w-12 h-12 stroke-[1.5] mb-2 text-neutral-600" />
              <p className="text-sm">Sua sacola está vazia.</p>
            </div>
          ) : (
            items.map((item: CartItem) => (
              <div key={item.cartItemId} className="flex gap-3 pb-3 border-b border-neutral-800/80">
                <img src={item.imageUrl || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=100&auto=format&fit=crop&q=60'} alt={item.name} className="w-16 h-16 rounded-xl object-cover bg-neutral-800" />
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-semibold text-xs text-white line-clamp-1">{item.name}</h4>
                    {item.size && (
                      <p className="text-[11px] text-neutral-400">Opção: <span className="font-medium text-amber-500">{item.size}</span></p>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs font-bold text-amber-500">
                      R$ {(item.price * item.quantity).toFixed(2)}
                    </span>
                    <div className="flex items-center gap-2 border border-neutral-700 rounded-lg p-0.5">
                      <button
                        onClick={() => updateQuantity(item.cartItemId, -1)}
                        className="p-1 hover:bg-neutral-800 rounded text-neutral-400"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-semibold px-1">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.cartItemId, 1)}
                        className="p-1 hover:bg-neutral-800 rounded text-neutral-400"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeItem(item.cartItemId)}
                  className="text-neutral-500 hover:text-red-400 self-start p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Checkout */}
        {items.length > 0 && (
          <div className="p-4 bg-[#1b1e24] border-t border-neutral-800 space-y-3">
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Seu Nome *"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-neutral-700 bg-[#15171c] text-white focus:outline-none focus:border-amber-500"
              />
              <input
                type="text"
                placeholder="Endereço de Entrega (Opcional)"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-neutral-700 bg-[#15171c] text-white focus:outline-none focus:border-amber-500"
              />
              <textarea
                rows={2}
                placeholder="Observações do pedido (Opcional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-neutral-700 bg-[#15171c] text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-neutral-400">Total do Pedido:</span>
              <span className="text-base font-bold text-amber-500">R$ {total().toFixed(2)}</span>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full bg-[#00a884] hover:bg-[#008f6f] text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition"
            >
              <Send className="w-4 h-4" />
              Enviar Pedido no WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  );
}