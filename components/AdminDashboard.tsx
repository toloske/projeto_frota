
import React, { useState, useMemo } from 'react';
import { FormData, DashboardStats } from '../types';
import { 
  Download, 
  Search, 
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Truck,
  TrendingUp,
  BarChart3,
  Clock,
  Filter
} from 'lucide-react';

interface Props {
  submissions: FormData[];
  onRefresh: () => void;
  isSyncing: boolean;
  lastSync: Date | null;
}

export const AdminDashboard: React.FC<Props> = ({ submissions, onRefresh, isSyncing, lastSync }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const vehicleRanking = useMemo(() => {
    const counts: Record<string, { count: number, reasons: string[] }> = {};
    submissions.forEach(s => {
      s.fleetStatus.filter(v => !v.running).forEach(v => {
        if (!counts[v.plate]) counts[v.plate] = { count: 0, reasons: [] };
        counts[v.plate].count += 1;
        if (v.justification && !counts[v.plate].reasons.includes(v.justification)) {
          counts[v.plate].reasons.push(v.justification);
        }
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5);
  }, [submissions]);

  const stats = useMemo(() => {
    if (submissions.length === 0) return null;
    let running: number = 0, stopped: number = 0, spot: number = 0;
    submissions.forEach(s => {
      running += s.fleetStatus.filter(v => v.running).length;
      stopped += s.fleetStatus.filter(v => !v.running).length;
      spot += (Object.values(s.spotOffers) as number[]).reduce((a: number, b: number) => a + b, 0);
    });
    return { 
      efficiency: ((running / (running + stopped)) * 100).toFixed(1),
      running, stopped, spot
    };
  }, [submissions]);

  const handleExportCSV = () => {
    if (submissions.length === 0) return;
    const headers = ["ID", "Data", "SVC", "Status Frota (Placa:Motivo)", "Total Spot"].join(",");
    const rows = submissions.map(s => {
      const stopped = s.fleetStatus.filter(v => !v.running).map(v => `${v.plate}:${v.justification}`).join("|");
      const totalSpot = (Object.values(s.spotOffers) as number[]).reduce((a: number, b: number) => a + b, 0);
      return [s.id, s.date, s.svc, stopped || "OK", totalSpot].join(",");
    });
    const blob = new Blob([headers + "\n" + rows.join("\n")], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Frota_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex justify-between items-end px-2">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Painel Central</h2>
          <div className="flex items-center gap-2 mt-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {lastSync ? `Atualizado às ${lastSync.toLocaleTimeString()}` : 'Aguardando sincronia...'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onRefresh} className={`p-3 bg-white border border-slate-100 rounded-2xl shadow-sm text-indigo-600 active:scale-90 transition-all ${isSyncing ? 'animate-spin' : ''}`}>
            <RefreshCw className="w-5 h-5" />
          </button>
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-lg text-[10px] font-black uppercase">
            <Download className="w-4 h-4" /> Exportar
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Eficiência Frota</span>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-slate-900 leading-none">{stats.efficiency}%</span>
              <TrendingUp className="w-4 h-4 text-emerald-500 mb-1" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Veículos SPOT</span>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-indigo-600 leading-none">{stats.spot}</span>
              <Truck className="w-4 h-4 text-indigo-300 mb-1" />
            </div>
          </div>
        </div>
      )}

      {/* Ranking de Indisponibilidade */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-4 h-4 text-rose-500" />
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Veículos mais parados (Semana)</h3>
        </div>
        <div className="space-y-4">
          {vehicleRanking.map(([plate, data]) => (
            <div key={plate} className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-10 bg-rose-500 rounded-full"></div>
                <div>
                  <span className="text-sm font-black text-slate-800">{plate}</span>
                  <div className="text-[8px] font-bold text-slate-400 uppercase">{data.reasons.join(', ')}</div>
                </div>
              </div>
              <div className="bg-rose-50 text-rose-600 px-3 py-1.5 rounded-xl text-[10px] font-black">
                {data.count}x
              </div>
            </div>
          ))}
          {vehicleRanking.length === 0 && (
            <div className="py-10 text-center">
              <span className="text-[10px] font-black text-slate-300 uppercase">Toda a frota rodando hoje</span>
            </div>
          )}
        </div>
      </div>

      {/* Lista de Relatórios */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          <input 
            type="text" 
            placeholder="Filtrar por SVC..." 
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm outline-none focus:border-indigo-500 transition-all font-bold text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid gap-3">
          {submissions.filter(s => s.svc.toLowerCase().includes(searchTerm.toLowerCase())).map(s => (
            <div key={s.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group active:scale-95 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                  {s.svc.slice(0, 3)}
                </div>
                <div>
                  <span className="text-lg font-black text-slate-800 block leading-none">{s.svc}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                    {new Date(s.timestamp).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {s.fleetStatus.filter(v => !v.running).length > 0 && (
                  <div className="bg-rose-50 text-rose-600 p-2 rounded-lg"><AlertCircle className="w-4 h-4" /></div>
                )}
                <ChevronRight className="w-5 h-5 text-slate-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
