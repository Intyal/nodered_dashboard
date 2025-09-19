import { svg, css } from '../js/lit-all.min.js';
import { BUIBaseWidget } from '../js/bui-base-widget.js';
import { getIconLibrary } from '../js/icon-library.js';

export class BUIIcon extends BUIBaseWidget {
	static defaults = {
		size: [1, 1],
		position: [0, 0],
		library: 'default',
		name: 'image',
		src: '',
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
			overflow:hidden;

			justify-content: var(--justify-content, center);
			align-items: var(--align-items, center);
			font-size: var(--font-size);
			color: var(--color);
		}
		svg {
			width: 1em;
			height: 1em;
			font-size: inherit; /* Наследует font-size родителя */
		}
	`;

	constructor() {
		super();

		Object.assign(this, this.defaults);

		this._currentIcon = null;
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

	willUpdate(changedProperties) {
		if (changedProperties.has('name') || changedProperties.has('library') || changedProperties.has('src')) {
			this.#loadIcon().then(icon => {
				this._currentIcon = icon;
				this.requestUpdate(); // Запрашиваем обновление после загрузки
			});
		}
	}

	render() {
		if (!this._currentIcon) {
			return this.renderLoadingPlaceholder();
		}

		return svg`
			${this._currentIcon}
		`;
	}

	connectedCallback() {
		super.connectedCallback();
		// Изменение размеров под родителя, если значения равны 0.
		this.size = [this._size[0] || this.parentElement?.innerSize[0],
			this._size[1] || this.parentElement?.innerSize[1]];
	}

	/**
	 * Асинхронная загрузка иконки из внешнего источника или библиотеки.
	 * @returns {Promise<SVGElement>} - Возвращает Promise с элементом SVG иконки или placeholder-иконкой при ошибке.
	 * 
	 * @description
	 * Метод выполняет следующие действия:
	 * Если указан `this.src`, парсит строку SVG в DOM-элемент.
	 * Иначе загружает иконку из указанной библиотеки (`this.library`).
	 */
	async #loadIcon() {
		if (this.src) {
			const parser = new DOMParser();
			const doc = parser.parseFromString(this.src, 'image/svg+xml');
			return doc.documentElement.cloneNode(true);
		}
	
		const library = getIconLibrary(this.library);
		if (!library) throw new Error(`Библиотека "${this.library}" не найдена`);
	
		// getIcon() возвращает готовый к использованию клон
		const svgElement = await library.getIcon(this.name);
		if (!svgElement) throw new Error(`Иконка "${this.name}" не существует`);
	
		return svgElement;
	}

	// Иконка загрузки
	renderLoadingPlaceholder() {
		return svg`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#ccc" stroke-width="2"/>
            </svg>
        `;
	}

}

customElements.define('bui-icon', BUIIcon);
