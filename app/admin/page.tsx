/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Product, Category, Order } from '../../types';
import { ArrowLeft, PlusCircle, Package, DollarSign, Trash2, Download, RefreshCw, Tag } from 'lucide-react';
import Link from 'next/link';

export default function AdminPrime() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'sales'>('catalog');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dollarRate, setDollarRate] = useState<number>(5.60);
  const [reload, setReload] = useState(0);

  // Estados Formulário de Categoria
  const [newCatName, setNewCatName] = useState('');

  // Estados Formulário de Produto
  const [name, setName] = useState('');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [priceBrl, setPriceBrl] = useState('');
  const [costUsd, setCostUsd] = useState('');
  const [description, setDescription] = useState('');
  const [isPreorder, setIsPreorder] = useState(false);
  const [inStock, setInStock] = useState(true);

  useEffect(() => {
    async function fetchData() {
      // 1. Cotação do Dólar PY
      const { data: config } = await supabase
        .from('store_settings')
        .select('dollar_rate')
        .eq('id', 'config')
        .single();
      if (config) setDollarRate(Number(config.dollar_rate));

      // 2. Categorias
      const { data: cats, error: catError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (!catError && cats && cats.length > 0) {
        setCategories(cats);
        setSelectedCategorySlug((prev) => (prev ? prev : cats[0].slug));
      }

      // 3. Produtos
      const { data: prods } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (prods) setProducts(prods as Product[]);

      // 4. Pedidos Recebidos
      const { data: ords } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (ords) setOrders(ords as Order[]);
    }
    fetchData();
  }, [reload]);

  const handleUpdateDollar = async (newRate: number) => {
    setDollarRate(newRate);
    await supabase.from('store_settings').update({ dollar_rate: newRate }).eq('id', 'config');
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const slug = newCatName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const { error } = await supabase.from('categories').insert([{ name: newCatName.trim(), slug }]);

    if (!error) {
      setNewCatName('');
      setReload((p) => p + 1);
      alert('Categoria criada com sucesso!');
    } else {
      console.error('Erro ao criar categoria:', error);
      alert(`Erro: ${error.message || 'Categoria já existente ou erro de conexão.'}`);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !priceBrl) {
      alert('Preencha os campos obrigatórios (Nome e Preço).');
      return;
    }

    const matchedCat = categories.find((c) => c.slug === selectedCategorySlug);
    const categoryIdToSave = matchedCat ? matchedCat.id : (categories[0]?.id || null);

    const { error: insertError } = await supabase.from('products').insert([
      {
        name: name.trim(),
        slug: `${name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
        category_id: categoryIdToSave,
        images: imageUrl.trim() ? [imageUrl.trim()] : ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80'],
        base_price: parseFloat(priceBrl),
        cost_usd: costUsd ? parseFloat(costUsd) : 0,
        description: description.trim() || null,
        is_preorder: isPreorder,
        in_stock: inStock,
        is_active: true,
      },
    ]);

    if (insertError) {
      console.error('Erro ao inserir produto:', insertError);
      alert(`Erro ao cadastrar produto: ${insertError.message}`);
      return;
    }

    setName('');
    setImageUrl('');
    setPriceBrl('');
    setCostUsd('');
    setDescription('');
    setReload((p) => p + 1);
    alert('Produto cadastrado com sucesso!');
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este item?')) {
      await supabase.from('products').delete().eq('id', id);
      setReload((p) => p + 1);
    }
  };

  // Métricas do Relatório de Vendas
  const totalRevenue = orders.reduce((acc, o) => acc + Number(o.total_amount || 0), 0);
  const totalCost = orders.reduce((acc, o) => acc + Number(o.estimated_cost_brl || 0), 0);
  const netProfit = totalRevenue - totalCost;
  const marginPercent = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';
  const averageTicket = orders.length > 0 ? (totalRevenue / orders.length).toFixed(2) : '0.00';

  const exportCSV = () => {
    let csv = 'ID;Data;Cliente;Itens;Total (R$);Custo Estimado (R$);Status\n';
    orders.forEach((o) => {
      const itemsList = o.items ? o.items.map((i) => `${i.quantity}x ${i.name}`).join(' | ') : '';
      csv += `${o.id};${new Date(o.created_at).toLocaleString('pt-BR')};${o.customer_name};"${itemsList}";${o.total_amount};${o.estimated_cost_brl};${o.status}\n`;
    });

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-vendas-prime-${Date.now()}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#0d0e11] text-neutral-200 px-6 py-6 font-sans">
      {/* Topo Admin */}
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <Link href="/" className="inline-flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" /> Voltar para a Vitrine
        </Link>

        <div className="flex items-center gap-2 bg-[#15171c] border border-neutral-800 px-3.5 py-1.5 rounded-xl">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span className="text-xs text-neutral-400 font-semibold">Cotação Dólar PY (R$):</span>
          <input
            type="number"
            step="0.01"
            value={dollarRate}
            onChange={(e) => handleUpdateDollar(parseFloat(e.target.value))}
            className="w-16 bg-[#1f222a] border border-neutral-700 text-amber-500 font-bold text-xs p-1 rounded text-center focus:outline-none"
          />
        </div>
      </div>

      {/* Navegação entre Abas */}
      <div className="max-w-6xl mx-auto flex items-center gap-3 pt-6 pb-6">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'catalog'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10'
              : 'bg-[#15171c] text-neutral-400 border border-neutral-800 hover:border-neutral-700'
          }`}
        >
          <Package className="w-4 h-4" /> Gestão de Catálogo
        </button>

        <button
          onClick={() => setActiveTab('sales')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'sales'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10'
              : 'bg-[#15171c] text-neutral-400 border border-neutral-800 hover:border-neutral-700'
          }`}
        >
          <DollarSign className="w-4 h-4" /> Relatório de Vendas ({orders.length})
        </button>
      </div>

      <div className="max-w-6xl mx-auto">
        {activeTab === 'catalog' ? (
          <div className="space-y-6">
            {/* Bloco Criar Nova Categoria */}
            <div className="bg-[#15171c] border border-neutral-800/80 rounded-2xl p-6">
              <h2 className="text-base font-bold text-white flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-amber-500" /> Criar Nova Categoria
              </h2>
              <form onSubmit={handleCreateCategory} className="flex gap-3">
                <input
                  type="text"
                  placeholder="Ex: iPhones & Eletrônicos, Perfumaria Árabe, Acessórios..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 bg-[#1b1e24] border border-neutral-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs px-5 py-3 rounded-xl transition uppercase tracking-wide"
                >
                  Criar Categoria
                </button>
              </form>
            </div>

            {/* Bloco Cadastrar Produto */}
            <div className="bg-[#15171c] border border-neutral-800/80 rounded-2xl p-6">
              <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                <PlusCircle className="w-5 h-5 text-amber-500" /> Cadastrar Novo Produto
              </h2>

              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 uppercase mb-1">Nome do Produto *</label>
                  <input
                    type="text"
                    placeholder="Ex: iPhone 15 Pro Max 256GB Titânio Natural"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#1b1e24] border border-neutral-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-400 uppercase mb-1">Categoria *</label>
                    <select
                      value={selectedCategorySlug}
                      onChange={(e) => setSelectedCategorySlug(e.target.value)}
                      className="w-full bg-[#1b1e24] border border-neutral-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      {categories.length === 0 ? (
                        <option value="">Nenhuma categoria cadastrada acima</option>
                      ) : (
                        categories.map((c) => (
                          <option key={c.id} value={c.slug}>{c.name}</option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-400 uppercase mb-1">Link da Foto (URL)</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full bg-[#1b1e24] border border-neutral-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-400 uppercase mb-1">Preço de Venda ao Cliente (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 6499.00"
                      value={priceBrl}
                      onChange={(e) => setPriceBrl(e.target.value)}
                      className="w-full bg-[#1b1e24] border border-neutral-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-400 uppercase mb-1">Custo de Compra no PY (USD $)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 950.00"
                      value={costUsd}
                      onChange={(e) => setCostUsd(e.target.value)}
                      className="w-full bg-[#1b1e24] border border-neutral-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 uppercase mb-1">Descrição & Detalhes do Produto (Opcional)</label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Lacrado na caixa, garantia Apple de 1 ano mundial..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-[#1b1e24] border border-neutral-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center gap-6 pt-1">
                  <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPreorder}
                      onChange={(e) => setIsPreorder(e.target.checked)}
                      className="rounded border-neutral-700"
                    />
                    Item sob encomenda
                  </label>

                  <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inStock}
                      onChange={(e) => setInStock(e.target.checked)}
                      className="rounded border-neutral-700"
                    />
                    Disponível em estoque
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black text-xs py-3.5 rounded-xl transition uppercase tracking-wider"
                >
                  Publicar Produto
                </button>
              </form>
            </div>

            {/* Listagem do Catálogo Atual */}
            <div className="bg-[#15171c] border border-neutral-800/80 rounded-2xl p-6">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                <h3 className="text-sm font-bold text-white">Catálogo Atual ({products.length})</h3>
                <button onClick={() => setReload((p) => p + 1)} className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition">
                  <RefreshCw className="w-3.5 h-3.5" /> Atualizar Lista
                </button>
              </div>

              <div className="divide-y divide-neutral-800/60 mt-2">
                {products.length === 0 ? (
                  <p className="text-xs text-neutral-500 py-4">Nenhum produto cadastrado.</p>
                ) : (
                  products.map((p) => {
                    const categoryObj = categories.find((c) => c.id === p.category_id);
                    return (
                      <div key={p.id} className="py-3.5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <img
                            src={p.images?.[0] || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=100&auto=format&fit=crop&q=60'}
                            alt={p.name}
                            className="w-12 h-12 rounded-xl object-cover bg-[#1b1e24]"
                          />
                          <div>
                            <h4 className="text-xs font-bold text-white">{p.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-black text-amber-500">R$ {Number(p.base_price).toFixed(2)}</span>
                              {p.cost_usd ? (
                                <span className="text-[10px] text-neutral-500">(Custo: ${p.cost_usd})</span>
                              ) : null}
                              <span className="text-[10px] bg-[#21242c] text-neutral-400 px-2 py-0.5 rounded font-mono">
                                {categoryObj ? categoryObj.name : 'sem-categoria'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Excluir
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Aba de Relatório de Vendas */
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#15171c] border border-neutral-800 p-5 rounded-2xl">
                <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Faturamento Total</span>
                <p className="text-2xl font-black text-amber-500 mt-1">R$ {totalRevenue.toFixed(2)}</p>
                <span className="text-[10px] text-neutral-500 mt-1 block">{orders.length} pedido(s) ativos</span>
              </div>

              <div className="bg-[#15171c] border border-neutral-800 p-5 rounded-2xl">
                <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Custo Estimado (PY)</span>
                <p className="text-2xl font-black text-white mt-1">R$ {totalCost.toFixed(2)}</p>
                <span className="text-[10px] text-neutral-500 mt-1 block">Cotação R$ {dollarRate.toFixed(2)}</span>
              </div>

              <div className="bg-[#15171c] border border-neutral-800 p-5 rounded-2xl">
                <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Lucro Líquido Est.</span>
                <p className="text-2xl font-black text-emerald-400 mt-1">R$ {netProfit.toFixed(2)}</p>
                <span className="text-[10px] text-neutral-500 mt-1 block">{marginPercent}% de margem geral</span>
              </div>

              <div className="bg-[#15171c] border border-neutral-800 p-5 rounded-2xl">
                <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Ticket Médio</span>
                <p className="text-2xl font-black text-amber-500 mt-1">R$ {averageTicket}</p>
                <span className="text-[10px] text-neutral-500 mt-1 block">Média por cliente</span>
              </div>
            </div>

            <div className="bg-[#15171c] border border-neutral-800 rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
                <div>
                  <h3 className="text-base font-bold text-white">Histórico de Pedidos Recebidos</h3>
                  <p className="text-xs text-neutral-500">Pedidos originados na sacola da vitrine para o WhatsApp.</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={exportCSV}
                    className="bg-[#00a884] hover:bg-[#008f6f] text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2 transition"
                  >
                    <Download className="w-4 h-4" /> Baixar Planilha Excel (.CSV)
                  </button>
                  <button onClick={() => setReload((p) => p + 1)} className="p-2 bg-[#21242c] text-neutral-400 hover:text-white rounded-xl transition">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="divide-y divide-neutral-800/60 mt-4">
                {orders.length === 0 ? (
                  <p className="text-xs text-neutral-500 py-4">Nenhum pedido registrado ainda.</p>
                ) : (
                  orders.map((ord) => (
                    <div key={ord.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-mono text-amber-500">#{ord.id.slice(0, 8)}</span>
                        <span className="text-[11px] text-neutral-500 ml-2">{new Date(ord.created_at).toLocaleString('pt-BR')}</span>
                        <div className="mt-1 space-y-0.5">
                          {ord.items?.map((item, idx) => (
                            <p key={idx} className="text-xs text-neutral-300">
                              • {item.quantity}x {item.name} <span className="text-neutral-500">(R$ {Number(item.price).toFixed(2)})</span>
                            </p>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-[10px] text-neutral-500 uppercase block font-bold">Total</span>
                          <span className="text-sm font-black text-amber-500">R$ {Number(ord.total_amount).toFixed(2)}</span>
                        </div>

                        <span className="bg-amber-500/10 border border-amber-500/20 text-amber-500 px-3 py-1 rounded-lg text-xs font-semibold">
                          ⏳ {ord.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}