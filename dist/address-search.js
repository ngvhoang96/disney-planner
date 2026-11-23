const endpoint = 'https://photon.komoot.io/api/';

export async function findAddressMatches(address, signal) {
  const url = new URL(endpoint);
  url.search = new URLSearchParams({ q: address, limit: '4', lat: '28.38', lon: '-81.56' });
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error('Address lookup failed');
  const result = await response.json();
  return (result.features ?? []).flatMap(feature => {
    const [lon, lat] = feature.geometry?.coordinates ?? [];
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 85 || Math.abs(lon) > 180) return [];
    const { name, housenumber, street, city, state, postcode, country } = feature.properties ?? {};
    const streetAddress = [housenumber, street].filter(Boolean).join(' ');
    const label = [...new Set([name, streetAddress, city, state, postcode, country].filter(Boolean))].join(', ');
    return label ? [{ label, coords: [lat, lon] }] : [];
  });
}
