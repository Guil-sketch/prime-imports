/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Product, Category } from '../types';
import ProductCard from '../components/ProductCard';
import CartDrawer from '../components/CartDrawer';
import FloatingCartButton from '../components/FloatingCartButton';
import { Search, Sparkles, Smartphone, ShieldCheck, Zap, Lock } from 'lucide-react';
import Link from 'next/link';

export default function PrimeVitrine() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      // 1. Categorias
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (catData) setCategories(catData);

      // 2. Produtos Ativos
      const { data: prodData } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (prodData) setProducts(prodData as Product[]);
      setLoading(false);
    }

    loadData();
  }, []);

  // Filtros de Categoria e Busca
  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === 'all' || product.category_id === selectedCategory;
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0d0e11] text-neutral-100 pb-24 font-sans selection:bg-amber-500 selection:text-black">
      {/* Top Header com Botão do Admin no Topo */}
      <header className="bg-[#121318]/90 backdrop-blur-md border-b border-neutral-800/80 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-black font-black text-xl shadow-lg shadow-amber-500/20">
              P
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black tracking-wider text-base sm:text-lg uppercase text-white">
                  Prime Imports
                </h1>
                <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  OFICIAL
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 font-medium">
                Eletrônicos & Importados Originais
              </p>
            </div>
          </div>

          {/* Botão de Acesso ao Painel Admin no Topo */}
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 bg-[#1b1e24] hover:bg-amber-500 hover:text-black text-neutral-300 border border-neutral-800 px-3.5 py-2 rounded-xl text-xs font-semibold transition"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Painel Admin</span>
          </Link>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-2">
        <div className="relative overflow-hidden bg-gradient-to-r from-neutral-900 via-[#15171d] to-neutral-900 border border-neutral-800/80 rounded-3xl p-6 sm:p-10 shadow-2xl">
          <div className="max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Catálogo Oficial Exclusivo
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Os melhores produtos com garantia e procedência oficial.
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 mt-2">
              Faça sua seleção no catálogo e finalize o pedido diretamente pelo WhatsApp da Prime.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-neutral-800/60">
            <div className="flex items-center gap-2.5 text-xs text-neutral-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Lacrado e Original</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-neutral-300">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Pronta Entrega & Encomenda</span>
            </div>
            <div className="hidden sm:flex items-center gap-2.5 text-xs text-neutral-300">
              <Smartphone className="w-4 h-4 text-sky-400" />
              <span>Garantia de 1 Ano</span>
            </div>
          </div>
        </div>
      </section>

      {/* Barra de Busca e Categorias */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por iPhone, iPad, Xiaomi, Perfumes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#15171c] border border-neutral-800/80 pl-11 pr-4 py-3 rounded-2xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition shadow-inner"
          />
        </div>

        {/* Categorias */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              selectedCategory === 'all'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10'
                : 'bg-[#15171c] text-neutral-400 border border-neutral-800/80 hover:border-neutral-700 hover:text-white'
            }`}
          >
            Todos os Produtos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10'
                  : 'bg-[#15171c] text-neutral-400 border border-neutral-800/80 hover:border-neutral-700 hover:text-white'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grade de Produtos */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 py-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div
                key={n}
                className="bg-[#15171c] border border-neutral-800/60 rounded-2xl aspect-[3/4] animate-pulse"
              />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-[#15171c] rounded-3xl border border-neutral-800/80 mt-2">
            <p className="text-sm font-bold text-white">Nenhum produto encontrado</p>
            <p className="text-xs text-neutral-500 mt-1">
              Cadastre novos itens no painel administrativo para exibir aqui.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      {/* Rodapé */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-10 mt-12 border-t border-neutral-800/60 text-center">
        <p className="text-[11px] text-neutral-500">
          © {new Date().getFullYear()} Prime Imports. Todos os direitos reservados.
        </p>
      </footer>

      {/* Sacola Flutuante e Modal */}
      <FloatingCartButton onClick={() => setIsCartOpen(true)} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}