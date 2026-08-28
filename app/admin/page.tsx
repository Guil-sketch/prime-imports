/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Product, Category, Order } from '../../types';
import {
  Plus,
  Trash2,
  Package,
  Tag,
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Download,
  RefreshCw,
  Lock
} from 'lucide-react';
import Link from 'next/link';

interface VariantInput {
  size: string;
  stock: number;
  price_override?: string;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'reports'>('catalog');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dollarRate, setDollarRate] = useState<number>(5.60);
  const [loading, setLoading] = useState(true);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Estados do Formulário de Produto
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [costUsd, setCostUsd] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [allowsCustomName, setAllowsCustomName] = useState(false);
  const [variants, setVariants] = useState<VariantInput[]>([
    { size: 'Padrão', stock: 10 },
  ]);

  // Estado para Nova Categoria
  const [newCatName, setNewCatName] = useState('');

  // 1. Carregamento de Dados do Supabase
  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // Cotação do Dólar
      const { data: config } = await supabase
        .from('store_settings')
        .select('dollar_rate')
        .eq('id', 'config')
        .single();
      if (config) setDollarRate(Number(config.dollar_rate));

      // Categorias
      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (cats) setCategories(cats);

      // Produtos (busca direta e estável)
      const { data: prods, error: prodErr } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (prodErr) {
        console.error('Erro ao carregar produtos:', prodErr);
      } else if (prods) {
        setProducts(prods as Product[]);
      }

      // Pedidos
      const { data: ords } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (ords) setOrders(ords as Order[]);

      setLoading(false);
    }

    fetchData();
  }, [reloadTrigger]);

  // Atualizar Dólar no Supabase
  const handleUpdateDollar = async (newRate: number) => {
    setDollarRate(newRate);
    await supabase.from('store_settings').upsert({ id: 'config', dollar_rate: newRate });
  };

  // Cálculos em Tempo Real de Margem do Produto
  const priceNum = parseFloat(basePrice) || 0;
  const costNum = parseFloat(costUsd) || 0;
  const costBrl = costNum * dollarRate;
  const profitBrl = priceNum > 0 ? priceNum - costBrl : 0;
  const marginPct = priceNum > 0 ? (profitBrl / priceNum) * 100 : 0;

  // Criar Categoria
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const slug = `${newCatName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    const { error } = await supabase.from('categories').insert([{ name: newCatName, slug }]);

    if (!error) {
      setNewCatName('');
      setReloadTrigger((prev) => prev + 1);
    }
  };

  // Cadastrar Produto
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !basePrice) {
      alert('Preencha os campos obrigatórios.');
      return;
    }

    const slug = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

    const { data: prodData, error: prodError } = await supabase
      .from('products')
      .insert([
        {
          name,
          slug,
          description,
          base_price: parseFloat(basePrice),
          cost_usd: costUsd ? parseFloat(costUsd) : 0,
          category_id: categoryId || null,
          images: imageUrl ? [imageUrl] : [],
          allows_custom_name: allowsCustomName,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (prodError || !prodData) {
      alert(`Erro ao criar produto: ${prodError?.message}`);
      return;
    }

    if (variants.length > 0) {
      const variantsToInsert = variants.map((v) => ({
        product_id: prodData.id,
        size: v.size.toUpperCase(),
        stock: Number(v.stock),
        price_override: v.price_override ? parseFloat(v.price_override) : null,
      }));

      await supabase.from('product_variants').insert(variantsToInsert);
    }

    setName('');
    setDescription('');
    setBasePrice('');
    setCostUsd('');
    setImageUrl('');
    setReloadTrigger((prev) => prev + 1);
    alert('Produto cadastrado com sucesso!');
  };

  // Excluir Produto
  const handleDeleteProduct = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este item?')) {
      await supabase.from('products').delete().eq('id', id);
      setReloadTrigger((prev) => prev + 1);
    }
  };

  // Exportar Relatório para CSV
  const handleExportCSV = () => {
    if (orders.length === 0) {
      alert('Nenhum pedido para exportar.');
      return;
    }

    const headers = ['ID', 'Data', 'Cliente', 'Itens', 'Total (R$)', 'Status'];
    const rows = orders.map((o) => [
      o.id,
      new Date(o.created_at).toLocaleString('pt-BR'),
      `"${o.customer_name}"`,
      `"${o.items?.map((i) => `${i.quantity}x ${i.name}`).join('; ') || ''}"`,
      o.total_amount?.toFixed(2),
      o.status,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_vendas_prime_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Métricas do Relatório
  const totalRevenue = orders.reduce((acc, o) => acc + Number(o.total_amount || 0), 0);
  const averageTicket = orders.length > 0 ? totalRevenue / orders.length : 0;

  return (
    <div className="min-h-screen bg-[#0d0e11] text-neutral-100 pb-16 font-sans">
      {/* Header Superior */}
      <header className="bg-[#121318] border-b border-neutral-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 bg-[#1b1e24] hover:bg-neutral-800 rounded-xl text-neutral-400 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-black text-lg text-white tracking-wide uppercase">
              Painel Prime Imports
            </h1>
            <p className="text-xs text-neutral-500">Gestão & Inteligência Financeira</p>
          </div>
        </div>

        {/* Cotação do Dólar Editável */}
        <div className="flex items-center gap-2 bg-[#1b1e24] border border-neutral-800 px-3 py-1.5 rounded-xl">
          <span className="text-xs text-emerald-400 font-bold">$ Cotação Dólar PY (R$):</span>
          <input
            type="number"
            step="0.01"
            value={dollarRate}
            onChange={(e) => handleUpdateDollar(parseFloat(e.target.value) || 0)}
            className="w-16 bg-[#15171c] text-amber-400 font-bold font-mono text-center border border-neutral-700 rounded-lg p-1 text-xs focus:outline-none focus:border-amber-500"
          />
        </div>
      </header>

      {/* Navegação entre Abas */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 flex gap-3">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'catalog'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10'
              : 'bg-[#15171c] text-neutral-400 hover:text-white border border-neutral-800'
          }`}
        >
          <Package className="w-4 h-4" /> Gestão de Catálogo ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'reports'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10'
              : 'bg-[#15171c] text-neutral-400 hover:text-white border border-neutral-800'
          }`}
        >
          <DollarSign className="w-4 h-4" /> Relatório de Vendas ({orders.length})
        </button>
      </div>

      {activeTab === 'catalog' ? (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulários de Cadastro */}
          <div className="space-y-6">
            {/* Categoria */}
            <div className="bg-[#15171c] p-5 rounded-2xl border border-neutral-800 shadow-xl">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-amber-500" /> Nova Categoria
              </h2>
              <form onSubmit={handleCreateCategory} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: iPhones, Perfumes, Xiaomi..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 text-xs p-2.5 rounded-xl border border-neutral-800 bg-[#1b1e24] text-white focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="bg-amber-500 text-black font-bold text-xs px-4 py-2 rounded-xl hover:bg-amber-400 transition"
                >
                  Criar
                </button>
              </form>
            </div>

            {/* Cadastro de Produto com Cálculo de Margem */}
            <div className="bg-[#15171c] p-5 rounded-2xl border border-neutral-800 shadow-xl">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
                <Plus className="w-4 h-4 text-amber-500" /> Cadastrar Novo Produto
              </h2>
              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: iPhone 15 Pro Max 256GB"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-neutral-800 bg-[#1b1e24] text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">
                      Categoria *
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-neutral-800 bg-[#1b1e24] text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="">Sem categoria</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">
                      Link da Foto (URL)
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-neutral-800 bg-[#1b1e24] text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Bloco de Precificação e Dólar */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">
                      Preço de Venda ao Cliente (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="1500.00"
                      value={basePrice}
                      onChange={(e) => setBasePrice(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-neutral-800 bg-[#1b1e24] text-white focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">
                      Custo de Compra no PY (USD $)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="50"
                      value={costUsd}
                      onChange={(e) => setCostUsd(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-neutral-800 bg-[#1b1e24] text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Dashboard do Cálculo em Tempo Real */}
                <div className="bg-[#101216] border border-neutral-800/80 rounded-2xl p-3 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-neutral-500 block">
                      Custo Convertido
                    </span>
                    <span className="text-xs font-bold text-white">
                      R$ {costBrl.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-neutral-500 block">
                      Lucro Líquido Est.
                    </span>
                    <span className="text-xs font-bold text-emerald-400">
                      R$ {profitBrl.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-neutral-500 block">
                      Margem de Lucro
                    </span>
                    <span className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-0.5">
                      <TrendingUp className="w-3 h-3" /> {marginPct.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">
                    Descrição & Detalhes do Produto (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Memória, cor, acessórios inclusos..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-neutral-800 bg-[#1b1e24] text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10"
                >
                  <CheckCircle2 className="w-4 h-4" /> Salvar Produto
                </button>
              </form>
            </div>
          </div>

          {/* Listagem de Itens Cadastrados */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#15171c] p-5 rounded-2xl border border-neutral-800 shadow-xl">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
                Itens no Catálogo ({products.length})
              </h2>

              {loading ? (
                <p className="text-xs text-neutral-500">Carregando catálogo...</p>
              ) : products.length === 0 ? (
                <p className="text-xs text-neutral-500">Nenhum item cadastrado ainda.</p>
              ) : (
                <div className="divide-y divide-neutral-800">
                  {products.map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.images?.[0] || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=100&auto=format&fit=crop&q=60'}
                          alt={item.name}
                          className="w-12 h-12 rounded-xl object-cover bg-neutral-800"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-white">{item.name}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-bold text-amber-500">
                              R$ {Number(item.base_price).toFixed(2)}
                            </span>
                            {item.cost_usd ? (
                              <span className="text-[10px] text-neutral-500">
                                (Custo: ${item.cost_usd} = R${(item.cost_usd * dollarRate).toFixed(2)})
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteProduct(item.id)}
                        className="p-2 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Aba de Relatório de Vendas */
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Métricas Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#15171c] border border-neutral-800 p-5 rounded-2xl">
              <span className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">
                Faturamento Total
              </span>
              <span className="text-xl font-black text-amber-500">
                R$ {totalRevenue.toFixed(2)}
              </span>
              <span className="text-[11px] text-neutral-500 block mt-1">
                {orders.length} pedido(s) registrado(s)
              </span>
            </div>

            <div className="bg-[#15171c] border border-neutral-800 p-5 rounded-2xl">
              <span className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">
                Custo Estimado (PY)
              </span>
              <span className="text-xl font-black text-white">
                R$ {(totalRevenue * 0.4).toFixed(2)}
              </span>
              <span className="text-[11px] text-neutral-500 block mt-1">
                Cotação R$ {dollarRate.toFixed(2)}
              </span>
            </div>

            <div className="bg-[#15171c] border border-neutral-800 p-5 rounded-2xl">
              <span className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">
                Lucro Líquido Est.
              </span>
              <span className="text-xl font-black text-emerald-400">
                R$ {(totalRevenue * 0.6).toFixed(2)}
              </span>
              <span className="text-[11px] text-emerald-500/80 block mt-1">
                ~60% de margem média
              </span>
            </div>

            <div className="bg-[#15171c] border border-neutral-800 p-5 rounded-2xl">
              <span className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">
                Ticket Médio
              </span>
              <span className="text-xl font-black text-amber-500">
                R$ {averageTicket.toFixed(2)}
              </span>
              <span className="text-[11px] text-neutral-500 block mt-1">
                Média por cliente
              </span>
            </div>
          </div>

          {/* Histórico e Exportação */}
          <div className="bg-[#15171c] border border-neutral-800 p-5 rounded-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-white text-sm">Histórico de Pedidos Recebidos</h3>
                <p className="text-xs text-neutral-500">
                  Pedidos originados na sacola da vitrine para o WhatsApp.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  className="bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" /> Baixar Planilha Excel (.CSV)
                </button>
                <button
                  onClick={() => setReloadTrigger((prev) => prev + 1)}
                  className="p-2 bg-[#1b1e24] hover:bg-neutral-800 text-neutral-400 rounded-xl border border-neutral-800 transition"
                  title="Atualizar Pedidos"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="py-12 text-center text-neutral-500 text-xs">
                Nenhum pedido registrado ainda.
              </div>
            ) : (
              <div className="divide-y divide-neutral-800">
                {orders.map((ord) => (
                  <div key={ord.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{ord.customer_name}</span>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          {ord.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-1">
                        {ord.items?.map((it) => `${it.quantity}x ${it.name} (${it.size})`).join(' • ')}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-amber-500 text-sm block">
                        R$ {Number(ord.total_amount).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-neutral-500">
                        {new Date(ord.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}