import { html, css } from '../js/lit-all.min.js';
import { BUIBaseWidget, colorUtilities } from '../js/bui-base-widget.js';

export class BUILed extends BUIBaseWidget {
	static defaults = {
		size: [1, 1],
		position: [0, 0],
		scale: [90, 90],
		glowOff: false,
	};

	static properties = {
		// Размер в сетке. Переопределяет кастомные переменные --width и --height.
		size: {
			type: Array,
			converter: function (value, type) {
				return value.split(' ').map(Number);
			},
		},
		// Позиция в сетке. Переопределяет кастомные переменные --left и --top.
		position: {
			type: Array,
			converter: function (value, type) {
				return value.split(' ').map(Number);
			},
		},
		// Масштаб относительно внутреннего размера. Переопределяет кастомные переменные --scalex и --scaley.
		scale: {
			type: Array,
			converter: function (value, type) {
				return value.split(' ').map(Number);
			},
		},
		// Эффкет свечения.
		glowOff: {
			type: Boolean,
			attribute: 'glow-off',
		},
		// Стиль элемента.
		style: {
			type: String,
		},
	};

	static styles = css`
		:host {
			grid-column-start: var(--left);
			grid-row-start: var(--top);
			grid-column-end: span var(--width);
			grid-row-end: span var(--height);

			display: flex;
			justify-content: center;
			align-items: center;

			font-size: var(--font-size);
		}
		.led {
			flex: 1;
			max-width: var(--scalex);
			min-height: var(--scaley);
			/*max-height: 100%;*/
			background: var(--color, grey);
			box-shadow: var(--shadow);
			border-radius: var(--border-radius);
			border-bottom: var(--border-bottom);
			margin-top: var(--margin-top);
			z-index: 0;
		}
	`;

	constructor() {
		super();

		Object.assign(this, this.defaults);
		this.color = "";
	}

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

	set scale(value) {
		this._scale = this.validateAndSetArr(this.defaults.scale, value);
		this.updatingCustomVariables(['--scalex', '--scaley'], this._scale, '%');
	}
	get scale() {
		return this._scale;
	}

	#calculateShadow() {
		if (this._glowOff) return '0';
		
		const rgb = colorUtilities.colorToRgb(this.color);
		const br = colorUtilities.rgbToHsl(rgb).l / 100;
		const intensity = parseInt(5 * br);
		const blur = parseInt(10 + 15 * br);
		const spread = parseInt(6 * br);
		
		return `0 ${intensity}px ${blur}px ${spread}px var(--color)`;
	}

	#updateColor() {
		const computedStyle = getComputedStyle(this);
		this.color = computedStyle.getPropertyValue('--color').trim();
	}

	#updateShadow() {
		const shadow = this.#calculateShadow();
		this.updatingCustomVariables(['--shadow'], [shadow]);
	}

	willUpdate(changedProperties) {
		// Метод .every() (для "все"), .some() (для "хотя бы один"):
		if (['glow-off'].some(key => changedProperties.has(key))) {
			this.#updateShadow();
		}
		if (['style'].some(key => changedProperties.has(key))) {
			this.#updateColor();
			this.#updateShadow();
		}
	}

	render() {
		return html`
			<div class="led"></div>
    	`;
	}

	firstUpdated() {
		this.#updateColor();
		this.#updateShadow();
	}

	connectedCallback() {
		super.connectedCallback();
		// Изменение размеров под родителя, если значения равны 0.
		this.size = [
			this._size[0] || this.parentElement?.innerSize[0],
			this._size[1] || this.parentElement?.innerSize[1]
		];
	}

}
customElements.define('bui-led', BUILed);