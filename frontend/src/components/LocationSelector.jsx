import React, { useState } from 'react';
import { MapPin, Sliders, Globe, AlertCircle, Sparkles } from 'lucide-react';
import { DEMO_AOIS, buildCustomAOIPolygon } from '../data/demoAOIs';

export function LocationSelector({ selectedAOI, onSelectAOI }) {
  const [mode, setMode] = useState('demo'); // 'demo' | 'custom'
  const [customBox, setCustomBox] = useState({
    minLng: -112.10,
    minLat: 33.44,
    maxLng: -112.08,
    maxLat: 33.46
  });

  const handleDemoChange = (e) => {
    const found = DEMO_AOIS.find((item) => item.id === e.target.value);
    if (found) {
      onSelectAOI(found);
    }
  };

  const handleCustomApply = () => {
    const polygon = buildCustomAOIPolygon(
      customBox.minLng,
      customBox.minLat,
      customBox.maxLng,
      customBox.maxLat
    );
    const customAOIObj = {
      id: 'custom_aoi',
      label: `Custom Bounding Box (${customBox.minLat}° N, ${customBox.minLng}° W)`,
      description: `User-defined AOI Polygon (${customBox.minLat}° to ${customBox.maxLat}°, ${customBox.minLng}° to ${customBox.maxLng}°)`,
      center: [(customBox.minLat + customBox.maxLat) / 2, (customBox.minLng + customBox.maxLng) / 2],
      zoom: 13,
      polygon
    };
    onSelectAOI(customAOIObj);
  };

  return (
    <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-5 shadow-lg space-y-4">
      {/* Header & Mode Switch */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Target Area of Interest (AOI)</h3>
            <p className="text-xs text-gray-400">Select test AOI or enter custom polygon bounds</p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center bg-gray-950 p-1 rounded-lg border border-gray-800 text-xs">
          <button
            type="button"
            onClick={() => setMode('demo')}
            className={`px-2.5 py-1 rounded-md transition ${
              mode === 'demo' ? 'bg-orange-500/20 text-orange-400 font-semibold border border-orange-500/30' : 'text-gray-400 hover:text-white'
            }`}
          >
            Demo / Test AOIs
          </button>
          <button
            type="button"
            onClick={() => setMode('custom')}
            className={`px-2.5 py-1 rounded-md transition ${
              mode === 'custom' ? 'bg-orange-500/20 text-orange-400 font-semibold border border-orange-500/30' : 'text-gray-400 hover:text-white'
            }`}
          >
            Custom Bounding Box
          </button>
        </div>
      </div>

      {/* Mode 1: Demo / Test Presets */}
      {mode === 'demo' && (
        <div className="space-y-3">
          <label className="block text-xs font-medium text-gray-300">
            Select Test Region <span className="text-amber-400 font-mono text-[11px] ml-1">(DEMO DATA)</span>
          </label>
          <select
            value={selectedAOI.id}
            onChange={handleDemoChange}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 transition"
          >
            {DEMO_AOIS.map((aoi) => (
              <option key={aoi.id} value={aoi.id}>
                {aoi.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400 bg-gray-950/60 p-2.5 rounded-lg border border-gray-800/60 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
            <span>{selectedAOI.description}</span>
          </p>
        </div>
      )}

      {/* Mode 2: Custom Coordinate Input */}
      {mode === 'custom' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div>
              <label className="block text-gray-400 mb-1">Min Longitude (°W)</label>
              <input
                type="number"
                step="0.01"
                value={customBox.minLng}
                onChange={(e) => setCustomBox({ ...customBox, minLng: parseFloat(e.target.value) || 0 })}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1.5 text-white font-mono focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Min Latitude (°N)</label>
              <input
                type="number"
                step="0.01"
                value={customBox.minLat}
                onChange={(e) => setCustomBox({ ...customBox, minLat: parseFloat(e.target.value) || 0 })}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1.5 text-white font-mono focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Max Longitude (°W)</label>
              <input
                type="number"
                step="0.01"
                value={customBox.maxLng}
                onChange={(e) => setCustomBox({ ...customBox, maxLng: parseFloat(e.target.value) || 0 })}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1.5 text-white font-mono focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Max Latitude (°N)</label>
              <input
                type="number"
                step="0.01"
                value={customBox.maxLat}
                onChange={(e) => setCustomBox({ ...customBox, maxLat: parseFloat(e.target.value) || 0 })}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1.5 text-white font-mono focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleCustomApply}
            className="w-full bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 font-medium py-2 rounded-xl text-xs transition"
          >
            Apply Custom AOI Bounding Box
          </button>
        </div>
      )}

      {/* Selected AOI GeoJSON Info */}
      <div className="pt-2 border-t border-gray-800/60 flex items-center justify-between text-[11px] text-gray-400 font-mono">
        <span className="flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-orange-400" />
          Polygon FeatureCollection
        </span>
        <span className="bg-gray-950 px-2 py-0.5 rounded text-gray-300">
          {selectedAOI.polygon.features[0].geometry.coordinates[0].length} Vertex Polygon
        </span>
      </div>
    </div>
  );
}
