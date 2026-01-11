
import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Calculator, 
  Settings, 
  ShoppingCart, 
  Download, 
  Trash2, 
  Plus, 
  Server, 
  HardDrive, 
  Globe, 
  Database,
  Info,
  Save, 
  RefreshCcw,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronUp,
  Shield,
  Box,
  LayoutGrid,
  Printer,
  Lock,
  LogIn,
  LogOut
} from 'lucide-react';

// --- Global Constants (Financial Engine Protocol) ---
const HOURS_PER_MONTH = 730;
const ADMIN_PASSWORD = "Huawei@123"; // Updated secure password for admin access

// --- Types & Interfaces ---
interface UnitPrices {
  vcpu_ram_unit: number; 
  evs: number; 
  hss: number;       
  waf: number;       
  edge_fw: number;   
  cloud_fw: number;
  hsm_kms: number;
  csdr: number;
  cce_vcpu: number;
  db_instance: number;
  eip: number;
  bandwidth: number;
  // Specific flavor prices (Monthly)
  [key: string]: number;
}

interface CartItem {
  id: string;
  category: string;
  name: string;
  config: string;
  quantity: number;
  monthlyUnitPrice: number; 
}

interface ECSFlavor {
  id: string;
  vcpu: number;
  ram: number;
  label: string;
}

// --- Default Monthly Unit Prices (MUP) ---
const DEFAULT_PRICES: UnitPrices = {
  vcpu_ram_unit: 1.0,
  evs: 0.15,
  hss: 5.00,
  waf: 45.00,
  edge_fw: 0.85,
  cloud_fw: 0.75,
  hsm_kms: 2.50,
  csdr: 15.00,
  cce_vcpu: 1.20,
  db_instance: 22.00,
  eip: 3.00,
  bandwidth: 5.50,
  // Flavor defaults
  flavor_1_1: 15.00, flavor_1_2: 22.00, flavor_2_4: 35.00, flavor_4_4: 45.00,
  flavor_2_8: 55.00, flavor_4_8: 65.00, flavor_4_16: 85.00, flavor_8_16: 110.00,
  flavor_8_32: 150.00, flavor_16_32: 210.00, flavor_16_64: 290.00, flavor_32_64: 410.00,
  flavor_32_128: 580.00, flavor_32_256: 850.00, flavor_48_160: 950.00, flavor_48_192: 1100.00,
  flavor_64_256: 1450.00
};

const ECS_FLAVORS: ECSFlavor[] = [
  { id: 'flavor_1_1', vcpu: 1, ram: 1, label: '1 vCPU 1 GB RAM' },
  { id: 'flavor_1_2', vcpu: 1, ram: 2, label: '1 vCPU 2 GB RAM' },
  { id: 'flavor_2_4', vcpu: 2, ram: 4, label: '2 vCPU 4 GB RAM' },
  { id: 'flavor_4_4', vcpu: 4, ram: 4, label: '4 vCPU 4 GB RAM' },
  { id: 'flavor_2_8', vcpu: 2, ram: 8, label: '2 vCPU 8 GB RAM' },
  { id: 'flavor_4_8', vcpu: 4, ram: 8, label: '4 vCPU 8 GB RAM' },
  { id: 'flavor_4_16', vcpu: 4, ram: 16, label: '4 vCPU 16 GB RAM' },
  { id: 'flavor_8_16', vcpu: 8, ram: 16, label: '8 vCPU 16 GB RAM' },
  { id: 'flavor_8_32', vcpu: 8, ram: 32, label: '8 vCPU 32 GB RAM' },
  { id: 'flavor_16_32', vcpu: 16, ram: 32, label: '16 vCPU 32 GB RAM' },
  { id: 'flavor_16_64', vcpu: 16, ram: 64, label: '16 vCPU 64 GB RAM' },
  { id: 'flavor_32_64', vcpu: 32, ram: 64, label: '32 vCPU 64 GB RAM' },
  { id: 'flavor_32_128', vcpu: 32, ram: 128, label: '32 vCPU 128 GB RAM' },
  { id: 'flavor_32_256', vcpu: 32, ram: 256, label: '32 vCPU 256 GB RAM' },
  { id: 'flavor_48_160', vcpu: 48, ram: 160, label: '48 vCPU 160 GB RAM' },
  { id: 'flavor_48_192', vcpu: 48, ram: 192, label: '48 vCPU 192 GB RAM' },
  { id: 'flavor_64_256', vcpu: 64, ram: 256, label: '64 vCPU 256 GB RAM' }
];

