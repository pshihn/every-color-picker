function _fire(src: HTMLElement, name: string, detail?: any) {
  const init: any = {
    bubbles: true,
    composed: true,
    detail
  };
  src.dispatchEvent(new CustomEvent(name, init));
}

export abstract class BaseElement extends HTMLElement {
  protected root: ShadowRoot;
  protected _nodes = new Map<string, HTMLElement>();

  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
  }

  protected $<T extends HTMLElement>(id: string): T {
    if (this._nodes.has(id)) {
      return this._nodes.get(id) as T;
    }
    const e = this.root.querySelector<T>(`#${id}`)!;
    this._nodes.set(id, e);
    return e;
  }

  protected $add(target: string | HTMLElement, event: string, handler: (evt: Event) => void) {
    if (typeof target === 'string') {
      target = this.$(target);
    }
    if (!target) return;
    target.addEventListener(event, handler);
  }

  protected $remove(target: string | HTMLElement, event: string, handler: (evt: Event) => void) {
    if (typeof target === 'string') {
      target = this.$(target);
    }
    if (!target) return;
    target.removeEventListener(event, handler);
  }

  protected fire(name: string, detail?: any) {
    _fire(this, name, detail);
  }

  disconnectedCallback() {
    this._nodes.clear();
  }
}

export abstract class BaseElementController {
  protected e: HTMLElement;
  protected root: ShadowRoot;
  protected _nodes = new Map<string, HTMLElement>();

  constructor(e: HTMLElement) {
    this.e = e;
    this.root = this.e.attachShadow({ mode: 'open' });
  }

  protected $<T extends HTMLElement>(id: string): T {
    if (this._nodes.has(id)) {
      return this._nodes.get(id) as T;
    }
    const e = this.root.querySelector<T>(`#${id}`)!;
    this._nodes.set(id, e);
    return e;
  }

  protected $add(target: string | HTMLElement, event: string, handler: (evt: Event) => void) {
    if (typeof target === 'string') {
      target = this.$(target);
    }
    if (!target) return;
    target.addEventListener(event, handler);
  }

  protected $remove(target: string | HTMLElement, event: string, handler: (evt: Event) => void) {
    if (typeof target === 'string') {
      target = this.$(target);
    }
    if (!target) return;
    target.removeEventListener(event, handler);
  }

  detach() {
    this._nodes.clear();
  }

  protected fire(name: string, detail?: any) {
    _fire(this.e, name, detail);
  }
}