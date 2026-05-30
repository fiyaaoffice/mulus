import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { ActiveFeed } from './components/ActiveFeed';
import { IndonesiaMap } from './components/IndonesiaMap';
import { PotholeModal } from './components/PotholeModal';
import { ReportFormModal } from './components/ReportFormModal';
import { PotholeReport, Statistics } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle, AlertTriangle, Info, Plus, ChevronRight, HelpCircle } from 'lucide-react';

export default function App() {
  const [reports, setReports] = useState<PotholeReport[]>([]);
  const [stats, setStats] = useState<Statistics>({
    totalActive: 0,
    totalRepaired: 0,
    smoothRoadPercentage: 94.2,
    activeCollaborators: 12
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showArchives, setShowArchives] = useState(false);
  
  // Coordinates picked by tapping map
  const [clickedLat, setClickedLat] = useState<number | null>(null);
  const [clickedLng, setClickedLng] = useState<number | null>(null);

  // Resolution Success Overlay Celebration
  const [showCelebration, setShowCelebration] = useState(false);
  const [repairedLabel, setRepairedLabel] = useState("");

  // Post Submission Success PIN feedback Modal
  const [lastCreatedPin, setLastCreatedPin] = useState<string | null>(null);
  const [lastCreatedTitle, setLastCreatedTitle] = useState<string>("");

  // Loading and Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize and Fetch Reports on Boot
  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reports');
      if (!res.ok) throw new Error("Gagal mengunduh laporan dari server.");
      const data = await res.json();
      setReports(data.reports || []);
      if (data.stats) {
        setStats(data.stats);
      }
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Koneksi ke server terputus.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Handle Map Coordinate Sensation / Trigger Click
  const handleMapClick = (lat: number, lng: number) => {
    setClickedLat(lat);
    setClickedLng(lng);
    setIsFormOpen(true);
  };

  const handleCreateReport = async (formData: any) => {
    try {
      setLoading(true);
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error("Gagal menyimpan laporan baru.");
      const newReport = await res.json();
      
      // Save for PIN Overlay Success feedback
      setLastCreatedPin(newReport.reporterPin || formData.reporterPin || '');
      setLastCreatedTitle(newReport.title || '');
      
      // Update local state list and stats
      await fetchReports();
      setIsFormOpen(false);
      
      // Focus map and selector directly onto newly reported pothole!
      setSelectedId(newReport.id);
      setClickedLat(null);
      setClickedLng(null);
    } catch (err: any) {
      alert(err.message || "Terjadi galat.");
    } finally {
      setLoading(false);
    }
  };

  // Upvote Report
  const handleUpvote = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`/api/reports/${id}/upvote`, { method: 'POST' });
      if (res.ok) {
        const updated = await res.json();
        // Update local reports state
        setReports(prev => prev.map(r => r.id === id ? { ...r, upvotes: updated.upvotes } : r));
      }
    } catch (err) {
      console.error("Gagal melakukan penyuaraan upvote:", err);
    }
  };

  // Add Comment/Sticky
  const handleAddComment = async (id: string, author: string, text: string, isOfficial?: boolean) => {
    try {
      const res = await fetch(`/api/reports/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author, text, isOfficial })
      });

      if (res.ok) {
        const updated = await res.json();
        setReports(prev => prev.map(r => r.id === id ? { ...r, comments: updated.comments } : r));
      }
    } catch (err) {
      console.error("Gagal mengirim komentar:", err);
    }
  };

  // Change report status (pending/repairing/resolved)
  const handleStatusChange = async (id: string, status: 'pending' | 'repairing' | 'resolved') => {
    try {
      const res = await fetch(`/api/reports/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        const updated = await res.json();
        setReports(prev => prev.map(r => r.id === id ? { ...r, status: updated.status } : r));
        // Refresh general stats to reflect repairing metrics
        const statsRes = await fetch('/api/reports');
        const statsData = await statsRes.json();
        if (statsData.stats) setStats(statsData.stats);
      }
    } catch (err) {
      console.error("Gagal merubah status laporan:", err);
    }
  };

  // Complete/Resolve report -> Will disappear from active map list
  const handleResolve = async (id: string) => {
    const reportToResolve = reports.find(r => r.id === id);
    if (!reportToResolve) return;

    try {
      const res = await fetch(`/api/reports/${id}/resolve`, { method: 'POST' });
      if (res.ok) {
        setRepairedLabel(`${reportToResolve.title} (${reportToResolve.roadName})`);
        setShowCelebration(true);
        setSelectedId(null);
        
        // Reload all data to refresh statistics and map pins
        await fetchReports();

        // Autoclose success celebration banner after 4 seconds
        setTimeout(() => {
          setShowCelebration(false);
        }, 4500);
      }
    } catch (err) {
      console.error("Gagal melunasi perbaikan jalan berlubang:", err);
    }
  };

  // Delete report completely (Reporter action tool)
  const handleDeleteReport = async (id: string, pin?: string) => {
    try {
      const url = pin ? `/api/reports/${id}?pin=${encodeURIComponent(pin)}&isAdmin=${isAdmin}` : `/api/reports/${id}?isAdmin=${isAdmin}`;
      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json();
      
      if (res.ok) {
        setSelectedId(null);
        await fetchReports();
        return { success: true };
      } else {
        return { success: false, error: data.error || "Gagal menghapus laporan." };
      }
    } catch (err: any) {
      console.error("Gagal menghapus laporan jalan berlubang:", err);
      return { success: false, error: err.message };
    }
  };

  // Toggle archives (completed potholes)
  const handleShowArchives = () => {
    setShowArchives(!showArchives);
    setSelectedId(null);
  };

  const currentlySelectedReport = reports.find(r => r.id === selectedId);

  return (
    <div className="flex h-screen flex-col bg-zinc-50 font-sans overflow-hidden">
      {/* Top Google-style workspace dashboard Header */}
      <Header
        stats={stats}
        isAdmin={isAdmin}
        setIsAdmin={setIsAdmin}
        onShowArchives={handleShowArchives}
        showArchives={showArchives}
      />

      {/* Main Workbench Layout: Map and Sidebar styled with Bento Grid curves */}
      <div className="flex-1 flex p-6 gap-6 bg-zinc-50 overflow-hidden relative">
        
        {/* Left Side: Interactive Collaborative Sidebar in a Bento Card */}
        <div className="w-full md:w-[380px] shrink-0 h-full flex flex-col z-20 shadow-xl md:shadow-none md:relative absolute md:translate-x-0 -translate-x-full md:block border border-black/10 rounded-[2rem] bg-white overflow-hidden transition-transform duration-355">
          <ActiveFeed
            reports={reports}
            selectedId={selectedId}
            onSelect={(id) => setSelectedId(id)}
            onUpvote={(id, e) => handleUpvote(id, e)}
            showArchivesOnly={showArchives}
          />
        </div>

        {/* Right Side: Map Canvas inside its beautiful Bento Frame */}
        <div className="flex-1 h-full z-0 relative border border-black/10 rounded-[2rem] shadow-sm overflow-hidden bg-white">
          <IndonesiaMap
            reports={reports}
            selectedId={selectedId}
            onSelect={(id) => setSelectedId(id)}
            onMapClick={handleMapClick}
            isAdmin={isAdmin}
          />

          {/* Map Overlay Button (Only on Mobile to expand feed) */}
          <div className="absolute top-6 left-6 z-10 md:hidden">
            <button
              onClick={() => {
                const sidebar = document.querySelector('.shrink-0');
                if (sidebar) {
                  sidebar.classList.toggle('-translate-x-full');
                }
              }}
              className="bg-black text-white p-3 px-5 rounded-full shadow-lg font-sans text-xs font-bold cursor-pointer transition active:scale-95"
            >
              Lihat Laporan ({reports.filter(r => showArchives ? r.status === 'resolved' : r.status !== 'resolved').length})
            </button>
          </div>

          {/* Center Pothole Register Trigger (Dashed style bento button or premium floating bento action) */}
          <div className="absolute bottom-6 right-6 z-20 flex flex-col items-end gap-2 text-sans">
            <button
              onClick={() => setIsFormOpen(true)}
              className="bg-black hover:bg-neutral-900 text-white font-extrabold p-4 px-6 rounded-2xl flex items-center gap-2.5 shadow-xl hover:scale-102 active:scale-98 transition duration-150 border border-neutral-800 cursor-pointer text-xs"
            >
              <Plus className="h-4.5 w-4.5 stroke-[3]" />
              <span>Laporkan Jalan Berlubang</span>
            </button>
          </div>
        </div>

        {/* Success / Repaired Celebration Visual Overlay Banner */}
        <AnimatePresence>
          {showCelebration && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-[1200] max-w-lg w-full px-4"
            >
              <div className="bg-black border border-neutral-800 text-white p-4 rounded-2xl shadow-2xl flex items-start gap-3.5">
                <div className="h-9 w-9 rounded-full bg-white text-black flex items-center justify-center shrink-0">
                  <CheckCircle className="h-5 w-5 stroke-[2.5]" />
                </div>
                <div className="flex-1">
                  <h4 className="text-[11px] font-bold font-mono uppercase tracking-widest text-neutral-300">Pekerjaan Umum Terverifikasi</h4>
                  <p className="text-xs font-bold text-white mt-0.5 leading-snug">Jalan Mulus Kembali!</p>
                  <p className="text-[10px] text-neutral-400 mt-1 italic font-medium">"{repairedLabel}" berhasil ditangani dan diarsip.</p>
                </div>
                <button 
                  onClick={() => setShowCelebration(false)}
                  className="text-neutral-400 hover:text-white font-bold text-xs"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Interactive Modals Backdrop Container */}
      <AnimatePresence>
        {/* Pothole details modal */}
        {currentlySelectedReport && (
          <PotholeModal
            report={currentlySelectedReport}
            onClose={() => setSelectedId(null)}
            onUpvote={(id) => handleUpvote(id)}
            onAddComment={handleAddComment}
            onResolve={handleResolve}
            onStatusChange={handleStatusChange}
            onDeleteReport={handleDeleteReport}
            isAdmin={isAdmin}
          />
        )}

        {/* Report New Pothole Form modal */}
        {isFormOpen && (
          <ReportFormModal
            initialLat={clickedLat}
            initialLng={clickedLng}
            onClose={() => {
              setIsFormOpen(false);
              setClickedLat(null);
              setClickedLng(null);
            }}
            onSubmit={handleCreateReport}
          />
        )}

        {/* Success PIN Alert overlay */}
        {lastCreatedPin && (
          <div className="fixed inset-0 z-[1250] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs font-sans animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-neutral-250 shadow-2xl space-y-4 text-center">
              <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs animate-bounce">
                <CheckCircle className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold tracking-tight text-neutral-950 text-base">
                  Laporan Berhasil Terkirim!
                </h3>
                <p className="text-[11px] text-neutral-500 max-w-xs mx-auto leading-normal">
                  Laporan Anda <strong className="text-neutral-800">"{lastCreatedTitle}"</strong> berhasil disimpan di basis data nasional Mulus.
                </p>
              </div>

              <div className="bg-zinc-50 border border-neutral-150 rounded-2xl p-4 space-y-1.5 shadow-3xs">
                <span className="block text-[9px] font-bold text-neutral-400 uppercase tracking-widest font-mono">
                  PIN Pengaman Postingan Anda
                </span>
                <span className="block text-2xl font-extrabold text-amber-600 font-mono tracking-widest bg-amber-50 rounded-xl py-2.5 max-w-[160px] mx-auto border border-amber-200 shadow-2xs leading-none">
                  {lastCreatedPin}
                </span>
                <p className="text-[10px] leading-relaxed text-neutral-500 font-bold pt-1 max-w-[240px] mx-auto">
                  Catat & Simpan PIN ini! Anda memerlukannya untuk menghapus postingan Anda jika kelak sudah di-approve/dikomentari secara resmi oleh Kementerian PUPR.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setLastCreatedPin(null);
                  setLastCreatedTitle('');
                }}
                className="w-full py-2.5 text-xs font-bold rounded-xl bg-black hover:bg-neutral-900 text-white shadow-md active:scale-98 transition duration-100 cursor-pointer"
              >
                Saya Sudah Catat PIN &bull; Selesai
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
