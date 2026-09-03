import { contextBridge, ipcRenderer } from 'electron';

export const api = {
  auth: {
    isSetup: () => ipcRenderer.invoke('auth:isSetup'),
    setup: (data: any) => ipcRenderer.invoke('auth:setup', data),
    login: (creds: any) => ipcRenderer.invoke('auth:login', creds),
    changePassword: (data: any) => ipcRenderer.invoke('auth:changePassword', data)
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (data: any) => ipcRenderer.invoke('settings:update', data)
  },
  products: {
    getAll: (opts?: any) => ipcRenderer.invoke('products:getAll', opts),
    getById: (id: number) => ipcRenderer.invoke('products:getById', id),
    getByCode: (code: string) => ipcRenderer.invoke('products:getByCode', code),
    create: (data: any) => ipcRenderer.invoke('products:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('products:update', { id, data }),
    delete: (id: number) => ipcRenderer.invoke('products:delete', id)
  },
  stock: {
    change: (data: any) => ipcRenderer.invoke('stock:change', data),
    getTransactions: (opts?: any) => ipcRenderer.invoke('stock:getTransactions', opts)
  },
  image: {
    save: (base64: string, filename: string) => ipcRenderer.invoke('image:save', { base64, filename }),
    getUri: (filename: string) => ipcRenderer.invoke('image:getUri', filename)
  },
  categories: {
    getAll: () => ipcRenderer.invoke('categories:getAll'),
    create: (name: string) => ipcRenderer.invoke('categories:create', name),
    delete: (id: number) => ipcRenderer.invoke('categories:delete', id)
  },
  suppliers: {
    getAll: () => ipcRenderer.invoke('suppliers:getAll'),
    create: (data: any) => ipcRenderer.invoke('suppliers:create', data),
    delete: (id: number) => ipcRenderer.invoke('suppliers:delete', id)
  },
  dashboard: {
    getStats: () => ipcRenderer.invoke('dashboard:getStats')
  },
  backup: {
    create: (dir?: string) => ipcRenderer.invoke('backup:create', dir),
    restore: (zipPath: string) => ipcRenderer.invoke('backup:restore', zipPath),
    selectFolder: () => ipcRenderer.invoke('backup:selectFolder'),
    selectFile: () => ipcRenderer.invoke('backup:selectFile')
  },
  dev: {
    loadDemoData: () => ipcRenderer.invoke('dev:loadDemoData')
  }
};

contextBridge.exposeInMainWorld('api', api);
