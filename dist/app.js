import { initialDays } from './itinerary.js';
import { readTripFile } from './trip-file.js';
import { dayPark, eventPlace, parks } from './parks.js';
import { findAddressMatches } from './address-search.js';
import { clearMap, mountMap } from './schedule-map.js';
import { installTimelineGestures, pixels, resizeTimes, shiftTimes } from './timeline-gestures.js';

const $ = id => document.getElementById(id);
const icon = name => '<svg aria-hidden="true"><use href="#' + name + '"/></svg>';
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);
const categories = ['Travel', 'Attraction', 'Dining', 'Show', 'Break', 'Errand', 'Other'];
const storageKey = 'disney-trip-calendar-v1';
const dateObject = value => new Date(value + 'T12:00:00Z');
const dateFormat = (value, options) => new Intl.DateTimeFormat('en-US', {
  ...options, timeZone: 'UTC'
}).format(dateObject(value));
const longDate = value => dateFormat(value, { weekday: 'long', month: 'long', day: 'numeric' });
const shortDate = value => dateFormat(value, { month: 'short', day: 'numeric' });
const todayParts = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric', month: '2-digit', day: '2-digit'
}).formatToParts(new Date());
const today = ['year', 'month', 'day'].map(type => todayParts.find(part => part.type === type).value).join('-');
const dialog = $('dialog');
const modal = $('dialog-content');
let stored;
try {
  stored = JSON.parse(localStorage.getItem(storageKey));
} catch {
  stored = null;
}
const hasSavedDays = Array.isArray(stored?.days);
let days = hasSavedDays ? stored.days : structuredClone(initialDays);
let active = days.find(day => day.id === stored?.active)?.id
  ?? days.find(day => day.id === today)?.id ?? days[0]?.id;
let view = stored?.view === 'map' ? 'map' : 'timeline';
let resizing;
let wholeDay = false;
let toastTimer;
let returnFocus;

const currentDay = () => days.find(day => day.id === active);
const seedPins = new Map(initialDays.flatMap(day => day.events).filter(event => event.coords)
  .map(event => [event.id, event]));
function eventAddress(event) {
  return event?.address ?? '';
}
function eventCoords(day, event) {
  if (event.coords) return event.coords;
  if (event.locationMode === 'preset') return eventPlace(day, event)?.coords ?? null;
  if (event.locationMode) return null;
  const source = seedPins.get(event.id);
  if (source?.location === event.location) return source.coords;
  return eventPlace(day, event)?.coords ?? null;
}
const orderedEvents = day => [...day.events].sort((a, b) => a.start - b.start || b.end - a.end);
const timeValue = minutes => {
  if (minutes === 1440) return '24:00';
  return [Math.floor(minutes / 60), minutes % 60].map(n => String(n).padStart(2, '0')).join(':');
};
const timeNumber = value => {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
};
function timeLabel(minutes) {
  if (minutes === 1440) return 'Midnight';
  const hour = Math.floor(minutes / 60);
  const minute = String(minutes % 60).padStart(2, '0');
  return `${hour % 12 || 12}:${minute} ${hour < 12 ? 'AM' : 'PM'}`;
}
function hourLabel(minutes) {
  return timeLabel(minutes).replace(':00', '');
}
function timeRange(event) {
  return `${timeLabel(event.start)} – ${timeLabel(event.end)}`;
}
function toast(message) {
  const box = $('toast');
  box.textContent = message;
  box.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { box.hidden = true; }, 3200);
}
function persist(message) {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ days, active, view }));
    if (message) toast(message);
  } catch {
    toast('Browser storage is unavailable. Changes will last until you close this page.');
  }
}
function update(message) {
  render();
  persist(message);
}
function navigateTo(dayId, keyboard = false) {
  if (!days.some(day => day.id === dayId)) return;
  active = dayId;
  resizing = null;
  update();
  if (keyboard) $('tab-' + dayId).focus();
}