const SERVICE_LABELS: Record<string, string> = {
  evs: "Elastic Volume Storage (GB)",
  hss: "Host Security Service (HSS)",
  waf: "Web App Firewall (WAF)",
  edge_fw: "Edge Firewall Protection",
  cloud_fw: "Cloud Firewall (CFW)",
  hsm_kms: "HSM / KMS License",
  csdr: "Disaster Recovery Node",
  cce_vcpu: "CCE Container vCPU",
  db_instance: "Managed DB Instance",
  eip: "Elastic IP (EIP)",
  bandwidth: "Bandwidth (Per MB)"
};

// --- Utility Functions ---
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const calculateItemTotal = (mup: number, qty: number) => {
  // Logic: Unit Price is Monthly. Total = MUP * Quantity.
  let total = mup * qty;
  total = Math.round((total + Number.EPSILON) * 100) / 100;
  return total;
};

// --- Sub-Components ---

const GenericInput = ({ label, value, onChange }: any) => {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-semibold text-slate-600 block">
        {label}
      </label>
      <input 
        type="number"
        min={0}
        value={value === 0 ? "" : value}
        placeholder="0"
        onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 shadow-sm"
      />
    </div>
  );
};

const SectionWrapper = ({ title, icon, children, defaultOpen = true }: any) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border-b border-slate-100 overflow-hidden">
      <div 
        className="px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors bg-slate-50/30"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="text-slate-500">{icon}</div>
          <h2 className="text-[13px] font-bold text-slate-700 tracking-tight">{title}</h2>
        </div>
        {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </div>
      {isOpen && (
        <div className="p-6 border-t border-slate-50 animate-in slide-in-from-top-1 duration-200">
          {children}
        </div>
      )}
    </div>
  );
};

