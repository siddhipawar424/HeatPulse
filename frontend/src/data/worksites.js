/**
/**
 * WORKSITE DATA MODEL & DEFAULT MONITORED WORKSITES
 * Represents production worksites monitored by the HeatPulse Operations Platform.
 * Supports extensible workforce groups (e.g. Heavy physical labor, Outdoor workers, Maintenance, Delivery, Supervisors).
 */

export const DEFAULT_WORKSITES = [
  {
    id: 'worksite_phoenix_sec_a',
    name: 'Central Avenue Road Widening Project',
    location: 'Central Ave & McDowell Rd, Phoenix, AZ',
    description: 'Urban road widening and infrastructure improvement project along Central Avenue corridor',
    center: [33.45, -112.09],
    zoom: 13,
    workforce_count: 62,
    workforce_groups: [
      { name: 'Outdoor workers', role: 'Concrete & Masonry Crews', headcount: 35 },
      { name: 'Heavy physical labor', role: 'Excavation & Rigging Operators', headcount: 18 },
      { name: 'Supervisors', role: 'Safety Officers & Foremen', headcount: 9 }
    ],
    operating_hours: '06:00 – 16:00',
    monitoring_status: 'ACTIVE',
    polygon: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { name: "Central Avenue Road Widening Project" },
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
    id: 'worksite_metro_core',
    name: 'Downtown Phoenix Civic Plaza Maintenance Zone',
    location: '1st St & Washington St, Phoenix, AZ',
    description: 'Exterior facade maintenance and HVAC servicing zone at downtown civic plaza',
    center: [33.47, -112.07],
    zoom: 13,
    workforce_count: 145,
    workforce_groups: [
      { name: 'Maintenance workers', role: 'HVAC & Facade Technicians', headcount: 60 },
      { name: 'Delivery workers', role: 'Logistics & Material Loading Crews', headcount: 45 },
      { name: 'Outdoor exercisers', role: 'Public Plaza Operations', headcount: 40 }
    ],
    operating_hours: '07:00 – 17:00',
    monitoring_status: 'ACTIVE',
    polygon: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { name: "Downtown Phoenix Civic Plaza Maintenance Zone" },
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
    id: 'worksite_suburban_logistics',
    name: 'West Phoenix Distribution & Freight Yard',
    location: '91st Ave Industrial Corridor, Phoenix, AZ',
    description: 'Open-air freight sorting and distribution yard with asphalt loading bays and staging areas',
    center: [33.43, -112.12],
    zoom: 13,
    workforce_count: 38,
    workforce_groups: [
      { name: 'Outdoor workers', role: 'Asphalt Loading & Rigging', headcount: 20 },
      { name: 'Delivery workers', role: 'Fleet Drivers & Couriers', headcount: 12 },
      { name: 'Supervisors', role: 'Yard Dispatch & Operations', headcount: 6 }
    ],
    operating_hours: '05:00 – 15:00',
    monitoring_status: 'ACTIVE',
    polygon: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { name: "West Phoenix Distribution & Freight Yard" },
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
 * Creates a GeoJSON Polygon FeatureCollection from custom bounding box coordinates
 */
export function buildCustomWorksitePolygon(minLng, minLat, maxLng, maxLat) {
  const pMinLng = parseFloat(minLng);
  const pMinLat = parseFloat(minLat);
  const pMaxLng = parseFloat(maxLng);
  const pMaxLat = parseFloat(maxLat);

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { name: "Custom User Worksite" },
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
