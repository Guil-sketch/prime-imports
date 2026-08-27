/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import { useCartStore } from '../store/useCartStore';
import { generateWhatsAppLink } from '../utils/whatsapp';
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
      <div className="bg-white w-full max-w-md h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
        
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-neutral-900" />
            <h2 className="font-bold text-neutral-900 text-base">Sua Sacola</h2>
            <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full font-semibold">
              {items.length}
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-neutral-100 text-neutral-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-grow space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-400 py-12">
              <ShoppingBag className="w-12 h-12 stroke-[1.5] mb-2 text-neutral-300" />
              <p className="text-sm">Sua sacola está vazia.</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.cartItemId} className="flex gap-3 pb-3 border-b border-neutral-100">
                <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-xl object-cover bg-neutral-100" />
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-semibold text-xs text-neutral-900 line-clamp-1">{item.name}</h4>
                    <p className="text-[11px] text-neutral-500">Opção: <span className="font-medium text-neutral-700">{item.size}</span></p>
                    {item.customizationText && (
                      <p className="text-[10px] text-neutral-400 italic">Obs: {item.customizationText}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs font-bold text-neutral-900">
                      R$ {(item.price * item.quantity).toFixed(2)}
                    </span>
                    <div className="flex items-center gap-2 border border-neutral-200 rounded-lg p-0.5">
                      <button
                        onClick={() => updateQuantity(item.cartItemId, -1)}
                        className="p-1 hover:bg-neutral-100 rounded text-neutral-600"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-semibold px-1">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.cartItemId, 1)}
                        className="p-1 hover:bg-neutral-100 rounded text-neutral-600"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeItem(item.cartItemId)}
                  className="text-neutral-300 hover:text-red-500 self-start p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-4 bg-neutral-50 border-t border-neutral-100 space-y-3">
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Seu Nome *"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:border-neutral-900"
              />
              <input
                type="text"
                placeholder="Endereço de Entrega (Opcional)"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:border-neutral-900"
              />
              <textarea
                rows={2}
                placeholder="Observações do pedido (Opcional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:border-neutral-900"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-neutral-500">Total:</span>
              <span className="text-base font-bold text-neutral-900">R$ {total().toFixed(2)}</span>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition"
            >
              <Send className="w-4 h-4" />
              Finalizar no WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  );
}