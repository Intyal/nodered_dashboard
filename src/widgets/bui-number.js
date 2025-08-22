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
		size: {	type: String, noRender: true },
		// Позиция в сетке. Переопределяет свойства left и top.
		position: {	type: String, noRender: true },
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
	}

	// Отрисовывает шаблон с помощью lit-html.
	render() {
		//console.log(`${this.constructor.name}: рендер.`);

		return html`
			${this.value}
		`;
	}

	// Хук, вызываемый после обновления свойства.
	afterPropertyUpdate(key, newValue, oldValue) {
		//console.log(`${this.constructor.name}: изменено свойство без рендеринга.`);

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

	// Хук: вызывается перед рендером.
	beforeUpdate(changedProperties) {
		//console.log(`${this.constructor.name}: перед рендером.`);
	}

	// Хук: вызывается при первом рендере.
	firstUpdated() {
		//console.log(`${this.constructor.name}: первый рендер.`);
	}

	// Хук: вызывается после рендера.
	afterUpdate(changedProperties) {
		//console.log(`${this.constructor.name}: после рендера.`);
	}

	// Жизненный цикл: при добавлении в DOM.
	onMounted() {
		//console.log(`${this.constructor.name}: добавлен в DOM.`);
	}

	// Жизненный цикл: при удалении из DOM.
	onUnmounted() {
		//console.log(`${this.constructor.name}: удалён из DOM.`);
	}

	// Жизненный цикл: при перемещении между DOM.
	onAdopted() {
		//console.log(`${this.constructor.name}: перемещён.`);
	}

}

// Регистрация элемента с автоматическим именем
BuiNumber.register();