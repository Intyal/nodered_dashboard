import { svg, css } from '../js/lit-all.min.js';
import { BUIBaseWidget } from '../js/bui-base-widget.js';
import { getIconLibrary } from '../js/icon-library.js';

export class BUIIcon extends BUIBaseWidget {
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
		name: {
			type: String,
		},
		library: {
			type: String,
		},
		src: {
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
			justify-content: var(--justify-content);
			align-items: center;

			font-size: var(--font-size);

			overflow:hidden;
		}
	`;

	constructor() {
		super();

		this.size = [1, 1];
		this.position = [0, 0];
		this.library = 'default';
		this.name = 'image';
		this.src = '';

		this.svg = '';
	}

	set size(value) {
		this.updatingCustomVariables(['--width', '--height'], value);
	}

	set position(value) {
		this.updatingCustomVariables(['--left', '--top'], value);
	}

	async willUpdate(changedProperties) {
		try {
			let svg;

				// Загрузка иконки из библиотеки
				const library = getIconLibrary(this.library);
				if (!library) {
					throw new Error(`Библиотека иконок "${this.library}" не найдена.`);
				}

				svg = await library.getIcon(this.name);


			// Клонируем SVG для безопасного использования
			this.svg = svg.cloneNode(true);

		} catch (error) {
			console.error('Error rendering icon:', error);
		}
	}

	render() {
		return svg`
			${this.svg}
    	`;
	}

}

customElements.define('bui-icon', BUIIcon);
