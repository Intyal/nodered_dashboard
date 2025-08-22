import { html } from '../lit-html.js';
import { WidgetBase } from "./WidgetBase.js";

class BuiSticker extends WidgetBase {
	static properties = {
		// Размер в сетке. Переопределяет свойства width и height.
		size: { type: String, noRender: true },
		// Позиция в сетке. Переопределяет свойства left и top.
		position: { type: String, noRender: true },
		// Позиция по горизонтали (старт столбца). Отражается в CSS-переменной `--left`.
		left: { watched: false, type: Number, cssVar: true, noRender: true },
		// Ширина ячейки в единицах сетки. Отражается в CSS-переменной `--width`.
		width: { watched: false, type: Number, cssVar: true, noRender: true },
		// Позиция по вертикали (старт строки). Отражается в CSS-переменной `--top`.
		top: { watched: false, type: Number, cssVar: true, noRender: true },
		// Высота ячейки в единицах сетки. Отражается в CSS-переменной `--height`.
		height: { watched: false, type: Number, cssVar: true, noRender: true },
	};

	static styles = `
		:host {
			box-sizing: border-box;
			border-radius: var(--bui-widget-border-radius, 0.5rem);
			padding: var(--padding, 8px);
			margin: var(--margin, 1px 2px);

			grid-column-end: span var(--width);
			grid-row-end: span var(--height);
			grid-column-start: var(--left);
			grid-row-start: var(--top);

			display: grid;
			overflow: hidden;
			grid-auto-flow: row dense;
			grid-template-columns: repeat(var(--width), 1fr);
			grid-template-rows: repeat(var(--height), 1fr);
			gap: 0px;
			background: var(--color);
			font-size: var(--page-atom-size);
		}
	`;

	constructor() {
		super();

		//this.debug = true;

		this.position = '0 0';
		this.size = '2 2';
	}

	// Хук, вызываемый после обновления свойства.
	afterPropertyUpdate(key, newValue, oldValue) {
		if (key === 'size') {
			const [width, height] = this.size.split(' ').map(Number);
			this.width = width;
			this.height = height;
		}
		if (key === 'position') {
			const [left, top] = this.position.split(' ').map(Number);
			this.left = left;
			this.top = top;
		}
	}

	render() {
		return html`
			<slot></slot>
		`;
	}

}

BuiSticker.register();