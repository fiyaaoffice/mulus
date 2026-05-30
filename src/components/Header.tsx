import React from 'react';
import { Activity, ShieldCheck, CheckCircle2, Users, Layers, AlertTriangle } from 'lucide-react';
import { Statistics } from '../types';

interface HeaderProps {
  stats: Statistics;
  isAdmin: boolean;
  setIsAdmin: (val: boolean) => void;
  onShowArchives: () => void;
  showArchives: boolean;
}

export function Header({ stats, isAdmin, setIsAdmin, onShowArchives, showArchives }: HeaderProps) {
  return (
    <header className="border-b border-black/10 bg-white px-8 py-5 z-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Brand Logo & Motto - Bento typography */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <img 
              src="/src/assets/images/logo mulus.png" 
              alt="Logo Mulus" 
              className="h-9 w-auto object-contain rounded-md" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block rounded-full bg-zinc-100 px-2.5 py-0.5 text-[9px] font-bold text-black/60 tracking-wider uppercase border border-black/5">
                INDONESIA
              </span>
            </div>
            <p className="font-sans text-xs font-semibold text-black/40">
              Visualisasi & Kolaborasi Infrastruktur Jalan Indonesia
            </p>
          </div>
        </div>

        {/* Dynamic Statistics Block styled as bento pieces */}
        <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs font-sans">
          {/* Active Reports */}
          <div className="flex items-center gap-2.5 rounded-2xl border border-black/10 bg-zinc-50 p-2.5 px-4 shadow-xs transition hover:bg-zinc-100">
            <AlertTriangle className="h-4 w-4 text-black animate-pulse" />
            <div>
              <div className="font-extrabold text-black text-sm tracking-tight">{stats.totalActive}</div>
              <div className="text-[9px] text-black/40 font-bold uppercase tracking-wider">Laporan Aktif</div>
            </div>
          </div>

          {/* Simple Archives / Selesai Toggle Button (stat removed as requested) */}
          <button 
            id="btn_show_archives"
            onClick={onShowArchives}
            className={`flex items-center gap-2 rounded-2xl border p-2.5 px-4 shadow-xs transition cursor-pointer text-left ${
              showArchives 
                ? 'border-black bg-black text-white hover:bg-neutral-900' 
                : 'border-black/10 bg-zinc-50 text-black hover:bg-zinc-100'
            }`}
          >
            <ShieldCheck className={`h-4 w-4 ${showArchives ? 'text-white' : 'text-black'}`} />
            <div>
              <div className="font-extrabold text-xs tracking-tight">Arsip Laporan</div>
              <div className="text-[9px] uppercase tracking-wider font-semibold opacity-70">
                {showArchives ? 'Menampilkan Selesai' : 'Tampilkan Selesai'}
              </div>
            </div>
          </button>
        </div>

        {/* Portal Trigger Toggle */}
        <div id="admin_toggle" className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={() => setIsAdmin(!isAdmin)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold tracking-tight shadow-sm transition cursor-pointer ${
              isAdmin 
                ? 'border-black bg-black text-white hover:bg-neutral-900' 
                : 'border-black/10 bg-white text-black/70 hover:bg-zinc-50'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            {isAdmin ? 'Portal PUPR Aktif' : 'Akses Portal'}
          </button>
        </div>
      </div>
    </header>
  );
}
