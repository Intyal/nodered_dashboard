import { html, css } from '../js/lit-all.min.js';
import { BUIBaseWidget, colorUtilities } from '../js/bui-base-widget.js';

export class BUILed extends BUIBaseWidget {
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
		glowOff: {
			type: Boolean,
			attribute: 'glow-off',
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
		.content {
			flex: 1;
			max-width: var(--sizex, 90%);
			min-height: var(--sizey, 90%);
			/*max-height: 100%;*/
			background: var(--color);
			box-shadow: var(--shadow);
			border-radius: var(--border-radius);
			border-bottom: var(--border-bottom);
			margin-top: var(--margin-top);
			z-index: 0;
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

	set glowOff(value) {
		if (value) {
			this.updatingCustomVariables(['--shadow'], ['0']);
		} else {
			const rgb = colorUtilities.colorToRgb(color);
			const br = colorUtilities.rgbToHsl(rgb).l / 100;
			const shadow = `0 ${parseInt(5 * br)}px ${parseInt(10 + 15 * br)}px ${parseInt(6 * br)}px var(--color)`;
			this.updatingCustomVariables(['--shadow'], [shadow]);
		}
	}

	render() {
		return html`
			<div class="content"></div>
    	`;
	}

}
customElements.define('bui-led', BUILed);
