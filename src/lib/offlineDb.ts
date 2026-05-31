import { PotholeReport, Statistics, Comment } from '../types';

// Detect if we are running in static hosting environments like GitHub Pages
export function isStaticMode(): boolean {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname.toLowerCase();
  return (
    h.endsWith('github.io') || 
    h === 'localhost' && window.location.port !== '3000' ||
    window.location.protocol === 'file:' ||
    // Force static fallback if API calls persistently fail
    window.localStorage.getItem('FORCE_OFFLINE_DB') === 'true'
  );
}

// Simulated PUPR response generator matching server.ts behavior
function generateOfflineAudit(title: string, desc: string, roadName: string, city: string, severity: 'low' | 'medium' | 'critical') {
  const codes = {
    critical: {
      summary: "Evaluasi taktis mendeteksi kehancuran masif pada aspal penyangga dasar. Kerusakan struktural ini disebabkan oleh penetrasi air basah berulang dan beban berganda angkutan berat yang melampaui kelas jalan.",
      trafficImpact: "Kritis & Sangat Tinggi. Lubang berada langsung di alur laju utama dengan tingkat kemacetan ekstrim saat jam berangkat kerja.",
      cost: "Rp 6.500.000",
      material: "Asphalt Concrete - Wearing Course (AC-WC) kualitas premium bertaraf nasional dengan pelindung pengerasan semen.",
      timeline: "1 - 2 Hari kerja (Pekerjaan darurat penambalan cepat).",
      suffix: "O2"
    },
    medium: {
      summary: "Terjadi retakan reflektif menengah berukuran tak-beraturan. Masalah dipicu oleh buruknya drainase sekunder perkotaan yang meluap ke lapisan pengikat jalan.",
      trafficImpact: "Sedang. Mengharuskan kendaraan melambat bertahap dan mengambil rasi laju menghindar sisi jalan.",
      cost: "Rp 3.800.000",
      material: "Campuran Aspal Dingin (Cold Mix Asphalt) Polimer Karbon tinggi dengan pelapis kedap air.",
      timeline: "3 Hari kerja (Sekaligus pembetulan saluran air penampung).",
      suffix: "G5"
    },
    low: {
      summary: "Pelepasan butiran agregat permukaan ringan (stripping). Konstruksi dasar stabil; hanya pengelupasan penutup tipis di jalur gesek rem lambat.",
      trafficImpact: "Rendah. Arus kendaraan bermotor relatif mengalir, namun tetap berisiko slip bagi pengendara dua roda.",
      cost: "Rp 1.500.000",
      material: "Lapis Penutup Bubur Aspal (Asphalt Slurry Seal) praktis.",
      timeline: "2 - 4 Jam pengerjaan kering.",
      suffix: "E1"
    }
  };

  const selected = codes[severity] || codes.low;
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const cityCode = city ? city.substring(0, 3).toUpperCase() : 'JKT';

  return {
    summary: selected.summary,
    trafficImpact: selected.trafficImpact,
    estimatedCost: selected.cost,
    recommendedMaterial: selected.material,
    estimatedTimeline: selected.timeline,
    puprResponseCode: `PUPR-${cityCode}-${randNum}-${selected.suffix}`
  };
}

// Exquisite seed potholes with realistic Indonesian coordinates, AI Audits and PUPR comments!
const SEED_POTHOLES: PotholeReport[] = [];

const LOCAL_STORAGE_KEY = "mulus_reports_database";

// Retrieve list of reports from LocalStorage
export function getOfflineReports(): PotholeReport[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    // Overwrite/clear any old pre-existing seed data cache to start fresh
    if (raw && (raw.includes('pothole-kemang') || raw.includes('pothole-dago') || raw.includes('pothole-darmo'))) {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    if (!raw) {
      // Seed initial data (empty)
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(SEED_POTHOLES));
      return SEED_POTHOLES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("Local storage read failure, using seed reports:", e);
    return SEED_POTHOLES;
  }
}

// Persist reports back to LocalStorage
function saveOfflineReports(reports: PotholeReport[]) {
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reports));
  } catch (e) {
    console.error("Local storage save failure:", e);
  }
}

// Compute dynamic stats matching design specs
export function getOfflineStats(reports: PotholeReport[]): Statistics {
  const resolved = reports.filter(r => r.status === "resolved").length;
  const active = reports.filter(r => r.status !== "resolved").length;
  const total = reports.length;
  
  const smoothPercentage = total > 0 ? Math.min(100, Math.max(75, 96 - (active * 1.5))) : 98;
  
  return {
    totalActive: active,
    totalRepaired: resolved,
    smoothRoadPercentage: Math.round(smoothPercentage * 10) / 10,
    activeCollaborators: 12 // steady active indicators
  };
}

