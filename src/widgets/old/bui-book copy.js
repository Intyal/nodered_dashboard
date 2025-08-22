import { WidgetBase } from "./WidgetBase.js";

/**
 * Кастомный элемент отображения Книги.
 *
 * Элемент содержит страницы, поддерживает:
 * - 
 *
 * @example
 * <bui-book id="bui_book" tab-style="bottom"></bui-book>
 *
 * @extends {WidgetBase}
 */
class BuiBook extends WidgetBase {
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
			min-height: 100vh;
			max-height: 100vh;
			min-width: 100vw;
			max-width: 100vw;
			display: flex;
			flex-direction: column-reverse;
			align-items: normal;
			gap: 0px;
		}
		.bookmarks_group {
			flex-grow: 0;
		}
		.pages_group {
			flex-grow: 1;
		}
  `;

	/**
	 * Создаёт экземпляр BuiBook.
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
		<div class="bookmarks_group">
			<slot name="bookmarks" id="bookmarks"></slot>
		</div>
		<div class="pages_group">
			<slot name="pages" id="pages"></slot>
		</div>
	`;
	}

}

// Регистрация элемента с автоматическим именем
BuiBook.register();