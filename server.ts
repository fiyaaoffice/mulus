import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

const DATA_DIR = path.join(process.cwd(), "data");
const REPORTS_PATH = path.join(DATA_DIR, "reports.json");

// Ensure data directory and files exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(REPORTS_PATH)) {
  fs.writeFileSync(REPORTS_PATH, JSON.stringify([], null, 2), "utf8");
} else {
  try {
    const data = fs.readFileSync(REPORTS_PATH, "utf8");
    const reports = JSON.parse(data);
    const filtered = reports.filter((r: any) => r.title !== "Lubang depan RS. Karya medika 1");
    if (reports.length !== filtered.length) {
      fs.writeFileSync(REPORTS_PATH, JSON.stringify(filtered, null, 2), "utf8");
      console.log("SUCCESSFULLY REMOVED TARGET REPORT FROM REPORTS.JSON");
    }
  } catch (error) {
    console.error("Error filtering reports on startup:", error);
  }
}

// Lazy load Gemini API
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY" && key.trim() !== "") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

// Read database
function readReports() {
  try {
    const data = fs.readFileSync(REPORTS_PATH, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading database:", error);
    return [];
  }
}

// Write to database
function writeReports(reports: any) {
  try {
    fs.writeFileSync(REPORTS_PATH, JSON.stringify(reports, null, 2), "utf8");
  } catch (error) {
    console.error("Error writing database:", error);
  }
}

// Helper to generate simulated Indonesian PUPR Audit report
function generateSimulatedAudit(title: string, desc: string, roadName: string, city: string, severity: string) {
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

  const selected = codes[severity as 'critical' | 'medium' | 'low'] || codes.low;
  const randNum = Math.floor(1000 + Math.random() * 9000);

  return {
    summary: selected.summary,
    trafficImpact: selected.trafficImpact,
    estimatedCost: selected.cost,
    recommendedMaterial: selected.material,
    estimatedTimeline: selected.timeline,
    puprResponseCode: `PUPR-${city.substring(0, 3).toUpperCase()}-${randNum}-${selected.suffix}`
  };
}

// API Routes
app.get("/api/reports", (req, res) => {
  const reports = readReports();
  // Compute some beautiful statistics dynamically
  const resolved = reports.filter((r: any) => r.status === "resolved").length;
  const active = reports.filter((r: any) => r.status !== "resolved").length;
  const total = reports.length;
  
  // Custom Google Ecosystem styled simulation of smooth roads
  // We assume default city street standard of 100 maximum capacity potholes
  // Smooth road percentage defaults to 94 % or starts from there
  const smoothPercentage = total > 0 ? Math.min(100, Math.max(75, 96 - (active * 1.5))) : 98;

  res.json({
    reports,
    stats: {
      totalActive: active,
      totalRepaired: resolved,
      smoothRoadPercentage: Math.round(smoothPercentage * 10) / 10,
      activeCollaborators: 8 + Math.floor(Math.random() * 12) // simulates active Google workspace users
    }
  });
});

app.post("/api/reports", async (req, res) => {
  const {
    title,
    description,
    lat,
    lng,
    roadName,
    city,
    province,
    severity,
    reporterName,
    reporterPin,
    imageUrl,
    videoUrl
  } = req.body;

  if (!title || !lat || !lng || !roadName) {
    return res.status(400).json({ error: "Kolom Judul, Lokasi, dan Nama Jalan wajib diisi." });
  }

  const reports = readReports();
  const id = `rep-${Date.now()}`;

  // Generate a random 4-digit PIN if not provided
  const finalPin = reporterPin ? String(reporterPin).trim() : Math.floor(1000 + Math.random() * 9000).toString();

  const newReport: any = {
    id,
    title,
    description: description || "Tidak ada rincian tambahan dari pelapor.",
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    imageUrl: imageUrl || "https://picsum.photos/seed/pothole/600/600",
    videoUrl: videoUrl || "",
    severity: severity || "medium",
    reporterName: reporterName || "Warga Anonim",
    reporterPin: finalPin,
    createdAt: new Date().toISOString(),
    status: "pending",
    upvotes: 1,
    roadName,
    city: city || "Kota Indonesia",
    province: province || "Provinsi Indonesia",
    comments: []
  };

  // Attempt using Google Gemini API to analyze pothole and output details in Indonesian
  const ai = getGeminiClient();
  if (ai) {
    try {
      console.log("Calling Gemini 3.5 Flash for Indonesian Pothole Audit Report Analysis...");
      
      const prompt = `Analangkahlah laporan jalan berlubang berikut ini:
Judul Laporan: ${newReport.title}
Deskripsi: ${newReport.description}
Sifat Kerusakan (Estimasi Awal Pengguna): ${newReport.severity}
Nama Jalan & Kota: ${newReport.roadName}, ${newReport.city}, ${newReport.province}

Buat analisis teknis jalan raya (Road Engineering Audit) super profesional bergaya Kementerian Pekerjaan Umum dan Perumahan Rakyat (PUPR) Indonesia.
Format keluaran HARUS berwujud JSON murni dengan properti persis seperti berikut (jangan sertakan markdown, kutipan, petik ganda berlebih, atau pre-wrap lain, murni JSON):
{
  "summary": "Ringkasan analisis konstruksi sipil jalan yang rusak maksimal 2-3 kalimat",
  "trafficImpact": "Seberapa parah dampak arus kemacetan kendaraan dalam 1 kalimat pendek berbobot",
  "estimatedCost": "Perkiraan biaya bahan penambalan aspal dalam Rupiah (misal Rp 3.500.000)",
  "recommendedMaterial": "Rekomendasi jenis bahan aspal/semen penambal terbaik (misalnya AC-WC Hotmix, Cold Mix dsb)",
  "estimatedTimeline": "Format hari atau jam pengerjaan (misal: 1 - 2 Hari kerja, ATAU 4 Jam kerja)",
  "puprResponseCode": "Kode formil PUPR kustom (misalnya PUPR-[TIGA HURUF KOTA]-[EMPAT ANGKA ACak]-SUF)"
}
Pastikan jawaban ditulis seluruhnya dalam Bahasa Indonesia yang formal dan profesional.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const text = response.text?.trim() || "";
      if (text) {
        const parsed = JSON.parse(text);
        newReport.aiAudit = {
          summary: parsed.summary || "",
          trafficImpact: parsed.trafficImpact || "",
          estimatedCost: parsed.estimatedCost || "Rp 3.000.000",
          recommendedMaterial: parsed.recommendedMaterial || "Hot Mix Asphalt Concrete",
          estimatedTimeline: parsed.estimatedTimeline || "3 Hari",
          puprResponseCode: parsed.puprResponseCode || `PUPR-${newReport.city.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}-O1`
        };
      }
    } catch (err) {
      console.error("Gemini API error (falling back to local high-fidelity generator):", err);
      // Fallback
      newReport.aiAudit = generateSimulatedAudit(newReport.title, newReport.description, newReport.roadName, newReport.city, newReport.severity);
    }
  } else {
    // Local generator fallback
    console.log("No Gemini API key detected or configured. Using local custom high-fidelity generator.");
    newReport.aiAudit = generateSimulatedAudit(newReport.title, newReport.description, newReport.roadName, newReport.city, newReport.severity);
  }

  reports.unshift(newReport);
  writeReports(reports);

  res.status(201).json(newReport);
});

// Upvote report
app.post("/api/reports/:id/upvote", (req, res) => {
  const { id } = req.params;
  const reports = readReports();
  const index = reports.findIndex((r: any) => r.id === id);

  if (index !== -1) {
    reports[index].upvotes += 1;
    writeReports(reports);
    return res.json(reports[index]);
  }

  res.status(404).json({ error: "Laporan tidak ditemukan." });
});

// Update Report Status (PUPR Government action)
app.post("/api/reports/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'pending' | 'repairing' | 'resolved'
  const reports = readReports();
  const index = reports.findIndex((r: any) => r.id === id);

  if (index !== -1) {
    reports[index].status = status;
    writeReports(reports);
    return res.json(reports[index]);
  }

  res.status(404).json({ error: "Laporan tidak ditemukan." });
});

// Add comment / stickynote
app.post("/api/reports/:id/comments", (req, res) => {
  const { id } = req.params;
  const { author, text, isOfficial, puprPin } = req.body;

  let finalAuthor = author;
  let finalIsOfficial = !!isOfficial;
  let finalAvatar = "";

  if (puprPin === "194507") {
    finalAuthor = "Kementerian PUPR";
    finalIsOfficial = true;
    finalAvatar = "https://upload.wikimedia.org/wikipedia/commons/4/43/Logo_Pekerjaan_Umum.png";
  }

  if (!finalAuthor || !text) {
    return res.status(400).json({ error: "Nama dan isi komentar wajib diisi." });
  }

  const reports = readReports();
  const index = reports.findIndex((r: any) => r.id === id);

  if (index !== -1) {
    const avatars = ["R", "G", "B", "Y", "P", "O", "T"];
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];

    const newComment = {
      id: `comm-${Date.now()}`,
      author: finalAuthor,
      avatar: finalAvatar || finalAuthor.substring(0, 1).toUpperCase() || randomAvatar,
      text,
      createdAt: new Date().toISOString(),
      isOfficial: finalIsOfficial
    };

    reports[index].comments.push(newComment);
    writeReports(reports);
    return res.json(reports[index]);
  }

  res.status(404).json({ error: "Laporan tidak ditemukan." });
});

// MARK REPAIRED - If requested, resolves the pothole report, putting it into complete list.
// In terms of design, the pothole will disappear from the active maps list, fulfilling "foto atau video tersebut hilang sendiri".
app.post("/api/reports/:id/resolve", (req, res) => {
  const { id } = req.params;
  const reports = readReports();
  const index = reports.findIndex((r: any) => r.id === id);

  if (index !== -1) {
    reports[index].status = "resolved";
    writeReports(reports);
    return res.json({ success: true, report: reports[index] });
  }

  res.status(404).json({ error: "Laporan tidak ditemukan." });
});

// DELETE REPORT - Allows reporters or admins to delete reports
app.delete("/api/reports/:id", (req, res) => {
  const { id } = req.params;
  const pin = req.query.pin || req.body.pin;
  const isAdmin = req.query.isAdmin === "true";

  const reports = readReports();
  const index = reports.findIndex((r: any) => r.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Laporan tidak ditemukan." });
  }

  const report = reports[index];

  if (!isAdmin) {
    // 1. Check if PIN matches
    if (!pin || String(pin).trim() !== String(report.reporterPin).trim()) {
      return res.status(403).json({ error: "PIN Pelapor salah atau tidak sah. Laporan hanya dapat dihapus oleh pembuat aslinya." });
    }

    // 2. Check if PUPR has approved/commented
    const isApprovedOrCommented = report.status !== "pending" || report.comments.some((c: any) => c.isOfficial || c.author === "Kementerian PUPR");
    if (!isApprovedOrCommented) {
      return res.status(403).json({ 
        error: "Laporan belum disetujui atau dikomentari secara resmi oleh Kementerian PUPR. Hubungi pihak PUPR melalui komentar, lalu coba lagi setelah ditanggapi." 
      });
    }
  }

  const deletedReport = reports.splice(index, 1)[0];
  writeReports(reports);
  return res.json({ success: true, report: deletedReport });
});

// Start listening or hook Vite Dev Server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server "Mulus" is running on port ${PORT}`);
  });
}

startServer();