// Create a new report fully client-side
export function createOfflineReport(formData: any): PotholeReport {
  const reports = getOfflineReports();
  const id = `report-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  const newReport: PotholeReport = {
    id,
    title: formData.title,
    description: formData.description,
    lat: Number(formData.lat),
    lng: Number(formData.lng),
    imageUrl: formData.imageUrl || "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800",
    videoUrl: formData.videoUrl || "",
    severity: formData.severity || "medium",
    reporterName: formData.reporterName || "Warga Anonim",
    reporterPin: formData.reporterPin || Math.floor(1000 + Math.random() * 9000).toString(),
    createdAt: new Date().toISOString(),
    status: "pending",
    upvotes: 1,
    roadName: formData.roadName || "Jalan Lokal",
    city: formData.city || "Kabupaten",
    province: formData.province || "Provinsi",
    authorityCategory: formData.authorityCategory || "kabupaten",
    aiAudit: generateOfflineAudit(
      formData.title,
      formData.description,
      formData.roadName || "",
      formData.city || "",
      formData.severity || "medium"
    ),
    comments: []
  };

  reports.unshift(newReport);
  saveOfflineReports(reports);
  return newReport;
}

// Increment upvote client-side
export function upvoteOfflineReport(id: string): PotholeReport | null {
  const reports = getOfflineReports();
  const idx = reports.findIndex(r => r.id === id);
  if (idx === -1) return null;
  
  reports[idx].upvotes += 1;
  saveOfflineReports(reports);
  return reports[idx];
}

// Add comments client-side
export function addOfflineComment(id: string, author: string, text: string, isOfficial?: boolean): PotholeReport | null {
  const reports = getOfflineReports();
  const idx = reports.findIndex(r => r.id === id);
  if (idx === -1) return null;

  const newComment: Comment = {
    id: `comment-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    author,
    text,
    createdAt: new Date().toISOString(),
    isOfficial: !!isOfficial
  };

  reports[idx].comments.push(newComment);
  saveOfflineReports(reports);
  return reports[idx];
}

// Change status client-side
export function updateOfflineStatus(id: string, status: 'pending' | 'repairing' | 'resolved'): PotholeReport | null {
  const reports = getOfflineReports();
  const idx = reports.findIndex(r => r.id === id);
  if (idx === -1) return null;

  reports[idx].status = status;
  saveOfflineReports(reports);
  return reports[idx];
}

// Resolve report client-side
export function resolveOfflineReport(id: string): PotholeReport | null {
  const reports = getOfflineReports();
  const idx = reports.findIndex(r => r.id === id);
  if (idx === -1) return null;

  reports[idx].status = "resolved";
  
  // Custom official resolution comment
  const agencyName = reports[idx].authorityCategory === "pusat" 
    ? "Kementerian PUPR (Pusat)" 
    : reports[idx].authorityCategory === "provinsi"
      ? "Dinas PU Provinsi"
      : "Dinas PU Kabupaten/Kota";

  const autoOfficialComment: Comment = {
    id: `comment-${Date.now()}-resolution`,
    author: "Sistem PUPR & Jalan Raya",
    text: `Pekerjaan konstruksi jalan telah selesai. Jalan berlubang di ${reports[idx].roadName} terkonfirmasi ditambal dengan material premium dan disetujui oleh unit pengawas ${agencyName}. Terima kasih atas laporan Anda!`,
    createdAt: new Date().toISOString(),
    isOfficial: true
  };

  reports[idx].comments.push(autoOfficialComment);
  saveOfflineReports(reports);
  return reports[idx];
}

// Delete report client-side
export function deleteOfflineReport(id: string, pin?: string, isAdmin?: boolean): { success: boolean; error?: string } {
  const reports = getOfflineReports();
  const idx = reports.findIndex(r => r.id === id);
  if (idx === -1) {
    return { success: false, error: "Laporan tidak ditemukan." };
  }

  const report = reports[idx];
  
  if (!isAdmin) {
    const submittedPin = String(pin || '').trim();
    const storedPin = String(report.reporterPin || '').trim();
    
    if (!submittedPin || submittedPin !== storedPin) {
      return { success: false, error: "PIN Pelapor salah atau tidak sah. Laporan hanya dapat dihapus oleh pembuat aslinya." };
    }
  }

  reports.splice(idx, 1);
  saveOfflineReports(reports);
  return { success: true };
}

// Clear all reports in Local Storage
export function purgeOfflineReports(): void {
  try {
    window.localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (e) {
    console.error("Local storage clear failure:", e);
  }
}

