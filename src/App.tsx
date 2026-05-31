import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { ActiveFeed } from './components/ActiveFeed';
import { IndonesiaMap } from './components/IndonesiaMap';
import { PotholeModal } from './components/PotholeModal';
import { ReportFormModal } from './components/ReportFormModal';
import { UserGuideModal } from './components/UserGuideModal';
import { PotholeReport, Statistics } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle, AlertTriangle, Info, Plus, ChevronRight, HelpCircle } from 'lucide-react';
import * as offlineDb from './lib/offlineDb';
import { 
  observeReports, 
  calculateStats, 
  createReportInFirestore, 
  upvoteReportInFirestore, 
  addCommentInFirestore, 
  updateStatusInFirestore, 
  resolveReportInFirestore, 
  deleteReportInFirestore,
  purgeAllReportsInFirestore
} from './lib/firebaseDb';

export default function App() {
  const [reports, setReports] = useState<PotholeReport[]>([]);
  const [showGuide, setShowGuide] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'map' | 'feed'>('map');
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

  // Toast notifications state
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Auto-dismiss notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Real-time synchronization bootstrapper
  const fetchReports = async () => {
    // Legacy function placeholder for compatibility
  };

  useEffect(() => {
    setLoading(true);
    const unsubscribe = observeReports(
      (realtimeReports) => {
        setReports(realtimeReports);
        setStats(calculateStats(realtimeReports));
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.warn("Firestore syncing skipped or offline. Falling back to Local Storage database:", err);
        // Fallback gracefully to LocalStorage
        const localRep = offlineDb.getOfflineReports();
        setReports(localRep);
        setStats(offlineDb.getOfflineStats(localRep));
        setError(null);
        setLoading(false);
      }
    );
    return () => unsubscribe();
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
      const newReport = await createReportInFirestore(formData);
      
      setLastCreatedPin(newReport.reporterPin || formData.reporterPin || '');
      setLastCreatedTitle(newReport.title || '');
      
      setNotification({
        message: "Postingan laporan jalan berlubang berhasil tersinkronisasi!",
        type: "success"
      });
      
      setIsFormOpen(false);
      setSelectedId(newReport.id);
      setClickedLat(null);
      setClickedLng(null);
    } catch (err: any) {
      console.warn("Firestore save failed, falling back to offline:", err);
      // Fallback
      const nr = offlineDb.createOfflineReport(formData);
      setLastCreatedPin(nr.reporterPin || formData.reporterPin || '');
      setLastCreatedTitle(nr.title || '');
      setNotification({
        message: "Laporan tersimpan di memori handphone Anda secara offline!",
        type: "info"
      });
      setIsFormOpen(false);
      setSelectedId(nr.id);
      setClickedLat(null);
      setClickedLng(null);
    } finally {
      setLoading(false);
    }
  };

  // Upvote Report
  const handleUpvote = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await upvoteReportInFirestore(id);
    } catch (err) {
      console.error("Gagal melakukan penyuaraan upvote:", err);
      // Fallback
      const updated = offlineDb.upvoteOfflineReport(id);
      if (updated) {
        setReports(prev => prev.map(r => r.id === id ? { ...r, upvotes: updated.upvotes } : r));
      }
    }
  };

  // Add Comment/Sticky
  const handleAddComment = async (id: string, author: string, text: string, isOfficial?: boolean) => {
    try {
      await addCommentInFirestore(id, author, text, isOfficial);
    } catch (err) {
      console.error("Gagal mengirim komentar:", err);
      // Fallback
      const updated = offlineDb.addOfflineComment(id, author, text, isOfficial);
      if (updated) {
        setReports(prev => prev.map(r => r.id === id ? { ...r, comments: updated.comments } : r));
      }
    }
  };

  // Change report status (pending/repairing/resolved)
  const handleStatusChange = async (id: string, status: 'pending' | 'repairing' | 'resolved') => {
    try {
      await updateStatusInFirestore(id, status);
    } catch (err) {
      console.error("Gagal merubah status laporan:", err);
      // Fallback
      const updated = offlineDb.updateOfflineStatus(id, status);
      if (updated) {
        setReports(prev => prev.map(r => r.id === id ? { ...r, status: updated.status } : r));
        const localRep = offlineDb.getOfflineReports();
        setStats(offlineDb.getOfflineStats(localRep));
      }
    }
  };

  // Complete/Resolve report -> Will disappear from active map list
  const handleResolve = async (id: string) => {
    const reportToResolve = reports.find(r => r.id === id);
    if (!reportToResolve) return;

    try {
      await resolveReportInFirestore(id);
      setRepairedLabel(`${reportToResolve.title} (${reportToResolve.roadName})`);
      setShowCelebration(true);
      setSelectedId(null);
      setTimeout(() => {
        setShowCelebration(false);
      }, 4500);
    } catch (err) {
      console.error("Gagal melunasi perbaikan jalan berlubang:", err);
      // Fallback
      const updated = offlineDb.resolveOfflineReport(id);
      if (updated) {
        setRepairedLabel(`${reportToResolve.title} (${reportToResolve.roadName})`);
        setShowCelebration(true);
        setSelectedId(null);
        setTimeout(() => {
          setShowCelebration(false);
        }, 4500);
      }
    }
  };

  // Delete report completely (Reporter action tool)
  const handleDeleteReport = async (id: string, pin?: string) => {
    try {
      setLoading(true);
      const result = await deleteReportInFirestore(id, pin, isAdmin);
      if (result.success) {
        setSelectedId(null);
        setNotification({
          message: "Laporan jalan berlubang berhasil dihapus!",
          type: "success"
        });
        return { success: true };
      } else {
        // Try fallback to offline
        const localResult = offlineDb.deleteOfflineReport(id, pin, isAdmin);
        if (localResult.success) {
          setSelectedId(null);
          setNotification({
            message: "Laporan jalan berlubang offline berhasil dihapus!",
            type: "success"
          });
          return { success: true };
        }
        return { success: false, error: result.error || "PIN Pelapor salah atau tidak sah." };
      }
    } catch (err: any) {
      console.error("Gagal menghapus laporan jalan berlubang:", err);
      // Fallback
      const result = offlineDb.deleteOfflineReport(id, pin, isAdmin);
      if (result.success) {
        setSelectedId(null);
        setNotification({
          message: "Laporan jalan berlubang offline berhasil dihapus!",
          type: "success"
        });
        return { success: true };
      } else {
        return { success: false, error: result.error || err.message };
      }
    } finally {
      setLoading(false);
    }
  };

  // Toggle archives (completed potholes)
  const handleShowArchives = () => {
    setShowArchives(!showArchives);
    setSelectedId(null);
  };

  // Clear/Purge all reports in the database (Admin reset tool)
  const handlePurgeAll = async () => {
    const confirmClear = window.confirm(
      "Apakah Anda yakin ingin menghapus semua laporan dari sistem? Tindakan ini permanen dan tidak dapat dibatalkan."
    );
    if (!confirmClear) return;

    try {
      setLoading(true);
      await purgeAllReportsInFirestore();
      offlineDb.purgeOfflineReports(); // Clear local cache too
      setSelectedId(null);
      setNotification({
        message: "Semua laporan jalan raya berhasil dihapus!",
        type: "success"
      });
    } catch (err: any) {
      console.error("Gagal menghapus semua database:", err);
      offlineDb.purgeOfflineReports();
      setSelectedId(null);
      setReports([]);
      setStats(offlineDb.getOfflineStats([]));
      setNotification({
        message: "Database telah dikosongkan secara lokal!",
        type: "info"
      });
    } finally {
      setLoading(false);
    }
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
        onOpenGuide={() => setShowGuide(true)}
        onPurgeAll={handlePurgeAll}
      />

      {/* Main Workbench Layout: Map and Sidebar styled with Bento Grid curves */}
      <div className="flex-1 flex p-0 sm:p-4 md:p-6 gap-0 sm:gap-4 md:gap-6 bg-zinc-50 overflow-hidden relative">
        
        {/* Left Side: Interactive Collaborative Sidebar in a Bento Card */}
        <div className={`w-full h-full flex-col md:w-[380px] shrink-0 md:relative z-20 md:border md:rounded-[2rem] bg-white overflow-hidden ${
          mobileTab === 'feed' ? 'flex' : 'hidden md:flex'
        }`}>
          <ActiveFeed
            reports={reports}
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id);
              setMobileTab('map'); // Auto switch to map to show location of the selected road pothole on mobile!
            }}
            onUpvote={(id, e) => handleUpvote(id, e)}
            showArchivesOnly={showArchives}
          />
        </div>

        {/* Right Side: Map Canvas inside its beautiful Bento Frame */}
        <div className={`flex-1 h-full z-0 relative border-0 sm:border border-black/10 rounded-none sm:rounded-[2rem] shadow-none sm:shadow-sm overflow-hidden bg-white ${
          mobileTab === 'map' ? 'block' : 'hidden md:block'
        }`}>
          <IndonesiaMap
            reports={reports}
            selectedId={selectedId}
            onSelect={(id) => setSelectedId(id)}
            onMapClick={handleMapClick}
            isAdmin={isAdmin}
          />

          {/* Center Pothole Register Trigger */}
          <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end gap-2 font-sans md:bottom-6 md:right-6">
            <button
              onClick={() => setIsFormOpen(true)}
              className="bg-black hover:bg-neutral-900 text-white font-extrabold p-3 sm:p-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl flex items-center gap-2 shadow-2xl hover:scale-102 active:scale-98 transition duration-150 border border-neutral-800 cursor-pointer text-xs md:text-xs"
            >
              <Plus className="h-4 w-4 sm:h-4.5 sm:w-4.5 stroke-[3]" />
              <span>Lapor Lubang</span>
            </button>
          </div>
        </div>

        {/* Floating Mode Toggle Pill for Phone/Mobile Screen Precision */}
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 md:hidden flex items-center bg-black/95 backdrop-blur-md border border-neutral-800 text-white rounded-full shadow-2xl p-1 select-none font-sans">
          <button
            onClick={() => setMobileTab('map')}
            className={`flex items-center gap-2 rounded-full py-1.5 px-4.5 text-[10px] font-extrabold uppercase tracking-wider transition ${
              mobileTab === 'map'
                ? 'bg-white text-black'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Peta
          </button>
          <button
            onClick={() => setMobileTab('feed')}
            className={`flex items-center gap-2 rounded-full py-1.5 px-4.5 text-[10px] font-extrabold uppercase tracking-wider transition ${
              mobileTab === 'feed'
                ? 'bg-white text-black'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Laporan
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
              mobileTab === 'feed' ? 'bg-black text-white' : 'bg-neutral-800 text-neutral-300'
            }`}>
              {reports.filter(r => showArchives ? r.status === 'resolved' : r.status !== 'resolved').length}
            </span>
          </button>
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

        {/* User Guide Tutorial Modal */}
        {showGuide && (
          <UserGuideModal onClose={() => setShowGuide(false)} />
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

      {/* Floating System toast notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -80, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[2050] max-w-sm w-full px-4"
          >
            <div className={`p-4 rounded-2xl shadow-2xl border flex items-center gap-3.5 ${
              notification.type === 'success' 
                ? 'bg-neutral-900 border-neutral-800 text-white shadow-emerald-950/20' 
                : 'bg-neutral-900 border-neutral-800 text-white'
            }`}>
              <div className="h-8 w-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <CheckCircle className="h-4 w-4 stroke-[3]" />
              </div>
              <div className="flex-1">
                <h4 className="text-[10px] font-bold font-mono uppercase tracking-widest text-neutral-400">
                  Sukses Sistem
                </h4>
                <p className="text-xs font-bold mt-0.5 leading-snug">{notification.message}</p>
              </div>
              <button 
                onClick={() => setNotification(null)}
                className="text-neutral-400 hover:text-white font-extrabold text-xs cursor-pointer px-1 py-0.5"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Processing Overlay Loader */}
      {loading && (
        <div className="fixed inset-0 z-[2000] flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs font-sans">
          <div className="bg-white px-6 py-5 rounded-2xl shadow-2xl border border-neutral-200/80 flex flex-col items-center gap-3.5 max-w-xs w-full text-center animate-fadeIn">
            <div className="relative flex items-center justify-center">
              {/* Spinner */}
              <div className="h-10 w-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
              {/* Inner core pulsing anchor */}
              <div className="absolute h-3 w-3 bg-amber-500 rounded-full animate-pulse"></div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-extrabold text-neutral-900">Sedang Memproses...</p>
              <p className="text-[10px] text-neutral-500 font-medium">Sistem sedang memuat laporan Anda ke server dan memetakan koordinat presisi.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
