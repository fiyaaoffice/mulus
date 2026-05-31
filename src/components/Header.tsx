import React from 'react';
import { Activity, ShieldCheck, Layers, AlertTriangle } from 'lucide-react';
import { Statistics } from '../types';
import logoMulus from '../assets/images/logo mulus.png';

interface HeaderProps {
  stats: Statistics;
  isAdmin: boolean;
  setIsAdmin: (val: boolean) => void;
  onShowArchives: () => void;
  showArchives: boolean;
  onOpenGuide: () => void;
}

export function Header({ stats, isAdmin, setIsAdmin, onShowArchives, showArchives, onOpenGuide }: HeaderProps) {
  return (
    <header className="border-b border-black/10 bg-white px-3.5 sm:px-6 md:px-8 py-2.5 sm:py-4 z-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 md:flex-row md:items-center md:justify-between">
        
        {/* Brand Logo & Actions in Row (responsive layout) */}
        <div className="flex items-center justify-between gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            <img 
              src={logoMulus} 
              alt="Logo Mulus" 
              className="h-7 w-auto object-contain rounded-md sm:h-9" 
            />
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[8px] sm:text-[9px] font-extrabold text-black/60 tracking-wider uppercase border border-black/5 leading-none">
                  INDONESIA
                </span>
              </div>
              <p className="font-sans text-[8px] sm:text-[10px] font-semibold text-black/40 mt-1">
                Visualisasi Kolaborasi Jalan Raya
              </p>
            </div>
          </div>

          {/* Mobile actions stacked nicely on the right corner of logo row */}
          <div className="flex items-center gap-1.5 md:hidden">
            <button
              onClick={onOpenGuide}
              title="Petunjuk Laporan"
              className="inline-flex items-center justify-center p-2 rounded-full border border-amber-200 bg-amber-50 text-amber-800 cursor-pointer hover:bg-amber-100 transition duration-150 shadow-2xs"
            >
              <Activity className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setIsAdmin(!isAdmin)}
              title={isAdmin ? 'Portal PUPR Aktif' : 'Akses Portal'}
              className={`inline-flex items-center justify-center p-2 rounded-full border cursor-pointer transition duration-150 shadow-2xs ${
                isAdmin 
                  ? 'border-neutral-900 bg-neutral-900 text-white' 
                  : 'border-black/10 bg-white text-black/70 hover:bg-zinc-50'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Dynamic Statistics Block styled as bento pieces */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Active Reports */}
          <div className="flex-1 md:flex-none flex items-center gap-2 rounded-xl border border-black/10 bg-zinc-50 p-1.5 px-3 shadow-xs transition md:rounded-2xl md:p-2.5 md:px-4">
            <AlertTriangle className="h-3.5 w-3.5 text-black animate-pulse sm:h-4 sm:w-4" />
            <div>
              <div className="font-extrabold text-black text-xs tracking-tight sm:text-sm leading-none md:leading-normal">{stats.totalActive}</div>
              <div className="text-[7px] sm:text-[9px] text-black/40 font-bold uppercase tracking-wider">Laporan Aktif</div>
            </div>
          </div>

          {/* Simple Archives / Selesai Toggle Button */}
          <button 
            id="btn_show_archives"
            onClick={onShowArchives}
            className={`flex-1 md:flex-none flex items-center gap-2 rounded-xl border p-1.5 px-3 shadow-xs transition cursor-pointer md:rounded-2xl md:p-2.5 md:px-4 text-left leading-none ${
              showArchives 
                ? 'border-black bg-black text-white hover:bg-neutral-900' 
                : 'border-black/10 bg-zinc-50 text-black hover:bg-zinc-100'
            }`}
          >
            <ShieldCheck className={`h-3.5 w-3.5 shrink-0 ${showArchives ? 'text-white' : 'text-black'} sm:h-4 sm:w-4`} />
            <div>
              <div className="font-extrabold text-[10px] sm:text-xs tracking-tight">Arsip Laporan</div>
              <div className="text-[7px] sm:text-[9px] uppercase tracking-wider font-semibold opacity-70 mt-0.5">
                {showArchives ? 'Selesai' : 'Mulai Tampil'}
              </div>
            </div>
          </button>
        </div>

        {/* Portal Trigger Toggle (Desktop only) */}
        <div id="admin_toggle" className="hidden md:flex items-center gap-2.5">
          <button
            onClick={onOpenGuide}
            className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-amber-800 px-4 py-2 text-xs font-bold tracking-tight shadow-sm cursor-pointer transition"
          >
            <Activity className="h-3.5 w-3.5" />
            Petunjuk Laporan
          </button>

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
