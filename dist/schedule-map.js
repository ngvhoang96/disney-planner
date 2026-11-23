import { fetchParkGeometry, overlayFor } from './park-overlays.js';

let map;
let showAttractions = true;

export function clearMap() {
  map?.remove();
  map = null;
}

function addParkLabels(L, park) {
  const pane = map.createPane('park-labels');
  pane.style.zIndex = '425';
  pane.style.pointerEvents = 'none';
  for (const land of park.lands) {
    const label = document.createElement('span');
    label.className = 'park-label';
    label.textContent = land.name;
    L.marker(land.coords, {
      pane: 'park-labels', interactive: false, keyboard: false,
      icon: L.divIcon({ className: 'park-label-anchor', html: label.outerHTML, iconSize: [0, 0] })
    }).addTo(map);
  }
}

function mountParkOverlays(L, container, park) {
  const activeMap = map;
  const overlays = overlayFor(park);
  const status = container.querySelector('.park-boundary-status');
  const boundaryStyle = { className: 'park-border', color: '#363c88', weight: 3,
    fillColor: '#8d80d1', fillOpacity: 0.08, interactive: false };
  let outline = L.polygon(overlays.border, { ...boundaryStyle, dashArray: '8 5' }).addTo(activeMap);
  const fitPark = () => activeMap.fitBounds(outline.getBounds(), { padding: [26, 26], maxZoom: 17 });
  const fitParkButton = container.querySelector('[data-fit-park]');
  let interacted = false;
  container.addEventListener('pointerdown', () => { interacted = true; }, { once: true });
  fitParkButton.onclick = fitPark;
  addParkLabels(L, overlays);
  fitPark();

  fetchParkGeometry(park).then(({ boundary, lands }) => {
    if (map !== activeMap) return;
    if (lands) {
      const colors = ['#8a6bc6', '#4c927e', '#6584c0', '#be8273', '#a39150'];
      let index = 0;
      const landLayer = L.geoJSON(lands, {
        interactive: false,
        style: () => ({ className: 'park-land', color: '#5f5a88', weight: 1,
          fillColor: colors[index++ % colors.length], fillOpacity: 0.20 })
      }).addTo(activeMap);
      landLayer.bringToBack();
    }
    if (boundary) {
      outline.remove();
      outline = L.geoJSON(boundary, { style: boundaryStyle, interactive: false }).addTo(activeMap);
      status.hidden = true;
      if (!interacted) fitPark();
    }
    if (boundary || lands) activeMap.attributionControl.addAttribution('Boundaries: Walt Disney World Resort GIS');
  });
}

function addAttractionMarkers(L, park, stops) {
  const markers = L.layerGroup();
  const scheduledPlaces = new Set(stops.map(stop => stop.placeId).filter(Boolean));
  const scheduledNames = new Set(stops.map(stop => stop.title.toLowerCase()));
  const locations = new Map();
  for (const item of park.places) {
    if (scheduledPlaces.has(item.id) || scheduledNames.has(item.title.toLowerCase())) continue;
    const key = item.coords.join(',');
    if (!locations.has(key)) locations.set(key, []);
    locations.get(key).push(item);
  }
  for (const places of locations.values()) {
    const popup = document.createElement('div');
    popup.className = 'attraction-popup';
    for (const item of places) {
      const row = document.createElement('div');
      const name = document.createElement('strong');
      name.textContent = item.title;
      const detail = document.createElement('p');
      detail.textContent = [item.category, item.area].filter(Boolean).join(' · ');
      const actions = document.createElement('div');
      actions.className = 'attraction-actions';
      const info = document.createElement('a');
      info.className = 'place-info-link';
      info.href = item.disneyLink.url;
      info.target = '_blank';
      info.rel = 'noopener noreferrer';
      info.textContent = item.disneyLink.label;
      const add = document.createElement('button');
      add.className = 'button primary';
      add.type = 'button';
      add.textContent = 'Add to day';
      add.setAttribute('aria-label', 'Add ' + item.title + ' to day');
      add.onclick = () => park.addPlace(item);
      actions.append(info, add);
      row.append(name, detail, actions);
      popup.append(row);
    }
    const title = places.map(item => item.title).join(' / ');
    const marker = L.marker(places[0].coords, {
      title, keyboard: true,
      icon: L.divIcon({ className: 'attraction-marker', iconSize: [26, 26], iconAnchor: [13, 13],
        html: '<span class="attraction-dot"></span>' })
    });
    marker.on('add', () => {
      marker.getElement().setAttribute('role', 'button');
      marker.getElement().setAttribute('aria-label', title);
    });
    marker.bindPopup(popup, { offset: [0, -7], maxHeight: 210 }).addTo(markers);
  }
  return markers;
}

