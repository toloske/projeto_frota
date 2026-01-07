
import React, { useState } from 'react';
import { SVCConfig, FormData } from '../types';
import { 
  Cloud, 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  Smartphone,
  CheckCircle,
  Copy,
  Check,
  Share2,
  ExternalLink,
  MessageCircle,
  Link as LinkIcon
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
  const [copiedLink, setCopiedLink] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const handleSave = () => {
    onUpdateSyncUrl(newUrl);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 3000);
  };

  const generateAccessLink = () => {
    if (!syncUrl) {
      alert("Defina primeiro o link de sincronia antes de gerar o acesso da equipe.");
      return;
    }
    const configBase64 = btoa(encodeURIComponent(syncUrl));
    const accessUrl = `${window.location.origin}${window.location.pathname}?config=${configBase64}`;
    
    navigator.clipboard.writeText(accessUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const exportLocalDb = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(submissions));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "frota_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Configuração do Banco de Dados (Link do Google Script) */}
      <div className="bg-indigo-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <Cloud className="w-6 h-6 text-indigo-300" />
            <h2 className="text-xl font-black uppercase tracking-tight">Conexão Mestra</h2>
          </div>
          
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-indigo-300 tracking-widest block">URL do Google Apps Script</label>
            <input 
              type="text" 
              placeholder="Cole aqui o link do script..."
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="w-full p-4 bg-white/10 border-2 border-white/20 rounded-2xl outline-none focus:border-white transition-all text-xs font-mono"
            />
            <button 
              onClick={handleSave}
              className={`w-full py-4 font-black rounded-2xl shadow-lg uppercase text-[10px] tracking-widest transition-all ${justSaved ? 'bg-emerald-500 text-white' : 'bg-white text-indigo-900'}`}
            >
              {justSaved ? 'Salvo com Sucesso!' : 'Salvar URL'}
            </button>
          </div>
        </div>
      </div>

      {/* NOVO: Link de Acesso para Equipe */}
      <div className="bg-emerald-50 p-8 rounded-[2.5rem] border border-emerald-100 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <Share2 className="w-6 h-6 text-emerald-600" />
          <h2 className="text-xl font-black text-emerald-900 uppercase tracking-tight">Acesso da Equipe</h2>
        </div>
        <p className="text-[10px] font-bold text-emerald-700 uppercase leading-relaxed">
          Gere um link para os funcionários. Quando eles abrirem no celular, o app se conectará sozinho ao banco de dados sem precisar digitar nada.
        </p>
        <button 
          onClick={generateAccessLink}
          className={`w-full py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 transition-all ${copiedLink ? 'bg-emerald-600 text-white' : 'bg-white border-2 border-emerald-200 text-emerald-700 shadow-sm active:bg-emerald-100'}`}
        >
          {copiedLink ? (
            <><Check className="w-5 h-5" /> Link Copiado!</>
          ) : (
            <><LinkIcon className="w-5 h-5" /> Copiar Link de Acesso</>
          )}
        </button>
        {copiedLink && (
          <div className="flex items-center gap-2 justify-center animate-in fade-in slide-in-from-top-1">
            <MessageCircle className="w-3 h-3 text-emerald-500" />
            <span className="text-[9px] font-black text-emerald-500 uppercase">Agora cole no WhatsApp da Equipe!</span>
          </div>
        )}
      </div>

      {/* Backup e Reset */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <Database className="w-6 h-6 text-slate-400" />
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Manutenção</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={exportLocalDb} className="flex flex-col items-center justify-center gap-3 p-6 bg-slate-50 rounded-3xl border border-slate-100">
            <Download className="w-6 h-6 text-indigo-600" />
            <span className="text-[9px] font-black uppercase text-slate-700">Backup</span>
          </button>
          <button onClick={onClearData} className="flex flex-col items-center justify-center gap-3 p-6 bg-rose-50 rounded-3xl border border-rose-100">
            <Trash2 className="w-6 h-6 text-rose-500" />
            <span className="text-[9px] font-black uppercase text-rose-800">Resetar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
