
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FormView } from './components/FormView';
import { AdminDashboard } from './components/AdminDashboard';
import { SettingsView } from './components/SettingsView';
import { FormData, SVCConfig } from './types';
import { DEFAULT_SVC_LIST, GLOBAL_SYNC_URL } from './constants';
import * as db from './db';
import { 
  ClipboardList, 
  LayoutDashboard, 
  Settings, 
  CloudLightning,
  Lock,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Wifi,
  WifiOff,
  CloudDownload
} from 'lucide-react';

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<'standard' | 'admin'>('standard');
  const [activeTab, setActiveTab] = useState<'form' | 'admin' | 'settings'>('form');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [svcList, setSvcList] = useState<SVCConfig[]>([]);
  const [formKey, setFormKey] = useState(0);
  const [syncUrl, setSyncUrl] = useState<string>(() => localStorage.getItem('fleet_sync_url') || GLOBAL_SYNC_URL || "");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [pendingCount, setPendingCount] = useState(0);

  // Carregar dados locais inicialmente
  const refreshLocalData = useCallback(async () => {
    const subs = await db.getAllSubmissions();
    setSubmissions(subs);
    setPendingCount(subs.filter(s => s.syncStatus === 'pending').length);
    
    const savedSvc = localStorage.getItem('fleet_svc_config');
    setSvcList(savedSvc ? JSON.parse(savedSvc) : DEFAULT_SVC_LIST);
  }, []);

  useEffect(() => {
    refreshLocalData();
  }, [formKey, refreshLocalData]);

  // Função para puxar dados do servidor (Apenas para o Gestor)
  const pullFromServer = useCallback(async () => {
    if (!syncUrl || userRole !== 'admin' || isSyncing) return;
    
    setIsSyncing(true);
    try {
      const response = await fetch(`${syncUrl}?action=get_all&t=${Date.now()}`);
      const text = await response.text();
      const data = JSON.parse(text);
      
      if (data && data.submissions) {
        await db.upsertSubmissionsFromServer(data.submissions);
        await refreshLocalData();
      }
    } catch (e) {
      console.error("Falha ao puxar dados do servidor:", e);
    } finally {
      setIsSyncing(false);
    }
  }, [syncUrl, userRole, isSyncing, refreshLocalData]);

  // Fila de Envio (Push)
  const syncQueue = useCallback(async () => {
    if (!syncUrl || isSyncing) return;
    
    const pending = await db.getPendingSubmissions();
    if (pending.length === 0) {
      setPendingCount(0);
      return;
    }

    setIsSyncing(true);
    setSyncError(false);

    for (const item of pending) {
      try {
        await fetch(syncUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ type: 'report', data: item })
        });
        
        // Em no-cors não temos certeza do 200, mas se não estourar catch, marcamos
        await db.markAsSynced(item.id);
      } catch (e) {
        console.error("Erro na rede ao sincronizar:", item.id);
        setSyncError(true);
        break; 
      }
    }

    await refreshLocalData();
    setIsSyncing(false);
  }, [syncUrl, isSyncing, refreshLocalData]);

  // Auto-sync
  useEffect(() => {
    syncQueue();
    const interval = setInterval(() => {
      syncQueue();
      if (userRole === 'admin') pullFromServer();
    }, 30000);
    return () => clearInterval(interval);
  }, [syncQueue, pullFromServer, userRole]);

  const handleSaveSubmission = async (data: FormData) => {
    await db.saveSubmission(data);
    await refreshLocalData();
    // Tenta sincronizar imediatamente após salvar
    setTimeout(syncQueue, 500); 
    return true;
  };

  const handleUpdateSyncUrl = (url: string) => {
    setSyncUrl(url);
    localStorage.setItem('fleet_sync_url', url);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-inter">
      <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div 
              onClick={() => { syncQueue(); if(userRole === 'admin') pullFromServer(); }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${isSyncing ? 'bg-indigo-600' : (syncError ? 'bg-rose-500' : 'bg-slate-100')}`}
            >
              {isSyncing ? <RefreshCw className="w-5 h-5 text-white animate-spin" /> : (syncError ? <WifiOff className="w-5 h-5 text-white" /> : <Wifi className="w-5 h-5 text-slate-400" />)}
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-tight leading-none">Frota Hub</h1>
              <div className="flex items-center gap-1.5 mt-1">
                {pendingCount > 0 ? (
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                    <span className="text-[8px] font-black text-amber-500 uppercase">{pendingCount} Pendente{pendingCount > 1 ? 's' : ''}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    <span className="text-[8px] font-black text-emerald-500 uppercase">Sincronizado</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {userRole === 'standard' ? (
            <button onClick={() => setShowLoginModal(true)} className="p-3 bg-slate-50 rounded-2xl text-slate-300 active:scale-95"><Lock className="w-5 h-5" /></button>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={pullFromServer} className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl active:scale-90">
                <CloudDownload className="w-5 h-5" />
              </button>
              <div className="bg-indigo-600 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg shadow-indigo-100">
                <ShieldCheck className="w-3 h-3 text-white" />
                <span className="text-[10px] font-black text-white uppercase">Gestor</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 max-w-2xl pb-32">
        {activeTab === 'form' && (
          <FormView 
            key={formKey} 
            onSave={handleSaveSubmission} 
            svcList={svcList} 
            configSource="default"
            onNewForm={() => setFormKey(k => k + 1)}
          />
        )}
        
        {userRole === 'admin' && (
          <div className="animate-in fade-in duration-300">
            {activeTab === 'admin' && (
              <AdminDashboard 
                submissions={submissions} 
                onRefresh={() => { syncQueue(); pullFromServer(); }}
                isSyncing={isSyncing}
                lastSync={new Date()}
                svcList={svcList}
              />
            )}
            {activeTab === 'settings' && (
              <SettingsView 
                svcList={svcList} 
                onUpdate={(l) => { setSvcList(l); localStorage.setItem('fleet_svc_config', JSON.stringify(l)); }} 
                onClearData={() => { if(confirm('Resetar Tudo?')) { localStorage.clear(); indexedDB.deleteDatabase('FrotaHubDB'); window.location.reload(); }}}
                syncUrl={syncUrl}
                onUpdateSyncUrl={handleUpdateSyncUrl} 
                submissions={submissions}
                onImportData={() => {}}
                lastRawResponse=""
              />
            )}
          </div>
        )}
      </main>

      {userRole === 'admin' && (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-white border border-slate-200 shadow-2xl rounded-full flex justify-around p-1.5 z-[60]">
          <button onClick={() => setActiveTab('form')} className={`flex flex-col items-center gap-1 flex-1 py-3 rounded-full transition-all ${activeTab === 'form' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400'}`}>
            <ClipboardList className="w-5 h-5" />
          </button>
          <button onClick={() => setActiveTab('admin')} className={`flex flex-col items-center gap-1 flex-1 py-3 rounded-full transition-all ${activeTab === 'admin' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400'}`}>
            <LayoutDashboard className="w-5 h-5" />
          </button>
          <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 flex-1 py-3 rounded-full transition-all ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400'}`}>
            <Settings className="w-5 h-5" />
          </button>
        </nav>
      )}

      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8">
            <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2 uppercase text-center">Gestor Frota</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (passwordInput === '1234') { setUserRole('admin'); setShowLoginModal(false); setPasswordInput(''); }
              else { alert('Senha incorreta!'); }
            }} className="space-y-4">
              <input type="password" placeholder="Senha" autoFocus value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold text-center" />
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase text-[10px]">Entrar</button>
              <button type="button" onClick={() => setShowLoginModal(false)} className="w-full text-[9px] font-black text-slate-300 uppercase">Voltar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
