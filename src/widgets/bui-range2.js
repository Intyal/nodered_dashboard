import { html, css, LitElement } from '../js/lit-all.min.js';
import { BUIBaseWidget } from '../js/bui-base-widget.js';

export class BUIRange2 extends BUIBaseWidget {
  static defaults = {
    size: [0, 0],
    position: [0, 0],
    min: 0,
    max: 100,
    value: 0,
    step: 1,
    intervals: 1,
    orientation: 'horizontal',
    disabled: false,
  };

  static properties = {
    size: { type: Array },
    position: { type: Array },
    attrStyle: { attribute: 'style', type: String },
    min: { type: Number },
    max: { type: Number },
    value: { type: Number },
    step: { type: Number },
    intervals: { type: Number },
    orientation: { type: String },
    disabled: { type: Boolean },
  };

  static styles = css`
    :host {
      --color: lime;
      --thumb-size: 2em;
      --track-height: 10px;
      --track-color: grey;
      --progress-height: 16px;

      grid-column-start: var(--left, 1);
      grid-row-start: var(--top, 1);
      grid-column-end: span var(--width, 1);
      grid-row-end: span var(--height, 1);

      display: flex;
      overflow: hidden;
      justify-content: center;
      align-items: center;
      font-size: var(--font-size, 16px);
      color: var(--color);
    }

    .range {
      display: grid;
      align-items: center;
      width: 100%;
      height: 100%;
      grid-template-columns: auto 1fr auto;
      grid-template-rows: auto auto auto;
      gap: 5px;
      box-sizing: border-box;
    }

    .range-input {
      grid-column: 1 / -1;
      grid-row: 2;
      appearance: none;
      background: transparent;
      width: 100%;
    }

    .range-input::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: calc(var(--thumb-size) * 2);
      height: var(--thumb-size);
      border: none;
      border-radius: 15px;
      background-color: var(--bui-widget-background-color, var(--track-color));
      background-image: var(--thumb-icon);
      background-size: contain;
      background-position: center;
      background-repeat: no-repeat;
      box-shadow: 0 0 0 1px var(--color) inset;
      cursor: grab;
    }

    .range-input::-moz-range-thumb {
      width: calc(var(--thumb-size) * 2);
      height: var(--thumb-size);
      border: none;
      border-radius: 15px;
      background-color: var(--bui-widget-background-color, var(--track-color));
      background-image: var(--thumb-icon);
      background-size: contain;
      background-position: center;
      background-repeat: no-repeat;
      box-shadow: 0 0 0 1px var(--color) inset;
      cursor: grab;
    }

    .range-input:disabled::-webkit-slider-thumb,
    .range-input:disabled::-moz-range-thumb {
      box-shadow: 0 0 0 6px inset gray;
      cursor: not-allowed;
    }

    .track {
      height: var(--track-height);
      background-color: var(--track-color);
      border-radius: 10px;
    }

    .progress {
      grid-column: 1;
      grid-row: 2;
      grid-column-end: 2;
      height: var(--progress-height);
      background-color: var(--color);
      border-radius: 10px;
      z-index: 1;
    }

    .range-output {
      grid-column: 2;
      grid-row: 1;
      text-align: center;
      font-size: 1.2em;
      user-select: none;
      color: white;
    }

    .range-input:hover + .range-output,
    .range-input:focus-visible + .range-output {
      color: var(--color);
      transition: color 300ms;
    }

    .tickmarks {
      grid-column: 2;
      grid-row: 3;
      position: relative;
      height: 24px;
      font-size: 12px;
      color: white;
    }

    .tick-label {
      position: absolute;
      left: 0;
      bottom: 0;
      transform: translateX(-50%);
      white-space: nowrap;
    }
  `;

  constructor() {
    super();
    // Инициализируем значения по умолчанию
    Object.keys(this.constructor.defaults).forEach(key => {
      this[key] = this.constructor.defaults[key];
    });
    this._lastColor = '';
  }