function render() {
  clearMap();
  const day = currentDay();
  const park = dayPark(day);
  $('park-picker').hidden = !day;
  $('day-park').value = park?.id ?? '';
  const editingDraftRange = Boolean(resizing?.onReturn);
  for (const selector of ['.masthead', '.date-navigation', '#park-picker', '.view-toggle', '.sidebar', '#mobile-add']) {
    document.querySelector(selector).inert = editingDraftRange;
  }
  const first = days[0]?.id;
  const last = days.at(-1)?.id;
  $('trip-range').textContent = first
    ? (first === last ? shortDate(first) : shortDate(first) + ' – ' + shortDate(last)) + ', ' + last.slice(0, 4)
    : 'No trip days';
  $('tabs').innerHTML = days.map(item => `
    <button class="tab" role="tab" id="tab-${item.id}" aria-controls="schedule"
      aria-selected="${item.id === active}" aria-label="${escape(longDate(item.id) + ', ' + item.title)}"
      tabindex="${item.id === active ? 0 : -1}" data-date="${item.id}" type="button">
      <span>${dateFormat(item.id, { weekday: 'short' })}</span>
      <strong>${dateFormat(item.id, { day: 'numeric' })}</strong>
    </button>`).join('');
  const activeTab = $('tab-' + active);
  if (activeTab) {
    $('schedule').setAttribute('aria-labelledby', activeTab.id);
    activeTab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  } else {
    $('schedule').removeAttribute('aria-labelledby');
  }
  const index = days.findIndex(item => item.id === active);
  $('prev').disabled = index <= 0;
  $('next').disabled = index < 0 || index >= days.length - 1;
  $('add-event').disabled = !day;
  $('mobile-add').hidden = !day || editingDraftRange;
  $('selected-date').textContent = day ? longDate(day.id) : '';
  $('day-title').textContent = day?.title ?? 'No trip days';
  $('day-subtitle').textContent = day?.subtitle ?? '';
  $('day-details').hidden = !day;
  $('day-notes').textContent = day?.notes || 'No notes for this day.';
  $('grid-view').parentElement.hidden = !day;
  $('grid-view').setAttribute('aria-pressed', view === 'timeline');
  $('map-view').setAttribute('aria-pressed', view === 'map');
  if (!day) {
    $('schedule-body').innerHTML = '<div class="empty"><p>Add a date to start your schedule.</p><button class="button primary" data-action="add-day">Add a day</button></div>';
    return;
  }
  const events = orderedEvents(day);
  if (view === 'map') {
    const stops = events.map(event => ({ ...event, coords: eventCoords(day, event) })).filter(event => event.coords);
    const parkMap = park ? {
      id: park.id, name: park.name, lands: park.lands,
      places: park.places.filter(item => item.coords),
      addPlace: item => editEvent(day, null, null, item)
    } : null;
    mountMap($('schedule-body'), { stops, park: parkMap,
      openEvent: stop => showEvent(day, day.events.find(event => event.id === stop.id))
    });
  } else {
    $('schedule-body').innerHTML = timeline(events);
    if (resizing) drawResize();
  }
}
function eventButton(event, className, style = '') {
  const label = escape(`${event.title}, ${timeRange(event)}${event.done ? ', complete' : ''}`);
  const title = `<strong>${event.done ? '✓ ' : ''}${escape(event.title)}</strong>`;
  const time = `<span class="event-time">${timeRange(event)}</span>`;
  const content = title + (className.includes('compact') ? '' : time);
  return `<button type="button" class="event ${className} ${event.done ? 'done' : ''}"
    data-color="${escape(event.category)}" data-event="${escape(event.id)}" style="${style}"
    aria-label="${label}" title="${label}">${content}</button>`;
}
function placeEvents(events, firstHour, height) {
  const groups = [];
  let group = { cards: [], columnEnds: [], end: -1 };
  for (const event of events) {
    const top = Math.min(pixels(event.start - firstHour) + 2, height - 32);
    const bottom = Math.min(height, Math.max(top + 30, pixels(event.end - firstHour) - 2));
    if (top >= group.end) {
      group = { cards: [], columnEnds: [], end: -1 };
      groups.push(group);
    }
    const available = group.columnEnds.findIndex(end => end <= top);
    const column = available === -1 ? group.columnEnds.length : available;
    group.columnEnds[column] = bottom;
    group.cards.push({ event, top, bottom, column });
    group.end = Math.max(group.end, bottom);
  }
  return groups.flatMap(({ cards, columnEnds }) => cards.map(({ event, top, bottom, column }) => {
    const width = 100 / columnEnds.length;
    return eventButton(event, 'grid-event' + (bottom - top < 45 ? ' compact' : ''),
      `top:${top}px;height:${bottom - top}px;left:calc(${column * width}% + 3px);width:calc(${width}% - 6px)`);
  })).join('');
}
function timeline(events) {
  const first = events.length ? Math.max(0, Math.floor(events[0].start / 60) * 60) : 480;
  const last = events.length ? Math.max(...events.map(item => item.end)) : 1200;
  const start = wholeDay || resizing ? 0 : first;
  const end = wholeDay || resizing ? 1440 : Math.ceil(last / 60) * 60;
  const height = pixels(end - start);
  let hours = '';
  let slots = '';
  for (let minute = start; minute < end; minute += 30) {
    const top = pixels(minute - start);
    if (minute % 60 === 0) {
      hours += `<span class="hour" style="top:${top}px">${hourLabel(minute)}</span>`;
    }
    slots += `<button class="slot" type="button" tabindex="-1" data-time="${minute}" style="top:${top}px" aria-label="New event at ${timeLabel(minute)}"></button>`;
  }
  const toolbar = resizing
    ? `<div class="timeline-tools resize-tools"><div><strong>Resize event</strong><span id="resize-range"></span></div>
      <button class="button outline" type="button" data-action="cancel-resize">Cancel</button>
      <button class="button primary" type="button" data-action="apply-resize">Apply</button></div>`
    : `<div class="timeline-tools hours-tools">
      <select id="visible-hours" aria-label="Visible hours">
        <option value="scheduled" ${wholeDay ? '' : 'selected'}>Scheduled hours</option>
        <option value="full" ${wholeDay ? 'selected' : ''}>Full day</option>
      </select></div>`;
  return `${toolbar}<div class="timeline"><div class="lanes" data-from="${start}" data-until="${end}"
    data-resizing="${Boolean(resizing)}" style="height:${height}px">${hours}${slots}
    ${placeEvents(resizing ? events.filter(item => item.id !== resizing.event.id) : events, start, height)}
    ${resizing ? resizeOverlay() : ''}</div></div>`;
}
function resizeOverlay() {
  return `<div class="resize-layer" data-color="${escape(resizing.event.category)}">
    <div class="resize-box"><strong>${escape(resizing.event.title)}</strong></div>
    <button class="resize-handle" data-resize-edge="start" role="slider" aria-orientation="vertical" aria-label="Start time" type="button"><span>Start</span></button>
    <button class="resize-handle" data-resize-edge="end" role="slider" aria-orientation="vertical" aria-label="End time" type="button"><span>End</span></button>
  </div>`;
}
function drawResize() {
  const layer = document.querySelector('.resize-layer');
  const { start, end } = resizing.range;
  layer.style.setProperty('--start', pixels(start) + 'px');
  layer.style.setProperty('--end', pixels(end) + 'px');
  $('resize-range').textContent = timeRange(resizing.range);
  for (const handle of layer.querySelectorAll('[data-resize-edge]')) {
    const isStart = handle.dataset.resizeEdge === 'start';
    const value = isStart ? start : end;
    handle.setAttribute('aria-valuemin', isStart ? 0 : start + 1);
    handle.setAttribute('aria-valuemax', isStart ? end - 1 : 1440);
    handle.setAttribute('aria-valuenow', value);
    handle.setAttribute('aria-valuetext', timeLabel(value));
  }
}
function beginResize(event, { dayId = active, onReturn } = {}) {
  returnFocus = null;
  dialog.close();
  resizing = { event, onReturn, previousDay: active, previousView: view,
    range: { start: event.start, end: event.end } };
  active = dayId;
  view = 'timeline';
  render();
  const handle = document.querySelector('[data-resize-edge=start]');
  handle.scrollIntoView({ block: 'center' });
  handle.focus({ preventScroll: true });
}
function finishResize(saveRange) {
  if (!resizing) return;
  const { event, range, onReturn, previousDay, previousView } = resizing;
  resizing = null;
  if (onReturn) {
    active = previousDay;
    view = previousView;
    render();
    onReturn(saveRange ? range : null);
    return;
  }
  if (saveRange) Object.assign(event, range);
  update(saveRange ? 'Time range updated' : undefined);
  const card = Array.from(document.querySelectorAll('.grid-event')).find(button => button.dataset.event === event.id);
  card?.focus();
}
function prepareGesture(control, lanes) {
  const edge = control.dataset.resizeEdge;
  if (edge) {
    const original = { ...resizing.range };
    return {
      move(delta) {
        resizing.range = resizeTimes(original, edge, original[edge] + delta);
        drawResize();
      },
      finish(commit) {
        if (commit) return;
        resizing.range = original;
        drawResize();
      }
    };
  }
  const event = currentDay().events.find(item => item.id === control.dataset.event);
  const from = Number(lanes.dataset.from);
  const until = Number(lanes.dataset.until);
  let proposed = { start: event.start, end: event.end };
  let ghost;
  return {
    start() {
      ghost = document.createElement('div');
      ghost.className = 'move-preview';
      ghost.dataset.color = event.category;
      ghost.setAttribute('aria-hidden', 'true');
      lanes.append(ghost);
      lanes.classList.add('moving-event');
      control.classList.add('moving-source');
      this.move(0);
    },
    move(delta) {
      proposed = shiftTimes(event, delta, from, until);
      ghost.style.top = pixels(proposed.start - from) + 'px';
      ghost.style.height = Math.min(pixels(until - proposed.start), Math.max(26, pixels(proposed.end - proposed.start))) + 'px';
      ghost.textContent = timeRange(proposed) + ' · ' + event.title;
    },
    finish(commit) {
      ghost.remove();
      lanes.classList.remove('moving-event');
      control.classList.remove('moving-source');
      if (!commit || event.start === proposed.start) return;
      Object.assign(event, proposed);
      update('Event moved to ' + timeLabel(event.start));
    }
  };
}

