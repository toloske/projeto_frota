
import React, { useState, useEffect } from 'react';
import { VEHICLE_CATEGORIES, STOPPED_JUSTIFICATIONS } from '../constants';
import { FormData, VehicleStatus, SVCConfig } from '../types';
import { 
  Calendar, 
  MapPin, 
  Truck, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Camera,
  Trash2,
  Send,
  Loader2,
  RefreshCw,
  FileCheck,
  Upload
} from 'lucide-react';

const getLocalDate = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
};

interface Props {
  onSave: (data: FormData) => void;
  svcList: SVCConfig[];
  onNewForm: () => void;
  isSyncing?: boolean;
}

export const FormView: React.FC<Props> = ({ onSave, svcList, onNewForm, isSyncing }) => {
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [date, setDate] = useState(getLocalDate());
  const [svc, setSvc] = useState('');
  
  const [spotOffers, setSpotOffers] = useState({
    bulkVan: 0,
    bulkVuc: 0,
    utilitarios: 0,
    van: 0,
    veiculoPasseio: 0,
    vuc: 0
  });

  const [fleetStatus, setFleetStatus] = useState<VehicleStatus[]>([]);
  const [baseCapacity, setBaseCapacity] = useState<Record<string, number>>(
    VEHICLE_CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat]: 0 }), {})
  );
  
  const [problems, setProblems] = useState<{ description: string; media: string[] }>({
    description: '',
    media: []
  });

  const [weeklyAcceptance, setWeeklyAcceptance] = useState<string | undefined>();
  const [acceptances, setAcceptances] = useState<string[]>([]);

  // Garantir que a tela suba ao mudar de passo no celular
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const handleSvcChange = (val: string) => {
    setSvc(val);
    const selectedSvc = svcList.find(s => s.id === val);
    if (selectedSvc) {
      setFleetStatus(selectedSvc.vehicles.map(v => ({
        plate: v.plate,
        category: v.category,
        running: true
      })));
    }
  };

  const handleSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!svc) { alert("Selecione um SVC."); return; }
    
    const finalData: FormData = {
      id: `REP-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase(),
      timestamp: new Date().toISOString(),
      date, svc, spotOffers, fleetStatus, baseCapacity, problems, weeklyAcceptance, acceptances
    };

    onSave(finalData);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in zoom-in duration-500 text-center px-6">
        <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-emerald-100">
          <CheckCircle2 className="w-12 h-12 text-white animate-bounce" />
        </div>
        <h2 className="text-3xl font-black text-slate-800 mb-2">Enviado!</h2>
        <p className="text-slate-500 font-bold mb-10 max-w-xs">Reporte de {svc} guardado com sucesso.</p>
        <button 
          onClick={onNewForm}
          className="w-full max-w-xs py-5 bg-indigo-600 text-white font-black rounded-3xl shadow-xl flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
        >
          Novo Reporte
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="pb-10 pt-4 relative">
      {isSyncing && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex flex-col items-center justify-center text-white p-10">
          <RefreshCw className="w-12 h-12 animate-spin mb-4" />
          <h3 className="text-xl font-black uppercase tracking-widest">Sincronizando...</h3>
        </div>
      )}

      {/* Barra de Progresso Compacta */}
      <div className="mb-8 flex items-center justify-between gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7].map(i => (
          <div key={i} className="flex-1 h-1.5 rounded-full relative bg-slate-200">
            <div className={`absolute inset-0 transition-all duration-500 rounded-full ${step >= i ? 'bg-indigo-600' : 'bg-transparent'}`} />
          </div>
        ))}
      </div>

      <div className="min-h-[400px]">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Identificação</h2>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Data da Operação</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl font-black text-lg border-2 border-transparent focus:border-indigo-500 outline-none" />
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <label className="text-[10px] font-black text-slate-400 uppercase block mb-4">Selecione o SVC</label>
              <div className="grid grid-cols-2 gap-2 max-h-[250px] overflow-y-auto pr-2">
                {svcList.map(s => (
                  <button key={s.id} onClick={() => handleSvcChange(s.id)} className={`p-4 rounded-2xl font-black text-sm border-2 transition-all ${svc === s.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl' : 'bg-white border-slate-100 text-slate-500'}`}>
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in">
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Ofertas SPOT</h2>
            {Object.keys(spotOffers).map(key => (
              <div key={key} className="bg-white p-5 rounded-3xl flex justify-between items-center shadow-sm">
                <span className="text-[10px] font-black uppercase text-slate-500">{key.replace(/([A-Z])/g, ' $1')}</span>
                <div className="flex items-center gap-4">
                  <button onClick={() => setSpotOffers(prev => ({...prev, [key]: Math.max(0, (prev as any)[key] - 1)}))} className="w-12 h-12 bg-slate-100 rounded-2xl font-black text-xl">-</button>
                  <span className="font-black text-indigo-600 text-xl w-6 text-center">{(spotOffers as any)[key]}</span>
                  <button onClick={() => setSpotOffers(prev => ({...prev, [key]: (prev as any)[key] + 1}))} className="w-12 h-12 bg-indigo-600 text-white rounded-2xl font-black text-xl">+</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in fade-in">
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Frota Parada</h2>
            <div className="space-y-3">
              {fleetStatus.length === 0 && (
                <div className="bg-indigo-50 p-6 rounded-3xl text-center border-2 border-dashed border-indigo-100">
                  <span className="text-[10px] font-black text-indigo-400 uppercase">Selecione o SVC no passo 1</span>
                </div>
              )}
              {fleetStatus.map(v => (
                <div key={v.plate} className={`p-5 rounded-3xl border-2 transition-all ${!v.running ? 'bg-rose-50 border-rose-500' : 'bg-white border-slate-50'}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-black text-xl text-slate-800 uppercase block">{v.plate}</span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{v.category}</span>
                    </div>
                    <button onClick={() => setFleetStatus(prev => prev.map(p => p.plate === v.plate ? {...p, running: !p.running} : p))} 
                      className={`px-6 py-4 rounded-2xl font-black text-[10px] uppercase shadow-sm ${v.running ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-600 text-white'}`}>
                      {v.running ? 'Rodou' : 'Parado'}
                    </button>
                  </div>
                  {!v.running && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {STOPPED_JUSTIFICATIONS.map(j => (
                        <button key={j} onClick={() => setFleetStatus(prev => prev.map(p => p.plate === v.plate ? {...p, justification: j} : p))}
                          className={`p-3 rounded-xl text-[9px] font-black uppercase border-2 ${v.justification === j ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-400 border-slate-100'}`}>
                          {j}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 animate-in fade-in">
             <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Capacidade Base</h2>
             {VEHICLE_CATEGORIES.map(cat => (
               <div key={cat} className="bg-white p-4 rounded-3xl flex justify-between items-center shadow-sm border border-slate-50">
                 <span className="text-[9px] font-black uppercase text-slate-500 flex-1 pr-4">{cat}</span>
                 <input 
                   type="number" 
                   inputMode="numeric"
                   value={baseCapacity[cat]} 
                   onChange={e => setBaseCapacity(prev => ({...prev, [cat]: parseInt(e.target.value) || 0}))} 
                   className="w-20 p-4 bg-slate-50 rounded-2xl text-center font-black outline-none border-2 border-transparent focus:border-indigo-500" 
                 />
               </div>
             ))}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Problemas Operacionais</h2>
            <textarea 
              placeholder="Relate quebras, atrasos ou problemas extras..." 
              value={problems.description} 
              onChange={e => setProblems(p => ({...p, description: e.target.value}))}
              className="w-full p-6 bg-white border-2 border-slate-100 focus:border-indigo-500 rounded-[2rem] min-h-[120px] font-bold text-slate-700 outline-none" 
            />
            
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center p-8 bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] cursor-pointer active:bg-slate-50 transition-colors">
                <Camera className="w-8 h-8 text-indigo-400 mb-2" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tirar Foto ou Anexar</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  className="hidden" 
                  onChange={e => {
                    const reader = new FileReader();
                    reader.onload = () => setProblems(p => ({...p, media: [...p.media, reader.result as string]}));
                    if(e.target.files?.[0]) reader.readAsDataURL(e.target.files[0]);
                  }} 
                />
              </label>
              
              <div className="grid grid-cols-4 gap-2">
                {problems.media.map((img, i) => (
                  <div key={i} className="aspect-square rounded-2xl overflow-hidden relative border border-slate-100 shadow-sm">
                    <img src={img} className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setProblems(p => ({...p, media: p.media.filter((_, idx) => idx !== i)}))} 
                      className="absolute top-1 right-1 bg-rose-500 text-white p-1.5 rounded-full shadow-lg"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                <FileCheck className="w-6 h-6 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Aceite Semanal</h2>
            </div>
            <p className="text-slate-500 font-bold text-sm leading-relaxed">Obrigatório anexar o print/foto do aceite semanal operacional.</p>
            
            {!weeklyAcceptance ? (
              <label className="flex flex-col items-center justify-center p-16 rounded-[2.5rem] border-4 border-dashed border-slate-100 bg-white hover:border-indigo-200 transition-all cursor-pointer">
                <Upload className="w-10 h-10 text-indigo-300 mb-4" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subir Print do Aceite</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  className="hidden" 
                  onChange={e => {
                    const reader = new FileReader();
                    reader.onload = () => setWeeklyAcceptance(reader.result as string);
                    if(e.target.files?.[0]) reader.readAsDataURL(e.target.files[0]);
                  }} 
                />
              </label>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white">
                  <img src={weeklyAcceptance} className="w-full max-h-[350px] object-contain bg-slate-100" />
                  <button 
                    onClick={() => setWeeklyAcceptance(undefined)}
                    className="absolute top-4 right-4 bg-rose-500 text-white p-4 rounded-2xl shadow-xl active:scale-90 transition-all flex items-center gap-2"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase">Excluir</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 7 && (
          <div className="space-y-8 animate-in fade-in">
            <h2 className="text-2xl font-black text-slate-800 text-center uppercase tracking-tight">Revisão Final</h2>
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-4">
               <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                 <span className="text-[10px] font-black text-slate-400 uppercase">SVC</span>
                 <span className="font-black text-indigo-600">{svc}</span>
               </div>
               <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                 <span className="text-[10px] font-black text-slate-400 uppercase">Data Op</span>
                 <span className="font-black text-slate-800">{date.split('-').reverse().join('/')}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-[10px] font-black text-slate-400 uppercase">Frota Parada</span>
                 <span className="font-black text-rose-500">{fleetStatus.filter(f => !f.running).length} veículos</span>
               </div>
            </div>
            
            <button 
              onClick={handleSubmit} 
              className="w-full py-8 bg-indigo-600 text-white font-black text-xl rounded-[3rem] shadow-2xl shadow-indigo-100 flex items-center justify-center gap-4 uppercase tracking-widest active:scale-95 transition-all"
            >
              Enviar Relatório
              <Send className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>

      {/* Navegação de Rodapé */}
      <div className="mt-12 flex justify-between gap-3">
        {step > 1 && (
          <button 
            onClick={() => setStep(s => s - 1)} 
            className="flex-1 py-5 bg-white text-slate-400 font-black rounded-[2rem] border border-slate-100 flex items-center justify-center gap-2 uppercase text-[10px]"
          >
            <ChevronLeft className="w-4 h-4" /> Anterior
          </button>
        )}
        {step < 7 && (
          <button 
            disabled={step === 1 && !svc}
            onClick={() => setStep(s => s + 1)} 
            className={`flex-1 py-5 font-black rounded-[2rem] shadow-xl flex items-center justify-center gap-2 uppercase text-[10px] transition-all ${(!svc && step === 1) ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white'}`}
          >
            Próximo <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