  // --- Сеттеры с синхронизацией CSS-переменных ---

  set size([w, h]) {
    const width = w === 0 ? (this.parentElement?.offsetWidth || 100) : w;
    const height = h === 0 ? (this.parentElement?.offsetHeight || 50) : h;
    this._size = [width, height];
    this.style.setProperty('--width', width);
    this.style.setProperty('--height', height);
  }
  get size() {
    return this._size;
  }

  set position([x, y]) {
    this._position = [x, y];
    this.style.setProperty('--left', x);
    this.style.setProperty('--top', y);
  }
  get position() {
    return this._position;
  }

  // --- Жизненный цикл ---

  connectedCallback() {
    super.connectedCallback();
    this.size = this._size; // Пересчитываем размеры
    this._updateThumbIcon();
    this._colorObserver = new MutationObserver(() => this._updateThumbIcon());
    this._colorObserver.observe(this, { attributes: true, attributeFilter: ['style'] });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._colorObserver) {
      this._colorObserver.disconnect();
    }
  }

  willUpdate(changedProperties) {
    if (changedProperties.has('value') || changedProperties.has('min') || changedProperties.has('max')) {
      this._updateProgress();
    }
    if (changedProperties.has('min') || changedProperties.has('max') || changedProperties.has('intervals')) {
      this._generateTicks();
    }
    if (changedProperties.has('disabled')) {
      this.renderRoot?.querySelector?.('.range-input')?.toggleAttribute('disabled', this.disabled);
    }
  }

  firstUpdated() {
    this._updateProgress();
    this._generateTicks();
  }

  // --- Рендер ---

  render() {
    return html`
      <div class="range">
        <div class="track"></div>
        <div class="progress" style="width: ${this._progressWidth}%;"></div>
        <input
          class="range-input"
          type="range"
          .value="${this.value}"
          .min="${this.min}"
          .max="${this.max}"
          .step="${this.step}"
          ?disabled="${this.disabled}"
          @input="${this.#handleInput}"
          aria-valuemin="${this.min}"
          aria-valuemax="${this.max}"
          aria-valuenow="${this.value}"
        />
        <output class="range-output">${this.value}</output>
        <div class="tickmarks">
          ${this._tickLabels}
        </div>
      </div>
    `;
  }

  // --- Приватные методы ---

  #handleInput(event) {
    const newValue = Number(event.target.value);
    if (this.value !== newValue) {
      this.value = newValue;
      this._updateProgress();
    }
  }

  _updateProgress() {
    const range = this.max - this.min;
    this._progressWidth = range === 0 ? 0 : ((this.value - this.min) / range) * 100;
  }

  _generateTicks() {
    const count = Math.max(1, this.intervals);
    const total = count + 1;
    this._tickLabels = Array.from({ length: total }, (_, i) => {
      const value = this.min + ((this.max - this.min) * i) / count;
      const percent = (i / count) * 100;
      return html`<span class="tick-label" style="left: ${percent}%">${value}</span>`;
    });
  }

  _updateThumbIcon() {
    const color = this.style.getPropertyValue('--color').trim() || 'lime';
    if (color === this._lastColor) return;
    this._lastColor = color;

    // Санитизация цвета
    if (!/^(#[0-9a-f]{3,6}|rgba?\([^)]+\)|hsla?\([^)]+\)|[a-z]+)$/i.test(color)) {
      console.warn('Invalid color value, fallback to lime:', color);
      this.style.setProperty('--thumb-icon', '');
      return;
    }

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <g fill="${color}">
          <rect x="7" y="7" width="3" height="10" rx="1"/>
          <rect x="11" y="7" width="3" height="10" rx="1"/>
          <rect x="15" y="7" width="3" height="10" rx="1"/>
        </g>
      </svg>
    `;
    const encoded = encodeURIComponent(svg.trim());
    this.style.setProperty('--thumb-icon', `url("data:image/svg+xml,${encoded}")`);
  }
}

customElements.define('bui-range2', BUIRange2);
