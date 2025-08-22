import { WidgetBase } from "./WidgetBase.js";

/**
 * Кастомный элемент отображения страницы.
 *
 * Элемент отображает страницу, на которую выводятся остальные виджеты, поддерживает:
 * - Размер сетки по горизонтали
 *
 * @example
 * <bui-page slot="pages" id="page0" role="page" class="panel-background-cell" number-cells="20" active></bui-page>
 *
 * @extends {WidgetBase}
 */
class BuiPage extends WidgetBase {
	/**
	 * Конфигурация реактивных свойств компонента.
	 * Определяет тип, атрибут, поведение и стилизацию.
	 *
	 * @static
	 */
	static properties = {
		/**
		 * Количество ячейки на странице по горизонтали.
		 * Отражается в CSS-переменной `--number-cells`.
		 */
		numberOfCells: { attribute: 'number-cells', type: Number, default: 20, cssVar: true },
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
			display: none;
			width: 100%;
			font-size: var(--page-atom-size);
			font-family: var(--bui-font-family);
			font-weight: 200;
			letter-spacing: -0.1em;
			/*height: 100vh;*/
		}
		:host([active]) {
			display: block;
		}
		#page {
			--bui-background-cell-size: calc(100dvmin / var(--number-cells));
			--bui-background-cell-height-count: 5;
			
			display: grid;
			grid-auto-flow: row;
			grid-template-columns: repeat(auto-fill, var(--bui-background-cell-size));
			grid-template-rows: repeat(var(--bui-background-cell-height-count), var(--bui-background-cell-size));
			grid-auto-rows: var(--bui-background-cell-size);
			gap: 0px;

			background: var(--bui-page-background-color);
			/*height: 100%;*/
		}
  `;

	/**
	 * Создаёт экземпляр BuiPage.
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
		<div part="page" id="page">
			<slot></slot>
		</div>
	`;
	}

}

// Регистрация элемента с автоматическим именем
BuiPage.register();