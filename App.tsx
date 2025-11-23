import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Trash2, Layers, User, Calculator, Copy, CheckCircle2 } from 'lucide-react';
import { CustomerInfo, CuttingItem, MaterialItem } from './types';
import { formatCurrency, formatNumber, calculateCuttingItemTotal, generateId } from './utils';
import { Button } from './components/Button';
import { SectionCard } from './components/SectionCard';
import { CurrencyInput } from './components/CurrencyInput';
import { DecimalInput } from './components/DecimalInput';
import { ITEM_DATABASE } from './constants';

const App: React.FC = () => {
  // --- State ---
  const [customer, setCustomer] = useState<CustomerInfo>({ name: '', number: '' });
  
  const [cuttingItems, setCuttingItems] = useState<CuttingItem[]>([
    { id: generateId(), type: '', length: 0, width: 0, qty: 1, price: 0, discPercent: 0, discRp: 0, isLumpsum: false }
  ]);
  
  const [materialItems, setMaterialItems] = useState<MaterialItem[]>([]);
  const [roundingDisc, setRoundingDisc] = useState(0); // State untuk diskon pembulatan
  const [copied, setCopied] = useState(false);

  // --- Calculations ---
  const cuttingSubtotal = useMemo(() => {
    return cuttingItems.reduce((acc, item) => acc + calculateCuttingItemTotal(item), 0);
  }, [cuttingItems]);

  const materialSubtotal = useMemo(() => {
    return materialItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
  }, [materialItems]);

  const grossTotal = cuttingSubtotal + materialSubtotal;
  const grandTotal = Math.max(0, grossTotal - roundingDisc);

  // --- Text Generation (Memoized for Copy) ---
  const generatedEstimasi = useMemo(() => {
    const lines = [];
    
    // Header
    lines.push(`*ESTIMASI CUTTING*`);
    const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    lines.push(`Tanggal: ${dateStr}`);
    lines.push(``);

    // Customer Info
    lines.push(`${customer.name || '-'}`);
    lines.push(`${customer.number || '-'}`);
    lines.push(``);

    // Cutting Section
    if (cuttingItems.length > 0) {
      lines.push(`*JASA CUTTING*`);
      cuttingItems.forEach((item, index) => {
        const itemTotal = calculateCuttingItemTotal(item);
        const suffix = item.isLumpsum ? 'Ls' : 'm²';
        
        // Line 1: Nama Item (Bold)
        lines.push(`*${index + 1}. ${item.type || 'Item Cutting'} ${suffix}*`);
        
        if (item.isLumpsum) {
           lines.push(`   Total Ukuran (Qty: ${item.qty}) : ${item.qty} Ls`);
           lines.push(`   Harga: ${formatCurrency(item.price)} (Borongan)`);
        } else {
           const areaPerItem = item.length * item.width;
           const totalAreaM2 = areaPerItem * item.qty;
           
           lines.push(`   Ukuran : ${item.length.toFixed(2)} * ${item.width.toFixed(2)} = ${formatNumber(areaPerItem)} m²`);
           lines.push(`   Total Ukuran (Qty: ${item.qty}) : ${formatNumber(totalAreaM2)} m²`);
           lines.push(`   Harga: ${formatCurrency(item.price)} /m²`);
        }
        
        if (item.discPercent > 0 || item.discRp > 0) {
           const discounts = [];
           if (item.discPercent > 0) discounts.push(`${item.discPercent}%`);
           if (item.discRp > 0) discounts.push(`${formatCurrency(item.discRp)}`);
           lines.push(`   Disc : ${discounts.join(' + ')}`);
        }

        lines.push(`   Subtotal: ${formatCurrency(itemTotal)}`);
        lines.push(``);
      });
      // Bold Subtotal Jasa
      lines.push(`  *> Subtotal Jasa: ${formatCurrency(cuttingSubtotal)}*`);
      lines.push(``);
    }

    // Material Section
    if (materialItems.length > 0) {
      lines.push(`*MATERIAL*`);
      materialItems.forEach((item, index) => {
        lines.push(`${index + 1}. ${item.name || 'Material'} | Qty: ${item.qty}`);
        lines.push(`   @ ${formatCurrency(item.price)} = ${formatCurrency(item.price * item.qty)}`);
      });
      lines.push(``);
      // Bold Subtotal Material
      lines.push(`   *> Subtotal Material: ${formatCurrency(materialSubtotal)}*`);
      lines.push(``);
    }

    // Footer
    lines.push(`--------------------------------`);
    if (roundingDisc > 0) {
       lines.push(`*Subtotal: ${formatCurrency(grossTotal)}*`);
       lines.push(`*Disc Pembulatan: - ${formatCurrency(roundingDisc)}*`);
       lines.push(`--------------------------------`);
    }
    lines.push(`*GRAND TOTAL: ${formatCurrency(grandTotal)}*`);
    lines.push(`--------------------------------`);

    return lines.join('\n');
  }, [customer, cuttingItems, materialItems, cuttingSubtotal, materialSubtotal, grandTotal, roundingDisc, grossTotal]);

  // --- Handlers: Customer ---
  const handleCustomerChange = (field: keyof CustomerInfo, value: string) => {
    setCustomer(prev => ({ ...prev, [field]: value }));
  };

  // --- Handlers: Cutting Items ---
  const addCuttingItem = () => {
    setCuttingItems(prev => [
      ...prev,
      { id: generateId(), type: '', length: 0, width: 0, qty: 1, price: 0, discPercent: 0, discRp: 0, isLumpsum: false }
    ]);
  };

  const removeCuttingItem = (id: string) => {
    setCuttingItems(prev => prev.filter(item => item.id !== id));
  };

  const updateCuttingItem = (id: string, field: keyof CuttingItem, value: any) => {
    setCuttingItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleTypeChange = (id: string, value: string) => {
    const preset = ITEM_DATABASE.find(p => p.label === value);
    
    setCuttingItems(prev => prev.map(item => {
      if (item.id === id) {
        if (preset) {
           return { 
             ...item, 
             type: value,
             price: preset.price,
             isLumpsum: false
           };
        }
        return { ...item, type: value };
      }
      return item;
    }));
  };

  const handleLsToggle = (id: string, newIsLumpsum: boolean, currentType: string) => {
    setCuttingItems(prev => prev.map(item => {
      if (item.id === id) {
        let newPrice = item.price;
        
        if (newIsLumpsum) {
          newPrice = 0;
        } else {
          const preset = ITEM_DATABASE.find(p => p.label === currentType);
          if (preset) {
            newPrice = preset.price;
          }
        }

        return { 
          ...item, 
          isLumpsum: newIsLumpsum,
          price: newPrice
        };
      }
      return item;
    }));
  };

  // --- Handlers: Material Items ---
  const addMaterialItem = () => {
    setMaterialItems(prev => [
      ...prev,
      { id: generateId(), name: '', qty: 1, price: 0 }
    ]);
  };

  const removeMaterialItem = (id: string) => {
    setMaterialItems(prev => prev.filter(item => item.id !== id));
  };

  const updateMaterialItem = (id: string, field: keyof MaterialItem, value: any) => {
    setMaterialItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // --- Clipboard Generator ---
  const handleCopyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedEstimasi);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
      alert('Gagal menyalin ke clipboard');
    }
  }, [generatedEstimasi]);

  return (
    <div className="min-h-screen bg-gray-50 pb-60 md:pb-56">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Calculator className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Nusa Wallart</h1>
          </div>
          <div className="text-sm text-gray-500 hidden sm:block">
            Estimator Profesional
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        
        {/* Customer Info */}
        <SectionCard title="Data Customer" icon={<User className="w-5 h-5 text-blue-600"/>}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Customer</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Contoh: Budi Sentosa"
                value={customer.name}
                onChange={(e) => handleCustomerChange('name', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nomor WhatsApp / Telp</label>
              <input
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Contoh: 0812..."
                value={customer.number}
                onChange={(e) => handleCustomerChange('number', e.target.value)}
              />
            </div>
          </div>
        </SectionCard>

        {/* Cutting Items */}
        <SectionCard 
          title="Jasa Cutting" 
          // Removed Scissors icon here as requested
        >
          <div className="space-y-6">
            {cuttingItems.map((item, index) => (
              <div key={item.id} className="relative bg-gray-50 p-4 rounded-lg border border-gray-200 group hover:border-blue-300 transition-colors">
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Row 1: Type, Ls Toggle, and Delete Button */}
                  <div className="md:col-span-12 flex items-center justify-end gap-3 mb-1">
                     <label className="inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={item.isLumpsum}
                          onChange={(e) => handleLsToggle(item.id, e.target.checked, item.type)}
                        />
                        <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        <span className="ms-2 text-xs font-medium text-gray-700">Ls</span>
                      </label>
                      <div className="h-4 w-px bg-gray-300 mx-1"></div>
                      <button onClick={() => removeCuttingItem(item.id)} className="text-gray-400 hover:text-red-500 p-1" title="Hapus Item">
                        <Trash2 className="w-4 h-4" />
                      </button>
                  </div>

                  {/* Type Column */}
                  <div className="md:col-span-4">
                    <label className="text-xs font-semibold text-gray-500 uppercase">
                      Jenis Cuttingan <span className="text-gray-400 font-normal ml-0.5">{item.isLumpsum ? '(Ls)' : '(m²)'}</span>
                    </label>
                    <input
                      type="text"
                      list="cutting-type-options"
                      placeholder={item.isLumpsum ? "Ex: Borongan Cutting" : "Ex: Akrilik 3mm"}
                      className="w-full mt-1 px-2 py-1.5 border border-gray-300 rounded focus:border-blue-500 outline-none text-sm"
                      value={item.type}
                      onChange={(e) => handleTypeChange(item.id, e.target.value)}
                    />
                  </div>
                  
                  {/* Dimensions & Qty Group (Combined) */}
                  <div className="md:col-span-6">
                    <label className="text-xs font-semibold text-gray-500 uppercase block">
                      Dimensi (P x L) & Qty
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="relative flex-1">
                        <DecimalInput
                          placeholder="P"
                          disabled={item.isLumpsum}
                          className={`w-full px-2 py-1.5 border rounded outline-none text-sm text-center ${
                            item.isLumpsum 
                              ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' 
                              : 'border-gray-300 focus:border-blue-500'
                          }`}
                          value={item.length}
                          onChange={(val) => updateCuttingItem(item.id, 'length', val)}
                        />
                      </div>

                      <span className="text-gray-400 text-xs font-medium">x</span>

                      <div className="relative flex-1">
                        <DecimalInput
                          placeholder="L"
                          disabled={item.isLumpsum}
                          className={`w-full px-2 py-1.5 border rounded outline-none text-sm text-center ${
                            item.isLumpsum 
                              ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' 
                              : 'border-gray-300 focus:border-blue-500'
                          }`}
                          value={item.width}
                          onChange={(val) => updateCuttingItem(item.id, 'width', val)}
                        />
                      </div>

                      <div className="h-6 w-px bg-gray-300 mx-1"></div>

                      <div className="relative w-20">
                         <input
                          type="number"
                          placeholder="Qty"
                          className="no-spinner w-full px-2 py-1.5 border border-gray-300 rounded focus:border-blue-500 outline-none text-sm text-center font-semibold text-blue-700 bg-blue-50/50"
                          value={item.qty || ''}
                          onChange={(e) => updateCuttingItem(item.id, 'qty', parseFloat(e.target.value) || 0)}
                        />
                         {!item.qty && <span className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs pointer-events-none">Qty</span>}
                      </div>
                    </div>
                  </div>

                  {/* Total Size Display */}
                  <div className="md:col-span-2 rounded p-1.5 flex flex-col justify-center bg-gray-100/50 border border-gray-200 text-center">
                     <span className="text-[10px] uppercase font-bold text-gray-400">Total Luas</span>
                     {item.isLumpsum ? (
                        <span className="text-sm font-bold text-gray-700">
                           -
                        </span>
                     ) : (
                        <span className="text-sm font-bold text-gray-700">
                           {formatNumber(item.length * item.width * item.qty)} <span className="text-xs font-normal">m²</span>
                        </span>
                     )}
                  </div>

                  {/* Row 2: Pricing */}
                  <div className="md:col-span-3">
                    <label className="text-xs font-semibold text-gray-500 uppercase">
                      {item.isLumpsum ? 'Harga (Rp)' : 'Harga/m² (Rp)'}
                    </label>
                    <CurrencyInput
                      placeholder="Ex: 450.000"
                      className="w-full mt-1 px-2 py-1.5 border border-gray-300 rounded focus:border-blue-500 outline-none text-sm font-medium"
                      value={item.price}
                      onChange={(val) => updateCuttingItem(item.id, 'price', val)}
                    />
                  </div>

                  {/* Combined Discount Section */}
                  <div className="md:col-span-5">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Diskon</label>
                    <div className="flex gap-2 mt-1">
                      <div className="relative w-20 flex-shrink-0">
                         <DecimalInput
                          placeholder="%"
                          className="w-full px-2 py-1.5 border border-gray-300 rounded focus:border-blue-500 outline-none text-sm text-center"
                          value={item.discPercent}
                          onChange={(val) => updateCuttingItem(item.id, 'discPercent', val)}
                        />
                      </div>
                      <div className="flex-grow">
                         <CurrencyInput
                          placeholder="Rp"
                          className="w-full px-2 py-1.5 border border-gray-300 rounded focus:border-blue-500 outline-none text-sm"
                          value={item.discRp}
                          onChange={(val) => updateCuttingItem(item.id, 'discRp', val)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-4 flex items-end justify-end">
                    <div className="text-right">
                      <span className="text-xs text-gray-500 block">Total Harga Item</span>
                      <span className="text-lg font-bold text-green-600">{formatCurrency(calculateCuttingItemTotal(item))}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {cuttingItems.length === 0 && (
              <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                Belum ada item cutting
              </div>
            )}
          </div>

          <div className="flex justify-end mt-4">
            <Button size="sm" variant="secondary" onClick={addCuttingItem} icon={<Plus className="w-4 h-4"/>}>
              Tambah Item
            </Button>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
             <span className="text-sm text-gray-500">Total item: {cuttingItems.length}</span>
             <div className="text-right">
               <span className="text-sm text-gray-600 mr-2">Subtotal Jasa:</span>
               <span className="text-xl font-bold text-gray-800">{formatCurrency(cuttingSubtotal)}</span>
             </div>
          </div>
        </SectionCard>

        {/* Material Items */}
        <SectionCard 
          title="Material Tambahan" 
          icon={<Layers className="w-5 h-5 text-orange-600"/>}
        >
           <div className="space-y-4">
            {materialItems.map((item) => (
              <div key={item.id} className="relative bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-all">
                {/* Delete Button (Top Right Red) */}
                <button 
                  onClick={() => removeMaterialItem(item.id)}
                  className="absolute top-2 right-2 p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                  title="Hapus Material"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="space-y-3">
                  <div className="pr-8">
                     <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Nama Material</label>
                     <input
                      type="text"
                      placeholder="Ex: Plat Besi 1mm"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:border-blue-500 outline-none"
                      value={item.name}
                      onChange={(e) => updateMaterialItem(item.id, 'name', e.target.value)}
                    />
                  </div>
                  
                  {/* Qty & Price Side-by-Side */}
                  <div className="flex gap-3">
                    <div className="w-20 shrink-0">
                       <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Qty</label>
                       <input
                        type="number"
                        className="no-spinner w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:border-blue-500 outline-none text-center bg-white"
                        value={item.qty || ''}
                        onChange={(e) => updateMaterialItem(item.id, 'qty', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="flex-grow">
                       <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Harga Satuan</label>
                       <CurrencyInput
                        placeholder="Ex: 150.000"
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:border-blue-500 outline-none bg-white"
                        value={item.price}
                        onChange={(val) => updateMaterialItem(item.id, 'price', val)}
                      />
                    </div>
                  </div>

                  {/* Subtotal Display */}
                  <div className="flex justify-end pt-2 border-t border-gray-200 border-dashed mt-2">
                    <div className="flex items-center gap-2">
                         <span className="text-xs text-gray-400">Total:</span>
                         <span className="text-sm font-bold text-gray-700">{formatCurrency(item.price * item.qty)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
             {materialItems.length === 0 && (
              <div className="text-center py-4 text-gray-400 text-sm">
                Tidak ada material tambahan
              </div>
            )}
           </div>

           <div className="flex justify-end mt-4">
             <Button size="sm" variant="secondary" onClick={addMaterialItem} icon={<Plus className="w-4 h-4"/>}>
               Tambah Material
             </Button>
           </div>
           
           <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end items-center">
             <div className="text-right">
               <span className="text-sm text-gray-600 mr-2">Subtotal Material:</span>
               <span className="text-lg font-bold text-gray-800">{formatCurrency(materialSubtotal)}</span>
             </div>
          </div>
        </SectionCard>

        {/* Rounding Discount Section */}
        <div className="flex justify-end">
            <div className="w-full md:w-1/2 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                    <label className="text-sm font-semibold text-gray-700">Disc Pembulatan (Rp)</label>
                    <div className="w-40">
                        <CurrencyInput
                            value={roundingDisc}
                            onChange={setRoundingDisc}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold text-gray-800 text-right"
                            placeholder="0"
                        />
                    </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-right">Nilai ini akan mengurangi Grand Total</p>
            </div>
        </div>

        {/* Preview Section has been removed as requested */}

      </main>

      {/* Sticky Bottom Summary */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] px-4 py-3 sm:p-4">
        <div className="max-w-4xl mx-auto">
          
          {/* Summary Boxes Stack */}
          <div className="flex flex-col gap-2 mb-3">
             {/* Box 1: Subtotals (Jasa & Material) */}
             <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 flex items-center justify-between">
                <div className="flex flex-col">
                   <span className="text-xs text-gray-500 mb-0.5">Total Jasa</span>
                   <span className="font-semibold text-gray-800 text-sm sm:text-base">{formatCurrency(cuttingSubtotal)}</span>
                </div>
                {/* Vertical Divider */}
                <div className="h-8 w-px bg-gray-200 mx-2"></div>
                <div className="flex flex-col items-end">
                   <span className="text-xs text-gray-500 mb-0.5">Total Material</span>
                   <span className="font-semibold text-gray-800 text-sm sm:text-base">{formatCurrency(materialSubtotal)}</span>
                </div>
             </div>

             {/* Box 2: Finals (Disc & Grand Total) */}
             <div className="bg-blue-50 rounded-lg border border-blue-100 p-3 flex justify-between items-center">
                <div className="flex flex-col">
                   <span className="text-xs text-gray-500 font-medium mb-0.5">Disc Pembulatan</span>
                   <span className={`font-bold text-sm sm:text-base ${roundingDisc > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                     - {formatCurrency(roundingDisc)}
                   </span>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[10px] text-blue-600/70 uppercase font-semibold leading-none mb-1">Grand Total</span>
                   <span className="text-xl sm:text-2xl font-bold text-blue-700 leading-none">
                     {formatCurrency(grandTotal)}
                   </span>
                </div>
             </div>
          </div>

          {/* Bottom Row: Big Action Button */}
          <Button 
            variant="primary" 
            size="lg" 
            className={`w-full py-3 text-lg font-bold shadow-xl shadow-blue-500/20 justify-center ${copied ? 'bg-green-600 hover:bg-green-700 ring-green-500' : ''}`}
            onClick={handleCopyToClipboard}
            icon={copied ? <CheckCircle2 className="w-6 h-6"/> : <Copy className="w-6 h-6"/>}
          >
            {copied ? 'Tersalin!' : 'Copy Estimasi'}
          </Button>

        </div>
      </div>

      <datalist id="cutting-type-options">
        {ITEM_DATABASE.map((option) => (
          <option key={option.label} value={option.label} />
        ))}
      </datalist>
    </div>
  );
};

export default App;