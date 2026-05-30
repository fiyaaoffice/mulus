import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { PotholeReport } from '../types';
import { Map, Maximize2, Compass, AlertCircle, Plus, Layers } from 'lucide-react';

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
  const [mapTheme, setMapTheme] = useState<'light' | 'dark'>('light');
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [hasGeolocation, setHasGeolocation] = useState<boolean>(false);

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

    // Custom colorful premium tile layer (CartoDB Voyager)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CartoDB &copy; OpenStreetMap'
    }).addTo(map);

    // Zoom control in bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Create LayerGroup for markers
    const markersGroup = L.layerGroup().addTo(map);
    
    mapRef.current = map;
    markersGroupRef.current = markersGroup;

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
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

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
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 font-sans">
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

        {/* Custom Map Themes */}
        <button
          onClick={() => setMapTheme(mapTheme === 'light' ? 'dark' : 'light')}
          title="Ubah Tema Peta"
          className="bg-white hover:bg-neutral-50 text-neutral-900 border border-neutral-200 h-9 w-9 rounded-lg flex items-center justify-center shadow-md cursor-pointer transition hover:scale-105"
        >
          <Layers className="h-4 w-4" />
        </button>

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

      {/* Floating Instructions Banner (mimics Google ecosystem floating search design) */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-none max-w-sm">
        <div className="bg-white/95 backdrop-blur-md border border-neutral-200/85 p-3.5 rounded-xl shadow-lg flex items-start gap-3">
          <AlertCircle className="h-4 w-4 shrink-0 text-black mt-0.5" />
          <div>
            <h4 className="text-[11px] font-bold text-neutral-950 uppercase tracking-widest">Kolaborasi Visual</h4>
            <p className="text-[10px] text-neutral-600 mt-1 leading-relaxed">
              Tekan langsung pada peta Indonesia di atas untuk menaruh titik koordinat keretakan jalan, lalu lengkapi detail masalah untuk dilaporkan.
            </p>
          </div>
        </div>
      </div>

      {/* Admin indicator banner */}
      {isAdmin && (
        <div className="absolute top-4 left-4 z-20 pointer-events-none">
          <div className="bg-black text-white border border-neutral-800 p-2 px-3 rounded-lg shadow-md flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase font-bold animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
            SIKAD PUPR AKTIF
          </div>
        </div>
      )}
    </div>
  );
}
