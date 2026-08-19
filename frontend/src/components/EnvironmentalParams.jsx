import React from 'react';
import { Droplets, Wind, Thermometer, Sun, CloudRain, Eye, Activity, Gauge } from 'lucide-react';

/**
 * EnvironmentalParams — displays FortyGuard /v1/env_params enrichment data.
 * Renders nothing when envParams is null (env API failed or unavailable).
 */
export function EnvironmentalParams({ envParams }) {
  if (!envParams) return null;

  const fmt = (val, decimals = 1) =>
    val != null ? Number(val).toFixed(decimals) : '—';

  const getAqiLabel = (aqi) => {
    if (aqi == null) return { label: '—', color: 'text-gray-400' };
    if (aqi <= 50)  return { label: 'Good',        color: 'text-emerald-400' };
    if (aqi <= 100) return { label: 'Moderate',    color: 'text-amber-400'   };
    if (aqi <= 150) return { label: 'Unhealthy*',  color: 'text-orange-400'  };
    return              { label: 'Hazardous',   color: 'text-red-400'     };
  };

  const aqiInfo = getAqiLabel(envParams.air_quality_index);

  const tiles = [
    {
      id: 'heat-index',
      icon: <Thermometer className="w-5 h-5" />,
      iconBg: 'bg-red-500/10 text-red-400 border-red-500/20',
      label: 'Heat Index',
      value: fmt(envParams.heat_index_celsius),
      unit: '°C',
      sub: 'Perceived temperature'
    },
    {
      id: 'apparent-temp',
      icon: <Activity className="w-5 h-5" />,
      iconBg: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      label: 'Apparent Temp',
      value: fmt(envParams.apparent_temperature_celsius),
      unit: '°C',
      sub: 'Feels like'
    },
    {
      id: 'relative-humidity',
      icon: <Droplets className="w-5 h-5" />,
      iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      label: 'Relative Humidity',
      value: fmt(envParams.relative_humidity_percent, 1),
      unit: '%',
      sub: 'Ambient moisture'
    },
    {
      id: 'wet-bulb',
      icon: <Gauge className="w-5 h-5" />,
      iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      label: 'Wet-Bulb Temp',
      value: fmt(envParams.wet_bulb_temperature_celsius),
      unit: '°C',
      sub: 'Evaporative cooling limit'
    },
    {
      id: 'aqi',
      icon: <Wind className="w-5 h-5" />,
      iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      label: 'Air Quality Index',
      value: fmt(envParams.air_quality_index, 0),
      unit: '',
      sub: aqiInfo.label,
      subColor: aqiInfo.color
    },
    {
      id: 'precipitation',
      icon: <CloudRain className="w-5 h-5" />,
      iconBg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      label: 'Precipitation',
      value: fmt(envParams.precipitation_mm, 1),
      unit: 'mm',
      sub: 'For target hour'
    },
    {
      id: 'solar-ghi',
      icon: <Sun className="w-5 h-5" />,
      iconBg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      label: 'Solar GHI',
      value: fmt(envParams.solar_ghi, 0),
      unit: 'W/m²',
      sub: 'Clear-sky irradiance'
    },
  ];

  return (
    <div className="bg-gray-900/90 border border-gray-800/80 rounded-2xl p-6 shadow-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-mono uppercase tracking-widest text-gray-400 font-semibold">
              FortyGuard Enrichment
            </h2>
            <h3 className="text-lg font-bold text-white tracking-wide">
              ENVIRONMENTAL CONDITIONS
            </h3>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider border bg-blue-500/10 text-blue-400 border-blue-500/30 font-mono">
          /v1/env_params
        </span>
      </div>

      {/* Tiles grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {tiles.map((tile) => (
          <div
            key={tile.id}
            id={`env-param-${tile.id}`}
            className="bg-gray-950/70 border border-gray-800/80 rounded-xl p-4 flex flex-col gap-2 hover:border-gray-700/80 transition-colors duration-200"
          >
            {/* Icon */}
            <div className={`w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0 ${tile.iconBg}`}>
              {tile.icon}
            </div>

            {/* Label */}
            <div className="text-[11px] font-medium text-gray-400 leading-tight">
              {tile.label}
            </div>

            {/* Value */}
            <div className="flex items-baseline gap-1 flex-wrap">
              <span className="text-xl font-black font-mono text-white leading-none">
                {tile.value}
              </span>
              {tile.unit && (
                <span className="text-xs text-gray-400 font-medium">{tile.unit}</span>
              )}
            </div>

            {/* Sub-label */}
            <div className={`text-[10px] font-mono leading-tight ${tile.subColor || 'text-gray-500'}`}>
              {tile.sub}
            </div>
          </div>
        ))}
      </div>

      {/* AQI footnote for sensitive groups */}
      {envParams.air_quality_index != null && envParams.air_quality_index > 100 && (
        <p className="text-[11px] text-orange-400/80 font-mono border-t border-gray-800/60 pt-3">
          * AQI above 100 — sensitive groups (elderly, children, outdoor workers) may experience adverse health effects from air pollution compounding heat stress.
        </p>
      )}
    </div>
  );
}
