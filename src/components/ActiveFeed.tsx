import React, { useState } from 'react';
import { Search, MapPin, ThumbsUp, MessageSquare, Flame, CheckCircle, ChevronRight, Archive, Clock, AlertTriangle } from 'lucide-react';
import { PotholeReport } from '../types';

interface ActiveFeedProps {
  reports: PotholeReport[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpvote: (id: string, e: React.MouseEvent) => void;
  showArchivesOnly: boolean;
}

export function ActiveFeed({ reports, selectedId, onSelect, onUpvote, showArchivesOnly }: ActiveFeedProps) {
  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  // Filter reports based on active status vs archive status
  const currentStatusReports = reports.filter(r => 
    showArchivesOnly ? r.status === 'resolved' : r.status !== 'resolved'
  );

  // Search and filter severity
  const filtered = currentStatusReports.filter(r => {
    const matchesSearch = 
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.roadName.toLowerCase().includes(search.toLowerCase()) ||
      r.city.toLowerCase().includes(search.toLowerCase()) ||
      r.province.toLowerCase().includes(search.toLowerCase());
    
    const matchesSeverity = filterSeverity === 'all' || r.severity === filterSeverity;
    return matchesSearch && matchesSeverity;
  });

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 font-mono text-[9px] font-extrabold text-red-700 uppercase tracking-widest">
            <Flame className="h-3 w-3 text-red-600" /> Kritis
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 font-mono text-[9px] font-extrabold text-amber-700 uppercase tracking-widest">
            <AlertTriangle className="h-3 w-3 text-amber-600" /> Sedang
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 font-mono text-[9px] font-extrabold text-zinc-600 uppercase tracking-widest">
            <Clock className="h-3 w-3" /> Ringan
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 rounded-lg bg-black px-2.5 py-1 font-sans text-[9px] font-bold text-white tracking-wider uppercase">
            <CheckCircle className="h-2.5 w-2.5" /> Mulus
          </span>
        );
      case 'repairing':
        return (
          <span className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 bg-zinc-100 px-2.5 py-1 font-sans text-[9px] font-bold text-zinc-800 tracking-wider uppercase">
            Perbaikan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 font-sans text-[9px] font-bold text-zinc-500 tracking-wider uppercase">
            Pending
          </span>
        );
    }
  };

  return (
    <div className="flex h-full flex-col bg-white border-r border-black/10">
      {/* Title block */}
      <div className="p-6 border-b border-black/10 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-sans font-extrabold tracking-tight text-black text-sm flex items-center gap-2">
            {showArchivesOnly ? (
              <>
                <Archive className="h-4 w-4 text-black" />
                Arsip Jalan Mulus ({filtered.length})
              </>
            ) : (
              <>
                <Search className="h-4 w-4 text-black" />
                Laporan Terbaru ({filtered.length})
              </>
            )}
          </h2>
          <span className="font-mono text-[10px] font-bold text-black/30 tracking-wider">LRP-IDN</span>
        </div>

        {/* Search Input styled as bento inputs */}
        <div className="relative mb-3">
          <Search className="absolute top-3 left-3.5 h-4 w-4 text-black/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari lokasi, jalan..."
            className="w-full rounded-full border border-black/10 bg-zinc-100 px-4 py-2.5 pl-10 font-sans text-xs outline-none transition focus:border-black/20 focus:bg-white placeholder:text-black/30 text-black font-semibold"
          />
        </div>

        {/* Filter severity */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-black/40 font-bold uppercase tracking-wider mr-1">Filter:</span>
          {['all', 'critical', 'medium', 'low'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`rounded-lg px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-widest border cursor-pointer transition duration-150 ${
                filterSeverity === sev
                  ? 'bg-black text-white border-black'
                  : 'bg-zinc-100 text-black/60 border-transparent hover:border-black/10 hover:bg-zinc-200/50'
              }`}
            >
              {sev === 'all' ? 'Semua' : sev === 'critical' ? 'Kritis' : sev === 'medium' ? 'Sedang' : 'Ringan'}
            </button>
          ))}
        </div>
      </div>

      {/* Feed list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 bg-zinc-50/50">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="h-12 w-12 flex items-center justify-center rounded-full bg-zinc-100 text-black/30 border border-black/5 mb-3">
              <Search className="h-5 w-5" />
            </div>
            <p className="font-sans text-xs font-bold text-black">Tidak ada laporan ditemukan</p>
            <p className="font-sans text-[11px] text-black/40 mt-1">Ganti rincian pencarian atau filter untuk hasil lainnya.</p>
          </div>
        ) : (
          filtered.map((report) => (
            <div
              key={report.id}
              onClick={() => onSelect(report.id)}
              className={`group flex flex-col justify-between overflow-hidden rounded-2xl border p-4.5 transition duration-200 cursor-pointer bg-white relative ${
                selectedId === report.id
                  ? 'border-black ring-1 ring-black shadow-md'
                  : 'border-black/5 hover:border-black/15 hover:shadow-sm'
              }`}
            >
              <div className="flex gap-4">
                {/* Image clip */}
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-black/5 bg-zinc-100">
                  <img
                    src={report.imageUrl}
                    alt={report.title}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                    {getSeverityBadge(report.severity)}
                    {getStatusBadge(report.status)}
                  </div>
                  <h3 className="font-sans font-bold tracking-tight text-neutral-900 text-xs truncate group-hover:text-black">
                    {report.title}
                  </h3>
                  <p className="font-sans text-[10px] text-neutral-500 font-medium flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3 shrink-0 text-neutral-400" />
                    <span className="truncate">{report.roadName}, {report.city}</span>
                  </p>
                </div>
              </div>

              {/* Card Footer with actions */}
              <div className="flex items-center justify-between border-t border-neutral-100 mt-3 pt-2.5">
                <span className="text-[9px] font-mono text-neutral-400">
                  {new Date(report.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: '2-digit'
                  })}
                </span>

                <div className="flex items-center gap-3">
                  {/* Upvotes button */}
                  <button
                    onClick={(e) => onUpvote(report.id, e)}
                    className="inline-flex items-center gap-1 rounded-full bg-neutral-50 hover:bg-neutral-100 border border-neutral-150 px-2 py-1 text-[10px] font-semibold text-neutral-700 cursor-pointer transition active:scale-95"
                  >
                    <ThumbsUp className="h-3 w-3 text-neutral-900" />
                    <span>{report.upvotes}</span>
                  </button>

                  {/* Comments count */}
                  <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-neutral-400">
                    <MessageSquare className="h-3 w-3" />
                    <span>{report.comments.length}</span>
                  </div>

                  {/* Visual trigger indicator */}
                  <ChevronRight className="h-3.5 w-3.5 text-neutral-300 group-hover:text-black group-hover:translate-x-0.5 transition" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
