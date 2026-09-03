import React, { useState } from 'react';
import { FileText, Download, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const Reports: React.FC = () => {
  const [reportType, setReportType] = useState('inventory');
  const [loading, setLoading] = useState(false);

  const exportCSV = async () => {
    setLoading(true);
    try {
      const res = await window.api.products.getAll({ limit: 10000 });
      const items = res.data;

      const headers = ['ID,Product Name,Code,Barcode,Category,Purchase Price,Selling Price,Stock,Min Stock\n'];
      const rows = items.map(p => 
        `"${p.id}","${p.product_name}","${p.product_code}","${p.barcode || ''}","${p.category || ''}",${p.purchase_price},${p.selling_price},${p.stock_quantity},${p.minimum_stock}`
      );

      const blob = new Blob([headers.concat(rows.join('\n')).join('')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Shop_Inventory_Report_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    setLoading(true);
    try {
      const res = await window.api.products.getAll({ limit: 10000 });
      const items = res.data;

      const doc = new jsPDF();
      doc.text('My Shop Inventory Manager - Stock Valuation Report', 14, 15);
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

      const tableData = items.map(p => [
        p.product_code,
        p.product_name,
        p.category,
        `$${p.selling_price.toFixed(2)}`,
        p.stock_quantity.toString(),
        p.stock_quantity <= p.minimum_stock ? 'LOW' : 'OK'
      ]);

      autoTable(doc, {
        head: [['Code', 'Name', 'Category', 'Price', 'Stock', 'Status']],
        body: tableData,
        startY: 28,
        theme: 'striped'
      });

      doc.save(`Shop_Inventory_${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Reports & Audit Center</h1>
        <p className="text-sm text-slate-400">Generate, print, and export complete store reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col justify-between">
          <div>
            <FileText className="w-8 h-8 text-indigo-400 mb-3" />
            <h3 className="text-lg font-semibold text-slate-100">Full Inventory & Valuation</h3>
            <p className="text-sm text-slate-400 mt-1">Export full product catalog with current stock levels, buying cost, and retail valuations.</p>
          </div>
          <div className="flex gap-2 mt-6">
            <button
              onClick={exportCSV}
              disabled={loading}
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 border border-slate-700"
            >
              <Download className="w-4 h-4" /> CSV / Excel
            </button>
            <button
              onClick={exportPDF}
              disabled={loading}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1.5"
            >
              <Printer className="w-4 h-4" /> PDF Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
