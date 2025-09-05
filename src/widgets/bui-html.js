import { html, css } from '../js/lit-all.min.js';
import { BUIBaseWidget } from '../js/bui-base-widget.js';

export class BuiHtml extends BUIBaseWidget {
	static defaults = {
		size: [1, 1],
		position: [0, 0],
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
			converter: (value, type) => {
				return value.split(' ').map(Number);
			},
		},
	};

	static styles = css`
		:host {
			grid-column-start: var(--left);
			grid-row-start: var(--top);
			grid-column-end: span var(--width);
			grid-row-end: span var(--height);

			display: flex;
			justify-content: var(--justify-content);
			align-items: center;

			font-size: var(--font-size);

			overflow:hidden;
		}
		.content {
			width: var(--dimensions);
			height: var(--dimensions);

			display: flex;
			justify-content: center;

			color: var(--color);
		}
	`;

	constructor() {
		super();

		this.size = this.defaults.size;
		this.position = this.defaults.position;
	}

	set size(value) {
		this._size = this.validateAndSetArr(this.defaults.size, value);

		this._size[0] = this._size[0] || this.parentNode?.size[0];
		this._size[1] = this._size[1] || this.parentNode?.size[1];

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

	render() {
		return html`
			<div class="content">
				<slot></slot>
			</div>
    	`;
	}

}

customElements.define('bui-html', BuiHtml);