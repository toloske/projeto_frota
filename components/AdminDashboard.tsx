
import React, { useState, useMemo } from 'react';
import { FormData } from '../types';
import { 
  Download, 
  Search, 
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Truck,
  TrendingUp,
  Clock
} from 'lucide-react';

interface Props {
  submissions: FormData[];
  onRefresh: () => void;
  isSyncing: boolean;
  lastSync: Date | null;
}

export const AdminDashboard: React.FC<Props> = ({ submissions, onRefresh, isSyncing, lastSync }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const stats = useMemo(() => {
    if (submissions.length === 0) return null;
    let running = 0, stopped = 0, spot = 0;
    submissions.forEach(s => {
      running += s.fleetStatus.filter(v => v.running).length;
      stopped += s.fleetStatus.filter(v => !v.running).length;
      spot += (Object.values(s.spotOffers) as number[]).reduce((a, b) => a + b, 0);
    });
    return { 
      efficiency: ((running / (running + stopped)) * 100).toFixed(1),
      running, stopped, spot
    };
  }, [submissions]);

  const handleExportCSV = () => {
    if (submissions.length === 0) return;
    const headers = ["ID", "Data", "SVC", "Parados", "Spot"].join(",");
    const rows = submissions.map(s => [
      s.id, s.date, s.svc, 
      s.fleetStatus.filter(v => !v.running).length,
      (Object.values(s.spotOffers) as number[]).reduce((a, b) => a + b, 0)
    ].join(","));
    const blob = new Blob([headers + "\n" + rows.join("\n")], { type: 'text/csv' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_frota_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const filteredSubmissions = submissions.filter(s => 
    s.svc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Relatórios Recebidos</h2>
          <div className="flex items-center gap-2 mt-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              {lastSync ? `Última atualização: ${lastSync.toLocaleTimeString()}` : 'Aguardando dados...'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onRefresh} className={`p-4 bg-slate-50 text-indigo-600 rounded-2xl active:scale-90 transition-all ${isSyncing ? 'animate-spin' : ''}`}>
            <RefreshCw className="w-5 h-5" />
          </button>
          <button onClick={handleExportCSV} className="p-4 bg-slate-900 text-white rounded-2xl shadow-lg active:scale-95 transition-all">
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Eficiência da Frota</span>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-slate-900 leading-none">{stats.efficiency}%</span>
              <TrendingUp className="w-4 h-4 text-emerald-500 mb-1" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Total de SPOT</span>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-indigo-600 leading-none">{stats.spot}</span>
              <Truck className="w-4 h-4 text-indigo-300 mb-1" />
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Filtrar por SVC..." 
            className="w-full pl-14 pr-6 py-5 bg-white border border-slate-100 rounded-3xl shadow-sm outline-none focus:border-indigo-500 transition-all font-bold text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid gap-3">
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200">
              <p className="text-slate-400 font-bold uppercase text-xs">Nenhum reporte encontrado</p>
            </div>
          ) : (
            filteredSubmissions.map(s => (
              <div key={s.id} className="bg-white p-6 rounded-[2rem] border border-slate-50 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    {s.svc.slice(0, 3)}
                  </div>
                  <div>
                    <span className="text-lg font-black text-slate-800 block leading-tight">{s.svc}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {new Date(s.timestamp).toLocaleDateString()} • {new Date(s.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {s.fleetStatus.some(v => !v.running) && (
                    <div className="bg-rose-50 text-rose-500 p-2.5 rounded-xl border border-rose-100">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                  )}
                  <ChevronRight className="w-5 h-5 text-slate-200" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
