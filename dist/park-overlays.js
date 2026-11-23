// Simplified planning outlines used when the ArcGIS feature service is unavailable.
const local = {
  'magic-kingdom': {
    layer: 6,
    border: [
      [28.4157,-81.5825],[28.4158,-81.5803],[28.4171,-81.5777],[28.4198,-81.5759],
      [28.4217,-81.5773],[28.4225,-81.5804],[28.4220,-81.5834],[28.4210,-81.5855],
      [28.4190,-81.5862],[28.4173,-81.5846]
    ],
    lands: []
  },
  epcot: {
    layer: 7,
    border: [
      [28.3671,-81.5545],[28.3666,-81.5502],[28.3677,-81.5474],[28.3700,-81.5459],
      [28.3738,-81.5460],[28.3764,-81.5480],[28.3768,-81.5513],[28.3755,-81.5543],
      [28.3720,-81.5552],[28.3691,-81.5549]
    ],
    lands: [
      { name: 'World Celebration', coords: [28.3741,-81.5498] },
      { name: 'World Discovery', coords: [28.3734,-81.5471] },
      { name: 'World Nature', coords: [28.3742,-81.5526] },
      { name: 'World Showcase', coords: [28.3692,-81.5502] }
    ]
  },
  'hollywood-studios': {
    layer: 8,
    border: [
      [28.3532,-81.5610],[28.3542,-81.5578],[28.3568,-81.5572],[28.3590,-81.5579],
      [28.3618,-81.5593],[28.3620,-81.5615],[28.3605,-81.5636],[28.3570,-81.5643],
      [28.3540,-81.5631]
    ],
    lands: [
      { name: 'Hollywood Boulevard', coords: [28.3576,-81.5594] },
      { name: 'Sunset Boulevard', coords: [28.3595,-81.5608] },
      { name: 'Toy Story Land', coords: [28.3558,-81.5622] },
      { name: 'Star Wars: Galaxy’s Edge', coords: [28.3547,-81.5596] },
      { name: 'Echo Lake', coords: [28.3577,-81.5586] },
      { name: 'Animation Courtyard', coords: [28.3571,-81.5610] }
    ]
  },
  'animal-kingdom': {
    layer: 5,
    border: [
      [28.3530,-81.5931],[28.3533,-81.5890],[28.3551,-81.5857],[28.3588,-81.5848],
      [28.3628,-81.5862],[28.3679,-81.5874],[28.3700,-81.5915],[28.3693,-81.5965],
      [28.3650,-81.5991],[28.3596,-81.5974],[28.3555,-81.5958]
    ],
    lands: [
      { name: 'Oasis', coords: [28.3554,-81.5876] },
      { name: 'Discovery Island', coords: [28.3572,-81.5897] },
      { name: 'Pandora', coords: [28.3549,-81.5922] },
      { name: 'Africa', coords: [28.3598,-81.5924] },
      { name: 'Asia', coords: [28.3598,-81.5876] },
      { name: 'Kilimanjaro Safaris', coords: [28.3644,-81.5940] }
    ]
  }
};

export function overlayFor(park) {
  const data = local[park.id];
  return { ...data, lands: park.lands.length ? park.lands : data.lands };
}

const service = 'https://services7.arcgis.com/TfWEJqWVMfgVXruO/ArcGIS/rest/services/Boundaries/FeatureServer';
const cached = new Map();
async function queryLayer(layer, where, signal) {
  const query = new URLSearchParams({ where, outFields: 'Name', outSR: '4326', f: 'geojson' });
  const response = await fetch(`${service}/${layer}/query?${query}`, { signal });
  if (!response.ok) throw new Error('Park geometry unavailable');
  const data = await response.json();
  const features = data.features?.filter(item =>
    ['Polygon', 'MultiPolygon'].includes(item.geometry?.type)) ?? [];
  if (!features.length) throw new Error('No park geometry returned');
  return { type: 'FeatureCollection', features };
}

export function fetchParkGeometry(park) {
  if (cached.has(park.id)) return cached.get(park.id);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  const result = Promise.allSettled([
    queryLayer(1, `Name='${park.name.replaceAll("'", "''")}'`, controller.signal),
    queryLayer(local[park.id].layer, '1=1', controller.signal)
  ]).then(([boundary, lands]) => {
    if (boundary.status === 'rejected' || lands.status === 'rejected') cached.delete(park.id);
    return { boundary: boundary.value, lands: lands.value };
  }).finally(() => clearTimeout(timeout));
  cached.set(park.id, result);
  return result;
}
