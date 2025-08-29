import { html, css } from '../js/lit-all.min.js';
import { BUIBaseWidget } from '../js/bui-base-widget.js';

export class BUINumber extends BUIBaseWidget {
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
			converter: (value, type) => {
				return value.split(' ').map(Number);
			}
		},
		// Число для отображения.
		value: {
			type: Number
		},
		// Количество знаков после запятой при отображении.
		fixed: {
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

		//this.debug = true;

		this.size = [1, 1];
		this.position = [0, 0];
		this.value = 0;
		this.fixed = 2;
		//
		this.fixedValue = 0; // Значение, которое будет отображено.
	}

	set size(value) {
		this.updatingCustomVariables(value, ['--width', '--height']);
	}

	set position(value) {
		this.updatingCustomVariables(value, ['--left', '--top']);
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
		if (['value', 'fixed'].some(key => changedProperties.has(key))) {
			let fixedValue = Number(this.value);
			if (!isNaN(this.fixed) && Number(this.fixed) >= 0) {
				fixedValue = fixedValue.toFixed(Number(this.fixed));
			}
			this.fixedValue = fixedValue;
		}
	}

	// Отрисовывает шаблон с помощью lit-html.
	render() {
		return html`
			${this.fixedValue}
		`;
	}
}

customElements.define('bui-number', BUINumber);