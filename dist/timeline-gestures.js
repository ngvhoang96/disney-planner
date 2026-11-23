const hourHeight = 80;
export const pixels = minutes => minutes / 60 * hourHeight;
const snapMinutes = minutes => Math.round(minutes / 5) * 5;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function shiftTimes(event, delta, from, until) {
  const duration = event.end - event.start;
  const start = clamp(event.start + delta, from, until - duration);
  return { start, end: start + duration };
}

export function resizeTimes(range, edge, value) {
  if (edge === 'start') return { ...range, start: clamp(value, 0, range.end - 1) };
  return { ...range, end: clamp(value, range.start + 1, 1440) };
}

export function installTimelineGestures(container, callbacks) {
  let gesture;
  let holdTimer;
  let frame;
  let suppressClick = false;
  let suppressTimer;

  function begin(target, point, touch) {
    const control = target.closest('[data-resize-edge], .grid-event');
    if (!control) return;
    const lanes = control.closest('.lanes');
    const edge = control.dataset.resizeEdge;
    if (!edge && lanes.dataset.resizing === 'true') return;
    const changes = callbacks.prepare(control, lanes);
    if (!changes) return;
    gesture = {
      changes, control, lanes, touch, id: touch ? point.identifier : point.pointerId,
      x: point.clientX, y: point.clientY, latestY: point.clientY, top: lanes.getBoundingClientRect().top,
      active: Boolean(edge)
    };
    if (!gesture.active && touch) holdTimer = setTimeout(activate, 320);
  }
  function activate() {
    if (!gesture || gesture.active) return;
    gesture.active = true;
    gesture.changes.start?.();
  }
  function update() {
    const { changes, lanes, latestY, y, top } = gesture;
    const delta = snapMinutes((latestY - y + top - lanes.getBoundingClientRect().top) * 60 / hourHeight);
    changes.move(delta);
  }
  function autoScroll() {
    if (frame) return;
    const tick = () => {
      frame = 0;
      if (!gesture?.active) return;
      const y = gesture.latestY;
      const edge = 72;
      const bottom = window.innerHeight - edge;
      const amount = y < edge ? -Math.min(18, (edge - y) / 4) : y > bottom ? Math.min(18, (y - bottom) / 4) : 0;
      if (amount) {
        window.scrollBy(0, amount);
        update();
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  }
  function move(point, event) {
    if (!gesture) return;
    if (!gesture.active && Math.hypot(point.clientX - gesture.x, point.clientY - gesture.y) >= 6) {
      if (gesture.touch) {
        finish(false);
        return;
      }
      activate();
    }
    if (!gesture.active) return;
    if (event.cancelable) event.preventDefault();
    gesture.latestY = point.clientY;
    update();
    autoScroll();
  }
  function finish(commit) {
    clearTimeout(holdTimer);
    cancelAnimationFrame(frame);
    frame = 0;
    if (!gesture) return;
    const { active, changes } = gesture;
    gesture = null;
    if (!active) return;
    suppressClick = true;
    clearTimeout(suppressTimer);
    suppressTimer = setTimeout(() => { suppressClick = false; }, 400);
    changes.finish(commit);
  }
  function resetClickSuppression() {
    clearTimeout(suppressTimer);
    suppressClick = false;
  }

  container.addEventListener('click', event => {
    if (!suppressClick) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    resetClickSuppression();
  }, true);
  container.addEventListener('contextmenu', event => {
    if (event.target.closest('.grid-event, [data-resize-edge]')) event.preventDefault();
  });
  container.addEventListener('pointerdown', event => {
    resetClickSuppression();
    if (event.button !== 0 || !event.isPrimary || gesture) return;
    if (event.pointerType === 'touch' && !event.target.closest('[data-resize-edge]')) return;
    begin(event.target, event, false);
    if (gesture) gesture.control.setPointerCapture(event.pointerId);
  });
  container.addEventListener('pointermove', event => {
    if (gesture && !gesture.touch && gesture.id === event.pointerId) move(event, event);
  });
  container.addEventListener('pointerup', event => {
    if (gesture && !gesture.touch && gesture.id === event.pointerId) finish(true);
  });
  container.addEventListener('pointercancel', event => {
    if (gesture && !gesture.touch && gesture.id === event.pointerId) finish(false);
  });
  container.addEventListener('lostpointercapture', event => {
    if (gesture && !gesture.touch && gesture.id === event.pointerId) finish(false);
  });
  container.addEventListener('touchstart', event => {
    if (event.touches.length > 1 && gesture?.touch) finish(false);
    if (event.touches.length !== 1 || gesture || event.target.closest('[data-resize-edge]')) return;
    resetClickSuppression();
    begin(event.target, event.changedTouches[0], true);
  }, { passive: true });
  container.addEventListener('touchmove', event => {
    if (!gesture?.touch) return;
    const point = Array.from(event.changedTouches).find(touch => touch.identifier === gesture.id);
    if (point) move(point, event);
  }, { passive: false });
  container.addEventListener('touchend', event => {
    if (!gesture?.touch || !Array.from(event.changedTouches).some(touch => touch.identifier === gesture.id)) return;
    if (gesture.active && event.cancelable) event.preventDefault();
    finish(true);
  }, { passive: false });
  container.addEventListener('touchcancel', event => {
    if (gesture?.touch && Array.from(event.changedTouches).some(touch => touch.identifier === gesture.id)) finish(false);
  });
  window.addEventListener('blur', () => finish(false));
}
