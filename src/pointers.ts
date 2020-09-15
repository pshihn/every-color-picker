export type InputEvent = TouchEvent | PointerEvent | MouseEvent;

export class Pointer {
  clientX: number;
  clientY: number;
  nativeEvent: Touch | PointerEvent | MouseEvent;
  id = -1;

  constructor(nativeEvent: Touch | PointerEvent | MouseEvent) {
    this.nativeEvent = nativeEvent;
    this.clientX = nativeEvent.clientX;
    this.clientY = nativeEvent.clientY;
  }
}

const isPointerEvent = (event: any): event is PointerEvent => self.PointerEvent && (event instanceof PointerEvent);

interface PointerTrackerHandler {
  start(pointer: Pointer, event: InputEvent): boolean;
  move(changedPointers: Pointer[], event: InputEvent): void;
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
    if (!this._h.start(pointer, event)) return false;
    this.currentPointers.push(pointer);
    this.startPointers.push(pointer);
    return true;
  }

  private pointerStart = (event: PointerEvent | MouseEvent) => {
    if (event.button !== 0) return;
    if (!this.triggerPointerStart(new Pointer(event), event)) return;
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
      this.triggerPointerStart(new Pointer(touch), event);
    }
  }

  private move = (event: InputEvent) => {
    const changedPointers = ('changedTouches' in event)
      ? Array.from(event.changedTouches).map((t) => new Pointer(t))
      : [new Pointer(event)];
    const trackedChangedPointers = [];
    for (const pointer of changedPointers) {
      const index = this.currentPointers.findIndex((p) => p.id === pointer.id);
      if (index === -1)
        continue;
      trackedChangedPointers.push(pointer);
      this.currentPointers[index] = pointer;
    }
    if (trackedChangedPointers.length === 0) return;
    this._h.move(trackedChangedPointers, event);
  }

  private triggerPointerEnd = (pointer: Pointer): boolean => {
    const index = this.currentPointers.findIndex((p) => p.id === pointer.id);
    if (index === -1)
      return false;
    this.currentPointers.splice(index, 1);
    this.startPointers.splice(index, 1);
    return true;
  }

  private pointerEnd = (event: PointerEvent | MouseEvent) => {
    if (!this.triggerPointerEnd(new Pointer(event))) return;
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
      this.triggerPointerEnd(new Pointer(touch));
    }
  }
}