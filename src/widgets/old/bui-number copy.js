import { WidgetBase } from "./WidgetBase.js";

/**
 * Кастомный элемент отображения числового значения.
 *
 * Элемент отображает число в виде текста, поддерживает:
 * - Округление до заданного количества знаков (`fixed`)
 * - Синхронизацию с атрибутами (`value`, `min-value`, `width`, `height` и др.)
 * - Позиционирование в сетке через CSS-переменные `--width`, `--height`, `--left`, `--top`
 * - Гибкое форматирование через CSS-переменные (`--color`, `--font-size`, `--justify-content`)
 *
 * @example
 * <bui-number value="3.14159" fixed="2" size="1 1"></bui-number>
 *
 * @extends {WidgetBase}
 */
class BuiNumber extends WidgetBase {
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
		size: { type: String, default: '1 1', converter: function(value) {
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
		width: { attribute: false, type: Number, default: 1, cssVar: true },

		/**
		 * Высота ячейки в единицах сетки.
		 * Отражается в CSS-переменной `--height`.
		 */
		height: { attribute: false, type: Number, default: 1, cssVar: true },

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

		/**
		 * Отображаемое числовое значение.
		 * Не отражается в CSS-переменной, но используется в `update()`.
		 */
		value: { type: Number, default: 0 },

		/**
		 * Количество знаков после запятой при отображении.
		 */
		fixed: { type: Number, default: 2 },
	};

	/**
	 * CSS-стили компонента, применяемые к теневому DOM.
	 *
	 * Поддерживает:
	 * - Позиционирование в CSS Grid через `--width`, `--height`, `--left`, `--top`
	 * - Центрирование содержимого (flex)
	 * - Кастомизацию цвета, размера шрифта и выравнивания через CSS-переменные
	 *
	 * @static
	 * @type {string}
	 */
	static styles = `
    :host {
      grid-column-end: span var(--width);
      grid-row-end: span var(--height);
      grid-column-start: var(--left);
      grid-row-start: var(--top);

      display: flex;
      overflow: hidden;
      justify-content: var(--justify-content, center);
      align-items: center;

      font-size: var(--font-size);
      color: var(--color);
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
		return ``;
	}

	/**
	 * Обрабатывает изменение свойства.
	 *
	 * @param {string} key - Имя изменённого свойства.
	 * @param {any} newValue - Новое значение.
	 * @param {any} oldValue - Старое значение.
	 */
	update(key, newValue, oldValue) {
		//console.log('update', key, newValue, oldValue);
		// Если значение свойств value или fixed изменилось
		if (['value', 'fixed'].includes(key)) {
			let fixedValue = Number(this.value);
			if (this.fixed != null) {
				fixedValue = fixedValue.toFixed(Number(this.fixed));
			}
			this.$$$().innerHTML = `${fixedValue}`;
		}
		// Выделяем свойсва width и height
		if (key === 'size') {
			if (newValue) {
				//this.width = newValue.split(' ').filter(Boolean)[0] || this.getDefaultValue('width');
				//this.height = newValue.split(' ').filter(Boolean)[1] || this.getDefaultValue('height');
			}
		}
		// Выделяем свойсва left и top
		if (key === 'position') {
			const [left, top] = newValue.split(' ').map(Number);
			this.left = left;
			this.top = top;
		}
	}
}

// Регистрация элемента с автоматическим именем
BuiNumber.register();