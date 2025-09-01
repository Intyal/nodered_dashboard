import { html, css } from '../js/lit-all.min.js';
import { BUIBaseWidget } from '../js/bui-base-widget.js';

export class BuiHtml extends BUIBaseWidget {
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

		this.size = [1, 1];
		this.position = [0, 0];
	}

	set size(value) {
		this.updatingCustomVariables(['--width', '--height'], value);
	}

	set position(value) {
		this.updatingCustomVariables(['--left', '--top'], value);
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