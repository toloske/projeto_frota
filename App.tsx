
import React, { useState, useEffect, useCallback } from 'react';
import { FormView } from './components/FormView';
import { AdminDashboard } from './components/AdminDashboard';
import { SettingsView } from './components/SettingsView';
import { FormData, SVCConfig } from './types';
import { DEFAULT_SVC_LIST, NATIVE_SHEET_URL } from './constants';
import * as db from './db';
import { 
  ClipboardList, 
  LayoutDashboard, 
  Settings, 
  Lock,
  ShieldCheck,
  RefreshCw,
  Wifi,
  WifiOff,
  CloudDownload,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<'standard' | 'admin'>('standard');
  const [activeTab, setActiveTab] = useState<'form' | 'admin' | 'settings'>('form');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [svcList, setSvcList] = useState<SVCConfig[]>([]);
  const [formKey, setFormKey] = useState(0);
  
  // A URL agora é fixa vinda das constantes, mas permitimos override se for um link válido
  const [syncUrl, setSyncUrl] = useState<string>(() => {
    const saved = localStorage.getItem('fleet_sync_url');
    // Se a URL nativa no código for válida, ela manda. Caso contrário, busca do localStorage.
    return (NATIVE_SHEET_URL && NATIVE_SHEET_URL.length > 20) ? NATIVE_SHEET_URL : (saved || "");
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [pendingCount, setPendingCount] = useState(0);

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

  // Sincronização de saída (Push)
  const syncQueue = useCallback(async () => {
    if (!syncUrl || syncUrl.length < 20 || isSyncing) return;
    
    const pending = await db.getPendingSubmissions();
    if (pending.length === 0) {
      setPendingCount(0);
      setSyncError(false);
      return;
    }

    setIsSyncing(true);
    setSyncError(false);

    for (const item of pending) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); 

        // IMPORTANTE: Enviamos como text/plain para evitar o erro de CORS do Google
        // O mode: 'no-cors' garante que o navegador envie o dado mesmo sem confirmação total
        await fetch(syncUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ type: 'report', data: item }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Em modo 'no-cors', não conseguimos ler a resposta, então se não deu erro de rede, 
        // assumimos que o Google recebeu para não travar a fila do usuário.
        await db.markAsSynced(item.id);
      } catch (e) {
        console.error("Erro na sincronização:", e);
        setSyncError(true);
        break; 
      }
    }

    await refreshLocalData();
    setIsSyncing(false);
  }, [syncUrl, isSyncing, refreshLocalData]);

  const pullFromServer = useCallback(async () => {
    if (!syncUrl || userRole !== 'admin' || isSyncing) return;
    
    setIsSyncing(true);
    try {
      const response = await fetch(`${syncUrl}?t=${Date.now()}`);
      if (!response.ok) throw new Error("Erro servidor");
      const data = await response.json();
      
      if (data && data.submissions) {
        await db.upsertSubmissionsFromServer(data.submissions);
        await refreshLocalData();
      }
    } catch (e) {
      console.error("Erro ao baixar dados:", e);
    } finally {
      setIsSyncing(false);
    }
  }, [syncUrl, userRole, isSyncing, refreshLocalData]);

  useEffect(() => {
    const interval = setInterval(() => {
      syncQueue();
      if (userRole === 'admin' && activeTab === 'admin') pullFromServer();
    }, 30000);
    return () => clearInterval(interval);
  }, [syncQueue, pullFromServer, userRole, activeTab]);

  const handleSaveSubmission = async (data: FormData) => {
    await db.saveSubmission(data);
    await refreshLocalData();
    setTimeout(syncQueue, 1000); 
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
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-sm ${isSyncing ? 'bg-indigo-600 animate-pulse' : (syncError ? 'bg-rose-500' : (pendingCount > 0 ? 'bg-amber-100' : 'bg-slate-100'))}`}
            >
              {isSyncing ? <RefreshCw className="w-5 h-5 text-white animate-spin" /> : (syncError ? <WifiOff className="w-5 h-5 text-white" /> : (pendingCount > 0 ? <Wifi className="w-5 h-5 text-amber-600" /> : <CheckCircle2 className="w-5 h-5 text-emerald-500" />))}
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-tight leading-none">Frota Hub</h1>
              <div className="flex items-center gap-1.5 mt-1">
                {pendingCount > 0 ? (
                  <div className="flex items-center gap-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    <span className="text-[9px] font-black text-amber-600 uppercase">{pendingCount} na fila</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    <span className="text-[9px] font-black text-emerald-500 uppercase">Sincronizado</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {userRole === 'standard' ? (
            <button onClick={() => setShowLoginModal(true)} className="p-3 bg-slate-100 rounded-2xl text-slate-400 active:scale-95"><Lock className="w-5 h-5" /></button>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={pullFromServer} className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl active:scale-90">
                <CloudDownload className="w-5 h-5" />
              </button>
              <div className="bg-indigo-600 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-lg shadow-indigo-100">
                <ShieldCheck className="w-3 h-3 text-white" />
                <span className="text-[10px] font-black text-white uppercase">Gestor</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 max-w-2xl pb-32">
        {(!syncUrl || syncUrl.length < 10) && activeTab === 'form' && (
          <div className="mb-6 p-5 bg-rose-50 border border-rose-100 rounded-3xl flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-rose-500 shrink-0" />
            <div>
              <p className="text-[10px] font-black text-rose-800 uppercase">Falta URL do Servidor</p>
              <p className="text-[10px] font-medium text-rose-700 leading-tight">Você precisa editar o arquivo constants.ts e colar a URL do seu Google Script.</p>
            </div>
          </div>
        )}

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
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-white border border-slate-200 shadow-2xl rounded-[2.5rem] flex justify-around p-1.5 z-[60]">
          <button onClick={() => setActiveTab('form')} className={`flex flex-col items-center gap-1 flex-1 py-4 rounded-[2rem] transition-all ${activeTab === 'form' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>
            <ClipboardList className="w-5 h-5" />
          </button>
          <button onClick={() => setActiveTab('admin')} className={`flex flex-col items-center gap-1 flex-1 py-4 rounded-[2rem] transition-all ${activeTab === 'admin' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>
            <LayoutDashboard className="w-5 h-5" />
          </button>
          <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 flex-1 py-4 rounded-[2rem] transition-all ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>
            <Settings className="w-5 h-5" />
          </button>
        </nav>
      )}

      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl p-10">
            <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center justify-center gap-2 uppercase tracking-tighter">Área do Gestor</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (passwordInput === '1234') { setUserRole('admin'); setShowLoginModal(false); setPasswordInput(''); }
              else { alert('Senha incorreta!'); }
            }} className="space-y-4">
              <input 
                type="password" 
                placeholder="DIGITE A SENHA" 
                autoFocus 
                value={passwordInput} 
                onChange={(e) => setPasswordInput(e.target.value)} 
                className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-black text-center text-lg tracking-widest" 
              />
              <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl uppercase text-[12px] shadow-lg shadow-indigo-100">Acessar Painel</button>
              <button type="button" onClick={() => setShowLoginModal(false)} className="w-full text-[10px] font-black text-slate-300 uppercase py-2">Voltar ao Formulário</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
