import { useEffect, useRef, useState, FormEvent } from 'react';
import L from 'leaflet';
import { PotholeReport } from '../types';
import { Map, Maximize2, Compass, AlertCircle, Plus, Layers, Search, Loader2, X, MapPin } from 'lucide-react';

interface IndonesiaMapProps {
  reports: PotholeReport[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMapClick: (lat: number, lng: number) => void;
  isAdmin: boolean;
}

export function IndonesiaMap({ reports, selectedId, onSelect, onMapClick, isAdmin }: IndonesiaMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const selectedMarkerRef = useRef<L.Marker | null>(null);
  
  // Custom interactive overlay states
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [hasGeolocation, setHasGeolocation] = useState<boolean>(false);

  // Google Maps layer and Coordinate HUD states
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [mapType, setMapType] = useState<'streets' | 'satellite' | 'terrain' | 'voyager'>('streets');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-2.5489, 118.0149]);
  const [hoverCoords, setHoverCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Search location states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Focus Coordinates of Indonesia
  const indonesiaCenter: [number, number] = [-2.5489, 118.0149];
  const defaultZoom = 5;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create Leaflet map instance
    const map = L.map(mapContainerRef.current, {
      center: indonesiaCenter,
      zoom: defaultZoom,
      minZoom: 4,
      maxZoom: 18,
      zoomControl: false, // Custom position Zoom controls
      maxBounds: [
        [-11.5, 94.0], // Southwest bounds of Indonesia
        [6.5, 142.0]   // Northeast bounds of Indonesia
      ]
    });

    // Zoom control in bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Create LayerGroup for markers
    const markersGroup = L.layerGroup().addTo(map);
    
    mapRef.current = map;
    markersGroupRef.current = markersGroup;

    // Listen to map movement to track central coordinates
    map.on('move', () => {
      const center = map.getCenter();
      setMapCenter([center.lat, center.lng]);
    });

    // Listen to mousemove for real-time desktop coordinate hover tracker
    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      setHoverCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    };
    const handleMouseOut = () => {
      setHoverCoords(null);
    };

    map.on('mousemove', handleMouseMove);
    map.on('mouseout', handleMouseOut);

    // Map Click Listener to Report Pothole
    map.on('click', (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    });

    // Handle initial browser geolocation (optional check)
    if (navigator.geolocation) {
      setHasGeolocation(true);
    }

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        map.off('mousemove', handleMouseMove);
        map.off('mouseout', handleMouseOut);
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Synchronize dynamic tile layers (Google Maps system & fallback)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing tile layer if it was registered
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    let url = '';
    let attribution = '';

    switch (mapType) {
      case 'streets':
        url = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
        attribution = '&copy; Google Maps';
        break;
      case 'satellite':
        url = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
        attribution = '&copy; Google Satellite Hybrid';
        break;
      case 'terrain':
        url = 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}';
        attribution = '&copy; Google Terrain';
        break;
      case 'voyager':
      default:
        url = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
        attribution = '&copy; CartoDB &copy; OpenStreetMap';
        break;
    }

    const newTileLayer = L.tileLayer(url, {
      attribution,
      maxZoom: 18,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    });

    newTileLayer.addTo(map);
    tileLayerRef.current = newTileLayer;
  }, [mapType]);

  // Sync Markers when reports list / selection changes
  useEffect(() => {
    const map = mapRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // Filter out resolved potholes - "hilang sendiri jika sudah diperbaiki"
    const activeReports = reports.filter(r => r.status !== 'resolved');

    activeReports.forEach((report) => {
      const isSelected = selectedId === report.id;
      
      // Black and White Sleek Google Ecosystem Marker Design
      const isCrit = report.severity === 'critical';
      const isMed = report.severity === 'medium';
      
      const pulseClass = isCrit 
        ? 'pothole-pulse-critical' 
        : isMed 
          ? 'pothole-pulse-medium' 
          : '';

      const markerHtml = `
        <div class="relative flex items-center justify-center w-8 h-8 rounded-full transition-transform ${isSelected ? 'scale-125 z-[999]' : 'scale-100'}">
          <div class="absolute h-5 w-5 rounded-full ${pulseClass} border-2 ${
            isSelected 
              ? 'bg-black border-white ring-2 ring-black' 
              : isCrit 
                ? 'bg-[#111111] border-white' 
                : isMed 
                  ? 'bg-[#555555] border-white' 
                  : 'bg-[#999999] border-[#eeeeee]'
          } flex items-center justify-center">
            <span class="h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white scale-125' : 'bg-white'}"></span>
          </div>
        </div>
      `;

      const markerIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-pothole-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([report.lat, report.lng], { icon: markerIcon });
      
      // Hover Tooltip or Popup
      marker.bindTooltip(`
        <div class="font-sans px-1 text-xs">
          <div class="font-bold text-neutral-900">${report.title}</div>
          <div class="text-[10px] text-neutral-500 mt-0.5">${report.roadName}</div>
        </div>
      `, { direction: 'top', offset: [0, -10] });

      // Click event
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelect(report.id);
      });

      marker.addTo(markersGroup);

      // Track currently selected marker to animate map focus
      if (isSelected) {
        selectedMarkerRef.current = marker;
        // Float camera over selected pothole
        map.setView([report.lat, report.lng], 12, { animate: true, duration: 1.2 });
      }
    });

  }, [reports, selectedId]);

  // Recenter Map of Indonesia
  const handleRecenter = () => {
    if (mapRef.current) {
      mapRef.current.setView(indonesiaCenter, defaultZoom, { animate: true, duration: 1 });
    }
  };

  // Geo Location Focus
  const handleGeoFocus = () => {
    if (navigator.geolocation && mapRef.current) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          mapRef.current?.setView([latitude, longitude], 14, { animate: true, duration: 1.2 });
          // Optionally trigger click on location
          onMapClick(latitude, longitude);
        },
        (error) => {
          console.warn("Geolocation permission error/blocked: ", error);
        }
      );
    }
  };

  // Handle Submit Search
  const handleSearchSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError('');
    setShowResults(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&countrycodes=id&limit=6`
      );
      if (!response.ok) {
        throw new Error('Gagal memuat');
      }
      const data = await response.json();
      setSearchResults(data);
      if (data.length === 0) {
        setSearchError('Lokasi tidak ditemukan');
      }
    } catch (err) {
      console.error(err);
      setSearchError('Gangguan jaringan atau pencarian dibatasi');
    } finally {
      setIsSearching(false);
    }
  };

  // Select Location from searched suggestions
  const handleSelectLocation = (item: any) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    
    if (mapRef.current) {
      // Zoom closer and focus with nice velocity
      mapRef.current.setView([lat, lng], 15, { animate: true, duration: 1.5 });
      
      // Auto-trigger map click which opens the report modal preset with these precise coordinates!
      onMapClick(lat, lng);
    }
    
    // Format a nice concise name for the query
    const addressParts = item.display_name.split(',');
    const addressName = addressParts.slice(0, Math.min(3, addressParts.length)).join(',').trim();
    setSearchQuery(addressName);
    setShowResults(false);
  };

  return (
    <div className="relative w-full h-full bg-neutral-100 flex flex-col overflow-hidden">
      {/* Visual background Grid Overlay resembling Figma blueprint design */}
      {showGrid && (
        <div 
          className="absolute inset-0 z-10 pointer-events-none opacity-[0.03]" 
          style={{
            backgroundImage: `
              linear-gradient(to right, black 1px, transparent 1px),
              linear-gradient(to bottom, black 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />
      )}

      {/* Actual Mapping Division */}
      <div 
        ref={mapContainerRef} 
        id="indonesia-map"
        className="w-full h-full outline-none z-0"
      />

      {/* Clean Floating Control Tools - Grayscale / Canvas Aesthetic */}
      <div className="absolute top-4 right-4 z-30 flex flex-col gap-2 font-sans">
        {/* Recenter Tool */}
        <button
          onClick={handleRecenter}
          title="Fokus Ulang Peta Indonesia"
          className="bg-white hover:bg-neutral-50 text-neutral-900 border border-neutral-200 h-9 w-9 rounded-lg flex items-center justify-center shadow-md cursor-pointer transition hover:scale-105"
        >
          <Compass className="h-4 w-4" />
        </button>

        {/* My Location Tool */}
        {hasGeolocation && (
          <button
            onClick={handleGeoFocus}
            title="Deteksi Lokasi Saya"
            className="bg-white hover:bg-neutral-50 text-neutral-900 border border-neutral-200 h-9 w-9 rounded-lg flex items-center justify-center shadow-md cursor-pointer transition hover:scale-105"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        )}

        {/* Custom Map Themes & Layers Selector */}
        <div className="relative">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            title="Ubah Jenis Peta Google"
            className={`h-9 w-9 rounded-lg flex items-center justify-center shadow-md cursor-pointer transition hover:scale-105 border ${
              showLayerMenu
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-white hover:bg-neutral-50 text-neutral-900 border-neutral-200'
            }`}
          >
            <Layers className="h-4 w-4" />
          </button>

          {showLayerMenu && (
            <div className="absolute right-11 top-0 bg-white border border-neutral-200 rounded-xl shadow-2xl p-2.5 w-48 flex flex-col gap-1 z-40 animate-fadeIn">
              <div className="px-2 pb-1.5 pt-0.5 text-[9px] font-extrabold text-neutral-400 uppercase tracking-wider font-mono border-b border-neutral-100">
                Pilih Jenis Peta Google
              </div>
              
              <button
                type="button"
                onClick={() => {
                  setMapType('streets');
                  setShowLayerMenu(false);
                }}
                className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  mapType === 'streets'
                    ? 'bg-amber-50 text-amber-700'
                    : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <span className="text-sm">🗺️</span> Google Standard (Jalan)
              </button>

              <button
                type="button"
                onClick={() => {
                  setMapType('satellite');
                  setShowLayerMenu(false);
                }}
                className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  mapType === 'satellite'
                    ? 'bg-amber-50 text-amber-700'
                    : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <span className="text-sm">🛰️</span> Google Satelit (Hybrid)
              </button>

              <button
                type="button"
                onClick={() => {
                  setMapType('terrain');
                  setShowLayerMenu(false);
                }}
                className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  mapType === 'terrain'
                    ? 'bg-amber-50 text-amber-700'
                    : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <span className="text-sm">⛰️</span> Google Terrain (Fisik)
              </button>

              <button
                type="button"
                onClick={() => {
                  setMapType('voyager');
                  setShowLayerMenu(false);
                }}
                className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  mapType === 'voyager'
                    ? 'bg-amber-50 text-amber-700'
                    : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <span className="text-sm">🎨</span> Voyager Minimalis
              </button>
            </div>
          )}
        </div>

        {/* Figma Grid Blueprint Toggle */}
        <button
          onClick={() => setShowGrid(!showGrid)}
          title="Tampilkan Lapisan Kisi Visual"
          className={`h-9 w-9 rounded-lg flex items-center justify-center shadow-md cursor-pointer transition hover:scale-105 border ${
            showGrid 
              ? 'bg-black text-white border-black' 
              : 'bg-white hover:bg-neutral-50 text-neutral-900 border-neutral-200'
          }`}
        >
          <span className="text-xs font-bold font-mono">GRID</span>
        </button>
      </div>

      {/* Floating Instructions Banner with Sync real-time Coordinates HUD */}
      <div className="hidden sm:block absolute bottom-4 left-4 z-20 pointer-events-none max-w-sm">
        <div className="bg-white/95 backdrop-blur-md border border-neutral-200/85 p-3.5 rounded-xl shadow-lg space-y-2.5">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-4 w-4 shrink-0 text-black mt-0.5" />
            <div>
              <h4 className="text-[11px] font-bold text-neutral-950 uppercase tracking-widest">Kolaborasi Visual</h4>
              <p className="text-[10px] text-neutral-600 mt-1 leading-relaxed">
                Tekan langsung pada peta Indonesia di atas mendata titik lubang aspal baru, atau lapor cepat koordinat presisi.
              </p>
            </div>
          </div>
          
          <div className="border-t border-neutral-100 pt-2 flex items-center justify-between gap-1.5 font-mono text-[9px] text-neutral-500">
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>GOOGLE EARTH COORDINATE SYSTEM</span>
            </div>
            <div className="font-bold text-neutral-800 bg-neutral-100 px-1.5 py-0.5 rounded leading-none">
              {hoverCoords 
                ? `${hoverCoords.lat.toFixed(6)}, ${hoverCoords.lng.toFixed(6)}`
                : `${mapCenter[0].toFixed(6)}, ${mapCenter[1].toFixed(6)}`
              }
            </div>
          </div>
        </div>
      </div>

      {/* Top Left Search and Status Container */}
      <div className="absolute top-4 left-4 z-30 flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm sm:max-w-md font-sans">
        {/* Google Maps-style Search Input card */}
        <div className="bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden">
          <form onSubmit={handleSearchSubmit} className="flex items-center px-3 py-2 gap-2">
            <Search className="h-4 w-4 text-neutral-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!e.target.value.trim()) {
                  setSearchResults([]);
                  setShowResults(false);
                }
              }}
              placeholder="Cari lokasi (cth: Bandung, Sleman, Sudirman)"
              className="flex-1 bg-transparent border-none text-xs text-neutral-900 outline-none placeholder:text-neutral-400 font-medium py-1"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setShowResults(false);
                }}
                className="p-1 text-neutral-400 hover:text-neutral-900 rounded-full hover:bg-neutral-100 transition whitespace-nowrap outline-none"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="submit"
              disabled={isSearching}
              className="px-3 py-1 bg-black text-white rounded-lg text-[11px] font-bold hover:bg-neutral-800 transition disabled:opacity-50 flex items-center gap-1 cursor-pointer outline-none"
            >
              {isSearching ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Cari'}
            </button>
          </form>

          {/* Autocomplete Dropdown Search Results */}
          {showResults && (searchResults.length > 0 || searchError) && (
            <div className="border-t border-neutral-100 bg-white max-h-56 overflow-y-auto">
              {searchError ? (
                <div className="p-3 text-xs text-neutral-500 font-medium text-center">
                  ⚠️ {searchError}
                </div>
              ) : (
                <div className="py-1">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-amber-600 uppercase tracking-wider bg-amber-50/40">
                    Hasil Pencarian (Peta Presisi)
                  </div>
                  {searchResults.map((item: any, index: number) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSelectLocation(item)}
                      className="w-full text-left px-3 py-2 hover:bg-neutral-50 transition border-b border-neutral-100 last:border-none flex items-start gap-2.5 text-xs text-neutral-700 cursor-pointer outline-none"
                    >
                      <MapPin className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="font-bold text-neutral-900 truncate">
                          {item.display_name.split(',')[0]}
                        </div>
                        <div className="text-[10px] text-neutral-500 truncate mt-0.5">
                          {item.display_name.split(',').slice(1).join(',').trim()}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Admin indicator banner */}
        {isAdmin && (
          <div className="self-start">
            <div className="bg-black text-white border border-neutral-800 p-2 px-3 rounded-lg shadow-md flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase font-bold animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
              SIKAD PUPR AKTIF
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
