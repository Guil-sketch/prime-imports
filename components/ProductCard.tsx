/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import { Product, ProductVariant } from '../types';
import { useCartStore } from '../store/useCartStore';
import { ShoppingBag, Check, X } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [customText, setCustomText] = useState('');
  const [added, setAdded] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const variants = product.product_variants || [];

  const handleAddToCart = () => {
    if (variants.length > 0 && !selectedVariant) {
      alert('Por favor, selecione uma opção.');
      return;
    }

    const currentPrice = selectedVariant?.price_override ?? product.base_price;
    const variantId = selectedVariant ? selectedVariant.id : 'standard';
    const sizeName = selectedVariant ? selectedVariant.size : 'Padrão';
    const cartItemId = `${product.id}-${variantId}-${customText.trim()}`;

    addItem({
      cartItemId,
      productId: product.id,
      variantId,
      name: product.name,
      size: sizeName,
      price: Number(currentPrice),
      quantity: 1,
      customizationText: customText.trim() ? customText.trim() : undefined,
      imageUrl: product.images?.[0] || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop&q=60',
    });

    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      setIsModalOpen(false);
      setSelectedVariant(null);
      setCustomText('');
    }, 800);
  };

  const imageSrc = product.images?.[0] || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop&q=60';

  return (
    <>
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between">
        <div className="relative aspect-square w-full bg-neutral-100">
          <img src={imageSrc} alt={product.name} className="w-full h-full object-cover" />
        </div>

        <div className="p-4 flex flex-col flex-grow justify-between">
          <div>
            <h3 className="font-semibold text-neutral-900 text-base line-clamp-1">{product.name}</h3>
            {product.description && (
              <p className="text-neutral-500 text-xs mt-1 line-clamp-2">{product.description}</p>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-neutral-400 block">Preço</span>
              <span className="text-base font-bold text-neutral-900">
                R$ {Number(product.base_price).toFixed(2)}
              </span>
            </div>

            <button
              onClick={() => (variants.length > 0 ? setIsModalOpen(true) : handleAddToCart())}
              className="bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium px-3.5 py-2 rounded-xl transition flex items-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              {variants.length > 0 ? 'Opções' : 'Comprar'}
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-bold text-neutral-900">{product.name}</h2>
                <p className="text-sm font-semibold text-neutral-700 mt-0.5">
                  R$ {(selectedVariant?.price_override ?? product.base_price).toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-neutral-400 hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {variants.length > 0 && (
              <div className="mb-5">
                <label className="block text-xs font-semibold text-neutral-600 mb-2">
                  Selecione a Variação:
                </label>
                <div className="flex flex-wrap gap-2">
                  {variants.map((variant) => {
                    const isSelected = selectedVariant?.id === variant.id;
                    return (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant)}
                        className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition ${
                          isSelected
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                        }`}
                      >
                        {variant.size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              onClick={handleAddToCart}
              disabled={added}
              className={`w-full py-3 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition ${
                added ? 'bg-emerald-600 text-white' : 'bg-neutral-900 hover:bg-neutral-800 text-white'
              }`}
            >
              {added ? (
                <>
                  <Check className="w-4 h-4" /> Adicionado!
                </>
              ) : (
                'Adicionar à Sacola'
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}