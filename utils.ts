
import { CuttingItem } from './types';

export const formatCurrency = (value: number): string => {
  // Value is in full Rupiah
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 3 // Allow up to 3 decimals for Area (e.g. 0.125 m2)
  }).format(value);
};

export const calculateCuttingItemTotal = (item: CuttingItem): number => {
  let grossPrice = 0;

  if (item.isLumpsum) {
    // Lumpsum: Price is per piece/unit directly (qty * price)
    grossPrice = item.price * item.qty;
  } else {
    // m2: Price is per square meter (L * W * qty * price)
    // Inputs are in Meters
    const areaM2 = item.length * item.width;
    grossPrice = areaM2 * item.qty * item.price;
  }

  const afterRpDisc = grossPrice - item.discRp;
  const finalPrice = afterRpDisc - (afterRpDisc * (item.discPercent / 100));
  return Math.max(0, finalPrice);
};

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};