function openDialog(title, body, focusSelector = '', headerActions = '') {
  if (!dialog.open) returnFocus = document.activeElement;
  modal.innerHTML = `<div class="dialog-inner">
    <header class="dialog-header"><h2 id="dialog-title">${escape(title)}</h2>
    ${headerActions || `<button type="button" class="icon-button close-dialog" aria-label="Close">${icon('close')}</button>`}</header>
    ${body}</div>`;
  if (!dialog.open) dialog.showModal();
  modal.querySelectorAll('.close-dialog').forEach(button => { button.onclick = () => dialog.close(); });
  modal.querySelector(focusSelector || '.close-dialog')?.focus();
}
dialog.addEventListener('close', () => {
  if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
});
function showFormError(form, message) {
  const error = form.querySelector('.error');
  error.hidden = false;
  error.textContent = message;
}
const errorBox = '<p class="error" role="alert" hidden></p>';
const cancel = '<button class="button outline cancel" type="button">Cancel</button>';
const save = label => `<button class="button primary" type="submit">${label}</button>`;
const wireCancel = () => modal.querySelector('.cancel')?.addEventListener('click', () => dialog.close());

const editorTabs = [
  ['info', 'Info'],
  ['date-time', 'Date Time'],
  ['location', 'Location']
];

function installEditorTabs(form) {
  const tabs = [...form.querySelectorAll('[role=tab]')];
  function show(id, focus = false) {
    for (const tab of tabs) {
      const selected = tab.dataset.editorTab === id;
      tab.setAttribute('aria-selected', selected);
      tab.tabIndex = selected ? 0 : -1;
      form.querySelector('#' + tab.getAttribute('aria-controls')).hidden = !selected;
      if (selected && focus) tab.focus();
    }
  }
  tabs.forEach((tab, index) => {
    tab.onclick = () => show(tab.dataset.editorTab);
    tab.onkeydown = event => {
      const next = { ArrowLeft: (index + tabs.length - 1) % tabs.length,
        ArrowRight: (index + 1) % tabs.length, Home: 0, End: tabs.length - 1 };
      if (!Object.hasOwn(next, event.key)) return;
      event.preventDefault();
      show(tabs[next[event.key]].dataset.editorTab, true);
    };
  });
  return show;
}

