import React, { useState } from 'react';
import { ShoppingCart, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

interface CartItem {
  product: any;
  quantity: number;
  unitPrice: number;
}

export const Sales: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchCode, setSearchCode] = useState('');
  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) return;

    try {
      const prod = await window.api.products.getByCode(searchCode.trim());
      if (!prod) {
        setFeedback({ type: 'error', message: `No product found for '${searchCode}'` });
        return;
      }

      const existingIndex = cart.findIndex(item => item.product.id === prod.id);
      if (existingIndex > -1) {
        const updated = [...cart];
        if (updated[existingIndex].quantity + 1 > prod.stock_quantity) {
          setFeedback({ type: 'error', message: `Cannot exceed stock of ${prod.stock_quantity}` });
          return;
        }
        updated[existingIndex].quantity += 1;
        setCart(updated);
      } else {
        if (prod.stock_quantity < 1) {
          setFeedback({ type: 'error', message: 'Product is out of stock' });
          return;
        }
        setCart([...cart, { product: prod, quantity: 1, unitPrice: prod.selling_price }]);
      }
      setSearchCode('');
      setFeedback(null);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const updateQuantity = (index: number, quantity: number) => {
    const updated = [...cart];
    if (quantity > updated[index].product.stock_quantity) {
      setFeedback({ type: 'error', message: `Max available stock is ${updated[index].product.stock_quantity}` });
      return;
    }
    if (quantity <= 0) {
      removeItem(index);
      return;
    }
    updated[index].quantity = quantity;
    setCart(updated);
  };

  const removeItem = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const subtotal = cart.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      for (const item of cart) {
        await window.api.stock.change({
          productId: item.product.id,
          type: 'Stock Out',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          notes: notes ? `Sale: ${notes}` : 'Counter Sale'
        });
      }

      setFeedback({ type: 'success', message: 'Sale completed & inventory deducted successfully!' });
      setCart([]);
      setNotes('');
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to complete transaction' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Stock Out / Sales Counter</h1>
        <p className="text-sm text-slate-400">Process sales and deduct live stock instantly</p>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          feedback.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{feedback.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Barcode Quick Entry */}
          <form onSubmit={handleAddProduct} className="flex gap-2">
            <input
              type="text"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500"
              placeholder="Scan Barcode or Type Product Code and hit Enter..."
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              autoFocus
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </form>

          {/* Cart Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/70 text-slate-400 text-xs uppercase font-semibold">
                <tr>
                  <th className="p-3.5">Product</th>
                  <th className="p-3.5">Available</th>
                  <th className="p-3.5">Price</th>
                  <th className="p-3.5 w-24">Qty</th>
                  <th className="p-3.5">Total</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {cart.map((item, index) => (
                  <tr key={item.product.id}>
                    <td className="p-3.5">
                      <p className="font-semibold text-slate-100">{item.product.product_name}</p>
                      <p className="text-xs text-slate-500">{item.product.product_code}</p>
                    </td>
                    <td className="p-3.5 text-slate-400">{item.product.stock_quantity}</td>
                    <td className="p-3.5 font-medium">${item.unitPrice.toFixed(2)}</td>
                    <td className="p-3.5">
                      <input
                        type="number"
                        min="1"
                        max={item.product.stock_quantity}
                        value={item.quantity}
                        onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 0)}
                        className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-100 text-center"
                      />
                    </td>
                    <td className="p-3.5 font-bold text-emerald-400">${(item.quantity * item.unitPrice).toFixed(2)}</td>
                    <td className="p-3.5 text-right">
                      <button onClick={() => removeItem(index)} className="p-1 hover:bg-rose-500/20 text-rose-400 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {cart.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">Cart is empty. Scan barcodes to start sale.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Checkout Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between h-fit space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-indigo-400" /> Summary
            </h3>
            <div className="space-y-2 pt-2 border-t border-slate-800 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Total Items</span>
                <span>{cart.reduce((acc, i) => acc + i.quantity, 0)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-slate-100 pt-2 border-t border-slate-800">
                <span>Grand Total</span>
                <span className="text-emerald-400">${subtotal.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Sale Notes / Invoice Reference</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Optional customer reference or remarks..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100 outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition"
          >
            <CheckCircle2 className="w-5 h-5" /> Complete Sale & Deduct Stock
          </button>
        </div>
      </div>
    </div>
  );
};
