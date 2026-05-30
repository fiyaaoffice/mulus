import React, { useState, useEffect } from 'react';
import { X, Camera, MapPin, Check, AlertCircle, Info, Upload } from 'lucide-react';

interface ReportFormModalProps {
  initialLat: number | null;
  initialLng: number | null;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    lat: number;
    lng: number;
    roadName: string;
    city: string;
    province: string;
    severity: 'low' | 'medium' | 'critical';
    reporterName: string;
    reporterPin: string;
    imageUrl: string;
  }) => void;
}

export function ReportFormModal({ initialLat, initialLng, onClose, onSubmit }: ReportFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [lat, setLat] = useState<number>(-6.2088);
  const [lng, setLng] = useState<number>(106.8456);
  const [roadName, setRoadName] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'critical'>('medium');
  const [reporterName, setReporterName] = useState('');
  const [reporterPin, setReporterPin] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());
  
  // Custom smart image picker
  const [selectedImagePreset, setSelectedImagePreset] = useState<string>('preset1');
  const [customImageUrl, setCustomImageUrl] = useState<string>('');

  // Preset Realistic Potholes we created / configured
  const presetImages = {
    preset1: {
      name: 'Lubang Perkotaan (Jakarta)',
      url: '/src/assets/images/pothole_city_png_1780109559191.png'
    },
    preset2: {
      name: 'Pekuburan Lubang Pedesaan',
      url: '/src/assets/images/pothole_rural_png_1780109577503.png'
    },
    preset3: {
      name: 'Retakan Aspal Hujan (Picsum)',
      url: 'https://picsum.photos/seed/pothole_rain/600/600'
    }
  };

  useEffect(() => {
    if (initialLat !== null) setLat(Number(initialLat));
    if (initialLng !== null) setLng(Number(initialLng));
  }, [initialLat, initialLng]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("Ukuran gambar terlalu besar. Batas maksimal adalah 10MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setCustomImageUrl(reader.result);
          setSelectedImagePreset('custom');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !roadName || !city || !province) return;

    const finalImageUrl = selectedImagePreset === 'custom' && customImageUrl
      ? customImageUrl 
      : presetImages[selectedImagePreset as keyof typeof presetImages]?.url || presetImages.preset1.url;

    onSubmit({
      title,
      description,
      lat: Number(lat),
      lng: Number(lng),
      roadName,
      city,
      province,
      severity,
      reporterName: reporterName || 'Warga Anonim',
      reporterPin,
      imageUrl: finalImageUrl
    });
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-150">
          <div>
            <h3 className="font-extrabold tracking-tight text-neutral-900 text-base flex items-center gap-2">
              <Camera className="h-5 w-5 text-black" />
              Laporkan Jalan Berlubang Baru
            </h3>
            <p className="text-[11px] font-medium text-neutral-500 mt-1">
              Publikasikan foto kerusakan dan bantu pemerintah mempercepat koordinasi perbaikan jalan.
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 text-neutral-500 hover:text-black cursor-pointer transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body Scroll */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
          
          {/* Main info */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 font-mono">Judul Laporan *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Lubang Menganga Dekat Belokan Flyover"
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs outline-none focus:border-black placeholder:text-neutral-400"
              />
            </div>

            {/* Road, city and province coordinates pick */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 font-mono">Nama Jalan *</label>
                <input
                  type="text"
                  required
                  value={roadName}
                  onChange={(e) => setRoadName(e.target.value)}
                  placeholder="Jl. Ahmad Yani"
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs outline-none focus:border-black placeholder:text-neutral-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 font-mono">Kota/Kabupaten *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Sleman / Bandung"
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs outline-none focus:border-black placeholder:text-neutral-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 font-mono">Provinsi *</label>
                <input
                  type="text"
                  required
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  placeholder="Jawa Barat"
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs outline-none focus:border-black placeholder:text-neutral-400"
                />
              </div>
            </div>
          </div>

          {/* Coordinates (Prefilled by map click or custom input) */}
          <div className="rounded-xl bg-neutral-50 border border-neutral-150 p-3.5">
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 font-bold font-mono tracking-wide uppercase mb-2">
              <MapPin className="h-3.5 w-3.5 text-black" />
              Titik Koordinat Lokasi (Akurat Seperti Google Maps)
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] text-neutral-400 block font-mono font-bold mb-1">LATITUDE:</label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                  placeholder="-6.208800"
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-black font-mono font-semibold"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-400 block font-mono font-bold mb-1">LONGITUDE:</label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  value={lng}
                  onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                  placeholder="106.845600"
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-black font-mono font-semibold"
                />
              </div>
            </div>
            <p className="text-[9px] text-neutral-400 mt-2">
              * Anda dapat memasukkan nilai koordinat numerik secara manual dengan tingkat presisi desimal tinggi, atau langsung menekan salah satu titik pada peta.
            </p>
          </div>

          {/* Severity, Reporter, and Post PIN */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2 font-mono">Sifat Kerusakan</label>
              <div className="flex gap-1.5">
                {[
                  { value: 'low', label: 'Ringan' },
                  { value: 'medium', label: 'Sedang' },
                  { value: 'critical', label: 'Kritis' }
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setSeverity(item.value as any)}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg border cursor-pointer transition ${
                      severity === item.value
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-neutral-500 border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 font-mono">Nama Pelapor</label>
              <input
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="Budi Santoso (anonim)"
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs outline-none focus:border-black placeholder:text-neutral-400"
              />
            </div>

            <div>
              <div className="flex items-center gap-1 mb-1.5">
                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider font-mono">PIN Pengaman *</label>
                <span className="text-[9px] text-amber-600 font-bold font-sans">(Ingat PIN ini)</span>
              </div>
              <input
                type="text"
                maxLength={6}
                required
                value={reporterPin}
                onChange={(e) => setReporterPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Contoh: 1234"
                className="w-full rounded-lg border border-red-200 bg-red-50/20 px-3 py-2 text-xs outline-none focus:border-black font-semibold text-center font-mono placeholder:text-neutral-400"
              />
            </div>
          </div>

          {/* Photo upload smart presets & local file device upload */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2 font-mono">Bukti Foto / Media Kerusakan</label>
            <div className="grid grid-cols-3 gap-2.5">
              {Object.entries(presetImages).map(([key, item]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedImagePreset(key)}
                  className={`flex flex-col items-center p-2 rounded-xl border cursor-pointer text-center relative overflow-hidden transition group ${
                    selectedImagePreset === key
                      ? 'border-black bg-neutral-900 text-white'
                      : 'border-neutral-200 bg-white hover:border-neutral-400 text-neutral-800'
                  }`}
                >
                  <div className="h-10 w-full rounded-md overflow-hidden bg-neutral-100 mb-1.5">
                    <img
                      src={item.url}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="text-[9px] font-bold truncate w-full">{item.name}</span>
                  {selectedImagePreset === key && (
                    <div className="absolute top-1 right-1 h-3.5 w-3.5 bg-black text-white rounded-full flex items-center justify-center border border-white">
                      <Check className="h-2 w-2 stroke-[3]" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Upload File & Custom URL Options */}
            <div className="mt-3 bg-zinc-50 border border-black/5 p-3 rounded-xl space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                {/* File Uploader Button */}
                <label className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-[10px] font-bold cursor-pointer transition bg-black hover:bg-neutral-800 text-white shadow-xs">
                  <Upload className="h-3 w-3" />
                  <span>Pilih Foto dari Galeri Device</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {/* Option for custom URLs */}
                <button
                  type="button"
                  onClick={() => setSelectedImagePreset('custom')}
                  className={`py-1.5 px-3 rounded-lg text-[10px] font-bold cursor-pointer transition ${
                    selectedImagePreset === 'custom' 
                      ? 'bg-neutral-900 text-white' 
                      : 'bg-neutral-200 hover:bg-neutral-250 text-neutral-800'
                  }`}
                >
                  Gunakan URL Kustom...
                </button>
              </div>

              {selectedImagePreset === 'custom' && (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-neutral-500 font-mono">LINK ATAU DATA-URL SEBAGAI SUMBER GAMBAR:</label>
                  <input
                    type="text"
                    required
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... atau pilih file untuk mengisi otomatis"
                    className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-black placeholder:text-neutral-400 font-mono"
                  />
                </div>
              )}

              {/* Instant Upload Preview status */}
              {selectedImagePreset === 'custom' && customImageUrl && (
                <div className="flex items-center gap-2 pt-1 border-t border-dashed border-zinc-200">
                  <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden border border-neutral-200 bg-white">
                    <img
                      src={customImageUrl}
                      alt="Uploader preview"
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-emerald-600 flex items-center gap-1">
                      <Check className="h-3 w-3 stroke-[3]" />
                      Berhasil Mengunggah Gambar lokal Pelapor
                    </span>
                    <span className="text-[9px] font-medium text-neutral-400 block truncate max-w-[280px]">
                      {customImageUrl.startsWith('data:') ? 'Format Base64 Media Terenkripsi' : customImageUrl}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 font-mono">Komentar / Catatan Deskriptif Sipil (Opsional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Jelaskan perkiraan lebar lubang, genangan air bila hujan, serta tingkat ancaman penyeberang atau rute angkot terganggu..."
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs outline-none focus:border-black placeholder:text-neutral-400 resize-none font-sans"
            />
          </div>

          <div className="flex items-start gap-2 text-neutral-400 text-[10px] font-medium pt-1.5 leading-relaxed">
            <Info className="h-4.5 w-4.5 shrink-0 text-black" />
            <span>
              * Dengan mempublikasikan laporan, AI Gemini 3.5 Flash akan memproses diagnosis aspal dan menyinkronkan data ini langsung ke visual grid sipil database Indonesia.
            </span>
          </div>

          {/* Form Actions footer */}
          <div className="border-t border-neutral-150 pt-4 flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 cursor-pointer transition active:scale-95"
            >
              Batalkan
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-extrabold rounded-lg bg-black hover:bg-neutral-900 text-white shadow-md flex items-center gap-1.5 cursor-pointer transition active:scale-95"
            >
              Mulai Terbitkan Laporan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