function editEvent(day, event, start = null, suggestion = null) {
  const first = orderedEvents(day)[0];
  const details = event ?? suggestion;
  const time = event?.start ?? start ?? (first ? Math.floor(first.start / 30) * 30 : 540);
  const end = event?.end ?? Math.min(time + (suggestion?.duration ?? 30), 1440);
  const dayOptions = days.map(item => `<option value="${item.id}" ${item.id === day.id ? 'selected' : ''}>${escape(shortDate(item.id) + ' · ' + item.title)}</option>`).join('');
  const title = event ? 'Edit event' : 'New event';
  const tabs = editorTabs.map(([id, name], index) => `<button type="button" id="event-tab-${id}"
    role="tab" data-editor-tab="${id}" aria-selected="${index === 0}" tabindex="${index === 0 ? 0 : -1}"
    aria-controls="event-panel-${id}">${name}</button>`).join('');
  openDialog(title, `
    <form class="dialog-form" id="event-form">
      <div class="editor-tabs" role="tablist" aria-label="Event editor">${tabs}</div>
      <section class="editor-panel" role="tabpanel" id="event-panel-info" aria-labelledby="event-tab-info">
        <label class="field">Title<input name="title" maxlength="120" value="${escape(details?.title)}"></label>
        <label class="field">Description<textarea name="notes" maxlength="2000">${escape(details?.notes)}</textarea></label>
      </section>
      <section class="editor-panel" role="tabpanel" id="event-panel-date-time" aria-labelledby="event-tab-date-time" hidden>
        <div class="field"><label for="event-day">Day</label><select id="event-day" name="day">${dayOptions}</select></div>
        <div class="field-row">
          <label class="field">Starts<input type="time" name="start" value="${timeValue(time)}"></label>
          <label class="field">Ends<input type="time" name="end" value="${timeValue(end % 1440)}"></label>
        </div>
        <button class="button outline" id="show-resizer" type="button">Show resizer</button>
      </section>
      <section class="editor-panel" role="tabpanel" id="event-panel-location" aria-labelledby="event-tab-location" hidden>
        <label class="field">Park<input name="park" readonly></label>
        <div class="field"><label for="event-place">Place</label><select id="event-place" name="place"></select></div>
        <a class="place-info-link" target="_blank" rel="noopener noreferrer" hidden></a>
        <div class="custom-location" hidden>
          <label class="field">Location<input name="location" maxlength="160" value="${escape(event?.location)}"></label>
          <label class="field">Address<input name="address" maxlength="250" value="${escape(eventAddress(event))}"></label>
          <div class="address-tools">
            <button class="button outline" id="find-map-pin" type="button">Find map pin</button>
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">Address lookup © OpenStreetMap contributors</a>
          </div>
          <p class="pin-status" role="status" hidden></p>
          <div class="field address-matches" hidden><label for="matching-address">Matching address</label><select id="matching-address" name="match"></select></div>
        </div>
      </section>
      ${errorBox}<div class="dialog-actions">${cancel}${save('Save event')}</div>
    </form>`, '#event-tab-info');
  const form = $('event-form');
  const fields = form.elements;
  const showTab = installEditorTabs(form);
  const error = form.querySelector('.error');
  const destination = () => days.find(item => item.id === fields.day.value);
  const parkForDestination = () => dayPark(destination());
  const preset = () => parkForDestination()?.places.find(place => place.id === fields.place.value);
  const chooseInitial = suggestion?.id ?? (event ? eventPlace(day, event)?.id : '');
  let locationValue = chooseInitial || (event?.location || event?.address || (event && eventCoords(day, event)) ? 'custom' : '');
  let customCoords = event ? eventCoords(day, event) : null;
  const custom = form.querySelector('.custom-location');
  const placeInfo = form.querySelector('.place-info-link');
  const matches = form.querySelector('.address-matches');
  const status = form.querySelector('.pin-status');
  let addressMatches = [];
  let pendingLookup;
  let lastStart = time;

  function pinStatus(message) {
    status.textContent = message;
    status.hidden = !message;
  }
  function showLocationFields() {
    custom.hidden = fields.place.value !== 'custom';
    const link = preset()?.disneyLink;
    placeInfo.hidden = !link;
    if (link) {
      placeInfo.href = link.url;
      placeInfo.textContent = link.label;
    } else {
      placeInfo.removeAttribute('href');
    }
  }
  function showPlaces() {
    const park = parkForDestination();
    fields.park.value = park?.name ?? 'No park selected';
    const groups = [
      ['Rides & attractions', 'Attraction'], ['Shows', 'Show'], ['Dining', 'Dining'],
      ['Other places', 'Travel', 'Other']
    ];
    fields.place.innerHTML = `<option value="custom">Custom location</option><option value="">Select a place</option>`;
    for (const [label, ...types] of groups) {
      const places = park?.places.filter(place => types.includes(place.category)) ?? [];
      if (!places.length) continue;
      const group = document.createElement('optgroup');
      group.label = label;
      for (const place of places) group.append(new Option(place.title, place.id));
      fields.place.append(group);
    }
    fields.place.value = locationValue;
    if (fields.place.selectedIndex < 0) {
      locationValue = event?.location || event?.address ? 'custom' : '';
      fields.place.value = locationValue;
    }
    showLocationFields();
  }
  showPlaces();
  if (customCoords) pinStatus('Map pin set.');
  fields.day.onchange = () => { error.hidden = true; showPlaces(); };
  fields.place.onchange = () => {
    locationValue = fields.place.value;
    error.hidden = true;
    showLocationFields();
  };
  fields.address.oninput = () => {
    pendingLookup?.abort();
    customCoords = null;
    addressMatches = [];
    matches.hidden = true;
    pinStatus('');
  };
  fields.match.onchange = () => {
    const match = addressMatches[Number(fields.match.value)];
    if (!match || fields.match.value === '') return;
    customCoords = match.coords;
    pinStatus('Map pin set.');
  };
  $('find-map-pin').onclick = async () => {
    const address = fields.address.value.trim();
    if (!address) {
      pinStatus('Enter an address to find its map pin.');
      fields.address.focus();
      return;
    }
    pendingLookup?.abort();
    const lookup = new AbortController();
    pendingLookup = lookup;
    customCoords = null;
    matches.hidden = true;
    pinStatus('Looking up address…');
    const timeout = setTimeout(() => lookup.abort(), 8000);
    try {
      const results = await findAddressMatches(address, lookup.signal);
      if (pendingLookup !== lookup || fields.address.value.trim() !== address) return;
      addressMatches = results;
      if (!results.length) {
        pinStatus('No match found. Try adding the city or ZIP code.');
        return;
      }
      fields.match.replaceChildren(new Option('Select the matching address', ''), ...results.map((result, index) =>
        new Option(result.label, String(index))));
      matches.hidden = false;
      pinStatus('');
      if (form.isConnected && !custom.hidden) fields.match.focus();
    } catch {
      if (pendingLookup === lookup && fields.address.value.trim() === address) {
        pinStatus('Address lookup is unavailable. You can still save the address.');
      }
    } finally {
      clearTimeout(timeout);
    }
  };
  fields.start.onchange = () => {
    if (!fields.start.value || !fields.end.value) return;
    const nextStart = timeNumber(fields.start.value);
    const previousEnd = timeNumber(fields.end.value) || 1440;
    if (!event || previousEnd <= nextStart) {
      fields.end.value = timeValue(Math.min(nextStart + Math.max(previousEnd - lastStart, 5), 1440) % 1440);
    }
    lastStart = nextStart;
  };
  function validateRange() {
    const start = timeNumber(fields.start.value);
    const end = fields.end.value ? timeNumber(fields.end.value) || 1440 : NaN;
    if (Number.isFinite(start) && Number.isFinite(end) && end > start) return { start, end };
    showTab('date-time');
    showFormError(form, 'Enter a start time and a later end time.');
    fields.start.focus();
    return null;
  }
  $('show-resizer').onclick = () => {
    const range = validateRange();
    if (!range) return;
    error.hidden = true;
    beginResize({ ...range, id: event?.id, title: fields.title.value.trim() || 'New event',
      category: preset()?.category ?? details?.category ?? 'Other'
    }, {
      dayId: destination().id,
      onReturn(changed) {
        if (changed) {
          fields.start.value = timeValue(changed.start);
          fields.end.value = timeValue(changed.end % 1440);
          lastStart = changed.start;
        }
        openDialog(title, '<div id="event-form-slot"></div>');
        $('event-form-slot').replaceWith(form);
        showTab('date-time', true);
      }
    });
  };
  wireCancel();
  form.addEventListener('submit', submit => {
    submit.preventDefault();
    const eventTitle = fields.title.value.trim();
    if (!eventTitle) {
      showTab('info');
      showFormError(form, 'Enter an event title.');
      fields.title.focus();
      return;
    }
    const range = validateRange();
    if (!range) return;
    const targetDay = destination();
    const place = preset();
    const isCustom = fields.place.value === 'custom';
    const record = {
      ...event, ...range, id: event?.id ?? crypto.randomUUID(), title: eventTitle,
      category: place?.category ?? details?.category ?? 'Other',
      location: place?.title ?? (isCustom ? fields.location.value.trim() : ''),
      address: isCustom ? fields.address.value.trim() : '',
      notes: fields.notes.value.trim(), links: event?.links ?? [], done: event?.done ?? false,
      locationMode: place ? 'preset' : isCustom ? 'custom' : 'none',
      placeId: place?.id ?? null, coords: place?.coords ?? (isCustom ? customCoords : null)
    };
    if (event) day.events = day.events.filter(item => item.id !== event.id);
    targetDay.events.push(record);
    active = targetDay.id;
    dialog.close();
    update(event ? 'Event updated' : 'Event added');
  });
}

