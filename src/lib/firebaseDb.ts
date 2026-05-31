import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  increment, 
  arrayUnion,
  getDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { PotholeReport, Comment, Statistics } from '../types';

const REPORTS_COLLECTION = 'reports';

// Simulated PUPR response generator
function generatePUPRAudit(title: string, desc: string, roadName: string, city: string, severity: 'low' | 'medium' | 'critical') {
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

// Observe reports in real-time
export function observeReports(
  onUpdate: (reports: PotholeReport[]) => void, 
  onError: (err: any) => void
) {
  const q = query(collection(db, REPORTS_COLLECTION), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const list: PotholeReport[] = [];
    snapshot.forEach((d) => {
      list.push(d.data() as PotholeReport);
    });
    onUpdate(list);
  }, (error) => {
    onError(error);
    handleFirestoreError(error, OperationType.LIST, REPORTS_COLLECTION);
  });
}

// Fetch all reports manually once
export async function fetchAllReports(): Promise<PotholeReport[]> {
  try {
    const q = query(collection(db, REPORTS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const list: PotholeReport[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as PotholeReport);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, REPORTS_COLLECTION);
    return [];
  }
}

// Calculate Statistics
export function calculateStats(reports: PotholeReport[]): Statistics {
  const resolved = reports.filter(r => r.status === "resolved").length;
  const active = reports.filter(r => r.status !== "resolved").length;
  const total = reports.length;
  
  const smoothPercentage = total > 0 ? Math.min(100, Math.max(75, 96 - (active * 1.5))) : 98;
  
  return {
    totalActive: active,
    totalRepaired: resolved,
    smoothRoadPercentage: Math.round(smoothPercentage * 10) / 10,
    activeCollaborators: 12 + Math.floor(reports.length / 3)
  };
}

// Create a report in Firestore
export async function createReportInFirestore(formData: any): Promise<PotholeReport> {
  const id = `report-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const finalPin = formData.reporterPin ? String(formData.reporterPin).trim() : Math.floor(1000 + Math.random() * 9000).toString();
  
  const newReport: PotholeReport = {
    id,
    title: formData.title,
    description: formData.description || "Tidak ada rincian tambahan dari pelapor.",
    lat: Number(formData.lat),
    lng: Number(formData.lng),
    imageUrl: formData.imageUrl || "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800",
    videoUrl: formData.videoUrl || "",
    severity: formData.severity || "medium",
    reporterName: formData.reporterName || "Warga Anonim",
    reporterPin: finalPin,
    createdAt: new Date().toISOString(),
    status: "pending",
    upvotes: 1,
    roadName: formData.roadName || "Jalan Raya",
    city: formData.city || "Kota Indonesia",
    province: formData.province || "Provinsi Indonesia",
    authorityCategory: formData.authorityCategory || "kabupaten",
    aiAudit: generatePUPRAudit(
      formData.title,
      formData.description,
      formData.roadName || "Jalan Raya",
      formData.city || "Kota Indonesia",
      formData.severity || "medium"
    ),
    comments: []
  };

  try {
    await setDoc(doc(db, REPORTS_COLLECTION, id), newReport);
    return newReport;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${REPORTS_COLLECTION}/${id}`);
    throw error;
  }
}

