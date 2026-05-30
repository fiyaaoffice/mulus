import React, { useState } from 'react';
import { X, ThumbsUp, MessageSquare, Shield, Clock, Heart, Hammer, HardHat, Check, User, ArrowRight, ExternalLink, Trash2, AlertCircle } from 'lucide-react';
import { PotholeReport } from '../types';

interface PotholeModalProps {
  report: PotholeReport;
  onClose: () => void;
  onUpvote: (id: string) => void;
  onAddComment: (id: string, author: string, text: string, isOfficial?: boolean, puprPin?: string) => void;
  onResolve: (id: string) => void;
  onStatusChange: (id: string, status: 'pending' | 'repairing' | 'resolved') => void;
  onDeleteReport: (id: string, pin?: string) => Promise<{ success: boolean; error?: string }> | any;
  isAdmin: boolean;
}

export function PotholeModal({
  report,
  onClose,
  onUpvote,
  onAddComment,
  onResolve,
  onStatusChange,
  onDeleteReport,
  isAdmin
}: PotholeModalProps) {
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isPuprActive, setIsPuprActive] = useState(false);
  const [puprPinInput, setPuprPinInput] = useState('');
  const [deletePinInput, setDeletePinInput] = useState('');
  const [activeTab, setActiveTab] = useState<'audit' | 'collab'>('audit');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorDeleteMsg, setErrorDeleteMsg] = useState('');

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPuprActive && !puprPinInput) return;
    
    const finalAuthor = isPuprActive ? 'Kementerian PUPR' : commentName;
    if (!finalAuthor || !commentText) return;
    
    onAddComment(report.id, finalAuthor, commentText, isPuprActive || isAdmin, isPuprActive ? puprPinInput : undefined);
    setCommentText('');
    setPuprPinInput('');
  };

  const getSeverityLabel = (sev: string) => {
    switch (sev) {
      case 'critical':
        return <span className="rounded-md border border-red-300 bg-red-50 text-red-700 px-2.5 py-1 text-xs font-bold uppercase tracking-wider font-mono">KRITIS</span>;
      case 'medium':
        return <span className="rounded-md border border-amber-300 bg-amber-50 text-amber-700 px-2.5 py-1 text-xs font-bold uppercase tracking-wider font-mono">SEDANG</span>;
      default:
        return <span className="rounded-md border border-neutral-300 bg-neutral-50 text-neutral-600 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider font-mono">RINGAN</span>;
    }
  };

  const getStatusBanner = (status: string) => {
    switch (status) {
      case 'resolved':
        return (
          <div className="flex items-center gap-2 bg-neutral-900 text-white px-3 py-2 rounded-xl border border-neutral-850 shadow-sm font-sans mb-4 text-xs font-semibold">
            <Check className="h-4 w-4 bg-white text-black rounded-full p-0.5" />
            <span>Jalan Berlubang Berhasil Diperbaiki oleh Kementerian PUPR</span>
          </div>
        );
      case 'repairing':
        return (
          <div className="flex items-center gap-2 bg-neutral-100 text-neutral-850 px-3 py-2 rounded-xl border border-neutral-200 font-sans mb-4 text-xs font-semibold">
            <Hammer className="h-4 w-4 text-black animate-spin" />
            <span className="text-neutral-900">Sedang Ditangani oleh Satuan Kerja Dinas Pekerjaan Umum</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 bg-white text-neutral-600 px-3 py-2 rounded-xl border border-neutral-200 font-sans mb-4 text-xs font-semibold">
            <Clock className="h-4 w-4 text-neutral-400" />
            <span>Mengantre pada Jadual Pemantauan Anggaran Sipil</span>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="flex items-start justify-between p-5 border-b border-neutral-150">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {getSeverityLabel(report.severity)}
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">{report.id}</span>
            </div>
            <h2 className="font-extrabold tracking-tight text-neutral-950 text-lg leading-tight">
              {report.title}
            </h2>
            <p className="text-xs font-medium text-neutral-500 mt-1">
              Ditemukan di {report.roadName}, {report.city}, {report.province}
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 text-neutral-500 hover:text-black cursor-pointer transition shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body Scroll */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {/* Status banner */}
          {getStatusBanner(report.status)}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Visual Media Card */}
            <div className="relative rounded-xl border border-neutral-200 bg-neutral-50 overflow-hidden group aspect-video flex items-center justify-center max-h-56">
              <img
                src={report.imageUrl}
                alt={report.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none flex items-end p-3">
                <span className="text-[10px] text-white font-mono uppercase bg-black/45 px-2 py-0.5 rounded-md">Foto Unggahan Warga</span>
              </div>
            </div>

            {/* Quick description & meta */}
            <div className="flex flex-col justify-between">
              <div>
                <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5 font-mono">Deskripsi Laporan</h4>
                <p className="text-xs text-neutral-700 leading-relaxed max-h-36 overflow-y-auto custom-scrollbar">
                  {report.description}
                </p>
              </div>

              <div className="border-t border-neutral-100 pt-3 mt-3 flex items-center justify-between text-[11px] text-neutral-500 font-medium">
                <div>
                  <span className="text-neutral-400">Pelapor: </span>
                  <span className="text-neutral-800 font-bold">{report.reporterName}</span>
                </div>
                <div>
                  <span className="text-neutral-400">Diunggah: </span>
                  <span className="text-neutral-800 font-bold">
                    {new Date(report.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Government Powers Control (If view is Government Portal/Admin) */}
          {isAdmin && (
            <div className="rounded-xl border border-black bg-black text-white p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-4.5 w-4.5" />
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider">Pemerintah Portal: Tindak Lanjut PUPR</h3>
              </div>
              <p className="text-[11px] text-neutral-300 mb-4 leading-relaxed">
                Konfirmasi perbaikan jalan raya yang dilaporkan warga. Memindahkan status ke "Mulus" akan memverifikasi perbaikan dan mengarsipkan foto dari peta utama secara otomatis.
              </p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => onStatusChange(report.id, 'pending')}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                    report.status === 'pending'
                      ? 'bg-white text-black border-white'
                      : 'border-neutral-700 hover:bg-neutral-900 text-white'
                  }`}
                >
                  Set Pending
                </button>
                <button
                  onClick={() => onStatusChange(report.id, 'repairing')}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                    report.status === 'repairing'
                      ? 'bg-white text-black border-white'
                      : 'border-neutral-700 hover:bg-neutral-900 text-white'
                  }`}
                >
                  Mulai Perbaikan
                </button>
                <button
                  onClick={() => onResolve(report.id)}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition duration-150"
                >
                  <Check className="h-4.5 w-4.5 stroke-[3]" />
                  Nyatakan Selesai (Jalan Mulus)
                </button>
              </div>
            </div>
          )}

          {/* Tabs Section (Audit vs Collaborative Discussion) */}
          <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white">
            <div className="flex border-b border-neutral-200 bg-neutral-50/70 p-1">
              <button
                onClick={() => setActiveTab('audit')}
                className={`flex-1 py-2 text-xs font-bold tracking-tight rounded-lg cursor-pointer transition ${
                  activeTab === 'audit'
                    ? 'bg-white text-black shadow-xs'
                    : 'text-neutral-500 hover:text-black hover:bg-neutral-100/70'
                }`}
              >
                Engineering Audit (Gemini AI)
              </button>
              <button
                onClick={() => setActiveTab('collab')}
                className={`flex-1 py-2 text-xs font-bold tracking-tight rounded-lg cursor-pointer cursor-pointer transition ${
                  activeTab === 'collab'
                    ? 'bg-white text-black shadow-xs'
                    : 'text-neutral-500 hover:text-black hover:bg-neutral-100/70'
                }`}
              >
                Kolaborasi Obrolan ({report.comments.length})
              </button>
            </div>

            {/* TAB 1: CIVIL ENGINEERING AUDIT (Gemini Smart Report) */}
            {activeTab === 'audit' && report.aiAudit && (
              <div className="p-5 space-y-4 font-sans bg-white">
                <div className="flex items-center gap-2 border-b border-neutral-100 pb-2">
                  <span className="h-2 w-2 rounded-full bg-black animate-ping"></span>
                  <p className="text-[10px] font-bold text-neutral-400 font-mono tracking-widest uppercase">
                    Kementerian Pekerjaan Umum (PUPR) — Rekomendasi AI Digital
                  </p>
                </div>

                {/* Audit summary */}
                <div>
                  <h5 className="text-[11px] font-bold text-neutral-900 uppercase tracking-wide">Hasil Diagnosis Jalan</h5>
                  <p className="text-xs text-neutral-700 mt-1 leading-relaxed">{report.aiAudit.summary}</p>
                </div>

                {/* Info grid details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="rounded-lg bg-neutral-50 border border-neutral-150 p-3">
                    <h6 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-mono">Dampak Arus Lalu Lintas</h6>
                    <p className="text-xs font-semibold text-neutral-800 mt-1">{report.aiAudit.trafficImpact}</p>
                  </div>
                  <div className="rounded-lg bg-neutral-50 border border-neutral-150 p-3">
                    <h6 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-mono">Rekomendasi Bahan Pelapis</h6>
                    <p className="text-xs font-semibold text-neutral-800 mt-1">{report.aiAudit.recommendedMaterial}</p>
                  </div>
                  <div className="rounded-lg bg-neutral-50 border border-neutral-150 p-3">
                    <h6 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-mono">Estimasi Alokasi Dana Tambal</h6>
                    <p className="text-xs font-bold text-neutral-950 mt-1">{report.aiAudit.estimatedCost}</p>
                  </div>
                  <div className="rounded-lg bg-neutral-50 border border-neutral-150 p-3">
                    <h6 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-mono">Estimasi Waktu Pengerjaan</h6>
                    <p className="text-xs font-semibold text-neutral-800 mt-1">{report.aiAudit.estimatedTimeline}</p>
                  </div>
                </div>

                {/* Official response bottom reference */}
                <div className="flex items-center justify-between border-t border-neutral-100 pt-3 text-[10px] font-mono text-neutral-400 uppercase">
                  <span>Sistem Informasi Geografis Jalan raya</span>
                  <span className="font-bold text-neutral-700">REF: {report.aiAudit.puprResponseCode}</span>
                </div>
              </div>
            )}

            {/* TAB 2: FIGMA-STYLE COLLABORATIVE FORUM COMMENT CANVAS */}
            {activeTab === 'collab' && (
              <div className="p-4 space-y-4">
                {/* Active chat feed list */}
                <div className="space-y-3 max-h-[240px] overflow-y-auto custom-scrollbar pr-1.5">
                  {report.comments.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-6 w-6 text-neutral-300 mx-auto mb-1.5" />
                      <p className="text-xs font-semibold text-neutral-500">Papan Obrolan Masih Kosong</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">Sampaikan analisis Anda untuk perbaikan jalan kolaboratif.</p>
                    </div>
                  ) : (
                    report.comments.map((comment) => (
                      <div 
                        key={comment.id} 
                        className={`flex gap-3 p-3 rounded-xl border ${
                          comment.isOfficial 
                            ? 'bg-amber-50/75 text-neutral-900 border-amber-200 shadow-xs' 
                            : 'bg-neutral-50 border-neutral-150 text-neutral-800'
                        }`}
                      >
                        {/* Avatar */}
                        <div className={`h-8 w-8 rounded-lg overflow-hidden font-bold flex items-center justify-center shrink-0 text-xs border ${
                          comment.isOfficial ? 'bg-white border-amber-300 shadow-2xs' : 'bg-black text-white'
                        }`}>
                          {comment.avatar && (comment.avatar.startsWith('http://') || comment.avatar.startsWith('https://')) ? (
                            <img 
                              src={comment.avatar} 
                              alt={comment.author} 
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-contain" 
                            />
                          ) : (
                            comment.avatar || 'U'
                          )}
                        </div>

                        {/* Content text block */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-extrabold truncate flex items-center gap-1">
                              <span className={comment.isOfficial ? 'text-amber-900' : 'text-neutral-900'}>{comment.author}</span>
                              {comment.isOfficial && (
                                <span className="inline-flex items-center justify-center h-3.5 w-3.5 rounded-full bg-blue-500 text-white p-0.5 shadow-2xs animate-pulse" title="Terverifikasi Resmi PUPR">
                                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-2.5 w-2.5">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                  </svg>
                                </span>
                              )}
                              {comment.isOfficial && (
                                <span className="text-[8px] bg-amber-500 text-white font-extrabold uppercase px-1 py-0.5 rounded-sm font-mono tracking-wider scale-90">PUPR</span>
                              )}
                            </span>
                            <span className={`text-[9px] font-mono font-medium ${comment.isOfficial ? 'text-amber-700/60' : 'text-neutral-400'}`}>
                              {new Date(comment.createdAt).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-xs leading-relaxed break-words">{comment.text}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Comment input form */}
                <form onSubmit={handleCommentSubmit} className="border-t border-neutral-150 pt-3 space-y-2.5">
                  <div className="flex gap-2">
                    {!isPuprActive && (
                      <input
                        type="text"
                        required
                        value={commentName}
                        onChange={(e) => setCommentName(e.target.value)}
                        placeholder="Nama Anda..."
                        className="w-1/3 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-black placeholder:text-neutral-400 font-semibold"
                      />
                    )}
                    <input
                      type="text"
                      required
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder={isPuprActive ? "Silakan ketik instruksi resmi / komentar dari Kementerian PUPR..." : "Tulis pesan atau saran teknis untuk jalan ini..."}
                      className="flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-black placeholder:text-neutral-400 font-medium"
                    />
                    <button
                      type="submit"
                      className="bg-black hover:bg-neutral-900 text-white font-bold text-xs px-4 py-1.5 rounded-lg cursor-pointer transition active:scale-95 shrink-0"
                    >
                      Kirim
                    </button>
                  </div>

                  {/* PUPR official verification option */}
                  <div className="flex items-center justify-between bg-zinc-50 border border-black/5 rounded-xl p-2.5 text-[11px]">
                    <label className="flex items-center gap-1.5 font-bold text-neutral-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isPuprActive}
                        onChange={(e) => {
                          setIsPuprActive(e.target.checked);
                          if (!e.target.checked) setPuprPinInput('');
                        }}
                        className="rounded border-zinc-300 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5"
                      />
                      <span className="flex items-center gap-1">
                        Komentar sebagai Kementerian PUPR Resmi
                        <span className="inline-flex items-center justify-center h-3 w-3 rounded-full bg-blue-500 text-white p-0.5" title="Terverifikasi Resmi">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="h-2 w-2">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                          </svg>
                        </span>
                      </span>
                    </label>

                    {isPuprActive && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-amber-600">PIN VERIFIKASI:</span>
                        <input
                          type="password"
                          required
                          maxLength={6}
                          value={puprPinInput}
                          onChange={(e) => setPuprPinInput(e.target.value)}
                          placeholder="Pin 194507"
                          className="w-24 rounded border border-neutral-300 bg-white px-2 py-0.5 text-center font-mono font-bold text-xs outline-none focus:border-amber-500 placeholder:text-[9.5px]"
                        />
                      </div>
                    )}
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer with Support Action */}
        <div className="border-t border-neutral-150 p-4 bg-neutral-50/50 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onUpvote(report.id)}
              className="inline-flex items-center gap-1.5 rounded-full bg-white hover:bg-neutral-100 border border-neutral-200 p-2 px-4 shadow-xs text-xs font-bold text-neutral-800 transition active:scale-95 cursor-pointer"
            >
              <ThumbsUp className="h-4 w-4 text-black shrink-0" />
              <span>Dukung Penanganan Laporan ({report.upvotes})</span>
            </button>

            {/* Button Hapus Laporan oleh Pelapor */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-red-50 hover:bg-red-100 border border-red-200 p-2 px-4 shadow-xs text-xs font-bold text-red-600 transition active:scale-95 cursor-pointer"
              title="Hapus laporan ini secara permanen"
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              <span>Hapus Laporan</span>
            </button>
          </div>
          
          <div className="text-[10px] text-neutral-400 font-mono">
            Sistem Informasi Jalan Sipil &bull; Indonesia
          </div>
        </div>

        {/* Custom Inline Confirmation Overlay for Deletion */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-neutral-900/80 backdrop-blur-xs flex items-center justify-center p-6 z-[1200] transition-opacity duration-200 animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-neutral-250 shadow-2xl space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-extrabold text-neutral-950 font-sans">
                    Konfirmasi Hapus Laporan Sipil
                  </h4>
                  <p className="text-xs text-neutral-550 leading-relaxed mt-1 font-sans">
                    Apakah Anda yakin ingin menghapus laporan <strong className="text-neutral-900">"{report.title}"</strong> secara permanen dari basis data nasional Indonesia? Tindakan ini tidak dapat dibatalkan.
                  </p>
                </div>
              </div>

              {!isAdmin && (
                <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-200 space-y-2">
                  <span className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider font-mono">
                    Masukkan PIN Pengaman Anda *
                  </span>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    value={deletePinInput}
                    onChange={(e) => {
                      setDeletePinInput(e.target.value.replace(/\D/g, ''));
                      setErrorDeleteMsg('');
                    }}
                    placeholder="PIN Pengaman Laporan"
                    className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-center tracking-widest font-mono outline-none focus:border-red-500"
                  />
                  <p className="text-[10px] text-neutral-400 font-sans leading-tight">
                    * Laporan hanya bisa dihapus oleh pembuat aslinya dengan memasukkan PIN dan setelah disetujui / dikomentari secara resmi oleh Kementerian PUPR.
                  </p>
                </div>
              )}

              {errorDeleteMsg && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-2.5 text-[11px] font-semibold text-red-600 leading-normal font-sans">
                  {errorDeleteMsg}
                </div>
              )}

              <div className="flex gap-2.5 justify-end pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletePinInput('');
                    setErrorDeleteMsg('');
                  }}
                  className="px-4 py-2 text-xs font-bold rounded-lg border border-neutral-250 bg-white hover:bg-neutral-50 text-neutral-700 cursor-pointer transition active:scale-95"
                >
                  Batalkan
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!isAdmin && !deletePinInput) {
                      setErrorDeleteMsg("Harap masukkan PIN Pengaman Laporan Anda.");
                      return;
                    }
                    setErrorDeleteMsg('');
                    const res = await onDeleteReport(report.id, isAdmin ? undefined : deletePinInput);
                    if (res && res.success === false) {
                      setErrorDeleteMsg(res.error || "Gagal menghapus laporan.");
                    } else {
                      setShowDeleteConfirm(false);
                      setDeletePinInput('');
                    }
                  }}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-md cursor-pointer transition active:scale-95"
                >
                  Ya, Hapus Permanen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
