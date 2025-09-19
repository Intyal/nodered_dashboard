import { html, css } from '../js/lit-all.min.js';
import { BUIBaseWidget } from '../js/bui-base-widget.js';

export class BUINumber extends BUIBaseWidget {
	static defaults = {
		size: [1, 1],
		position: [0, 0],
		value: 0,
		fixed: 2,
	};

	static properties = {
		// Размер в сетке. Переопределяет кастомные переменные --width и --height.
		size: {
			type: Array,
			converter: function (value, type) {
				return value.split(' ').map(Number);
			}
		},
		// Позиция в сетке. Переопределяет кастомные переменные --left и --top.
		position: {
			type: Array,
			converter: function (value, type) {
				return value.split(' ').map(Number);
			}
		},
		// Число для отображения.
		value: {
			type: Number
		},
		// Количество знаков после запятой при отображении.
		fixed: {
			attribute: 'fraction-digits',
			type: Number
		},
	};

	static styles = css`
		:host {
			grid-column-end: span var(--width);
			grid-row-end: span var(--height);
			grid-column-start: var(--left);
			grid-row-start: var(--top);

			display: flex;
			overflow: hidden;
			justify-content: var(--justify-content, center);
			align-items: center;

			font-size: var(--font-size);
			color: var(--color);
		}
	`;

	constructor() {
		super();

		Object.assign(this, this.defaults);

		this.fixedValue = 0; // Значение, которое будет отображено.
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

	set value(value) {
		if (isNaN(value)) {
			console.warn(`[${this.constructor.name}][value] Новое значение не является числом`);
			return;
		}
		this._value = value;
	}
	get value() {
		return this._value;
	}

	willUpdate(changedProperties) {
		// Метод .every() (для "все"), .some() (для "хотя бы один"):
		if (['value', 'fraction-digits'].some(key => changedProperties.has(key))) {
			let fixedValue = Number(this.value);
			if (!isNaN(this.fixed) && Number(this.fixed) >= 0) {
				fixedValue = fixedValue.toFixed(Number(this.fixed));
			}
			this.fixedValue = fixedValue;
		}
	}

	render() {
		return html`
			${this.fixedValue}
		`;
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

customElements.define('bui-number', BUINumber);