export function mountMap(container, { stops, park, openEvent }) {
  if (!stops.length && !park) {
    container.innerHTML = '<div class="empty"><p>No mapped events on this day.</p><p>Add map coordinates in an event’s editor to pin it here.</p></div>';
    return;
  }
  const L = window.L;
  if (!L) {
    container.innerHTML = '<div class="empty"><p>The map could not load. Reload the page to try again.</p></div>';
    return;
  }
  container.innerHTML = `<div class="map-toolbar">
    ${park ? '<button type="button" class="button outline" data-fit-park>Fit park</button>' : ''}
    ${stops.length ? '<button type="button" class="button outline" data-fit-route>Fit route</button>' : ''}
    ${park ? '<button type="button" class="button outline attraction-toggle" data-attractions><span class="attraction-dot"></span>Attractions &amp; places</button>' : ''}
    </div><div class="map-canvas" aria-label="Map of attractions and scheduled stops"></div>
    <p class="map-status" role="status" hidden>Background map unavailable.</p>
    ${park ? '<p class="map-status park-boundary-status">Approximate park outline for planning.</p>' : ''}
    <ol class="map-stops" aria-label="Mapped events"></ol>`;
  const canvas = container.querySelector('.map-canvas');
  map = L.map(canvas, { maxZoom: 19, scrollWheelZoom: false });
  const fit = points => {
    const bounds = L.latLngBounds(points);
    if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
      map.setView(bounds.getCenter(), 16);
    } else {
      map.fitBounds(bounds, { padding: [35, 35], maxZoom: 17 });
    }
  };
  const routePoints = stops.map(stop => stop.coords);
  const fitRoute = () => fit(routePoints);
  const status = container.querySelector('.map-status');
  const tiles = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri', maxZoom: 19, maxNativeZoom: 18
  });
  let loaded = false;
  tiles.on('tileload', () => {
    loaded = true;
    status.hidden = true;
  });
  tiles.on('tileerror', () => { if (!loaded) status.hidden = false; });
  const fitRouteButton = container.querySelector('[data-fit-route]');
  if (fitRouteButton) fitRouteButton.onclick = fitRoute;
  if (park) {
    map.attributionControl.addAttribution('Place data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>');
    mountParkOverlays(L, container, park);
    const markerGroup = addAttractionMarkers(L, park, stops);
    const toggle = container.querySelector('[data-attractions]');
    const updateAttractions = () => {
      toggle.setAttribute('aria-pressed', showAttractions);
      if (showAttractions) markerGroup.addTo(map);
      else map.removeLayer(markerGroup);
    };
    toggle.onclick = () => {
      showAttractions = !showAttractions;
      updateAttractions();
    };
    updateAttractions();
  } else {
    fitRoute();
  }
  if (routePoints.length > 1) {
    L.polyline(routePoints, { color: '#404eae', dashArray: '6 7', weight: 3, interactive: false }).addTo(map);
  }
  const list = container.querySelector('.map-stops');
  const seen = new Map();
  stops.forEach((stop, index) => {
    const caption = `${index + 1}. ${stop.title}`;
    const key = stop.coords.join(',');
    const count = seen.get(key) ?? 0;
    seen.set(key, count + 1);
    const marker = L.marker(stop.coords, {
      title: caption, keyboard: true, zIndexOffset: 500,
      icon: L.divIcon({ className: 'map-pin-shell', iconSize: [30, 30], iconAnchor: [15 - count * 13, 15],
        html: `<span class="map-pin ${stop.done ? 'map-pin-done' : ''}">${stop.done ? '✓' : index + 1}</span>` })
    });
    marker.on('add', () => {
      marker.getElement().setAttribute('role', 'button');
      marker.getElement().setAttribute('aria-label', caption);
    });
    marker.on('click', () => openEvent(stop)).addTo(map);
    const row = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'button outline';
    button.textContent = caption;
    button.onclick = () => openEvent(stop);
    row.append(button);
    list.append(row);
  });
  tiles.addTo(map);
}
