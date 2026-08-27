/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Product, Category, CartItem } from '../types';
import { ShieldCheck, Truck, Sparkles, ShoppingBag, X, Trash2, Send } from 'lucide-react';
import Link from 'next/link';

export default function PrimeVitrine() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [dollarRate, setDollarRate] = useState<number>(5.60);

  useEffect(() => {
    async function loadData() {
      const { data: cats } = await supabase.from('categories').select('*').order('name');
      if (cats) setCategories(cats);

      const { data: prods } = await supabase.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false });
      if (prods) setProducts(prods as Product[]);

      const { data: config } = await supabase.from('store_settings').select('dollar_rate').eq('id', 'config').single();
      if (config) setDollarRate(Number(config.dollar_rate));
    }
    loadData();
  }, []);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.id === product.id);
      if (exists) {
        return prev.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { id: product.id, name: product.name, price: Number(product.base_price), quantity: 1, cost_usd: product.cost_usd || 0 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const totalCart = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const estimatedCostBrl = cart.reduce((acc, item) => acc + ((item.cost_usd || 0) * dollarRate * item.quantity), 0);

    // Salvar o pedido no Supabase para o relatório administrativo
    await supabase.from('orders').insert([{
      customer_name: 'Cliente Vitrine',
      items: cart,
      total_amount: totalCart,
      estimated_cost_brl: estimatedCostBrl,
      status: 'Pendente'
    }]);

    const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5561999999999';
    let msg = `🛍️ *NOVO PEDIDO - PRIME IMPORTS*\n\n`;
    cart.forEach((i) => {
      msg += `• *${i.quantity}x* ${i.name} (R$ ${i.price.toFixed(2)})\n`;
    });
    msg += `\n💰 *Total: R$ ${totalCart.toFixed(2)}*\n`;
    msg += `\nOlá Carlos! Gostaria de finalizar o pedido com o cálculo de frete.`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const filteredProducts = products.filter((p) =>
    selectedCategory === 'all' ? true : p.category_id === selectedCategory
  );

  return (
    <div className="min-h-screen bg-[#0d0e11] text-neutral-100 font-sans selection:bg-amber-500 selection:text-black">
      {/* Header */}
      <header className="border-b border-neutral-900/80 bg-[#0d0e11]/90 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-amber-500 font-black tracking-wider text-lg uppercase flex items-center gap-2">
              PRIME IMPORTS
            </h1>
            <p className="text-[11px] text-neutral-500 font-medium">Direto de Foz & PY • Enviamos para todo o Brasil</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-xs bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white px-3.5 py-1.5 rounded-lg transition"
            >
              + Painel admin
            </Link>
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 bg-neutral-900 border border-neutral-800 rounded-lg text-amber-500 hover:bg-neutral-800 transition"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-12 pb-8 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 px-3.5 py-1 rounded-full text-xs font-semibold mb-5 uppercase tracking-wide">
          <Sparkles className="w-3.5 h-3.5" />
          Produtos 100% Originais & Lacrados
        </div>

        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
          iPhones, Perfumaria Árabe e o melhor <br /> do K-Beauty
        </h2>

        <p className="text-neutral-400 text-xs sm:text-sm mt-3 max-w-lg">
          Faça sua seleção online e finalize direto com o Carlos no WhatsApp com frete calculado na hora.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-6 mt-6 text-xs text-neutral-400">
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-amber-500" /> Procedência Garantida</span>
          <span className="flex items-center gap-1.5"><Truck className="w-4 h-4 text-amber-500" /> Envio Seguro c/ Rastreio</span>
          <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-amber-500" /> Cotação Atualizada</span>
        </div>
      </section>

      {/* Categorias */}
      <section className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition ${
              selectedCategory === 'all'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : 'bg-[#15171c] text-neutral-400 border border-neutral-800 hover:border-neutral-700'
            }`}
          >
            Todos os Produtos
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === c.id
                  ? 'bg-amber-500 text-neutral-950 shadow-md'
                  : 'bg-[#15171c] text-neutral-400 border border-neutral-800 hover:border-neutral-700'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </section>

      {/* Grade de Produtos */}
      <main className="max-w-6xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              className="bg-[#15171c] border border-neutral-800/80 rounded-2xl p-4 flex flex-col justify-between hover:border-amber-500/40 transition group"
            >
              <div className="aspect-4/3 w-full bg-[#1b1e24] rounded-xl overflow-hidden mb-4 relative">
                <img
                  src={p.images?.[0] || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80'}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              </div>

              <div>
                <h3 className="font-bold text-white text-sm sm:text-base leading-snug">{p.name}</h3>
                {p.description && <p className="text-neutral-500 text-xs mt-1 line-clamp-2">{p.description}</p>}
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-800/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-neutral-500 block uppercase font-medium">À Vista / PIX</span>
                  <span className="text-base font-black text-amber-500">
                    R$ {Number(p.base_price).toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={() => addToCart(p)}
                  className="bg-[#21242c] hover:bg-amber-500 hover:text-black text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs"
                >
                  Adicionar
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Gaveta Sacola */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs">
          <div className="bg-[#13151a] border-l border-neutral-800 w-full max-w-md h-full flex flex-col justify-between p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div className="flex items-center gap-2 text-amber-500">
                <ShoppingBag className="w-5 h-5" />
                <h2 className="font-bold text-base text-white">Sacola ({totalItemsCount})</h2>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="text-neutral-500 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-neutral-500">
                  <p className="text-xs">Sua sacola está vazia.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="bg-[#1a1d24] border border-neutral-800 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">{item.name}</h4>
                      <p className="text-[11px] text-neutral-400 mt-0.5">{item.quantity}x R$ {item.price.toFixed(2)}</p>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-neutral-500 hover:text-red-400 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="pt-4 border-t border-neutral-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-400 font-bold uppercase">Total</span>
                  <span className="text-lg font-black text-amber-500">R$ {totalCart.toFixed(2)}</span>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full bg-[#00a884] hover:bg-[#008f6f] text-white font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition"
                >
                  <Send className="w-4 h-4" /> Enviar Pedido para o Carlos
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}