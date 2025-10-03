// Заметки
//
//
//

import { html, css } from '../js/lit-all.min.js';
import { BUIBaseWidget } from '../js/bui-base-widget.js';

export class BUISticker extends BUIBaseWidget {
	static defaults = {
		size: [2, 2],
		position: [0, 0],
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
		// Размер внутренней сетки. Переопределяет кастомные переменные --innerWidth и --innerHeight.
		innerSize: {
			attribute: 'inner-size',
			type: Array,
			converter: function (value, type) {
				return value ? value.split(' ').map(Number) : ['', ''];
			}
		},
	};

	static styles = css`
		:host {
			grid-column-end: span var(--width);
			grid-row-end: span var(--height);
			grid-column-start: var(--left);
			grid-row-start: var(--top);

			display: grid;
			overflow: hidden;
			grid-auto-flow: row dense;
			grid-template-columns: repeat(var(--innerWidth, var(--width)), 1fr);
			grid-template-rows: repeat(var(--innerHeight, var(--height)), 1fr);
			gap: 0px;
			box-sizing: border-box;

			padding: var(--padding, 8px);
			margin: var(--margin, 1px 2px);
		}
  `;

	constructor() {
		super();

		this.size = this.defaults.size;
		this.position = this.defaults.position;
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

		if (!this.getAttribute('inner-size')) {
			this.innerSize = this._size;
		}
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

	set innerSize(value) {
		this._innerSize = this.validateAndSetArr(this._innerSize, value);
		this.updatingCustomVariables(['--innerWidth', '--innerHeight'], this._innerSize);
	}
	get innerSize() {
		return this._innerSize;
	}

	render() {
		return html`
			<slot></slot>
    	`;
	}

	connectedCallback() {
		super.connectedCallback();
		// При добавлении в DOM
		// Изменение размеров под родителя, если значения равны 0.
		this.size = [
			this._size[0] || this.parentElement?.innerSize[0],
			this._size[1] || this.parentElement?.innerSize[1]
		];
	}
}

customElements.define('bui-sticker', BUISticker);
