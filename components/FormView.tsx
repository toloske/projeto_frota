import React, { useState, useEffect, useRef } from 'react';
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
  Upload,
  Image as ImageIcon
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
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [date, setDate] = useState(getLocalDate());
  const [svc, setSvc] = useState('');
  
  const problemsInputRef = useRef<HTMLInputElement>(null);
  const acceptanceInputRef = useRef<HTMLInputElement>(null);

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

  // Garantir que a tela suba ao mudar de passo no celular com delay para reflow
  useEffect(() => {
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
    return () => clearTimeout(timer);
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

  const processFile = (file: File, callback: (base64: string) => void) => {
    setIsProcessingImage(true);
    const reader = new FileReader();
    reader.onload = () => {
      callback(reader.result as string);
      setIsProcessingImage(false);
    };
    reader.onerror = () => {
      alert("Erro ao processar imagem.");
      setIsProcessingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!svc) { alert("Selecione um SVC."); return; }
    
    const finalData: FormData = {
      id: `REP-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase(),
      timestamp: new Date().toISOString(),
      date, svc, spotOffers, fleetStatus, baseCapacity, problems, weeklyAcceptance,
      acceptances: []
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
      {(isSyncing || isProcessingImage) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex flex-col items-center justify-center text-white p-10">
          <div className="relative">
             <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
             <RefreshCw className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400" />
          </div>
          <h3 className="text-sm font-black uppercase tracking-[0.3em] mt-6">
            {isProcessingImage ? 'Processando Foto...' : 'Sincronizando...'}
          </h3>
        </div>
      )}

      {/* Barra de Progresso Compacta */}
      <div className="mb-8 flex items-center justify-between gap-1.5 px-1">
        {[1, 2, 3, 4, 5, 6, 7].map(i => (
          <div key={i} className="flex-1 h-1.5 rounded-full relative bg-slate-200 overflow-hidden">
            <div className={`absolute inset-0 transition-all duration-700 ${step >= i ? 'bg-indigo-600' : 'bg-transparent'}`} />
          </div>
        ))}
      </div>

      <div className="min-h-[450px]">
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
                  <button key={s.id} onClick={() => handleSvcChange(s.id)} className={`p-4 rounded-2xl font-black text-sm border-2 transition-all ${svc === s.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl scale-[0.98]' : 'bg-white border-slate-100 text-slate-500'}`}>
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
                <div className="bg-indigo-50 p-10 rounded-3xl text-center border-2 border-dashed border-indigo-100">
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
              <div 
                onClick={() => problemsInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-8 bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] cursor-pointer active:bg-slate-50 transition-colors relative"
              >
                <Camera className="w-8 h-8 text-indigo-400 mb-2" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Anexar Evidências</span>
                <input 
                  ref={problemsInputRef}
                  type="file" 
                  accept="image/*" 
                  multiple
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={e => {
                    const files = e.target.files;
                    if(files) {
                      Array.from(files).forEach(file => {
                        // Cast 'file' as 'File' to fix TypeScript inference as 'unknown' in Array.from(FileList)
                        processFile(file as File, (base64) => {
                          setProblems(p => ({...p, media: [...p.media, base64]}));
                        });
                      });
                    }
                  }} 
                />
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                {problems.media.map((img, i) => (
                  <div key={i} className="aspect-square rounded-2xl overflow-hidden relative border border-slate-100 shadow-sm group">
                    <img src={img} className="w-full h-full object-cover" />
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setProblems(p => ({...p, media: p.media.filter((_, idx) => idx !== i)}));
                      }} 
                      className="absolute top-2 right-2 bg-rose-500 text-white p-2 rounded-xl shadow-lg active:scale-90"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                <FileCheck className="w-6 h-6 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Aceite Semanal</h2>
            </div>
            
            <div className="bg-indigo-900 text-white p-6 rounded-[2rem] shadow-xl">
               <p className="text-[11px] font-bold uppercase leading-relaxed text-indigo-100">
                 É obrigatório anexar o print ou foto do aceite semanal operacional para prosseguir.
               </p>
            </div>
            
            {!weeklyAcceptance ? (
              <div 
                onClick={() => acceptanceInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-16 rounded-[2.5rem] border-4 border-dashed border-slate-200 bg-white active:bg-slate-50 transition-all cursor-pointer relative"
              >
                <Upload className="w-10 h-10 text-indigo-300 mb-4" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Subir Print do Aceite</span>
                <input 
                  ref={acceptanceInputRef}
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if(file) {
                      processFile(file, (base64) => setWeeklyAcceptance(base64));
                    }
                  }} 
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white bg-slate-100">
                  <img src={weeklyAcceptance} className="w-full max-h-[400px] object-contain" />
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                    <button 
                      onClick={() => setWeeklyAcceptance(undefined)}
                      className="w-full py-4 bg-rose-600 text-white rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                      <Trash2 className="w-5 h-5" />
                      <span className="text-[10px] font-black uppercase">Remover e Tirar Outra</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 7 && (
          <div className="space-y-8 animate-in fade-in duration-700">
            <h2 className="text-2xl font-black text-slate-800 text-center uppercase tracking-tight">Revisão Final</h2>
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-4">
               <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                 <span className="text-[10px] font-black text-slate-400 uppercase">SVC</span>
                 <span className="font-black text-indigo-600 text-lg">{svc}</span>
               </div>
               <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                 <span className="text-[10px] font-black text-slate-400 uppercase">Data Op</span>
                 <span className="font-black text-slate-800">{date.split('-').reverse().join('/')}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-[10px] font-black text-slate-400 uppercase">Frota Parada</span>
                 <span className={`font-black ${fleetStatus.filter(f => !f.running).length > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                   {fleetStatus.filter(f => !f.running).length} veículos
                 </span>
               </div>
            </div>

            <div className="bg-emerald-50 p-6 rounded-[2.5rem] border-2 border-emerald-100 flex items-center gap-4">
               <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-white" />
               </div>
               <p className="text-[10px] font-black text-emerald-700 uppercase leading-relaxed">Tudo pronto para envio. Verifique se os dados estão corretos.</p>
            </div>
            
            <button 
              onClick={handleSubmit} 
              className="w-full py-8 bg-indigo-600 text-white font-black text-xl rounded-[3rem] shadow-2xl shadow-indigo-100 flex items-center justify-center gap-4 uppercase tracking-widest active:scale-95 transition-all"
            >
              Enviar Agora
              <Send className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>

      {/* Navegação de Rodapé */}
      <div className="mt-12 flex justify-between gap-3 px-1">
        {step > 1 && (
          <button 
            onClick={() => setStep(s => s - 1)} 
            className="flex-1 py-5 bg-white text-slate-400 font-black rounded-[2rem] border border-slate-100 flex items-center justify-center gap-2 uppercase text-[10px] active:bg-slate-50"
          >
            <ChevronLeft className="w-4 h-4" /> Anterior
          </button>
        )}
        {step < 7 && (
          <button 
            disabled={step === 1 && !svc}
            onClick={() => setStep(s => s + 1)} 
            className={`flex-1 py-5 font-black rounded-[2rem] shadow-xl flex items-center justify-center gap-2 uppercase text-[10px] transition-all active:scale-[0.98] ${(!svc && step === 1) ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white'}`}
          >
            {step === 6 && !weeklyAcceptance ? 'Anexar Aceite' : 'Próximo'} <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
