import { html, css, svg, LitElement } from '../js/lit-all.min.js';
import { BUIBaseWidget } from '../js/bui-base-widget.js';

export class BUIRange2 extends BUIBaseWidget {
  static defaults = {
    size: [2, 2],
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
    size: { type: Array, converter: (value) => value.split(' ').map(Number) },
    position: { type: Array, converter: (value) => value.split(' ').map(Number) },
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
      grid-column-start: var(--left);
      grid-row-start: var(--top);
      grid-column-end: span var(--width);
      grid-row-end: span var(--height);
      display: flex;
      overflow: hidden;
      justify-content: center;
      align-items: center;
      font-size: var(--font-size);
      color: var(--color);
    }

    .range {
      --thumb-size: 2em;
      --track-height: 10px;
      --track-color: grey;
      --progress-height: 16px;

      display: grid;
      align-items: center;
      width: 100%;
      height: 100%;
      grid-auto-flow: row dense;
      grid-template-columns: calc(var(--thumb-size) * 3) auto calc(var(--thumb-size) * 3);
      grid-template-rows: auto auto auto;
      gap: 0;
      box-sizing: border-box;
      margin: 5px 0;
    }

    .range-input {
      grid-column: 1 / -1;
      grid-row: 2;
      background: transparent;
      outline: none;
      -webkit-appearance: none;
      -moz-appearance: none;
    }

    .range-input::-webkit-slider-thumb {
      appearance: none;
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
      width: var(--thumb-size);
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
      box-shadow: 0 0 0 6px gray inset;
      cursor: default;
    }

    .track {
      grid-column: 2;
      grid-row: 2;
      height: var(--track-height);
      border-radius: 10px;
      background-color: var(--track-color);
    }

    .progress {
      grid-column: 2;
      grid-row: 2;
      width: calc((var(--value, 0) - var(--min, 0)) / (var(--max, 100) - var(--min, 0)) * 100%);
      height: var(--progress-height);
      border-radius: 10px;
      background-color: var(--color);
    }

    .range-output {
      grid-column: 2;
      grid-row: 1;
      text-align: center;
      font-size: 6em;
      user-select: none;
      color: white;
      transition: color 300ms;
    }

    .range-output:hover,
    .range-output:focus-visible {
      color: var(--color);
    }

    .tickmarks {
      grid-column: 2;
      grid-row: 3;
      position: relative;
      height: 30px;
      color: white;
      font-size: 14px;
      user-select: none;
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
    this.intervals = 1;
    this._thumbSvgCache = new Map();
  }

  // --- Сеттеры ---

  set size(value) {
    this._size = this.validateAndSetArr(this.constructor.defaults.size, value);
    this._updateSize();
  }
  get size() { return this._size; }

  set position(value) {
    this._position = this.validateAndSetArr(this.constructor.defaults.position, value);
    this.updatingCustomVariables(['--left', '--top'], this._position);
  }
  get position() { return this._position; }

  // --- Жизненный цикл ---

  connectedCallback() {
    super.connectedCallback();
    this._updateSize();
  }

  willUpdate(changedProps) {
    if (changedProps.has('min') || changedProps.has('max') || changedProps.has('intervals')) {
      this._generateTickmarks();
    }
    if (changedProps.has('value')) {
      this._lastValue = changedProps.get('value');
    }
  }

  updated(changedProps) {
    if (changedProps.has('min') || changedProps.has('max') || changedProps.has('value') || changedProps.has('--color')) {
      this._updateProgressStyle();
    }
    if (changedProps.has('--color')) {
      this._updateThumbIcon();
    }
  }

  // --- Приватные методы ---

  _updateSize() {
    const parentSize = this.parentElement?.innerSize || [0, 0];
    const width = this._size[0] || parentSize[0];
    const height = this._size[1] || parentSize[1];
    this.updatingCustomVariables(['--width', '--height'], [width, height]);
  }

  _updateProgressStyle() {
    this.style.setProperty('--value', this.value);
    this.style.setProperty('--min', this.min);
    this.style.setProperty('--max', this.max);
  }

  _updateThumbIcon() {
    const color = this.getCssVariable('--color').trim() || 'lime';
    if (!this._isValidColor(color)) {
      console.warn('Invalid color, fallback to lime:', color);
      return;
    }

    if (this._thumbSvgCache.has(color)) {
      this.style.setProperty('--thumb-icon', this._thumbSvgCache.get(color));
      return;
    }

    const svgStr = this._renderThumbSvg(color);
    const dataUrl = `url("data:image/svg+xml,${encodeURIComponent(svgStr)}")`;
    this._thumbSvgCache.set(color, dataUrl);
    this.style.setProperty('--thumb-icon', dataUrl);
  }

  _renderThumbSvg(color) {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <g fill="${color.replace(/"/g, '&quot;')}">
          <rect x="7" y="7" width="3" height="10" rx="1"/>
          <rect x="11" y="7" width="3" height="10" rx="1"/>
          <rect x="15" y="7" width="3" height="10" rx="1"/>
        </g>
      </svg>
    `.trim();
  }

  _isValidColor(color) {
    const temp = document.createElement('div');
    temp.style.color = color;
    return temp.style.color !== '';
  }

  _generateTickmarks() {
    if (this.intervals <= 0) {
      this._tickLabels = [];
      return;
    }

    const totalTicks = this.intervals + 1;
    this._tickLabels = Array.from({ length: totalTicks }, (_, i) => {
      const value = this.min + (this.max - this.min) * (i / this.intervals);
      const percent = (i / this.intervals) * 100;
      return { value, percent };
    });
  }

  _handleInput(event) {
    const newValue = Number(event.target.value);
    if (this.value !== newValue) {
      this.value = newValue;
    }
  }

  _handlePointerUp(event) {
    if (this._lastValue !== this.value) {
      this.dispatchEvent(new CustomEvent('change', {
        detail: { value: this.value },
        bubbles: true,
        composed: true
      }));
    }
  }

  // --- Рендер ---

  render() {
    return html`
      <div class="range">
        <div class="track"></div>
        <div class="progress"></div>
        <input
          class="range-input"
          type="range"
          .min=${this.min}
          .max=${this.max}
          .value=${this.value}
          .step=${this.step}
          ?disabled=${this.disabled}
          aria-valuemin=${this.min}
          aria-valuemax=${this.max}
          aria-valuenow=${this.value}
          @input=${this._handleInput}
          @pointerup=${this._handlePointerUp}
        >
        <output class="range-output">${this.value}</output>
        <div class="tickmarks">
          ${this._tickLabels?.map(item => html`
            <span class="tick-label" style="left: ${item.percent}%;">${item.value}</span>
          `)}
        </div>
      </div>
    `;
  }
}

customElements.define('bui-range2', BUIRange2);