const App = () => {
  const [prices, setPrices] = useState<UnitPrices>(() => {
    const saved = localStorage.getItem('hcs_billing_v13');
    return saved ? JSON.parse(saved) : DEFAULT_PRICES;
  });
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeTab, setActiveTab] = useState<'store' | 'admin'>('store');
  const [notification, setNotification] = useState<string | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // States for bulk inputs
  const [flavorQuantities, setFlavorQuantities] = useState<Record<string, number>>({});
  const [serviceInputs, setServiceInputs] = useState({
    evs: 0,
    csdr: 0,
    hss: 0,
    waf: 0,
    edge_fw: 0,
    cloud_fw: 0,
    hsm: 0,
    cce: 0,
    db: 0,
    eip: 0,
    bandwidth: 0
  });

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Sync state to cart
  useEffect(() => {
    const newCart: CartItem[] = [];
    
    // Process ECS Flavors
    ECS_FLAVORS.forEach(f => {
      const qty = flavorQuantities[f.id] || 0;
      if (qty > 0) {
        newCart.push({
          id: f.id,
          category: 'Compute Services (ECS)',
          name: 'Virtual Machine',
          config: f.label,
          quantity: qty,
          monthlyUnitPrice: prices[f.id]
        });
      }
    });

    // Process other services
    const addSvc = (key: keyof typeof serviceInputs, cat: string, name: string, config: string, mup: number) => {
      if (serviceInputs[key] > 0) {
        newCart.push({
          id: key as string,
          category: cat,
          name: name,
          config: config,
          quantity: serviceInputs[key],
          monthlyUnitPrice: mup
        });
      }
    };

    addSvc('evs', 'Storage Services', 'EVS Disk', 'Elastic Volume Storage (GB)', prices.evs);
    addSvc('csdr', 'Disaster Recovery', 'CSDR Node', 'Disaster Recovery License', prices.csdr);
    addSvc('hss', 'Security Services', 'HSS Agent', 'Host Security Service (Number of ECS)', prices.hss);
    addSvc('waf', 'Security Services', 'WAF 100M', 'Web App Firewall (Per 100 Mbps)', prices.waf);
    addSvc('edge_fw', 'Security Services', 'Edge Firewall', 'Per vCPU of protected ECS', prices.edge_fw);
    addSvc('cloud_fw', 'Security Services', 'Cloud Firewall CFW', 'Per vCPU of protected ECS', prices.cloud_fw);
    addSvc('hsm', 'Security Services', 'HSM/KMS', 'Number of Keys', prices.hsm_kms);
    addSvc('cce', 'Container Services', 'CCE Worker', 'CCE Cluster (Total vCPU of Worker Nodes)', prices.cce_vcpu);
    addSvc('db', 'Database as a Service', 'DB Instance', 'Managed RDS Instance', prices.db_instance);
    addSvc('eip', 'Network Services', 'Elastic IP', 'EIP (Number)', prices.eip);
    addSvc('bandwidth', 'Network Services', 'Bandwidth', 'Bandwidth (MB)', prices.bandwidth);

    setCart(newCart);
  }, [flavorQuantities, serviceInputs, prices]);

  const cartCalculated = useMemo(() => {
    return cart.map(item => ({
      ...item,
      total: calculateItemTotal(item.monthlyUnitPrice, item.quantity)
    }));
  }, [cart]);

  const grandTotal = useMemo(() => {
    return cartCalculated.reduce((sum, item) => sum + item.total, 0);
  }, [cartCalculated]);

  const exportBOQ = () => {
    if (cart.length === 0) return;
    const timestamp = new Date().toLocaleString();
    const rows = [
      ["HUAWEI CLOUD STACK - OFFICIAL BILL OF QUANTITIES"],
      [`Export Date: ${timestamp}`],
      ["Billing Mode: Monthly"],
      ["Currency: USD"],
      [],
      ["ID", "Category", "Service Name", "Configuration", "Quantity", "MUP (Monthly)", "Subtotal (USD)"]
    ];

    cartCalculated.forEach((item, index) => {
      rows.push([
        (index + 1).toString(),
        item.category,
        item.name,
        item.config,
        item.quantity.toString(),
        item.monthlyUnitPrice.toFixed(2),
        item.total.toFixed(2)
      ]);
    });

    rows.push([], ["", "", "", "", "", "ESTIMATED TOTAL", grandTotal.toFixed(2)]);

    const csvContent = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `HCS_Commercial_BOQ.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearAll = () => {
    setFlavorQuantities({});
    setServiceInputs({
      evs: 0, csdr: 0, hss: 0, waf: 0, edge_fw: 0, cloud_fw: 0, hsm: 0, cce: 0, db: 0, eip: 0, bandwidth: 0
    });
  };

  const handleLogin = (password: string) => {
    if (password === ADMIN_PASSWORD) {
      setIsAdminAuthenticated(true);
      setNotification("Admin login successful.");
    } else {
      setNotification("Invalid password.");
    }
  };

  const handleLogout = () => {
    setIsAdminAuthenticated(false);
    setActiveTab('store');
    setNotification("Logged out from Admin.");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Plus_Jakarta_Sans']">
      <header className="bg-[#1e40af] text-white px-10 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-4">
          <div className="bg-white/10 p-2 rounded-lg">
            <Calculator size={24} />
          </div>
          <h1 className="text-lg font-bold tracking-tight">MEEZA HCS Official Calculator</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveTab('store')} 
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'store' ? 'bg-white text-[#1e40af]' : 'hover:bg-white/10'}`}
          >
            Store
          </button>
          <button 
            onClick={() => setActiveTab('admin')} 
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'admin' ? 'bg-white text-[#1e40af]' : 'hover:bg-white/10'}`}
          >
            Admin
          </button>
          {isAdminAuthenticated && (
            <button 
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg text-xs font-bold uppercase hover:bg-red-500/20 transition-all text-red-200"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-[1440px] mx-auto w-full p-6">
        {notification && (
          <div className="fixed top-20 right-6 z-[60] bg-slate-800 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-right-4">
            <CheckCircle2 className="text-green-400" size={18} />
            <p className="text-xs font-bold">{notification}</p>
          </div>
        )}

        {activeTab === 'store' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
              <SectionWrapper title="Compute Services (ECS)" icon={<LayoutGrid size={16} />}>
                <p className="text-[11px] font-bold text-blue-600 mb-4 uppercase tracking-wider">Virtual Machines</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {ECS_FLAVORS.map(f => (
                    <div key={f.id} className="border border-slate-100 rounded-lg p-3 bg-slate-50/30 flex justify-between items-center group hover:border-blue-200 transition-colors">
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-slate-700 leading-tight">{f.label}</p>
                        <p className="text-[9px] text-slate-400 mt-1 uppercase font-medium">{f.vcpu} vCPU, {f.ram} GB RAM</p>
                      </div>
                      <input 
                        type="number" min={0} 
                        value={flavorQuantities[f.id] || ""} 
                        onChange={(e) => setFlavorQuantities({...flavorQuantities, [f.id]: Math.max(0, parseInt(e.target.value) || 0)})}
                        placeholder="0"
                        className="w-12 border border-slate-200 rounded p-1.5 text-xs text-center focus:ring-1 focus:ring-blue-400 outline-none" 
                      />
                    </div>
                  ))}
                </div>
              </SectionWrapper>

              <SectionWrapper title="Storage Services" icon={<HardDrive size={16} />} defaultOpen={false}>
                <div className="max-w-xs">
                  <GenericInput label="Elastic Volume Storage (GB)" value={serviceInputs.evs} onChange={(v: number) => setServiceInputs({...serviceInputs, evs: v})} />
                </div>
              </SectionWrapper>

              <SectionWrapper title="Disaster Recovery" icon={<RefreshCcw size={16} />} defaultOpen={false}>
                <div className="max-w-xs">
                  <GenericInput label="Protected Nodes (ECS Replication)" value={serviceInputs.csdr} onChange={(v: number) => setServiceInputs({...serviceInputs, csdr: v})} />
                </div>
              </SectionWrapper>

              <SectionWrapper title="Security Services" icon={<Shield size={16} />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <GenericInput label="Host Security Service HSS (Number of ECS)" value={serviceInputs.hss} onChange={(v: number) => setServiceInputs({...serviceInputs, hss: v})} />
                  <GenericInput label="Web Application Firewall WAF (Per 100 Mbps)" value={serviceInputs.waf} onChange={(v: number) => setServiceInputs({...serviceInputs, waf: v})} />
                  <GenericInput label="Edge Firewall (Per vCPU of protected ECS)" value={serviceInputs.edge_fw} onChange={(v: number) => setServiceInputs({...serviceInputs, edge_fw: v})} />
                  <GenericInput label="Cloud Firewall CFW (Per vCPU of protected ECS)" value={serviceInputs.cloud_fw} onChange={(v: number) => setServiceInputs({...serviceInputs, cloud_fw: v})} />
                  <GenericInput label="HSM/KMS (Number of Keys)" value={serviceInputs.hsm} onChange={(v: number) => setServiceInputs({...serviceInputs, hsm: v})} />
                </div>
              </SectionWrapper>

              <SectionWrapper title="Container Services" icon={<Box size={16} />}>
                <div className="max-w-xs">
                  <GenericInput label="CCE Cluster (Total vCPU of Worker Nodes)" value={serviceInputs.cce} onChange={(v: number) => setServiceInputs({...serviceInputs, cce: v})} />
                </div>
              </SectionWrapper>

              <SectionWrapper title="Database as a Service" icon={<Database size={16} />} defaultOpen={false}>
                <div className="max-w-xs">
                  <GenericInput label="RDS Instances (Number)" value={serviceInputs.db} onChange={(v: number) => setServiceInputs({...serviceInputs, db: v})} />
                </div>
              </SectionWrapper>

              <SectionWrapper title="Network Services" icon={<Globe size={16} />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <GenericInput label="Elastic IP (EIP)" value={serviceInputs.eip} onChange={(v: number) => setServiceInputs({...serviceInputs, eip: v})} />
                  <GenericInput label="Bandwidth (MB)" value={serviceInputs.bandwidth} onChange={(v: number) => setServiceInputs({...serviceInputs, bandwidth: v})} />
                </div>
              </SectionWrapper>
            </div>

            {/* Sidebar Summary */}
            <div className="lg:col-span-4">
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden sticky top-24">
                <div className="p-5 bg-[#0f172a] text-white flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <ShoppingCart size={18} />
                    <h3 className="text-sm font-bold uppercase tracking-tight">TECHNICAL BOQ</h3>
                  </div>
                  <button onClick={clearAll} className="text-slate-400 hover:text-white transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-100 bg-white">
                  {cartCalculated.length === 0 ? (
                    <div className="p-16 text-center opacity-30">
                      <p className="text-[10px] font-bold uppercase tracking-widest">No Selection</p>
                    </div>
                  ) : (
                    cartCalculated.map(item => (
                      <div key={item.id} className="p-6 hover:bg-slate-50 transition-all border-b border-slate-50">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-slate-800 text-[12px] leading-tight uppercase">{item.config}</h4>
                          <span className="text-[12px] font-black text-slate-900">{formatCurrency(item.total)}</span>
                        </div>
                        <div className="flex flex-col text-[11px] font-medium text-slate-400">
                          <span>Qty: {item.quantity}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-8 bg-slate-50/50 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-10">
                    <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">ESTIMATED TOTAL</span>
                    <span className="text-3xl font-black text-slate-900">{formatCurrency(grandTotal)}</span>
                  </div>
                  <button 
                    onClick={exportBOQ}
                    disabled={cart.length === 0}
                    className="w-full bg-[#1e40af] hover:bg-blue-800 disabled:bg-slate-200 text-white py-4 rounded-lg font-bold text-[12px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-sm"
                  >
                    <Download size={18} /> EXPORT CSV BOQ
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto py-12">
            {!isAdminAuthenticated ? (
              <AdminLogin onLogin={handleLogin} />
            ) : (
              <div className="bg-white rounded-lg p-10 border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between mb-10 border-b pb-6">
                  <div className="flex items-center gap-4">
                    <Settings size={24} className="text-slate-400" />
                    <h2 className="text-xl font-bold text-slate-800">Commercial Price Management (Monthly)</h2>
                  </div>
                  <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg text-xs font-bold border border-green-100">
                    <Shield size={14} />
                    ADMIN AUTHENTICATED
                  </div>
                </div>
                <AdminPortal currentPrices={prices} onSave={(p: any) => { setPrices(p); localStorage.setItem('hcs_billing_v13', JSON.stringify(p)); setNotification("Prices Updated."); setActiveTab('store'); }} />
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="py-8 px-10 border-t border-slate-100 flex justify-between items-center text-slate-300 text-[10px] font-bold uppercase tracking-[0.2em] bg-white mt-12">
        <span>MEEZA HCS OFFICIAL CALCULATOR</span>
        <div className="flex items-center gap-2 text-slate-400">
          <Shield size={12} />
          <span>Huawei Cloud Infrastructure</span>
        </div>
      </footer>
    </div>
  );
};

const AdminLogin = ({ onLogin }: { onLogin: (password: string) => void }) => {
  const [password, setPassword] = useState("");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(password);
  };

  return (
    <div className="max-w-md mx-auto bg-white p-10 rounded-2xl border border-slate-200 shadow-2xl text-center">
      <div className="w-16 h-16 bg-[#1e40af]/10 text-[#1e40af] rounded-full flex items-center justify-center mx-auto mb-6">
        <Lock size={32} />
      </div>
      <h2 className="text-2xl font-black text-slate-900 mb-2">Admin Portal</h2>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Access restricted to authorized personnel</p>
      
      <form onSubmit={handleSubmit} className="space-y-6 text-left">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all font-mono"
            placeholder="••••••••"
            required
            autoFocus
          />
        </div>
        <button 
          type="submit"
          className="w-full bg-[#1e40af] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-lg shadow-blue-100 active:scale-95 transition-all"
        >
          <LogIn size={18} /> Authenticate
        </button>
      </form>
      <div className="mt-8 pt-8 border-t border-slate-50 text-[10px] text-slate-300 font-bold uppercase tracking-widest">
        MEEZA Security Protocol
      </div>
    </div>
  );
};

const AdminPortal = ({ currentPrices, onSave }: any) => {
  const [data, setData] = useState(currentPrices);
  
  const groups = [
    { 
      title: "ECS Flavor Monthly Rates", 
      items: ECS_FLAVORS.map(f => ({ id: f.id, label: f.label })) 
    },
    { 
      title: "Service Monthly Rates", 
      items: [
        { id: 'evs', label: SERVICE_LABELS.evs },
        { id: 'hss', label: SERVICE_LABELS.hss },
        { id: 'waf', label: SERVICE_LABELS.waf },
        { id: 'edge_fw', label: SERVICE_LABELS.edge_fw },
        { id: 'cloud_fw', label: SERVICE_LABELS.cloud_fw },
        { id: 'hsm_kms', label: SERVICE_LABELS.hsm_kms },
        { id: 'csdr', label: SERVICE_LABELS.csdr },
        { id: 'cce_vcpu', label: SERVICE_LABELS.cce_vcpu },
        { id: 'db_instance', label: SERVICE_LABELS.db_instance },
        { id: 'eip', label: SERVICE_LABELS.eip },
        { id: 'bandwidth', label: SERVICE_LABELS.bandwidth }
      ] 
    }
  ];

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
        {groups.map(g => (
          <div key={g.title} className="space-y-6">
            <h3 className="text-[12px] font-black text-blue-600 uppercase tracking-widest border-l-4 border-blue-600 pl-4 bg-blue-50/50 py-2 rounded-r-lg">{g.title}</h3>
            <div className="space-y-3">
              {g.items.map(item => (
                <div key={item.id} className="flex items-center justify-between gap-4 border-b border-slate-50 pb-3 group">
                  <label className="text-[11px] font-bold text-slate-600 uppercase flex-1 group-hover:text-blue-600 transition-colors">{item.label}</label>
                  <div className="flex items-center bg-slate-50 px-3 rounded-xl border border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50 transition-all">
                    <span className="text-[11px] text-slate-400 font-black">$</span>
                    <input 
                      type="number" step="0.01" value={data[item.id]} 
                      onChange={e => setData({...data, [item.id]:parseFloat(e.target.value)||0})} 
                      className="w-24 bg-transparent py-3 text-[12px] font-black text-slate-800 outline-none text-right" 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-4 pt-10 border-t border-slate-100">
        <button onClick={() => onSave(data)} className="flex-1 bg-[#1e40af] text-white font-bold py-5 rounded-xl flex items-center justify-center gap-3 hover:bg-blue-800 transition-all text-xs uppercase tracking-[0.2em] shadow-lg shadow-blue-100 active:scale-[0.98]">
          <Save size={20} /> SYNC COMMERCIAL RATES
        </button>
        <button onClick={() => setData(DEFAULT_PRICES)} className="px-10 bg-slate-100 text-slate-500 font-bold py-5 rounded-xl hover:bg-slate-200 transition-all text-xs uppercase tracking-widest flex items-center gap-3 active:scale-95">
          <RefreshCcw size={18} /> RESET DEFAULTS
        </button>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
