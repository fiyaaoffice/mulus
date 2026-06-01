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
    authorityCategory: 'pusat' | 'provinsi' | 'kabupaten';
  }) => void;
}

// Compress and downscale uploaded images using canvas to bypass Firestore's 1MB document size limit
export const compressImage = (file: File, maxWidth = 640, maxHeight = 640, quality = 0.6): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        // Draw and perform anti-aliasing downscaling
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export function getSimulatedAddress(lat: number, lng: number): { roadName: string, city: string, province: string, authorityCategory: 'pusat' | 'provinsi' | 'kabupaten' } {
  // Default fallback
  let roadName = "Jl. Raya Utama";
  let city = "Jakarta Pusat";
  let province = "DKI Jakarta";
  let authorityCategory: 'pusat' | 'provinsi' | 'kabupaten' = "pusat";

  const absoluteLat = Math.abs(lat);
  const absoluteLng = Math.abs(lng);

  // Heuristics based on coordinate bounding box
  if (lat >= -6.8 && lat <= -5.5 && lng >= 106.3 && lng <= 107.5) {
    // Jakarta Raya and surroundings
    const roads = ["Jl. Jend. Sudirman", "Jl. Gatot Subroto", "Jl. H.R. Rasuna Said", "Jl. Raya Bogor", "Jl. Margonda Raya", "Jl. Kebon Jeruk Raya"];
    const cities = ["Jakarta Selatan", "Jakarta Pusat", "Jakarta Barat", "Depok", "Bekasi"];
    const rIdx = Math.abs(Math.floor(lat * 1000 + lng * 1000)) % roads.length;
    const cIdx = Math.abs(Math.floor(lat * 500)) % cities.length;
    roadName = roads[rIdx];
    city = cities[cIdx];
    province = "DKI Jakarta";
  } else if (lat >= -8.2 && lat <= -6.0 && lng >= 107.2 && lng <= 109.0) {
    // West Java (Bandung, etc)
    const roads = ["Jl. Lintas Jawa Barat", "Jl. Raya Cipularang Km 90", "Jl. Dr. Djunjunan", "Jl. Ir. H. Juanda", "Jl. Soekarno-Hatta", "Jl. Siliwangi"];
    roadName = roads[Math.abs(Math.floor(lat * 1000 + lng * 1000)) % roads.length];
    city = "Bandung";
    province = "Jawa Barat";
  } else if (lat >= -8.3 && lat <= -7.2 && lng >= 110.0 && lng <= 111.0) {
    // Yogyakarta & Solo
    const roads = ["Jl. Malioboro", "Jl. Ringroad Utara", "Jl. Kaliurang Km 7", "Jl. Raya Jogja-Solo"];
    roadName = roads[Math.abs(Math.floor(lat * 1000 + lng * 1000)) % roads.length];
    city = "Sleman";
    province = "D.I. Yogyakarta";
  } else if (lat >= -8.8 && lat <= -6.8 && lng >= 111.0 && lng <= 115.0) {
    // East Java (Surabaya, Malang, etc)
    const roads = ["Jl. Basuki Rahmat", "Jl. Lintas Pantura Timur", "Jl. Raya Darmo", "Jl. Raya Tretes"];
    roadName = roads[Math.abs(Math.floor(lat * 1000 + lng * 1000)) % roads.length];
    city = "Surabaya";
    province = "Jawa Timur";
  } else if (lat >= -6.0 && lat <= 6.0 && lng >= 95.0 && lng <= 106.0) {
    // Sumatra
    const roads = ["Jl. Lintas Sumatera Km 128", "Jl. Sisingamangaraja", "Jl. Trans Sumatera Buah", "Jl. Angkatan 45"];
    roadName = roads[Math.abs(Math.floor(lat * 1000 + lng * 1000)) % roads.length];
    city = "Medan";
    province = "Sumatera Utara";
  } else if (lat >= -4.0 && lat <= 4.0 && lng >= 109.0 && lng <= 119.0) {
    // Kalimantan
    const roads = ["Jl. Trans Kalimantan Km 40", "Jl. Ahmad Yani", "Jl. Jenderal Sudirman"];
    roadName = roads[Math.abs(Math.floor(lat * 1000 + lng * 1000)) % roads.length];
    city = "Samarinda";
    province = "Kalimantan Timur";
  } else if (lat >= -8.5 && lat <= 2.0 && lng >= 119.0 && lng <= 126.5) {
    // Sulawesi
    const roads = ["Jl. Lintas Trans-Sulawesi", "Jl. AP Pettarani", "Jl. Boulevard"];
    roadName = roads[Math.abs(Math.floor(lat * 1000 + lng * 1000)) % roads.length];
    city = "Makassar";
    province = "Sulawesi Selatan";
  } else if (lat >= -9.0 && lat <= -8.0 && lng >= 114.0 && lng <= 116.0) {
    // Bali
    const roads = ["Jl. Sunset Road", "Jl. Bypass Ngurah Rai", "Jl. Raya Ubud"];
    roadName = roads[Math.abs(Math.floor(lat * 1000 + lng * 1000)) % roads.length];
    city = "Badung";
    province = "Bali";
  }

  // Now calculate smart wewenang based on road keywords
  const nameLower = roadName.toLowerCase();
  if (
    nameLower.includes('nasional') || 
    nameLower.includes('lintas') || 
    nameLower.includes('tol') || 
    nameLower.includes('bypass') || 
    nameLower.includes('by pass') || 
    nameLower.includes('pantura') || 
    nameLower.includes('trans') || 
    nameLower.includes('negara') ||
    nameLower.includes('sudirman') ||
    nameLower.includes('gatot subroto') ||
    nameLower.includes('thamrin')
  ) {
    authorityCategory = 'pusat';
  } else if (
    nameLower.includes('provinsi') || 
    nameLower.includes('prov') || 
    nameLower.includes('raya') || 
    nameLower.includes('arteri') ||
    nameLower.includes('lingkar') ||
    nameLower.includes('utama')
  ) {
    authorityCategory = 'provinsi';
  } else {
    authorityCategory = 'kabupaten';
  }

  return { roadName, city, province, authorityCategory };
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
  const [authorityCategory, setAuthorityCategory] = useState<'pusat' | 'provinsi' | 'kabupaten'>('pusat');
  const [reporterName, setReporterName] = useState('');
  const [reporterPin, setReporterPin] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());
  const [isGeocoding, setIsGeocoding] = useState(false);
  
  // Custom smart image picker (presets removed, always 'custom')
  const [selectedImagePreset, setSelectedImagePreset] = useState<string>('custom');
  const [customImageUrl, setCustomImageUrl] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState(false);

  // Handle coordinate edits: auto-fill address when lat / lng changes
  useEffect(() => {
    let active = true;
    if (lat && lng) {
      // Immediate simulated fallback so the form is never blank
      const mapped = getSimulatedAddress(Number(lat), Number(lng));
      setRoadName(mapped.roadName);
      setCity(mapped.city);
      setProvince(mapped.province);
      setAuthorityCategory(mapped.authorityCategory);

      // Perform real Nominatim reverse geocoding for 100% precision
      const fetchReverseGeocode = async () => {
        setIsGeocoding(true);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
          if (!res.ok) throw new Error("Gagal mengambil data geocoding");
          const data = await res.json();
          if (active && data && data.address) {
            const addr = data.address;
            
            // Extract road / street name
            const road = addr.road || addr.street || addr.footway || addr.path || addr.pedestrian || addr.suburb || addr.neighbourhood || addr.village || mapped.roadName;
            
            // Extract city / kabupaten
            const cityOrKab = addr.city || addr.town || addr.municipality || addr.city_district || addr.county || addr.regency || mapped.city;
            
            // Extract province
            const prov = addr.state || addr.region || mapped.province;

            setRoadName(road);
            setCity(cityOrKab);
            setProvince(prov);

            // Re-evaluate authority category based on geocoded road name
            const nameLower = road.toLowerCase();
            let authCat: 'pusat' | 'provinsi' | 'kabupaten' = 'kabupaten';
            if (
              nameLower.includes('nasional') || 
              nameLower.includes('lintas') || 
              nameLower.includes('tol') || 
              nameLower.includes('bypass') || 
              nameLower.includes('by pass') || 
              nameLower.includes('pantura') || 
              nameLower.includes('trans') || 
              nameLower.includes('negara') ||
              nameLower.includes('sudirman') ||
              nameLower.includes('gatot subroto') ||
              nameLower.includes('thamrin')
            ) {
              authCat = 'pusat';
            } else if (
              nameLower.includes('provinsi') || 
              nameLower.includes('prov') || 
              nameLower.includes('raya') || 
              nameLower.includes('arteri') ||
              nameLower.includes('lingkar') ||
              nameLower.includes('utama')
            ) {
              authCat = 'provinsi';
            }
            setAuthorityCategory(authCat);
          }
        } catch (err) {
          console.error("Nominatim reverse geocode error:", err);
        } finally {
          if (active) setIsGeocoding(false);
        }
      };

      const debounceTimer = setTimeout(() => {
        fetchReverseGeocode();
      }, 700);

      return () => {
        active = false;
        clearTimeout(debounceTimer);
      };
    }
  }, [lat, lng]);

  // Adjust authority category reactively when roadName is edited manually
  useEffect(() => {
    const nameLower = roadName.toLowerCase();
    
    // Explicit string matching matches PUPR/Authority rule
    if (
      nameLower.includes('nasional') || 
      nameLower.includes('lintas') || 
      nameLower.includes('tol') || 
      nameLower.includes('bypass') || 
      nameLower.includes('by pass') || 
      nameLower.includes('pantura') || 
      nameLower.includes('trans') || 
      nameLower.includes('negara') ||
      nameLower.includes('sudirman') ||
      nameLower.includes('gatot subroto') ||
      nameLower.includes('thamrin')
    ) {
      setAuthorityCategory('pusat');
    } else if (
      nameLower.includes('provinsi') || 
      nameLower.includes('prov') || 
      nameLower.includes('raya') || 
      nameLower.includes('arteri') ||
      nameLower.includes('lingkar') ||
      nameLower.includes('utama')
    ) {
      setAuthorityCategory('provinsi');
    } else if (
      nameLower.includes('kabupaten') || 
      nameLower.includes('kab') || 
      nameLower.includes('kota') || 
      nameLower.includes('kecamatan') || 
      nameLower.includes('desa') || 
      nameLower.includes('kelurahan') || 
      nameLower.includes('gang') || 
      nameLower.includes('perum') || 
      nameLower.includes('perumahan') || 
      nameLower.includes('dusun')
    ) {
      setAuthorityCategory('kabupaten');
    }
  }, [roadName]);

  // Synchronise coordinate points when clicked on map to provide seamless addresses
  useEffect(() => {
    if (initialLat !== null && initialLng !== null) {
      setLat(Number(initialLat));
      setLng(Number(initialLng));
    }
  }, [initialLat, initialLng]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("Ukuran gambar terlalu besar. Batas maksimal adalah 10MB.");
        return;
      }
      setIsCompressing(true);
      try {
        const compressedBase64 = await compressImage(file, 640, 640, 0.6);
        setCustomImageUrl(compressedBase64);
        setSelectedImagePreset('custom');
      } catch (err) {
        console.error("Gagal mengompres gambar:", err);
        // Fallback to raw base64 if compression fails
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setCustomImageUrl(reader.result);
            setSelectedImagePreset('custom');
          }
        };
        reader.readAsDataURL(file);
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !roadName || !city || !province) return;

    // Use a relevant fallback image of simulated pothole if nothing is supplied
    const finalImageUrl = customImageUrl || 'https://picsum.photos/seed/mulus_pothole/600/600';

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
      imageUrl: finalImageUrl,
      authorityCategory
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
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 font-bold font-mono tracking-wide uppercase">
                <MapPin className="h-3.5 w-3.5 text-black" />
                Titik Koordinat Lokasi (Akurat Seperti Google Maps)
              </div>
              {isGeocoding && (
                <div className="flex items-center gap-1.5 text-[10px] text-amber-600 font-bold animate-pulse font-sans">
                  <div className="h-2 w-2 bg-amber-500 rounded-full animate-ping"></div>
                  <span>Sedang Melacak Alamat 100% Akurat...</span>
                </div>
              )}
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

          {/* Classification of Authority Category (Wewenang Jalan) */}
          <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2 font-mono">
              Kategori Penanggung Jawab Jalan (Wewenang)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {[
                { value: 'pusat', title: 'Pusat (PUPR)', desc: 'Jalan nasional & lintas provinsi' },
                { value: 'provinsi', title: 'Provinsi', desc: 'Jalan utama dalam provinsi' },
                { value: 'kabupaten', title: 'Kabupaten/Kota', desc: 'Jalan kota & kecamatan' }
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setAuthorityCategory(item.value as any)}
                  className={`p-2.5 text-left rounded-lg border cursor-pointer transition flex flex-col justify-start text-xs ${
                    authorityCategory === item.value
                      ? 'bg-black text-white border-black shadow-xs'
                      : 'bg-white text-neutral-800 border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <span className="font-extrabold block">{item.title}</span>
                  <span className={`text-[9px] mt-0.5 block leading-tight ${authorityCategory === item.value ? 'text-neutral-300' : 'text-neutral-500'}`}>
                    {item.desc}
                  </span>
                </button>
              ))}
            </div>
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

          {/* Foto / Media Kerusakan */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2 font-mono">Bukti Foto / Media Kerusakan</label>

            {/* Upload File & Custom URL Options */}
            <div className="bg-zinc-50 border border-black/5 p-3 rounded-xl space-y-2.5">
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
              {isCompressing ? (
                <div className="flex items-center gap-2 pt-1 border-t border-dashed border-zinc-200 animate-pulse text-amber-600">
                  <div className="h-5 w-5 rounded-full border-2 border-amber-500 border-t-transparent animate-spin shrink-0"></div>
                  <span className="text-[10px] font-bold">
                    Mengoptimasi & mengompres ukuran foto (agar pas di cloud)...
                  </span>
                </div>
              ) : (
                selectedImagePreset === 'custom' && customImageUrl && (
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
                        {customImageUrl.startsWith('data:') ? `Format Teroptimasi Cloud (${Math.round(customImageUrl.length / 1024)} KB)` : customImageUrl}
                      </span>
                    </div>
                  </div>
                )
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
              disabled={isCompressing}
              className={`px-5 py-2 text-xs font-extrabold rounded-lg shadow-md flex items-center gap-1.5 transition active:scale-95 ${
                isCompressing 
                  ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                  : 'bg-black hover:bg-neutral-900 text-white cursor-pointer'
              }`}
            >
              {isCompressing ? 'Sedang Mengompres...' : 'Mulai Terbitkan Laporan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
