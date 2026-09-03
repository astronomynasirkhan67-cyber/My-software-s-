export interface IElectronAPI {
  auth: {
    isSetup: () => Promise<boolean>;
    setup: (data: any) => Promise<{ success: boolean }>;
    login: (creds: any) => Promise<{ success: boolean; username?: string; message?: string }>;
    changePassword: (data: any) => Promise<{ success: boolean }>;
  };
  settings: {
    get: () => Promise<any>;
    update: (data: any) => Promise<{ success: boolean }>;
  };
  products: {
    getAll: (opts?: any) => Promise<{ data: any[]; total: number; totalPages: number }>;
    getById: (id: number) => Promise<any>;
    getByCode: (code: string) => Promise<any>;
    create: (data: any) => Promise<{ id: number }>;
    update: (id: number, data: any) => Promise<{ success: boolean }>;
    delete: (id: number) => Promise<{ success: boolean }>;
  };
  stock: {
    change: (data: any) => Promise<{ success: boolean; newStock: number }>;
    getTransactions: (opts?: any) => Promise<any[]>;
  };
  image: {
    save: (base64: string, filename: string) => Promise<string>;
    getUri: (filename: string) => Promise<string>;
  };
  categories: {
    getAll: () => Promise<any[]>;
    create: (name: string) => Promise<any>;
    delete: (id: number) => Promise<any>;
  };
  suppliers: {
    getAll: () => Promise<any[]>;
    create: (data: any) => Promise<any>;
    delete: (id: number) => Promise<any>;
  };
  dashboard: {
    getStats: () => Promise<any>;
  };
  backup: {
    create: (dir?: string) => Promise<string>;
    restore: (zipPath: string) => Promise<boolean>;
    selectFolder: () => Promise<string | null>;
    selectFile: () => Promise<string | null>;
  };
  dev: {
    loadDemoData: () => Promise<any>;
  };
}

declare global {
  interface Window {
    api: IElectronAPI;
  }
}