function showEvent(day, event) {
  const links = (event.links ?? []).filter(link => /^https?:\/\//i.test(link.url));
  const disneyLink = eventPlace(day, event)?.disneyLink;
  if (disneyLink && !links.some(link => link.url === disneyLink.url)) {
    links.unshift(disneyLink);
  }
  const address = eventAddress(event);
  if (address) {
    links.push({ label: 'Open address in Maps', url: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(address) });
  }
  openDialog(event.title, `
    <p class="meta">${icon('clock')}${escape(shortDate(day.id) + ' · ' + timeRange(event))}</p>
    ${event.location ? `<p class="meta">${icon('pin')}${escape(event.location)}</p>` : ''}
    ${address ? `<p class="meta event-address">${escape(address)}</p>` : ''}
    ${event.notes ? `<p class="detail-text">${escape(event.notes)}</p>` : ''}
    ${links.length ? `<div class="detail-links">${links.map(item =>
      `<a href="${escape(item.url)}" target="_blank" rel="noopener noreferrer">${escape(item.label)}</a>`).join('')}</div>` : ''}
    <div class="dialog-actions event-footer">
      <button class="button outline" id="toggle-done">${icon('check')}${event.done ? 'Reopen' : 'Mark done'}</button>
      <button class="button primary close-dialog" type="button">Close</button>
    </div>`, '#event-actions', `
    <div class="event-action-menu">
      <button id="event-actions" class="icon-button" aria-expanded="false" aria-controls="event-options"
        type="button" aria-label="Event actions">${icon('more')}</button>
      <div class="event-options" id="event-options" hidden>
        <button type="button" id="edit-event">Edit</button>
        <button type="button" id="resize-event">Resize</button>
        <button type="button" id="remove-event">Delete</button>
      </div>
    </div>`);
  const toggle = $('event-actions');
  const options = $('event-options');
  toggle.onclick = () => {
    options.hidden = !options.hidden;
    toggle.setAttribute('aria-expanded', !options.hidden);
  };
  options.onkeydown = key => {
    if (key.key !== 'Escape') return;
    key.preventDefault();
    options.hidden = true;
    toggle.setAttribute('aria-expanded', false);
    toggle.focus();
  };
  $('edit-event').onclick = () => editEvent(day, event);
  $('resize-event').onclick = () => beginResize(event);
  $('toggle-done').onclick = () => {
    event.done = !event.done;
    dialog.close();
    update(event.done ? 'Event marked done' : 'Event reopened');
  };
  $('remove-event').onclick = () => confirmRemoval('Delete event?', `“${event.title}” will be removed from this day.`, 'Delete event', () => {
    day.events = day.events.filter(item => item.id !== event.id);
    update('Event deleted');
  }, () => showEvent(day, event));
}

function addDay() {
  const date = days.at(-1)?.id;
  const tomorrow = date ? new Date(dateObject(date).getTime() + 86400000).toISOString().slice(0, 10) : today;
  openDialog('Add a trip day', `
    <form class="dialog-form" id="new-day-form">
      <label class="field">Date<input type="date" name="date" required value="${tomorrow}"></label>
      <label class="field">Day name <input name="title" maxlength="100" placeholder="Optional"></label>
      ${errorBox}<div class="dialog-actions">${cancel}${save('Add day')}</div>
    </form>`, '[name=date]');
  wireCancel();
  $('new-day-form').addEventListener('submit', event => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const id = values.get('date');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(id) || Number.isNaN(dateObject(id).getTime())) {
      return showFormError(event.currentTarget, 'Choose a valid date.');
    }
    if (days.some(day => day.id === id)) return showFormError(event.currentTarget, 'This date is already in your trip.');
    days.push({ id, parkId: '', title: values.get('title').trim() || longDate(id), subtitle: '', notes: '', events: [] });
    days.sort((a, b) => a.id.localeCompare(b.id));
    active = id;
    dialog.close();
    update('Trip day added');
  });
}

