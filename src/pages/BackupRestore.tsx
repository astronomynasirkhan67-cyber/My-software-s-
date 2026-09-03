import React, { useState } from 'react';
import { Database, FolderUp, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

export const BackupRestore: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleCreateBackup = async () => {
    setLoading(true);
    try {
      const folder = await window.api.backup.selectFolder();
      if (!folder) {
        setLoading(false);
        return;
      }
      const file = await window.api.backup.create(folder);
      setStatus({ type: 'success', message: `Backup created successfully at: ${file}` });
    } catch (e: any) {
      setStatus({ type: 'error', message: e.message || 'Failed to create backup' });
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!window.confirm('CRITICAL: Restoring a backup replaces your current shop database and product images. Are you absolutely sure?')) {
      return;
    }

    setLoading(true);
    try {
      const file = await window.api.backup.selectFile();
      if (!file) {
        setLoading(false);
        return;
      }
      await window.api.backup.restore(file);
      setStatus({ type: 'success', message: 'Shop database restored successfully! Please restart the app.' });
    } catch (e: any) {
      setStatus({ type: 'error', message: e.message || 'Failed to restore backup' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Backup & Restore</h1>
        <p className="text-sm text-slate-400">Safeguard your local shop data and image files</p>
      </div>

      {status && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          status.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
        }`}>
          {status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span className="text-sm font-medium">{status.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg w-fit mb-3">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Create Full Offline Backup</h3>
            <p className="text-sm text-slate-400 mt-1">
              Archives all SQLite tables, transaction histories, configuration, and stored product photos into a standalone ZIP file.
            </p>
          </div>
          <button
            onClick={handleCreateBackup}
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition"
          >
            <FolderUp className="w-5 h-5" /> Choose Folder & Backup
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg w-fit mb-3">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Restore Shop Backup</h3>
            <p className="text-sm text-slate-400 mt-1">
              Select an existing `.zip` backup archive to restore your entire shop database and image catalog.
            </p>
          </div>
          <button
            onClick={handleRestoreBackup}
            disabled={loading}
            className="w-full py-3 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition"
          >
            <RefreshCw className="w-5 h-5" /> Select Backup ZIP & Restore
          </button>
        </div>
      </div>
    </div>
  );
};
