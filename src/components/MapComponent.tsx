import React, { useState } from 'react';
import { MapPin, Info, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

interface Issue {
  id: string;
  title: string;
  category: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Pending' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';
  latitude: number;
  longitude: number;
  address: string;
}

interface MapComponentProps {
  issues: Issue[];
  selectedIssueId?: string;
  onSelectIssue?: (issueId: string) => void;
  interactive?: boolean;
  onLocationSelect?: (lat: number, lng: number, address: string) => void;
  initialLat?: number;
  initialLng?: number;
}

export default function MapComponent({
  issues,
  selectedIssueId,
  onSelectIssue,
  interactive = false,
  onLocationSelect,
  initialLat = 37.7749,
  initialLng = -122.4194,
}: MapComponentProps) {
  const [mapCenter, setMapCenter] = useState({ lat: initialLat, lng: initialLng });
  const [draggedPin, setDraggedPin] = useState<{ lat: number; lng: number } | null>(
    interactive ? { lat: initialLat, lng: initialLng } : null
  );

  // Simple coordinate to canvas pixels mapping
  // San Francisco center bounds approximation
  const latMin = 37.7400;
  const latMax = 37.7950;
  const lngMin = -122.4600;
  const lngMax = -122.4000;

  const getXY = (lat: number, lng: number) => {
    const x = ((lng - lngMin) / (lngMax - lngMin)) * 100;
    const y = (1 - (lat - latMin) / (latMax - latMin)) * 100; // Invert Y for screen coordinates
    return {
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(5, Math.min(95, y)),
    };
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !onLocationSelect) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    // Convert screen back to Lat Lng
    const lng = lngMin + (clickX / 100) * (lngMax - lngMin);
    const lat = latMin + (1 - clickY / 100) * (latMax - latMin);

    setDraggedPin({ lat, lng });

    // Generate simulated address based on click sector
    let sector = 'Downtown District';
    if (clickX < 40 && clickY > 55) sector = 'Golden Gate & Richmond';
    else if (clickX < 50 && clickY < 50) sector = 'Pacific Heights';
    else if (clickX > 60 && clickY > 60) sector = 'Mission / Noe Valley District';
    else if (clickX > 55 && clickY < 55) sector = 'SOMA Financial Area';
    
    const streetNum = Math.floor(Math.random() * 800) + 100;
    const streets = ['Market St', 'Tehama St', 'Mission St', 'Valencia St', 'Duboce Ave', 'Oak St', '8th St', '3rd St'];
    const street = streets[Math.floor((clickX + clickY) % streets.length)];
    const address = `${streetNum} ${street}, San Francisco, CA 94103 (${sector})`;

    onLocationSelect(Number(lat.toFixed(5)), Number(lng.toFixed(5)), address);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolved': return 'bg-emerald-500 border-emerald-300';
      case 'In Progress': return 'bg-amber-500 border-amber-300';
      case 'Assigned': return 'bg-blue-500 border-blue-300';
      case 'Closed': return 'bg-slate-500 border-slate-400';
      default: return 'bg-rose-500 border-rose-300';
    }
  };

  const getSeverityRing = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'ring-4 ring-rose-500 animate-pulse';
      case 'High': return 'ring-2 ring-orange-400 animate-pulse';
      case 'Medium': return 'ring-2 ring-amber-300';
      default: return 'ring-1 ring-emerald-300';
    }
  };

  return (
    <div className="relative w-full h-[400px] md:h-[480px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl select-none">
      {/* City Map Background Vector Art Grid */}
      <div 
        id="civic-map-canvas"
        className="absolute inset-0 cursor-crosshair opacity-90 bg-[radial-gradient(#1e293b_1.5px,transparent_1.5px)] [background-size:24px_24px]"
        onClick={handleMapClick}
      >
        {/* Styled Roads / Streets */}
        <div className="absolute top-1/4 left-0 w-full h-4 bg-slate-900 border-y border-slate-800/40 rotate-1"></div>
        <div className="absolute top-2/3 left-0 w-full h-6 bg-slate-900 border-y border-slate-800/40 -rotate-2"></div>
        <div className="absolute top-0 left-1/3 w-8 h-full bg-slate-900 border-x border-slate-800/40 rotate-12"></div>
        <div className="absolute top-0 left-2/3 w-6 h-full bg-slate-900 border-x border-slate-800/40 -rotate-6"></div>
        
        {/* Diagonal Highway */}
        <div className="absolute top-0 left-0 w-full h-10 bg-slate-900/60 border-y border-slate-800/40 rotate-45 transform origin-top-left">
          <div className="w-full h-0.5 border-t border-dashed border-slate-700 mt-4"></div>
        </div>

        {/* Civic Parks / Water body */}
        <div className="absolute bottom-6 left-12 w-40 h-28 bg-emerald-950/40 rounded-full blur-sm border border-emerald-900/30">
          <span className="absolute top-10 left-10 text-[10px] tracking-wider text-emerald-600 font-semibold font-mono">MISSION PARK</span>
        </div>
        <div className="absolute top-8 right-16 w-36 h-20 bg-blue-950/30 rounded-3xl blur-sm border border-blue-900/20">
          <span className="absolute top-8 left-8 text-[10px] tracking-wider text-blue-600 font-semibold font-mono">MARINA BASIN</span>
        </div>

        {/* Display issues markers */}
        {issues.map(issue => {
          const { x, y } = getXY(issue.latitude, issue.longitude);
          const isSelected = selectedIssueId === issue.id;
          
          return (
            <div
              key={issue.id}
              className="absolute group transition-transform hover:scale-125 z-10"
              style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectIssue) onSelectIssue(issue.id);
              }}
            >
              {/* Ping Marker Pin */}
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shadow-lg ${getStatusColor(issue.status)} ${getSeverityRing(issue.severity)} ${isSelected ? 'scale-125 ring-4 ring-white' : ''}`}>
                <MapPin className="w-3.5 h-3.5 text-white" />
              </div>

              {/* Tooltip Popup on hover */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-white p-2.5 rounded-lg shadow-xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 z-50 min-w-[180px]">
                <p className="text-xs font-bold text-slate-100 truncate">{issue.title}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor(issue.status)}`}></span>
                  <span className="text-[10px] font-semibold text-slate-300 font-mono">{issue.status} • {issue.severity}</span>
                </div>
                <p className="text-[9px] text-slate-400 mt-1 truncate">{issue.address}</p>
              </div>
            </div>
          );
        })}

        {/* Dynamic Dragged pin for Reporting Mode */}
        {interactive && draggedPin && (
          <div
            className="absolute z-20 animate-bounce"
            style={{ 
              left: `${getXY(draggedPin.lat, draggedPin.lng).x}%`, 
              top: `${getXY(draggedPin.lat, draggedPin.lng).y}%`, 
              transform: 'translate(-50%, -100%)' 
            }}
          >
            <div className="flex flex-col items-center">
              <div className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg border border-rose-400 whitespace-nowrap mb-1">
                Pin Issue Here
              </div>
              <div className="w-8 h-8 bg-rose-600 rounded-full border-2 border-white flex items-center justify-center shadow-2xl ring-4 ring-rose-500/30">
                <MapPin className="w-5 h-5 text-white animate-pulse" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Map Overlay Controls / HUD */}
      <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-800 text-white flex flex-col gap-1 shadow-lg max-w-[200px] pointer-events-none">
        <h4 className="text-[11px] font-bold tracking-widest text-emerald-400 font-mono uppercase">HYPERLOCAL HUB HUD</h4>
        <p className="text-[10px] text-slate-400 leading-tight">Click on the grid to pinpoint your civic hazard.</p>
        <div className="flex items-center gap-1.5 mt-1.5 text-[9px] font-mono text-slate-300">
          <Clock className="w-3 h-3 text-emerald-400" />
          <span>UTC LIVE SYNC</span>
        </div>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-sm px-3 py-2 rounded-xl border border-slate-800 flex gap-3 text-[10px] font-mono text-slate-300 shadow-md">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
          <span>Assigned</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Resolved</span>
        </div>
      </div>
    </div>
  );
}