function manageDays() {
  const list = days.map(day => `<div class="day-row">
    <span><strong>${escape(day.title)}</strong><small>${escape(shortDate(day.id))} · ${day.events.length} ${day.events.length === 1 ? 'event' : 'events'}</small></span>
    <button type="button" class="icon-button" data-edit-day="${day.id}" aria-label="${escape('Edit ' + day.title)}">${icon('edit')}</button>
    <button type="button" class="button danger" data-remove-day="${day.id}" aria-label="${escape('Remove ' + day.title)}">Remove</button>
  </div>`).join('');
  openDialog('Manage trip days', `<div class="day-list">${list || '<p>No trip days.</p>'}</div>
    <div class="dialog-actions">
      <button class="button outline" type="button" id="import-trip">Import JSON</button>
      <button class="button outline" type="button" id="export-trip">Export JSON</button>
      <button class="button primary" type="button" id="manage-add">${icon('plus')} Add day</button>
    </div>`);
  $('manage-add').onclick = addDay;
  $('import-trip').onclick = importTrip;
  $('export-trip').onclick = exportTrip;
  modal.querySelectorAll('[data-edit-day]').forEach(button => {
    button.onclick = () => editDay(days.find(day => day.id === button.dataset.editDay));
  });
  modal.querySelectorAll('[data-remove-day]').forEach(button => {
    button.onclick = () => {
      const index = days.findIndex(day => day.id === button.dataset.removeDay);
      const day = days[index];
      confirmRemoval('Remove trip day?', `${longDate(day.id)} and all events on that date will be removed.`, 'Remove day', () => {
        days.splice(index, 1);
        if (active === day.id) active = (days[index] ?? days[index - 1])?.id;
        update('Trip day removed');
      }, manageDays);
    };
  });
}

