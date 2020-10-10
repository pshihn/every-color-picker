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
      this._add('pointerdown', this.pointerStart);
    } else {
      this._add('mousedown', this.pointerStart);
      this._add('touchstart', this.touchStart);
      this._add('touchmove', this.move);
      this._add('touchend', this.touchEnd);
      this._add('touchcancel', this.touchEnd);
    }
  }

  stop() {
    this._remove('pointerdown', this.pointerStart);
    this._remove('mousedown', this.pointerStart);
    this._remove('touchstart', this.touchStart);
    this._remove('touchmove', this.move);
    this._remove('touchend', this.touchEnd);
    this._remove('touchcancel', this.touchEnd);
    this._remove('pointermove', this.move);
    this._remove('pointerup', this.pointerEnd);
    this._remove('pointercancel', this.pointerEnd);

    this._remove('mousemove', this.move, window);
    this._remove('mouseup', this.pointerEnd, window);
  }

  private _add(name: string, callback: any, node?: EventTarget) {
    (node || this._e).addEventListener(name, callback);
  }

  private _remove(name: string, callback: any, node?: EventTarget) {
    (node || this._e).removeEventListener(name, callback);
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
      this._add('pointermove', this.move);
      this._add('pointerup', this.pointerEnd);
      this._add('pointercancel', this.pointerEnd);
    } else {
      this._add('mousemove', this.move, window);
      this._add('mouseup', this.pointerEnd, window);
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
      this._remove('pointermove', this.move);
      this._remove('pointerup', this.pointerEnd);
      this._remove('pointercancel', this.pointerEnd);
    } else {
      this._remove('mousemove', this.move, window);
      this._remove('mouseup', this.pointerEnd, window);
    }
  }

  private touchEnd = (event: TouchEvent) => {
    for (const touch of Array.from(event.changedTouches)) {
      this.triggerPointerEnd(createPointer(touch), event);
    }
  }
}