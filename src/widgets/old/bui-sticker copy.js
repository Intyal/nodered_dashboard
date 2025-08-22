import { WidgetBase } from "./WidgetBase.js";

/**
 * Кастомный элемент отображения Стикера.
 *
 * Элемент отображает стикер для объединения дугих элементов, поддерживает:
 * - Позиционирование в сетке через CSS-переменные `--width`, `--height`, `--left`, `--top`
 *
 * @example
 * <bui-sticker size="3 4" position="0 0" id="st2"></bui-sticker>
 *
 * @extends {WidgetBase}
 */
class BuiSticker extends WidgetBase {
	/**
	 * Конфигурация реактивных свойств компонента.
	 * Определяет тип, атрибут, поведение и стилизацию.
	 *
	 * @static
	*/
	static properties = {
		/**
		 * Размер в сетке.
		 * Переопределяет свойства width и height.
		 */
		size: { type: String, default: '2 2', converter: function(value) {
			const [width, height] = value.split(' ').map(Number);
			this.width = width;
			this.height = height;
			return value;
		} },

		/**
		 * Позиция в сетке.
		 * Переопределяет свойства left и top.
		 */
		position: { type: String, default: '0 0', converter: function(value) {
			const [left, top] = value.split(' ').map(Number);
			this.left = left;
			this.top = top;
			return value;
		} },

		/**
		 * Ширина ячейки в единицах сетки.
		 * Отражается в CSS-переменной `--width`.
		 */
		width: { attribute: false, type: Number, default: 2, cssVar: true },

		/**
		 * Высота ячейки в единицах сетки.
		 * Отражается в CSS-переменной `--height`.
		 */
		height: { attribute: false, type: Number, default: 2, cssVar: true },

		/**
		 * Позиция по горизонтали (старт столбца).
		 * Отражается в CSS-переменной `--left`.
		 */
		left: { attribute: false, type: Number, default: 0, cssVar: true },

		/**
		 * Позиция по вертикали (старт строки).
		 * Отражается в CSS-переменной `--top`.
		 */
		top: { attribute: false, type: Number, default: 0, cssVar: true },
	};

	/**
	 * CSS-стили компонента, применяемые к теневому DOM.
	 *
	 * Поддерживает:
	 * - Позиционирование в CSS Grid через `--width`, `--height`, `--left`, `--top`
	 *
	 * @static
	 * @type {string}
	 */
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

	/**
	 * Создаёт экземпляр BuiNumber.
	 * Вызывает конструктор родительского класса.
	 */
	constructor() {
		super();

	}

	/**
	 * Возвращает HTML-шаблон компонента.
	 *
	 * @returns {string}
	 */
	template() {
		return `
			<slot></slot>
		`;
	}

}

// Регистрация элемента с автоматическим именем
BuiSticker.register();