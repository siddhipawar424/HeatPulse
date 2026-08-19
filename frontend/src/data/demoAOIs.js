/**
 * DEMO / TEST AOI BOUNDING BOXES
 * Clearly labeled for development, demonstration, and quick test analysis.
 * Does not imply restricted global location support. Users can also enter custom bounding box coordinates.
 */

export const DEMO_AOIS = [
  {
    id: 'demo_aoi_1',
    label: '[DEMO / TEST AOI 1] Urban Heat Test Sector A',
    description: 'Default test bounding box (33.44° N to 33.46° N, 112.10° W to 112.08° W)',
    center: [33.45, -112.09],
    zoom: 13,
    polygon: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { name: "Demo Test AOI 1" },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [-112.10, 33.44],
              [-112.08, 33.44],
              [-112.08, 33.46],
              [-112.10, 33.46],
              [-112.10, 33.44]
            ]]
          }
        }
      ]
    }
  },
  {
    id: 'demo_aoi_2',
    label: '[DEMO / TEST AOI 2] Metropolitan Commercial Core',
    description: 'High-density asphalt zone test polygon',
    center: [33.47, -112.07],
    zoom: 13,
    polygon: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { name: "Demo Test AOI 2" },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [-112.08, 33.46],
              [-112.06, 33.46],
              [-112.06, 33.48],
              [-112.08, 33.48],
              [-112.08, 33.46]
            ]]
          }
        }
      ]
    }
  },
  {
    id: 'demo_aoi_3',
    label: '[DEMO / TEST AOI 3] Suburban Corridor Sector',
    description: 'Low-vegetation mixed zone test polygon',
    center: [33.43, -112.12],
    zoom: 13,
    polygon: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { name: "Demo Test AOI 3" },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [-112.13, 33.42],
              [-112.11, 33.42],
              [-112.11, 33.44],
              [-112.13, 33.44],
              [-112.13, 33.42]
            ]]
          }
        }
      ]
    }
  }
];

/**
 * Creates a GeoJSON Polygon FeatureCollection from bounding box coordinates
 * @param {number} minLng 
 * @param {number} minLat 
 * @param {number} maxLng 
 * @param {number} maxLat 
 * @returns {Object} GeoJSON FeatureCollection
 */
export function buildCustomAOIPolygon(minLng, minLat, maxLng, maxLat) {
  const pMinLng = parseFloat(minLng);
  const pMinLat = parseFloat(minLat);
  const pMaxLng = parseFloat(maxLng);
  const pMaxLat = parseFloat(maxLat);

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { name: "Custom User AOI" },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [pMinLng, pMinLat],
            [pMaxLng, pMinLat],
            [pMaxLng, pMaxLat],
            [pMinLng, pMaxLat],
            [pMinLng, pMinLat]
          ]]
        }
      }
    ]
  };
}