function importTrip() {
  openDialog('Import trip JSON', `
    <form class="dialog-form" id="trip-import-form">
      <p class="detail-text">Importing replaces the trip saved in this browser. Export it first if you want a copy.</p>
      <label class="field">Trip JSON file<input type="file" name="trip" accept=".json,application/json" required></label>
      ${errorBox}<div class="dialog-actions">${cancel}${save('Replace trip')}</div>
    </form>`, '[name=trip]');
  modal.querySelector('.cancel').onclick = manageDays;
  $('trip-import-form').onsubmit = async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const file = form.elements.trip.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return showFormError(form, 'Choose a JSON file smaller than 5 MB.');

    const submit = form.querySelector('[type=submit]');
    submit.disabled = true;
    try {
      const imported = readTripFile(await file.text(), parks, categories);
      if (!dialog.open || !form.isConnected) return;
      days = imported;
      active = days.find(day => day.id === today)?.id ?? days[0]?.id;
      resizing = null;
      dialog.close();
      update('Trip imported');
    } catch (error) {
      showFormError(form, error.message || 'Could not read the trip file.');
    } finally {
      submit.disabled = false;
    }
  };
}

function exportTrip() {
  const file = new Blob([JSON.stringify({ version: 1, days }, null, 2) + '\n'], { type: 'application/json' });
  const url = URL.createObjectURL(file);
  const download = document.createElement('a');
  download.href = url;
  download.download = 'disney-planner.trip.json';
  download.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function editDay(day) {
  openDialog('Edit trip day', `<form class="dialog-form" id="day-form">
    <label class="field">Day name<input required name="title" maxlength="100" value="${escape(day.title)}"></label>
    <label class="field">Subtitle<input name="subtitle" maxlength="150" value="${escape(day.subtitle)}"></label>
    <label class="field">Notes<textarea name="notes" maxlength="2000">${escape(day.notes)}</textarea></label>
    ${errorBox}<div class="dialog-actions">${cancel}${save('Save day')}</div></form>`, '[name=title]');
  wireCancel();
  $('day-form').onsubmit = event => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const title = values.get('title').trim();
    if (!title) return showFormError(event.currentTarget, 'Enter a day name.');
    Object.assign(day, { title, subtitle: values.get('subtitle').trim(), notes: values.get('notes').trim() });
    dialog.close();
    update('Trip day updated');
  };
}
function confirmRemoval(title, message, label, remove, back) {
  openDialog(title, `<p class="detail-text">${escape(message)}</p><div class="dialog-actions">
    ${cancel}<button id="confirm-remove" class="button danger" type="button">${label}</button></div>`);
  modal.querySelector('.cancel').onclick = back;
  $('confirm-remove').onclick = () => {
    dialog.close();
    remove();
  };
}
$('day-park').innerHTML = '<option value="">No park</option>' + parks.map(park =>
  `<option value="${park.id}">${escape(park.name)}</option>`).join('');
