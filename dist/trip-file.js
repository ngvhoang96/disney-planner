export function readTripFile(text, parks, categories) {
  let input;
  try {
    input = JSON.parse(text);
  } catch {
    throw new Error('Choose a valid JSON file.');
  }
  const days = Array.isArray(input) ? input : input?.days;
  if (!Array.isArray(days)) throw new Error('The file needs a days array.');
  if (!Array.isArray(input) && input.version !== undefined && input.version !== 1) {
    throw new Error('This trip file version is unsupported.');
  }
  const dates = new Set();
  const eventIds = new Set();
  const trip = days.map((day, index) => {
    const id = day?.id;
    const date = typeof id === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(id) ? new Date(id + 'T00:00:00Z') : null;
    if (!date || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== id || dates.has(id)) {
      throw new Error('Check the date for day ' + (index + 1) + '. Use a unique YYYY-MM-DD date.');
    }
    dates.add(id);
    const parkId = day.parkId ?? '';
    const park = parks.find(item => item.id === parkId);
    if ((parkId && !park) || !Array.isArray(day.events)) throw new Error('Check the park and events for ' + id + '.');
    const events = day.events.map((event, position) => {
      const error = 'Check event ' + (position + 1) + ' on ' + id + '.';
      if (!event || typeof event.title !== 'string' || !event.title.trim()
        || !Number.isInteger(event.start) || !Number.isInteger(event.end)
        || event.start < 0 || event.end > 1440 || event.start >= event.end
        || !categories.includes(event.category ?? 'Other')) throw new Error(error);
      const eventId = event.id ?? 'import-' + id + '-' + position;
      if (typeof eventId !== 'string' || !eventId.trim() || eventIds.has(eventId)) throw new Error(error + ' Event IDs must be unique.');
      eventIds.add(eventId);
      const { coords, placeId, locationMode } = event;
      if (coords != null && (!Array.isArray(coords) || coords.length !== 2 || !coords.every(Number.isFinite)
        || Math.abs(coords[0]) > 90 || Math.abs(coords[1]) > 180)) throw new Error(error + ' Invalid map coordinates.');
      if (placeId != null && !park?.places.some(place => place.id === placeId)) throw new Error(error + ' Place is outside the selected park.');
      if (locationMode != null && !['preset', 'custom', 'none'].includes(locationMode)) throw new Error(error + ' Invalid location mode.');
      const links = event.links ?? [];
      if (!Array.isArray(links) || links.some(link => typeof link?.label !== 'string' || typeof link.url !== 'string'
        || !/^https?:\/\//i.test(link.url))) throw new Error(error + ' Links must use HTTP or HTTPS.');
      return {
        id: eventId, title: event.title, start: event.start, end: event.end,
        category: event.category ?? 'Other', done: event.done === true,
        notes: textValue(event.notes), location: textValue(event.location), address: textValue(event.address),
        coords, placeId, locationMode, links: links.map(({label, url}) => ({label, url}))
      };
    });
    return { id, title: textValue(day.title) || id, parkId, subtitle: textValue(day.subtitle), notes: textValue(day.notes), events };
  });
  return trip.sort((a, b) => a.id.localeCompare(b.id));
}

function textValue(value) {
  return typeof value === 'string' ? value : '';
}
