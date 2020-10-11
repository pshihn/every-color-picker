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
  protected __n = new Map<string, HTMLElement>();
  abstract value: string;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() { return ['value']; }

  attributeChangedCallback(name: string, _: string, newValue: string) {
    if (name === 'value') {
      this.value = newValue;
    }
  }

  protected $<T extends HTMLElement>(id: string): T {
    if (this.__n.has(id)) {
      return this.__n.get(id) as T;
    }
    const e = this.root.querySelector<T>(`#${id}`)!;
    this.__n.set(id, e);
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
    this.__n.clear();
  }
}

export abstract class BaseElementController {
  protected e: HTMLElement;
  protected root: ShadowRoot;
  protected __n = new Map<string, HTMLElement>();

  constructor(e: HTMLElement) {
    this.e = e;
    this.root = this.e.attachShadow({ mode: 'open' });
  }

  protected $<T extends HTMLElement>(id: string): T {
    if (this.__n.has(id)) {
      return this.__n.get(id) as T;
    }
    const e = this.root.querySelector<T>(`#${id}`)!;
    this.__n.set(id, e);
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
    this.__n.clear();
  }

  protected fire(name: string, detail?: any) {
    _fire(this.e, name, detail);
  }
}