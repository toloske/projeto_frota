
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FormView } from './components/FormView';
import { AdminDashboard } from './components/AdminDashboard';
import { SettingsView } from './components/SettingsView';
import { FormData, SVCConfig } from './types';
import { DEFAULT_SVC_LIST } from './constants';
import { 
  ClipboardList, 
  LayoutDashboard, 
  Settings, 
  UserCircle, 
  Wifi, 
  WifiOff,
  RefreshCw,
  X,
  CloudLightning
} from 'lucide-react';

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<'standard' | 'admin'>('standard');
  const [activeTab, setActiveTab] = useState<'form' | 'admin' | 'settings'>('form');
  const [submissions, setSubmissions] = useState<FormData[]>([]);
  const [svcList, setSvcList] = useState<SVCConfig[]>([]);
  const [formKey, setFormKey] = useState(0);
  
  // Link de sincronização usando padrão Vite (import.meta.env)
  const [syncUrl, setSyncUrl] = useState<string>(
    // Fix: Using type assertion to any for import.meta to avoid property 'env' not found error when Vite client types are not loaded
    ((import.meta as any).env?.VITE_SYNC_URL as string) || localStorage.getItem('fleet_sync_url') || ''
  );
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  
  const pollingRef = useRef<number | null>(null);

  const fetchCloudData = useCallback(async (silent = false) => {
    if (!syncUrl) return;
    if (!silent) setIsSyncing(true);
    
    try {
      const response = await fetch(syncUrl, { cache: 'no-store' });
      if (!response.ok) throw new Error('Falha na rede');
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setSubmissions(data);
        setLastSync(new Date());
        localStorage.setItem('fleet_submissions', JSON.stringify(data));
      }
    } catch (e) {
      console.error("Erro na sincronização:", e);
    } finally {
      if (!silent) setIsSyncing(false);
    }
  }, [syncUrl]);

  useEffect(() => {
    if (syncUrl) {
      fetchCloudData();
      
      pollingRef.current = window.setInterval(() => {
        fetchCloudData(true);
      }, 30000);
    }
    
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [syncUrl, fetchCloudData]);

  useEffect(() => {
    const savedSvc = localStorage.getItem('fleet_svc_config');
    setSvcList(savedSvc ? JSON.parse(savedSvc) : DEFAULT_SVC_LIST);
    
    const savedRole = localStorage.getItem('user_role');
    if (savedRole === 'admin') setUserRole('admin');
  }, []);

  const handleAdminAuth = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (passwordInput === '1234') {
      setUserRole('admin');
      localStorage.setItem('user_role', 'admin');
      setActiveTab('admin');
      setShowLoginModal(false);
      setPasswordInput('');
    }
  };

  const handleSaveSubmission = async (data: FormData) => {
    const updated = [data, ...submissions];
    setSubmissions(updated);
    localStorage.setItem('fleet_submissions', JSON.stringify(updated));

    if (syncUrl) {
      setIsSyncing(true);
      try {
        await fetch(syncUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        setTimeout(() => fetchCloudData(true), 2000);
        return true;
      } catch (e) {
        console.error("Erro no envio:", e);
        alert("Erro ao enviar para nuvem. O registro ficou salvo apenas neste aparelho.");
        return false;
      } finally {
        setIsSyncing(false);
      }
    }
    return true;
  };

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0 bg-slate-50 text-slate-900 font-inter">
      <header className="bg-slate-900 text-white p-4 shadow-2xl sticky top-0 z-[60]">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl transition-all ${isSyncing ? 'bg-indigo-500 animate-pulse' : 'bg-white/5 border border-white/10'}`}>
              {syncUrl ? (
                <div className="relative">
                  <Wifi className="w-5 h-5 text-emerald-400" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                </div>
              ) : (
                <WifiOff className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black tracking-tight leading-none uppercase">Frota Hub Live</h1>
                {syncUrl && <CloudLightning className="w-3 h-3 text-indigo-400 animate-pulse" />}
              </div>
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block mt-1">
                {isSyncing ? 'Atualizando dados...' : lastSync ? `Cloud OK: ${lastSync.toLocaleTimeString()}` : 'Modo Local'}
              </span>
            </div>
          </div>
          
          <button 
            onClick={() => userRole === 'admin' ? setActiveTab('admin') : setShowLoginModal(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
              userRole === 'admin' ? 'bg-indigo-600 shadow-lg shadow-indigo-900/20' : 'bg-white text-slate-900'
            }`}
          >
            <UserCircle className="w-4 h-4" /> {userRole === 'admin' ? 'PAINEL GESTÃO' : 'ENTRAR'}
          </button>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 max-w-4xl">
        {activeTab === 'form' && (
          <FormView 
            key={formKey} 
            onSave={handleSaveSubmission} 
            svcList={svcList} 
            onNewForm={() => setFormKey(k => k + 1)}
            isSyncing={isSyncing}
          />
        )}
        
        {userRole === 'admin' && (
          <>
            {activeTab === 'admin' && (
              <AdminDashboard 
                submissions={submissions} 
                onRefresh={() => fetchCloudData()}
                isSyncing={isSyncing}
                lastSync={lastSync}
              />
            )}
            {activeTab === 'settings' && (
              <SettingsView 
                svcList={svcList} 
                onUpdate={(l) => { setSvcList(l); localStorage.setItem('fleet_svc_config', JSON.stringify(l)); }} 
                onClearData={() => { if(confirm('Excluir tudo localmente?')) { setSubmissions([]); localStorage.removeItem('fleet_submissions'); }}}
                syncUrl={syncUrl}
                onUpdateSyncUrl={(url) => { setSyncUrl(url); localStorage.setItem('fleet_sync_url', url); fetchCloudData(); }}
                submissions={submissions}
                onImportData={(data) => { setSubmissions(data); localStorage.setItem('fleet_submissions', JSON.stringify(data)); }}
              />
            )}
          </>
        )}
      </main>

      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black text-slate-800">Acesso Restrito</h2>
              <button onClick={() => setShowLoginModal(false)}><X className="w-6 h-6 text-slate-300" /></button>
            </div>
            <form onSubmit={handleAdminAuth} className="space-y-4">
              <input 
                type="password"
                placeholder="Senha de Acesso"
                autoFocus
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl text-center text-2xl font-black outline-none transition-all"
              />
              <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 uppercase tracking-widest text-xs">Entrar no Dashboard</button>
            </form>
          </div>
        </div>
      )}

      <nav className="fixed bottom-4 left-4 right-4 bg-white/90 backdrop-blur-xl border border-slate-100 flex justify-around p-3 z-50 shadow-2xl rounded-[2rem] md:max-w-md md:mx-auto">
        <button onClick={() => setActiveTab('form')} className={`flex flex-col items-center gap-1 flex-1 py-2 rounded-2xl transition-all ${activeTab === 'form' ? 'bg-slate-100 text-slate-900' : 'text-slate-400'}`}>
          <ClipboardList className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase">Reportar</span>
        </button>
        {userRole === 'admin' && (
          <>
            <button onClick={() => setActiveTab('admin')} className={`flex flex-col items-center gap-1 flex-1 py-2 rounded-2xl transition-all ${activeTab === 'admin' ? 'bg-slate-100 text-slate-900' : 'text-slate-400'}`}>
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-[8px] font-black uppercase">Dashboard</span>
            </button>
            <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 flex-1 py-2 rounded-2xl transition-all ${activeTab === 'settings' ? 'bg-slate-100 text-slate-900' : 'text-slate-400'}`}>
              <Settings className="w-5 h-5" />
              <span className="text-[8px] font-black uppercase">Ajustes</span>
            </button>
          </>
        )}
      </nav>
    </div>
  );
};

export default App;
