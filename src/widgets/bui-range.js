import { html, css, svg } from '../js/lit-all.min.js';
import { BUIBaseWidget } from '../js/bui-base-widget.js';

export class BUIRange extends BUIBaseWidget {
	/**
	 * Значения по умолчанию для всех настраиваемых параметров.
	 */
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
		visibleRangeOff: false,
		visibleValueOff: false,
	};

	static properties = {
		size: {
			type: Array,
			converter: (value) => value.split(' ').map(Number),
		},
		position: {
			type: Array,
			converter: (value) => value.split(' ').map(Number),
		},
		min: {
			type: Number,
		},
		max: {
			type: Number,
		},
		value: {
			type: Number,
			reflect: true,
		},
		step: {
			type: Number,
		},
		intervals: {
			type: Number,
		},
		orientation: {
			type: String,
		},
		disabled: {
			type: Boolean,
		},
		// Отображать ли значение
		visibleValueOff: {
			attribute: 'visible-value-off',
			type: Boolean,
		},
		// Отображать ли диапазоны
		visibleRangeOff: {
			attribute: 'visible-range-off',
			type: Boolean,
		},
	};

	static styles = css`
		:host {
			--color: lime;
			--thumb-size: 6em;
			--track-height: 1em;
			--progress-height: 3em;
			--range-output-font-size: 6em;
			--tickmarks-font-size: 2.5em;
			--track-color: grey;
			--thumb-bg: var(--bui-widget-background-color);

			grid-column-start: var(--left);
			grid-row-start: var(--top);
			grid-column-end: span var(--width);
			grid-row-end: span var(--height);

			display: flex;
			overflow: hidden;
			justify-content: center;
			align-items: center;
			color: var(--color);
		}

		.range {
			display: grid;
			width: 100%;
			height: 100%;
			/* grid-auto-flow: row dense; */
			grid-template-columns: var(--thumb-size) auto var(--thumb-size);
			grid-template-rows: min-content minmax(var(--thumb-size), auto) min-content;
			/* gap: 0; */
			/* box-sizing: border-box; */
			/* margin: 0.3em 0; */
			align-items: center;
		}

		.track {
			grid-column-start: 2;
			grid-row-start: 2;
			height: var(--track-height);
			border-radius: 2em;
			background-color: var(--track-color);
		}

		.progress {
			grid-column-start: 2;
			grid-row-start: 2;
			width: calc((var(--value) - var(--min)) / (var(--max) - var(--min)) * 100%);
			height: var(--progress-height);
			border-radius: 2em;
			background-color: var(--color);
		}

		.thumb-track-container {
			grid-column-start: 2;
			grid-row-start: 2;
			position: relative;
			/* width: 100%; */
			/* height: 100%; */
		}

		.range-input {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			opacity: 0;
			-webkit-appearance: none;
			-moz-appearance: none;
			appearance: none;
			cursor: pointer;
			outline: none;
			box-shadow: none;
		}

		.thumb {
			position: absolute;
			/* top: 50%; */
			left: var(--thumb-left, 0);
			transform: translateX(-50%) translateY(-50%);
			pointer-events: none;
			color: var(--color);
			/* will-change: transform; */
		}

		.thumb svg {
			display: block;
			width: calc(var(--thumb-size) * 2);
			height: var(--thumb-size);
		}

		.range-output {
			grid-column-start: 2;
			grid-row-start: 1;
			text-align: center;
			line-height: 1;
			font-size: var(--range-output-font-size);
			user-select: none;
			color: white;
		}

		.thumb-track-container:hover ~ .range-output,
		.thumb-track-container:focus-visible ~ .range-output {
			color: var(--color);
			transition: 300ms;
		}

		.tickmarks {
			grid-column-start: 2;
			grid-row-start: 3;
			position: relative;
			height: 1em;
			color: white;
			font-size: var(--tickmarks-font-size);
			line-height: 1;
			user-select: none;
		}

		.tick-label {
			position: absolute;
			left: var(--tick-pos, 0);
			transform: translateX(-50%);
			/* white-space: nowrap; */
		}
	`;

	constructor() {
		super();
		Object.keys(this.constructor.defaults).forEach(key => {
			this[key] = this.constructor.defaults[key];
		});

		this.tickLabels = [];
	}

	// --- Сеттеры ---

	set size(value) {
		const validValue = this.validateAndSetArr(this.defaults.size, value);
		const w = validValue[0] === 0 ? (this.parentElement?.innerSize?.[0] || this.defaults.size[0]) : validValue[0];
		const h = validValue[1] === 0 ? (this.parentElement?.innerSize?.[1] || this.defaults.size[1]) : validValue[1];
		this._size = [w, h];

		// this._size = this.validateAndSetArr(this.defaults.size, value);
		// if (this.parentElement) {
		// 	if (this._size[0] === 0) this._size[0] = this.parentElement?.innerSize?.[0] ?? 2;
		// 	if (this._size[1] === 0) this._size[1] = this.parentElement?.innerSize?.[1] ?? 2;
		// }
		this.updatingCustomVariables(['--width', '--height'], this._size);
	}
	get size() { return this._size; }

	set position(value) {
		this._position = this.validateAndSetArr(this.defaults.position, value);
		this.updatingCustomVariables(['--left', '--top'], this._position);
	}
	get position() { return this._position; }

	// --- Жизненный цикл ---

	connectedCallback() {
		super.connectedCallback();
		// Только если size[0] или [1] === 0 — подстраиваем под родителя
		// const w = this._size[0] === 0 ? (this.parentElement?.innerSize?.[0] || this.defaults.size[0]) : this._size[0];
		// const h = this._size[1] === 0 ? (this.parentElement?.innerSize?.[1] || this.defaults.size[1]) : this._size[1];
		// this.size = [w, h];
		this.#generateTickmarks();
	}

	willUpdate(changedProperties) {
		if (changedProperties.has('min') || changedProperties.has('max') || changedProperties.has('intervals')) {
			this.#generateTickmarks();
		}
	}

	// --- Рендер ---

	renderThumb() {
		return svg`
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50">
				<rect x="0" y="0" width="100" height="50" rx="25" fill="var(--thumb-bg, #333)" />
				<rect x="1" y="1" width="98" height="48" rx="25" fill="none" stroke="currentColor" stroke-width="3%" />
				<rect x="30" y="15" width="6" height="20" rx="3" fill="currentColor" />
				<rect x="47" y="15" width="6" height="20" rx="3" fill="currentColor" />
				<rect x="64" y="15" width="6" height="20" rx="3" fill="currentColor" />
			</svg>
		`;
	}

	render() {
		const percent = this.#getPercent();
		return html`
			<div class="range" style="--value: ${this.value}; --min: ${this.min}; --max: ${this.max};">
				<div class="track"></div>
				<div class="progress"></div>
				<div class="thumb-track-container">
					<input
						@input=${this.#handleInputRange}
						@pointerup=${this.#onPointerUp}
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
					/>
					<div class="thumb" style="--thumb-left: ${percent}%;" aria-hidden="true">
						${this.renderThumb()}
					</div>
				</div>
				${this.visibleValueOff ? `` : html`<output class="range-output">${this.value}</output>`}
				${this.visibleRangeOff ? `` : html`<div class="tickmarks">${this.tickLabels}</div>`}
			</div>
		`;
	}

	updated(changedProperties) {
		//this.#rangeAnimate
	}

	// --- Обработчики ---

	// Генерируем событие при изменении значения
	#onPointerUp(event) {
		//
		const value = this.value;
		//console.log(value);
		if (event.button === 0) {
			// Генерируем кастомное событие с данными
			this.dispatchEvent(
				new CustomEvent('bui-data-update', {
				detail: { value, element: this },
				bubbles: true,     // чтобы событие всплывало
				composed: true     // чтобы вышло за пределы shadow DOM
				})
			);
		}
	}

	#handleInputRange(event) {
		const newValue = Number(event.target.value);
		if (this.value !== newValue) {
			this.value = newValue;
		}
	}

	// --- Вспомогательные методы ---

	#generateTickmarks() {
		if (this.intervals <= 0) {
			this.tickLabels = [];
			return;
		}
		const tickCount = this.intervals;
		const totalTicks = tickCount + 1;
		this.tickLabels = Array.from({ length: totalTicks }, (_, i) => {
			const value = this.min + (this.max - this.min) * (i / tickCount);
			const percent = (i / tickCount) * 100;
			return html`
				<span class="tick-label" style="--tick-pos: ${percent}%;">${value}</span>
			`;
		});
	}

	#getPercent() {
		const range = this.max - this.min;
		return range === 0 ? 0 : ((this.value - this.min) / range) * 100;
	}

	#rangeAnimate() {
		const percent = this.#getPercent();
		const thumb = this.$('.thumb');
		const progress = this.$('.progress');
	  
		thumb?.animate({ left: `${percent}%` }, { duration: 1000, easing: 'ease', fill: 'forwards' });
		progress?.animate({ width: `${percent}%` }, { duration: 1000, easing: 'ease', fill: 'forwards' });
	}
}

customElements.define('bui-range', BUIRange);