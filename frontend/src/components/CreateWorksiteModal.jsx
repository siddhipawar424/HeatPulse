import React, { useState } from 'react';
import { X, Building2, MapPin, Users, Clock, Globe, Plus } from 'lucide-react';
import { buildCustomWorksitePolygon } from '../data/worksites';

export function CreateWorksiteModal({ isOpen, onClose, onCreateWorksite }) {
  const [formData, setFormData] = useState({
    name: 'Phoenix South Sector Construction',
    location: 'South Mountain Corridor, Phoenix, AZ',
    description: 'Infrastructure development & paving worksite',
    workforce_count: 55,
    operating_hours: '06:00 – 16:00',
    minLng: -112.12,
    minLat: 33.40,
    maxLng: -112.10,
    maxLat: 33.42,
    groupsText: 'Outdoor workers, Heavy physical labor, Supervisors'
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    const polygon = buildCustomWorksitePolygon(
      formData.minLng,
      formData.minLat,
      formData.maxLng,
      formData.maxLat
    );

    const parsedGroups = formData.groupsText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(gName => ({ name: gName, headcount: Math.round(formData.workforce_count / 3) }));

    const newWorksite = {
      id: `worksite_custom_${Date.now()}`,
      name: formData.name,
      location: formData.location,
      description: formData.description,
      center: [(formData.minLat + formData.maxLat) / 2, (formData.minLng + formData.maxLng) / 2],
      zoom: 13,
      workforce_count: parseInt(formData.workforce_count, 10) || 40,
      workforce_groups: parsedGroups.length > 0 ? parsedGroups : [{ name: 'Outdoor workers', headcount: formData.workforce_count }],
      operating_hours: formData.operating_hours,
      monitoring_status: 'ACTIVE',
      polygon
    };

    onCreateWorksite(newWorksite);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-wide">Add Monitored Worksite</h3>
              <p className="text-xs text-gray-400">Register a new operational worksite location and workforce</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Worksite Name & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-300 font-medium mb-1">Worksite Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-medium mb-1">Location / Address</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Workforce Headcount & Shift Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-300 font-medium mb-1">Exposed Workforce Count</label>
              <input
                type="number"
                required
                value={formData.workforce_count}
                onChange={(e) => setFormData({ ...formData, workforce_count: e.target.value })}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white focus:border-orange-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-medium mb-1">Operating Shift Hours</label>
              <input
                type="text"
                required
                value={formData.operating_hours}
                onChange={(e) => setFormData({ ...formData, operating_hours: e.target.value })}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white focus:border-orange-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Extensible Workforce Groups */}
          <div>
            <label className="block text-gray-300 font-medium mb-1">Active Roles / Groups (Comma Separated)</label>
            <input
              type="text"
              value={formData.groupsText}
              onChange={(e) => setFormData({ ...formData, groupsText: e.target.value })}
              placeholder="e.g. Outdoor workers, Heavy physical labor, Delivery workers, Supervisors"
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
            />
          </div>

          {/* Custom AOI Polygon Coordinates */}
          <div className="space-y-2 pt-2 border-t border-gray-800">
            <label className="block text-gray-300 font-medium flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-orange-400" /> AOI Polygon Bounding Box Coordinates
            </label>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="block text-gray-500 text-[10px]">Min Lng (°W)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.minLng}
                  onChange={(e) => setFormData({ ...formData, minLng: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-2 py-1 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-500 text-[10px]">Min Lat (°N)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.minLat}
                  onChange={(e) => setFormData({ ...formData, minLat: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-2 py-1 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-500 text-[10px]">Max Lng (°W)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.maxLng}
                  onChange={(e) => setFormData({ ...formData, maxLng: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-2 py-1 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-500 text-[10px]">Max Lat (°N)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.maxLat}
                  onChange={(e) => setFormData({ ...formData, maxLat: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-2 py-1 text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-medium transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-orange-500/20"
            >
              <Plus className="w-4 h-4" /> Create Worksite
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
