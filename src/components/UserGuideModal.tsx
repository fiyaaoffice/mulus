import React from 'react';
import { X, MapPin, Award, FileText, Camera, Lock, Info, Landmark } from 'lucide-react';

interface UserGuideModalProps {
  onClose: () => void;
}

export function UserGuideModal({ onClose }: UserGuideModalProps) {
  const steps = [
    {
      icon: <MapPin className="h-5 w-5 text-neutral-800" />,
      title: '1. Tentukan Titik Lokasi Kerusakan',
      desc: 'Cari lokasi menggunakan fitur kolom pencarian peta presisi tinggi pada bagian atas peta, klik langsung di area jalan pada peta interaktif Indonesia, atau input koordinat Latitude & Longitude secara manual.'
    },
    {
      icon: <Landmark className="h-5 w-5 text-neutral-800" />,
      title: '2. Tentukan Hub Kategori Wewenang',
      desc: 'Pilih klasifikasi penanggung jawab penanganan jalan agar laporan Anda terarah cepat:',
      bullets: [
        'Pemerintah Pusat (Kementerian PUPR): Memperbaiki jalan nasional dan lintas provinsi.',
        'Pemerintah Provinsi: Memperbaiki jalan utama di dalam provinsi.',
        'Pemerintah Kabupaten/Kota: Memperbaiki jalan perkotaan dan antarkecamatan.'
      ]
    },
    {
      icon: <FileText className="h-5 w-5 text-neutral-800" />,
      title: '3. Deskripsikan Secara Rinci',
      desc: 'Berikan judul laporan spesifik, deskripsi kronologi (sejak kapan berlubang), sifat keparahan kerusakan (Ringan / Sedang / Kritis), dan isi nama pelapor Anda.'
    },
    {
      icon: <Camera className="h-5 w-5 text-neutral-800" />,
      title: '4. Pasang Foto / Video Bukti',
      desc: 'Unggah file dokumentasi dari galeri handphone Anda atau input alamat URL tautan eksternal kustom untuk menyajikan bukti visual aspal berlubang di lapangan.'
    },
    {
      icon: <Lock className="h-5 w-5 text-neutral-800" />,
      title: '5. Amankan PIN Laporan Anda',
      desc: 'Setiap laporan yang terdaftar dilindungi PIN 4-digit acak (atau sesuaikan sendiri). Simpan PIN ini baik-baik untuk otorisasi penghapusan/perubahan di masa mendatang.'
    }
  ];

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-150 bg-neutral-50">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-center">
              <Info className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-extrabold tracking-tight text-neutral-900 text-base">
                Petunjuk Penggunaan & Alur Laporan
              </h3>
              <p className="text-[11px] font-medium text-neutral-500 mt-0.5">
                Panduan interaktif partisipasi publik dalam pemantauan jalan rusak.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-neutral-100 text-neutral-500 hover:text-black cursor-pointer transition bg-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content - Steps */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-700 leading-relaxed flex gap-2.5">
            <span className="text-lg">📢</span>
            <p>
              Portal ini dirancang untuk mendeteksi, mencatat, dan mengoordinasikan perbaikan sarana aspal jalan di wilayah Indonesia secara kolaboratif. Laporan Anda langsung diteruskan ke instansi terkait berdasarkan kategori penanggung jawab.
            </p>
          </div>

          <div className="space-y-4">
            {steps.map((step, idx) => (
              <div key={idx} className="flex gap-4 p-4 rounded-xl border border-neutral-150 hover:bg-neutral-50/50 transition">
                <div className="h-9 w-9 bg-neutral-100 rounded-lg flex items-center justify-center border border-neutral-200 shrink-0">
                  {step.icon}
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold text-neutral-900">
                    {step.title}
                  </h4>
                  <p className="text-xs text-neutral-600 leading-normal">
                    {step.desc}
                  </p>
                  {step.bullets && (
                    <ul className="mt-2 space-y-1.5 pl-1">
                      {step.bullets.map((bullet, bidx) => (
                        <li key={bidx} className="text-[11px] text-neutral-700 flex items-start gap-1.5 leading-snug">
                          <span className="text-neutral-400 mt-1 shrink-0">•</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-150 flex justify-end bg-neutral-50">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-black hover:bg-neutral-800 rounded-xl cursor-pointer transition shadow-xs"
          >
            Saya Mengerti, Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
}
