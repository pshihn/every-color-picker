export type InputEvent = TouchEvent | PointerEvent | MouseEvent;

export interface Pointer {
  clientX: number;
  clientY: number;
  nativeEvent: Touch | PointerEvent | MouseEvent;
  id: number;
}

function createPointer(nativeEvent: Touch | PointerEvent | MouseEvent): Pointer {
  let id = -1;
  if (self.Touch && nativeEvent instanceof Touch) {
    id = nativeEvent.identifier;
  } else if (isPointerEvent(nativeEvent)) {
    id = nativeEvent.pointerId;
  }
  return {
    id,
    nativeEvent,
    clientX: nativeEvent.clientX,
    clientY: nativeEvent.clientY
  };
}

const isPointerEvent = (event: any): event is PointerEvent => self.PointerEvent && (event instanceof PointerEvent);

export interface PointerTrackerHandler {
  onStart(pointer: Pointer, event: InputEvent): boolean;
  onMove(changedPointers: Pointer[], event: InputEvent): void;
  onEnd?: (pointer: Pointer, event: InputEvent, cancelled: boolean) => void;
}

export class PointerTracker {
  private _e: HTMLElement;
  private _h: PointerTrackerHandler;

  private startPointers: Pointer[] = [];
  private currentPointers: Pointer[] = [];

  constructor(element: HTMLElement, handler: PointerTrackerHandler) {
    this._e = element;
    this._h = handler;
    if (self.PointerEvent) {
      this._e.addEventListener('pointerdown', this.pointerStart);
    } else {
      this._e.addEventListener('mousedown', this.pointerStart);
      this._e.addEventListener('touchstart', this.touchStart);
      this._e.addEventListener('touchmove', this.move);
      this._e.addEventListener('touchend', this.touchEnd);
      this._e.addEventListener('touchcancel', this.touchEnd);
    }
  }

  stop() {
    this._e.removeEventListener('pointerdown', this.pointerStart);
    this._e.removeEventListener('mousedown', this.pointerStart);
    this._e.removeEventListener('touchstart', this.touchStart);
    this._e.removeEventListener('touchmove', this.move);
    this._e.removeEventListener('touchend', this.touchEnd);
    this._e.removeEventListener('touchcancel', this.touchEnd);
    this._e.removeEventListener('pointermove', this.move);
    this._e.removeEventListener('pointerup', this.pointerEnd);
    this._e.removeEventListener('pointercancel', this.pointerEnd);
    window.removeEventListener('mousemove', this.move);
    window.removeEventListener('mouseup', this.pointerEnd);
  }

  private triggerPointerStart(pointer: Pointer, event: InputEvent): boolean {
    if (!this._h.onStart(pointer, event)) return false;
    this.currentPointers.push(pointer);
    this.startPointers.push(pointer);
    return true;
  }

  private pointerStart = (event: PointerEvent | MouseEvent) => {
    if (event.button !== 0) return;
    if (!this.triggerPointerStart(createPointer(event), event)) return;
    if (isPointerEvent(event)) {
      const capturingElement = (event.target && 'setPointerCapture' in event.target) ? event.target : this._e;
      capturingElement.setPointerCapture(event.pointerId);
      this._e.addEventListener('pointermove', this.move);
      this._e.addEventListener('pointerup', this.pointerEnd);
      this._e.addEventListener('pointercancel', this.pointerEnd);
    } else {
      window.addEventListener('mousemove', this.move);
      window.addEventListener('mouseup', this.pointerEnd);
    }
  }

  private touchStart = (event: TouchEvent) => {
    for (const touch of Array.from(event.changedTouches)) {
      this.triggerPointerStart(createPointer(touch), event);
    }
  }

  private move = (event: InputEvent) => {
    const changedPointers = ('changedTouches' in event)
      ? Array.from(event.changedTouches).map((t) => createPointer(t))
      : [createPointer(event)];
    const trackedChangedPointers = [];
    for (const pointer of changedPointers) {
      const index = this.currentPointers.findIndex((p) => p.id === pointer.id);
      if (index === -1)
        continue;
      trackedChangedPointers.push(pointer);
      this.currentPointers[index] = pointer;
    }
    if (trackedChangedPointers.length === 0) return;
    this._h.onMove(trackedChangedPointers, event);
  }

  private triggerPointerEnd = (pointer: Pointer, event: InputEvent): boolean => {
    const index = this.currentPointers.findIndex((p) => p.id === pointer.id);
    if (index === -1)
      return false;
    this.currentPointers.splice(index, 1);
    this.startPointers.splice(index, 1);

    if (this._h.onEnd) {
      this._h.onEnd(pointer, event, event.type === 'touchcancel' || event.type === 'pointercancel');
    }
    return true;
  }

  private pointerEnd = (event: PointerEvent | MouseEvent) => {
    if (!this.triggerPointerEnd(createPointer(event), event)) return;
    if (isPointerEvent(event)) {
      if (this.currentPointers.length) return;
      this._e.removeEventListener('pointermove', this.move);
      this._e.removeEventListener('pointerup', this.pointerEnd);
      this._e.removeEventListener('pointercancel', this.pointerEnd);
    } else {
      window.removeEventListener('mousemove', this.move);
      window.removeEventListener('mouseup', this.pointerEnd);
    }
  }

  private touchEnd = (event: TouchEvent) => {
    for (const touch of Array.from(event.changedTouches)) {
      this.triggerPointerEnd(createPointer(touch), event);
    }
  }
}