import React, { useState, useEffect, useRef } from 'react';
import { Search, Barcode, X, Package, DollarSign, MapPin, Tag } from 'lucide-react';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSearchTerm('');
      setResults([]);
      setSelectedProduct(null);
    }
  }, [isOpen]);

  // Fast debounced search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      // Direct barcode exact match first
      const exactMatch = await window.api.products.getByCode(searchTerm.trim());
      if (exactMatch) {
        setSelectedProduct(exactMatch);
      }

      const res = await window.api.products.getAll({ search: searchTerm, limit: 10 });
      setResults(res.data);
      if (res.data.length > 0 && !exactMatch) {
        setSelectedProduct(res.data[0]);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
        {/* Header & Barcode Ready Input */}
        <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex items-center gap-3">
          <Search className="w-6 h-6 text-indigo-400" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-lg text-slate-100 placeholder-slate-400 outline-none"
            placeholder="Scan barcode with scanner or type product name / code / brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
            }}
          />
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded border border-slate-600">
              <Barcode className="w-3.5 h-3.5" /> USB Scanner Ready
            </span>
            <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Results Body */}
        <div className="grid grid-cols-1 md:grid-cols-3 flex-1 overflow-hidden">
          {/* Result List */}
          <div className="md:col-span-1 border-r border-slate-800 overflow-y-auto max-h-[60vh] divide-y divide-slate-800/60">
            {results.map((prod) => (
              <div
                key={prod.id}
                onClick={() => setSelectedProduct(prod)}
                className={`p-3.5 cursor-pointer transition flex flex-col gap-1 ${
                  selectedProduct?.id === prod.id ? 'bg-indigo-600/20 border-l-4 border-indigo-500' : 'hover:bg-slate-800/40'
                }`}
              >
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-semibold text-slate-200 line-clamp-1">{prod.product_name}</h4>
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                    prod.stock_quantity <= 0 ? 'bg-rose-500/20 text-rose-400' :
                    prod.stock_quantity <= prod.minimum_stock ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {prod.stock_quantity}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{prod.product_code}</span>
                  <span className="font-semibold text-slate-300">${prod.selling_price.toFixed(2)}</span>
                </div>
              </div>
            ))}
            {results.length === 0 && searchTerm && (
              <p className="p-6 text-center text-sm text-slate-500">No matching products found.</p>
            )}
            {!searchTerm && (
              <p className="p-6 text-center text-sm text-slate-500">Start typing or scan a product barcode to view live details.</p>
            )}
          </div>

          {/* Detailed Item Overview for Customer Interaction */}
          <div className="md:col-span-2 p-6 overflow-y-auto max-h-[60vh] bg-slate-900/50">
            {selectedProduct ? (
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-semibold uppercase text-indigo-400 tracking-wider bg-indigo-500/10 px-2.5 py-1 rounded-md">
                      {selectedProduct.category || 'General'}
                    </span>
                    <h2 className="text-2xl font-bold text-slate-100 mt-2">{selectedProduct.product_name}</h2>
                    <p className="text-sm text-slate-400">Brand: {selectedProduct.brand || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 uppercase font-semibold">Retail Price</p>
                    <p className="text-3xl font-extrabold text-emerald-400">${selectedProduct.selling_price.toFixed(2)}</p>
                    <p className="text-xs text-slate-500">Cost: ${selectedProduct.purchase_price.toFixed(2)}</p>
                  </div>
                </div>

                {/* Badges Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
                    <p className="text-xs text-slate-400 flex items-center gap-1.5"><Package className="w-3.5 h-3.5" /> Stock Level</p>
                    <p className={`text-lg font-bold mt-1 ${
                      selectedProduct.stock_quantity <= 0 ? 'text-rose-400' :
                      selectedProduct.stock_quantity <= selectedProduct.minimum_stock ? 'text-amber-400' : 'text-slate-100'
                    }`}>
                      {selectedProduct.stock_quantity} Units
                    </p>
                  </div>

                  <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
                    <p className="text-xs text-slate-400 flex items-center gap-1.5"><Barcode className="w-3.5 h-3.5" /> Barcode</p>
                    <p className="text-sm font-mono font-medium text-slate-200 mt-1">{selectedProduct.barcode || 'N/A'}</p>
                  </div>

                  <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
                    <p className="text-xs text-slate-400 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Product Code</p>
                    <p className="text-sm font-mono font-medium text-slate-200 mt-1">{selectedProduct.product_code}</p>
                  </div>

                  <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
                    <p className="text-xs text-slate-400 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Location / Shelf</p>
                    <p className="text-sm font-medium text-slate-200 mt-1">{selectedProduct.location || 'Not Specified'}</p>
                  </div>

                  <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60 col-span-2">
                    <p className="text-xs text-slate-400">Supplier</p>
                    <p className="text-sm font-medium text-slate-200 mt-1">{selectedProduct.supplier || 'N/A'}</p>
                  </div>
                </div>

                {selectedProduct.description && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-slate-400 mb-1">Product Description</h4>
                    <p className="text-sm text-slate-300 bg-slate-800/30 p-3 rounded border border-slate-800">{selectedProduct.description}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12">
                <Package className="w-12 h-12 stroke-1 mb-2 opacity-60" />
                <p>Select a product to view immediate inventory specifications</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
