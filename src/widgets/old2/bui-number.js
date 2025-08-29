import { html } from '../lit-html.js';
import { WidgetBase } from "./WidgetBase.js";

class BuiNumber extends WidgetBase {

	/**
	 * Конфигурация реактивных свойств компонента.
	 * Определяет тип, атрибут, поведение и стилизацию.
	 *
	 * @static
	 */
	static properties = {
		// Размер в сетке. Переопределяет свойства width и height.
		size: {	type: String, noRender: true, parser: (value) => value.split(' ').map(Number) },
		// Позиция в сетке. Переопределяет свойства left и top.
		position: {	type: String, noRender: true, parser: (value) => value.split(' ').map(Number) },
		// Позиция по горизонтали (старт столбца). Отражается в CSS-переменной `--left`.
		left: { watched: false, type: Number, cssVar: true, noRender: true },
		// Ширина ячейки в единицах сетки. Отражается в CSS-переменной `--width`.
		width: { watched: false, type: Number, cssVar: true, noRender: true },
		// Позиция по вертикали (старт строки). Отражается в CSS-переменной `--top`.
		top: { watched: false, type: Number, cssVar: true, noRender: true },
		// Высота ячейки в единицах сетки. Отражается в CSS-переменной `--height`.
		height: { watched: false, type: Number, cssVar: true, noRender: true },
		// Число для отображения.
		value: { type: Number, reflect: true },
		// Количество знаков после запятой при отображении.
		fixed: { type: Number, reflect: true },
		// Примеры parser
		/*
		example: {
			// parser — это функция, которая преобразует строку из HTML-атрибута в нужный тип данных при установке свойства.
			// Автоматически (по умолчанию)
			type: Number,
			// parser, если нужна не стандартная логика
			parser: (value) => {
				const n = Number(value);
				return isNaN(n) ? 1 : n;
			},
			// parser с доступом к this
			parser: function(value) {
				// this — экземпляр компонента
				const unit = this.unit || 'px';
				return value + unit;
			},
			// parser для даты с поддержкой локализации
			// <my-event date="05.04.2025"></my-event>
			// → this.date → 5 апреля 2025
			parser: createDateParser('ru'), // или this.lang, если динамически
			// parser для объекта с валидацией и дефолтами
			// <my-widget config='{"theme": "dark", "size": "small", "unknown": "field"}'></my-widget>
			// → this.config → { theme: 'dark', size: 'small', showIcon: true }
			parser: createValidatedObjectParser(
				{ theme: 'light', size: 'medium', showIcon: true },
				{ theme: ['light', 'dark', 'blue'], size: ['small', 'medium', 'large'] }
			),
		},
		// Примеры converter
		example: {
			reflect: true,
			// converter — это функция, которая преобразует значение из JavaScript в строку, когда оно устанавливается в HTML-атрибут.
			// Автоматически (по умолчанию)
			type: Number,
			// converter, если нужна не стандартная логика
			// this.tags = ['news', 'tech']; → атрибут: tags="news,tech"
			converter: (value) => value.join(','),
			// this.size = 24; → атрибут: size="24px"
			converter: (value) => `${value}px`,
			// this.theme = 'dark'; → атрибут: theme="theme-dark"
			converter: (value) => `theme-${value}`,
			// converter с доступом к this
			// this.unit = 'rem';
			// this.value = 1.5; → атрибут: value="1.5rem"
			converter: function(value) {
				// this — экземпляр компонента
				return this.unit ? `${value}${this.unit}` : String(value);
			}
			
		},
		*/
	};

	/**
	 * CSS-стили компонента, применяемые к теневому DOM.
	 *
	 * Поддерживает:
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

	constructor() {
		super();

		//this.debug = true;

		// Инициализация свойств компонента значениями по умолчанию.
		this.position = '0 0';
		this.size = '1 1';
		this.value = 0;
		this.fixed = 2;
		//
		this.fixedValue = 0; // Значение, которое будет отображено.
	}

	// Отрисовывает шаблон с помощью lit-html.
	render() {
		return html`
			${this.fixedValue}
		`;
	}

	// Хук, вызываемый после обновления свойства (при `noRender: true`). Не вызывает render(), не обновляет DOM.
	afterPropertyUpdate(key, newValue, oldValue) {
		if (key === 'size') {
			[this.width, this.height] = this.size;
		}
		if (key === 'position') {
			[this.left, this.top] = this.position;
		}
	}

	// Хук: вызывается перед рендером.
	beforeUpdate(changedProperties) {
		// Метод .every() (для "все"), .some() (для "хотя бы один"):
		if (['value', 'fixed'].some(key => changedProperties.has(key))) {
			let fixedValue = Number(this.value);
			if (this.fixed != null) {
				fixedValue = fixedValue.toFixed(Number(this.fixed));
			}
			this.fixedValue = fixedValue;
		}
	}

	// Хук: вызывается при первом рендере.
	firstUpdated() {

	}

	// Хук: вызывается после рендера.
	afterUpdate(changedProperties) {

	}

	// Жизненный цикл: при добавлении в DOM.
	onMounted() {

	}

	// Жизненный цикл: при удалении из DOM.
	onUnmounted() {

	}

	// Жизненный цикл: при перемещении между DOM.
	onAdopted() {

	}

}

// Регистрация элемента с автоматическим именем
BuiNumber.register();