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
		this.library = 'default';
		this.name = 'image';
		this.src = '';

		this._currentIcon = null;
	}

	set size(value) {
		this.updatingCustomVariables(['--width', '--height'], value);
	}

	set position(value) {
		this.updatingCustomVariables(['--left', '--top'], value);
	}

	willUpdate(changedProperties) {
		if (changedProperties.has('name') || changedProperties.has('library') || changedProperties.has('src')) {
			this._loadIcon().then(icon => {
				this._currentIcon = icon;
				this.requestUpdate(); // Запрашиваем обновление после загрузки
			});
		}
	}

	render() {
		if (!this._currentIcon) {
			return this._renderLoadingPlaceholder();
		}

		return svg`
			<div class="content">
				${this._currentIcon}
			</div>
		`;
	}

	async _loadIcon() {
		try {
			if (this.src) {
				const parser = new DOMParser();
				const doc = parser.parseFromString(this.src, 'image/svg+xml');
				return doc.documentElement.cloneNode(true);
			}

			const library = getIconLibrary(this.library);
			if (!library) throw new Error(`Библиотека "${this.library}" не найдена`);

			const svgElement = await library.getIcon(this.name);
			if (!svgElement) throw new Error(`Иконка "${this.name}" не существует`);

			return svgElement.cloneNode(true);

		} catch (error) {
			console.error('Ошибка загрузки иконки:', error);
			return this._createErrorSVG();
		}
	}

	_renderLoadingPlaceholder() {
		return svg`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#ccc" stroke-width="2"/>
            </svg>
        `;
	}

	_createErrorSVG() {
		const parser = new DOMParser();
		const doc = parser.parseFromString(this._getErrorPlaceholder(), 'image/svg+xml');
		return doc.documentElement;
	}

	_getErrorPlaceholder() {
		return svg`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#ff0000" stroke-width="2"/>
                <path d="M12 8V12" stroke="#ff0000" stroke-width="2" stroke-linecap="round"/>
                <circle cx="12" cy="16" r="1.5" fill="#ff0000"/>
            </svg>
        `;
	}

}

customElements.define('bui-icon', BUIIcon);
