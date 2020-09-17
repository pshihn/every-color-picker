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

  protected fire(name: string, detail?: any, bubbles: boolean = true, composed: boolean = true) {
    if (name) {
      const init: any = {
        bubbles: (typeof bubbles === 'boolean') ? bubbles : true,
        composed: (typeof composed === 'boolean') ? composed : true
      };
      if (detail) {
        init.detail = detail;
      }
      this.dispatchEvent(new CustomEvent(name, init));
    }
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

  detach() {
    this._nodes.clear();
  }

  protected fire(name: string, detail?: any, bubbles: boolean = true, composed: boolean = true) {
    if (name) {
      const init: any = {
        bubbles: (typeof bubbles === 'boolean') ? bubbles : true,
        composed: (typeof composed === 'boolean') ? composed : true
      };
      if (detail) {
        init.detail = detail;
      }
      this.e.dispatchEvent(new CustomEvent(name, init));
    }
  }
}