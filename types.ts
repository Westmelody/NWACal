
export interface CuttingItem {
  id: string;
  type: string;
  length: number; // P (meter)
  width: number; // L (meter)
  qty: number;
  price: number; // Harga Satuan (Rp)
  discPercent: number;
  discRp: number; // Diskon (Rp)
  isLumpsum: boolean;
}

export interface MaterialItem {
  id: string;
  name: string;
  qty: number;
  price: number; // Harga Satuan (Rp)
}

export interface CustomerInfo {
  name: string;
  number: string;
}

export type CurrencyFormatOptions = {
  currency?: string;
  locale?: string;
};
