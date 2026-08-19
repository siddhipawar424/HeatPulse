import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, useMap } from 'react-leaflet';
import { Layers, MapPin, Eye } from 'lucide-react';

// Controller to auto-pan and zoom map when selected AOI changes
function MapViewBounds({ center, zoom, bounds }) {
  const map = useMap();

  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [30, 30] });
    } else if (center) {
      map.setView(center, zoom || 13);
    }
  }, [center, zoom, bounds, map]);

  return null;
}

export function MapPanel({ selectedAOI, analysisResult }) {
  // Convert GeoJSON [[lng, lat]] coordinates to Leaflet [[lat, lng]] format
  const rawCoords = selectedAOI?.polygon?.features?.[0]?.geometry?.coordinates?.[0] || [];
  const polygonLatLngs = rawCoords.map(([lng, lat]) => [lat, lng]);

  const center = selectedAOI?.center || [33.45, -112.09];
  const zoom = selectedAOI?.zoom || 13;

  return (
    <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-4 shadow-xl flex flex-col h-full min-h-[380px] lg:min-h-[440px]">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              Hyperlocal AOI Boundary Map
              <span className="text-[10px] font-mono bg-gray-800 text-gray-300 px-2 py-0.5 rounded border border-gray-700">
                CartoDB Dark Tile
              </span>
            </h3>
          </div>
        </div>

        {analysisResult && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Risk Level:</span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
              analysisResult.risk.level === 'CRITICAL' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
              analysisResult.risk.level === 'HIGH' ? 'bg-red-500/20 text-red-400 border-red-500/40' :
              analysisResult.risk.level === 'MODERATE' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
              'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
            }`}>
              {analysisResult.risk.level} ({analysisResult.risk.score})
            </span>
          </div>
        )}
      </div>

      {/* Interactive Map View */}
      <div className="relative flex-1 w-full rounded-xl overflow-hidden border border-gray-800/80 shadow-inner">
        <MapContainer
          center={center}
          zoom={zoom}
          scrollWheelZoom={true}
          className="w-full h-full min-h-[320px]"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            maxZoom={19}
          />

          <MapViewBounds center={center} zoom={zoom} bounds={polygonLatLngs} />

          {/* AOI Polygon Highlight Overlay */}
          {polygonLatLngs.length > 0 && (
            <Polygon
              positions={polygonLatLngs}
              pathOptions={{
                color: '#ff5722',
                fillColor: '#ff5722',
                fillOpacity: 0.22,
                weight: 2.5,
                dashArray: '6, 6'
              }}
            >
              <Popup>
                <div className="p-1 space-y-1 text-xs">
                  <div className="font-bold text-orange-400">{selectedAOI.label}</div>
                  <div className="text-gray-300 font-mono text-[11px]">
                    AOI Bounds: {polygonLatLngs.length} Points
                  </div>
                  {analysisResult && (
                    <div className="mt-2 pt-1 border-t border-gray-700 text-gray-200">
                      <div><strong className="text-orange-300">Max Temp:</strong> {analysisResult.risk.maximum_temperature}°C</div>
                      <div><strong className="text-orange-300">Mean Temp:</strong> {analysisResult.risk.mean_temperature}°C</div>
                    </div>
                  )}
                </div>
              </Popup>
            </Polygon>
          )}
        </MapContainer>

        {/* Legend / Overlay Note */}
        <div className="absolute bottom-3 left-3 z-[400] bg-gray-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-gray-800 text-[11px] text-gray-300 flex items-center gap-2 shadow-md">
          <span className="w-2.5 h-2.5 rounded-sm bg-orange-500/40 border border-orange-400"></span>
          <span>Target Analysis AOI Boundary</span>
        </div>
      </div>
    </div>
  );
}
