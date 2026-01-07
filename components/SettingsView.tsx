
import React, { useState } from 'react';
import { SVCConfig, FormData } from '../types';
import { 
  Cloud, 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  Plus, 
  ChevronDown, 
  ExternalLink,
  ShieldCheck,
  Info,
  Copy,
  Check,
  Smartphone
} from 'lucide-react';

interface Props {
  svcList: SVCConfig[];
  onUpdate: (newList: SVCConfig[]) => void;
  onClearData: () => void;
  syncUrl: string;
  onUpdateSyncUrl: (url: string) => void;
  submissions: FormData[];
  onImportData: (data: FormData[]) => void;
}

export const SettingsView: React.FC<Props> = ({ 
  svcList, onUpdate, onClearData, syncUrl, onUpdateSyncUrl, submissions, onImportData 
}) => {
  const [newUrl, setNewUrl] = useState(syncUrl);
  const [showSyncInfo, setShowSyncInfo] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(syncUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportLocalDb = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(submissions));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "frota_hub_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const importLocalDb = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          if (Array.isArray(json)) {
            onImportData(json);
            alert("Banco de dados importado com sucesso!");
          }
        } catch (err) {
          alert("Erro ao importar arquivo.");
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-8 pb-20 animate-in slide-in-from-bottom-6 duration-400">
      {/* Sincronização em Nuvem */}
      <div className="bg-indigo-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Cloud className="w-8 h-8 text-indigo-300" />
            <h2 className="text-2xl font-black uppercase tracking-tight leading-none">Sincronizar Nuvem</h2>
          </div>
          
          <div className="bg-white/10 p-4 rounded-2xl mb-6 flex items-start gap-3 border border-white/10">
            <Smartphone className="w-5 h-5 text-indigo-300 shrink-0 mt-1" />
            <p className="text-indigo-200 text-[9px] font-bold uppercase leading-relaxed">
              Atenção: Para o celular sincronizar com o computador, cole EXATAMENTE o mesmo link nos dois aparelhos.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Colar URL do Web App (Google Scripts)"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="w-full p-4 bg-white/10 border-2 border-white/20 rounded-2xl outline-none focus:border-white transition-all text-xs font-mono pr-12"
              />
              {syncUrl && (
                <button 
                  onClick={handleCopyUrl}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-indigo-300" />}
                </button>
              )}
            </div>
            
            <button 
              onClick={() => onUpdateSyncUrl(newUrl)}
              className="w-full py-4 bg-white text-indigo-900 font-black rounded-2xl shadow-lg uppercase text-[10px] tracking-widest active:scale-95 transition-all"
            >
              Salvar Link de Sincronia
            </button>
            
            <button 
              onClick={() => setShowSyncInfo(!showSyncInfo)}
              className="w-full flex items-center justify-center gap-2 text-[8px] font-bold uppercase text-indigo-300"
            >
              <Info className="w-3 h-3" /> Como configurar a planilha?
            </button>
          </div>

          {showSyncInfo && (
            <div className="mt-6 p-6 bg-white/10 rounded-3xl text-[10px] leading-relaxed border border-white/10 animate-in fade-in zoom-in-95">
              <p className="font-bold text-white mb-2">Siga estes passos:</p>
              <ol className="list-decimal list-inside space-y-2 text-indigo-100">
                <li>Abra uma Planilha Google.</li>
                <li>Vá em Extensões {'>'} Apps Script.</li>
                <li>Crie um script com funções doGet(e) e doPost(e).</li>
                <li>Clique em Implantar {'>'} Nova Implantação {'>'} App Web.</li>
                <li>Em "Quem pode acessar", selecione "Qualquer pessoa".</li>
                <li>Copie o link gerado e cole no campo acima em cada aparelho.</li>
              </ol>
            </div>
          )}
        </div>
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-20 -mt-20"></div>
      </div>

      {/* Backup e Manutenção */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-50">
        <div className="flex items-center gap-3 mb-8">
          <Database className="w-6 h-6 text-slate-400" />
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Banco de Dados Local</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={exportLocalDb}
            className="flex items-center justify-center gap-3 p-5 bg-slate-50 hover:bg-slate-100 rounded-2xl border-2 border-transparent transition-all"
          >
            <Download className="w-5 h-5 text-indigo-600" />
            <div className="text-left">
              <span className="block text-xs font-black text-slate-800 uppercase tracking-tight leading-none">Exportar JSON</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase">Backup manual dos dados</span>
            </div>
          </button>

          <label className="flex items-center justify-center gap-3 p-5 bg-slate-50 hover:bg-slate-100 rounded-2xl border-2 border-transparent transition-all cursor-pointer">
            <Upload className="w-5 h-5 text-emerald-600" />
            <div className="text-left">
              <span className="block text-xs font-black text-slate-800 uppercase tracking-tight leading-none">Importar JSON</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase">Restaurar de outro aparelho</span>
            </div>
            <input type="file" accept=".json" onChange={importLocalDb} className="hidden" />
          </label>

          <button 
            onClick={onClearData}
            className="flex items-center justify-center gap-3 p-5 bg-rose-50 hover:bg-rose-100 rounded-2xl border-2 border-transparent transition-all col-span-full"
          >
            <Trash2 className="w-5 h-5 text-rose-500" />
            <div className="text-left">
              <span className="block text-xs font-black text-rose-800 uppercase tracking-tight leading-none">Limpar Tudo</span>
              <span className="text-[8px] font-bold text-rose-400 uppercase">Resetar banco de dados</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