// Upvote in Firestore
export async function upvoteReportInFirestore(id: string): Promise<void> {
  const docRef = doc(db, REPORTS_COLLECTION, id);
  try {
    await updateDoc(docRef, {
      upvotes: increment(1)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${REPORTS_COLLECTION}/${id}`);
  }
}

// Add comment to Firestore
export async function addCommentInFirestore(
  id: string, 
  author: string, 
  text: string, 
  isOfficial?: boolean,
  puprPin?: string
): Promise<void> {
  const docRef = doc(db, REPORTS_COLLECTION, id);
  
  const avatars = ["R", "G", "B", "Y", "P", "O", "T"];
  const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
  let finalAuthor = author;
  let finalIsOfficial = !!isOfficial;
  let finalAvatar = "";

  if (puprPin === "194507") {
    finalAuthor = "Pemerintah Pusat (Kementerian PUPR)";
    finalIsOfficial = true;
    finalAvatar = "https://upload.wikimedia.org/wikipedia/commons/4/43/Logo_Pekerjaan_Umum.png";
  } else if (puprPin === "194508") {
    finalAuthor = "Pemerintah Provinsi";
    finalIsOfficial = true;
    finalAvatar = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Coat_of_arms_of_Indonesia.svg/640px-Coat_of_arms_of_Indonesia.svg.png";
  } else if (puprPin === "194509") {
    finalAuthor = "Pemerintah Kabupaten/Kota";
    finalIsOfficial = true;
    finalAvatar = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Coat_of_arms_of_Indonesia.svg/640px-Coat_of_arms_of_Indonesia.svg.png";
  }

  const newComment: Comment = {
    id: `comment-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    author: finalAuthor,
    avatar: finalAvatar || finalAuthor.substring(0, 1).toUpperCase() || randomAvatar,
    text,
    createdAt: new Date().toISOString(),
    isOfficial: finalIsOfficial
  };

  try {
    await updateDoc(docRef, {
      comments: arrayUnion(newComment)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${REPORTS_COLLECTION}/${id}`);
  }
}

// Update status in Firestore
export async function updateStatusInFirestore(id: string, status: 'pending' | 'repairing' | 'resolved'): Promise<void> {
  const docRef = doc(db, REPORTS_COLLECTION, id);
  try {
    await updateDoc(docRef, {
      status
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${REPORTS_COLLECTION}/${id}`);
  }
}

// Resolve report in Firestore with automatic PUPR Resolution comment
export async function resolveReportInFirestore(id: string): Promise<void> {
  const docRef = doc(db, REPORTS_COLLECTION, id);
  try {
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return;
    const reportData = docSnap.data() as PotholeReport;

    const agencyName = reportData.authorityCategory === "pusat" 
      ? "Kementerian PUPR (Pusat)" 
      : reportData.authorityCategory === "provinsi"
        ? "Dinas PU Provinsi"
        : "Dinas PU Kabupaten/Kota";

    const autoOfficialComment: Comment = {
      id: `comment-${Date.now()}-resolution`,
      author: "Sistem PUPR & Jalan Raya",
      text: `Pekerjaan konstruksi jalan telah selesai. Jalan berlubang di ${reportData.roadName} terkonfirmasi ditambal dengan material premium dan disetujui oleh unit pengawas ${agencyName}. Terima kasih atas laporan Anda!`,
      createdAt: new Date().toISOString(),
      isOfficial: true
    };

    await updateDoc(docRef, {
      status: "resolved",
      comments: arrayUnion(autoOfficialComment)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${REPORTS_COLLECTION}/${id}`);
  }
}

// Delete report in Firestore (with reporter PIN authentication / Admin override)
export async function deleteReportInFirestore(
  id: string, 
  pin?: string, 
  isAdmin?: boolean
): Promise<{ success: boolean; error?: string }> {
  const docRef = doc(db, REPORTS_COLLECTION, id);
  try {
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return { success: false, error: "Laporan tidak ditemukan." };
    }

    const report = docSnap.data() as PotholeReport;
    
    if (!isAdmin) {
      const submittedPin = String(pin || '').trim();
      const storedPin = String(report.reporterPin || '').trim();
      
      if (!submittedPin || submittedPin !== storedPin) {
        return { success: false, error: "PIN Pelapor salah atau tidak sah. Laporan hanya dapat dihapus oleh pembuat aslinya." };
      }
    }

    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${REPORTS_COLLECTION}/${id}`);
    return { success: false, error: "Koneksi ke server terputus." };
  }
}

// Clear all reports in Firestore (Admin reset)
export async function purgeAllReportsInFirestore(): Promise<void> {
  try {
    const q = query(collection(db, REPORTS_COLLECTION));
    const snapshot = await getDocs(q);
    const deletePromises: Promise<void>[] = [];
    snapshot.forEach((docSnap) => {
      deletePromises.push(deleteDoc(docSnap.ref));
    });
    await Promise.all(deletePromises);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, REPORTS_COLLECTION);
    throw error;
  }
}

