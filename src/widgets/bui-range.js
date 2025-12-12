import { html, css, svg, unsafeHTML } from '../js/lit-all.min.js';
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
		intervals : 1,
		orientation: 'horizontal',
		disabled: false,
		thumbIconUrl: '',
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
			--tickmarks-w: calc(100% - 20px);
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
			gap: 0px;
			box-sizing: border-box;
			margin: 5px 0;
      	}
		.range-input {
			grid-column-start: 1;
			grid-row-start: 2;
			grid-column-end: span 3;

			appearance: none;
			background: none;
		}
		.range-input::-webkit-slider-thumb {
			-webkit-appearance: none;
			appearance: none;

			width: calc(var(--thumb-size) * 2);
			height: var(--thumb-size);
			border: none;
			border-radius: 15px;
			background-color: var(--bui-widget-background-color, var(--track-color));
			
			/* Динамический SVG из переменной */
			background-image: var(--thumb-icon);
			background-size: contain;
			background-position: center;
			background-repeat: no-repeat;
			
			box-shadow: 0 0 0 1px var(--color) inset;
			cursor: grab;
}
		}
		.range-input::-moz-range-thumb {
			width: var(--thumb-size);
			height: var(--thumb-size);
			border: none;
			border-radius: 15px;
			background-color: var(--bui-widget-background-color, var(--track-color));
			
			/* SVG с закруглёнными полосками */
			background-image: var(--thumb-icon);
			background-size: contain;
			background-position: center;
			background-repeat: no-repeat;
			
			box-shadow: 0 0 0 1px var(--color) inset;
			cursor: grab;
}
		}
		/* .range-input:active::-webkit-slider-thumb {
			background-color: var(--bui-widget-background-color, var(--track-color));
			box-shadow: 0 0 0 6px inset var(--thumb-color);
		}
		.range-input:active::-moz-range-thumb {
			background-color: var(--bui-widget-background-color, var(--track-color));
			box-shadow: 0 0 0 6px inset var(--thumb-color);
		} */
		.range-input:disabled::-webkit-slider-thumb {
			box-shadow: 0 0 0 6px inset gray;
		}
		.range-input:disabled::-moz-range-thumb {
			box-shadow: 0 0 0 6px inset gray;
		}
		/* .range-input:focus-visible {
			outline-offset: 3px;
			outline: 1px solid red;
		}
		.range-input:focus-visible::-webkit-slider-thumb {
			outline: 3px solid green;
		}
		.range-input:focus-visible::-moz-range-thumb {
			outline: 3px solid green;
		} */
		.track {
			grid-column-start: 2;
			grid-row-start: 2;
			height: var(--track-height);
			border-radius: 10px;
			background-color: var(--track-color);
		}
		.progress {
			grid-column-start: 2;
			grid-row-start: 2;
			width: calc(var(--value) / ((var(--max) - var(--min)) / 100) * 1%);
			height: var(--progress-height);
			border-radius: 10px;
			background-color: var(--color);
		}
		.range-output {
			grid-column-start: 2;
			grid-row-start: 1;
			text-align: center;
			font-size: 6em;
			user-select: none;
			color: white;
		}
		.range-input:hover + .range-output,
		.range-input:focus-visible + .range-output {
			color: var(--color);
			transition: 300ms;
		}
		.tickmarks {
			grid-column-start: 2;
			grid-row-start: 3;
			/* grid-column-end: span 3; */
			
			position: relative;
			height: 30px;
			color: white;
			font-size: 14px;
			user-select: none;
		}
		.tick-label {
			position: absolute;
			transform: translateX(-50%); /* Центрирует текст по горизонтали */
			white-space: nowrap; /* Предотвращает перенос длинных чисел */
		}		
		/* .tickmarks span::before {
			content: "";
			position: absolute;
			bottom: 0;
			left: 50%;
			transform: translateX(-50%);
			width: 2px;
			height: 10px;
			background: #c6c6c6;
		} */
  `;
	constructor() {
		super();

		// Инициализация значений по умолчанию
		Object.keys(this.constructor.defaults).forEach(key => {
			this[key] = this.constructor.defaults[key];
		});

		this._lastColor = '';
	}

	// --- Сеттеры с синхронизацией CSS-переменных ---

	set size(value) {
		this._size = this.validateAndSetArr(this.defaults.size, value);

		// Изменение размеров под родителя, если значения равны 0.
		if (this.parentElement) {
			if (this._size[0] === 0) {
				this._size[0] = this.parentElement?.innerSize[0];
			}
			if (this._size[1] === 0) {
				this._size[1] = this.parentElement?.innerSize[1];
			}
		}

		this.updatingCustomVariables(['--width', '--height'], this._size);
	}
	get size() {
		return this._size;
	}

	set position(value) {
		this._position = this.validateAndSetArr(this.defaults.position, value);
		this.updatingCustomVariables(['--left', '--top'], this._position);
	}
	get position() {
		return this._position;
	}

	// --- Жизненный цикл ---

	connectedCallback() {
		super.connectedCallback();
		// Изменение размеров под родителя, если значения равны 0.
		this.size = [
			this._size[0] || this.parentElement?.innerSize[0],
			this._size[1] || this.parentElement?.innerSize[1]
		];

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

	}

	// Вызывается после первого обновления DOM компонента, непосредственно перед вызовом updated().
	firstUpdated() {
		//
	}

	// --- Рендер ---

	render() {
		const tickCount = this.intervals; // количество интервалов → количество зон между метками
		const totalTicks = tickCount + 1; // количество меток = интервалы + 1
	
		return html`
			<div class="range" style="--value: ${this.value}; --min: ${this.min}; --max: ${this.max};">
				<div class="track"></div>
				<div class="progress"></div>
				<input
					@input=${this.#handleInputRange}
					class="range-input"
					id="tailmetr"
					type="range"
					min="${this.min}"
					max="${this.max}"
					value="${this.value}"
					step="${this.step}"
					aria-valuemin="${this.min}"
					aria-valuemax="${this.max}"
				>
				<output class="range-output" id="output" for="tailmetr">${this.value}</output>
				<div class="tickmarks">
					${Array.from({ length: totalTicks }, (_, i) => {
						const value = this.min + (this.max - this.min) * (i / tickCount);
						const percent = (i / tickCount) * 100;
						return html`
							<span class="tick-label" style="left: ${percent}%;">${value}</span>
						`;
					})}
				</div>
			</div>
		`;
	}

	// --- Приватные методы ---

	#handleInputRange(event) {
		const newValue = Number(event.target.value);
		if (this.value !== newValue) {
			this.value = newValue;
    	//event.target.parentNode.style.setProperty('--value', event.target.value);
		//event.target.nextElementSibling.value = event.target.value; // Значение в подсказке
		}
	}

	_updateThumbIcon() {
		const color = this.style.getPropertyValue('--color').trim();
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

// Регистрация компонента
customElements.define('bui-range', BUIRange);