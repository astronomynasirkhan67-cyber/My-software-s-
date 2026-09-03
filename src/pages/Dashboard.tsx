import React, { useEffect, useState } from 'react';
import { Package, AlertTriangle, XCircle, DollarSign, ArrowUpRight, ArrowDownLeft, RefreshCcw } from 'lucide-react';
import { format } from 'date-fns';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const data = await window.api.dashboard.getStats();
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading || !stats) {
    return <div className="p-8 text-gray-400">Loading shop performance metrics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Shop Overview</h1>
          <p className="text-sm text-slate-400">Real-time local inventory levels and valuation</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-sm transition"
        >
          <RefreshCcw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Total Products</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">{stats.totalProducts}</h3>
              <p className="text-xs text-slate-500 mt-1">{stats.totalStock} total units in shop</p>
            </div>
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Package className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-400 tracking-wider uppercase">Low Stock Alert</p>
              <h3 className="text-2xl font-bold text-amber-400 mt-1">{stats.lowStock}</h3>
              <p className="text-xs text-slate-500 mt-1">Items at or below threshold</p>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-rose-400 tracking-wider uppercase">Out of Stock</p>
              <h3 className="text-2xl font-bold text-rose-400 mt-1">{stats.outOfStock}</h3>
              <p className="text-xs text-slate-500 mt-1">Requires immediate restocking</p>
            </div>
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-lg">
              <XCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-400 tracking-wider uppercase">Inventory Value</p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1">${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
              <p className="text-xs text-slate-500 mt-1">At current retail prices</p>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-slate-200 mb-4">Stock by Category</h2>
          <div className="space-y-3">
            {stats.categoryBreakdown.map((cat: any) => (
              <div key={cat.category} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300 font-medium">{cat.category}</span>
                  <span className="text-slate-400">{cat.total_stock} units ({cat.count} items)</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-2 rounded-full"
                    style={{ width: `${Math.min(100, (cat.total_stock / (stats.totalStock || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
            {stats.categoryBreakdown.length === 0 && (
              <p className="text-sm text-slate-500">No categories found.</p>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-slate-200 mb-4">Recent Stock Movements</h2>
          <div className="divide-y divide-slate-800">
            {stats.recentTx.map((tx: any) => (
              <div key={tx.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    tx.transaction_type === 'Stock In' ? 'bg-emerald-500/10 text-emerald-400' :
                    tx.transaction_type === 'Stock Out' ? 'bg-rose-500/10 text-rose-400' :
                    'bg-amber-500/10 text-amber-400'
                  }`}>
                    {tx.transaction_type === 'Stock In' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{tx.product_name}</p>
                    <p className="text-xs text-slate-500">{tx.product_code} • {tx.notes || tx.transaction_type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${tx.transaction_type === 'Stock In' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {tx.transaction_type === 'Stock In' ? '+' : '-'}{tx.quantity}
                  </p>
                  <p className="text-xs text-slate-500">{format(new Date(tx.date), 'MMM dd, HH:mm')}</p>
                </div>
              </div>
            ))}
            {stats.recentTx.length === 0 && (
              <p className="text-sm text-slate-500 py-2">No transactions recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