$('day-park').onchange = changeDayPark;

function changeDayPark(event) {
  const select = event.currentTarget;
  const day = currentDay();
  const oldPark = dayPark(day);
  const nextId = select.value;
  if (oldPark?.id === nextId) return;
  if (!oldPark) {
    day.parkId = nextId;
    update('Park updated');
    return;
  }
  select.value = oldPark.id;
  const linkedEvents = day.events.filter(item => eventPlace(day, item));
  const nextName = parks.find(park => park.id === nextId)?.name;
  const action = nextName ? 'Change park' : 'Clear park';
  const message = nextName ? `Switch from ${oldPark.name} to ${nextName}?`
    : `Clear ${oldPark.name} from this day?`;
  const affected = linkedEvents.length
    ? `This will remove ${linkedEvents.length} ${linkedEvents.length === 1 ? 'event' : 'events'} linked to places in ${oldPark.name}.`
    : `There are no events linked to ${oldPark.name} places on this day.`;
  openDialog(action + '?', `<p class="detail-text">${escape(message)} ${escape(affected)}</p>
    ${linkedEvents.length ? `<ul class="park-change-events">${linkedEvents.map(item => `<li>${escape(item.title)}</li>`).join('')}</ul>` : ''}
    <div class="dialog-actions">${cancel}<button class="button ${linkedEvents.length ? 'danger' : 'primary'}" id="confirm-park" type="button">${action}</button></div>`, '.cancel');
  wireCancel();
  $('confirm-park').onclick = () => {
    const removed = new Set(linkedEvents.map(item => item.id));
    day.events = day.events.filter(item => !removed.has(item.id));
    for (const item of day.events) {
      const coords = eventCoords(day, item);
      if (coords) item.coords = coords;
    }
    day.parkId = nextId;
    dialog.close();
    update(nextName ? 'Park updated' : 'Park cleared');
  };
}
$('legend').innerHTML = categories.map(category =>
  `<div class="legend-item" data-color="${category}"><span class="legend-dot"></span>${category}</div>`).join('');
$('tabs').addEventListener('click', event => {
  const tab = event.target.closest('[data-date]');
  if (tab) navigateTo(tab.dataset.date, true);
});
$('tabs').addEventListener('keydown', event => {
  const index = days.findIndex(day => day.id === active);
  const targets = { ArrowLeft: days[index - 1], ArrowRight: days[index + 1], Home: days[0], End: days.at(-1) };
  if (Object.hasOwn(targets, event.key)) {
    event.preventDefault();
    if (targets[event.key]) navigateTo(targets[event.key].id, true);
  }
});
$('prev').onclick = () => navigateTo(days[days.findIndex(day => day.id === active) - 1]?.id);
$('next').onclick = () => navigateTo(days[days.findIndex(day => day.id === active) + 1]?.id);
$('manage').onclick = () => { if (resizing) finishResize(false); manageDays(); };
$('add-day').onclick = () => { if (resizing) finishResize(false); addDay(); };
$('add-event').onclick = $('mobile-add').onclick = () => { if (resizing) finishResize(false); editEvent(currentDay()); };
$('edit-day').onclick = () => { if (resizing) finishResize(false); editDay(currentDay()); };
function changeView(nextView) {
  resizing = null;
  view = nextView;
  update();
}
$('grid-view').onclick = () => changeView('timeline');
$('map-view').onclick = () => changeView('map');
installTimelineGestures($('schedule-body'), { prepare: prepareGesture });
$('schedule-body').addEventListener('keydown', event => {
  if (!resizing) return;
  if (event.key === 'Escape') {
    finishResize(false);
    return;
  }
  const edge = event.target.dataset.resizeEdge;
  if (!edge) return;
  const value = resizing.range[edge];
  const step = event.shiftKey ? 15 : 5;
  const choices = { ArrowUp: value - step, ArrowLeft: value - step, ArrowDown: value + step,
    ArrowRight: value + step, Home: 0, End: 1440 };
  if (!Object.hasOwn(choices, event.key)) return;
  event.preventDefault();
  resizing.range = resizeTimes(resizing.range, edge, choices[event.key]);
  drawResize();
});
$('schedule-body').addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (resizing) {
    if (button.dataset.action === 'cancel-resize') finishResize(false);
    if (button.dataset.action === 'apply-resize') finishResize(true);
    return;
  }
  const day = currentDay();
  if (button.dataset.event) showEvent(day, day.events.find(item => item.id === button.dataset.event));
  if (button.dataset.time !== undefined) editEvent(day, null, Number(button.dataset.time));
  if (button.dataset.action === 'add-day') addDay();
  if (button.dataset.action === 'add-event') editEvent(day);
});
$('schedule-body').addEventListener('change', event => {
  if (event.target.id !== 'visible-hours') return;
  wholeDay = event.target.value === 'full';
  render();
  $('visible-hours').focus({ preventScroll: true });
});
render();
