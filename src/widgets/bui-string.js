import { html, css } from '../js/lit-all.min.js';
import { BUIBaseWidget } from '../js/bui-base-widget.js';

export class BUIString extends BUIBaseWidget {
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
		direction: {
			type: String,
		},
	};

	static styles = css`
		:host {
			grid-column-start: var(--left);
			grid-row-start: var(--top);
			grid-column-end: span var(--width);
			grid-row-end: span var(--height);
			overflow: hidden;

			display: flex;
			align-items: var(--align-items);
			justify-content: var(--justify-content);
			writing-mode: var(--writing-mode);
			transform: var(--transform);
		}
		.string {
			/* align-items: var(--align-items-text, center); */
			font-size: var(--font-size);
			color: var(--color);
			line-height: 1.0;
			/*letter-spacing: -0.025em;*/
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

	set direction(value) {
		if (value === 'vertup') {
			this.updatingCustomVariables(['--writing-mode', '--transform'], ['vertical-lr', 'scale(-1, -1)']);
		}
		if (value === 'vertdown') {
			this.updatingCustomVariables(['--writing-mode', '--transform'], ['vertical-lr', '']);
		}
	}

	render() {
		return html`
			<div class="string">
				<slot></slot>
			</div>
    	`;
	}

}
customElements.define('bui-string', BUIString);
