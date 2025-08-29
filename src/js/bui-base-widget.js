import { LitElement } from './lit-all.min.js';

export class BUIBaseWidget extends LitElement {
	// Приватные поля для хранения стилей и правила
	#mySheet = new CSSStyleSheet();
	#rule = null;

	constructor() {
		super();

		// Инициализация стилей
		this.#mySheet.replaceSync(':host {}');
		this.#rule = this.#mySheet.cssRules[0]?.style || null;
	}

	/**
	 * Общий метод для обновления CSS-переменных
	 * @param {Array} values - Массив значений (числа или строки)
	 * @param {Array} cssProperties - Массив CSS-свойств (например, ['--width', '--height'])
	 */
	updatingCustomVariables(values, cssProperties) {
		if (!Array.isArray(values) || !Array.isArray(cssProperties)) {
			throw new TypeError('Значение должно быть массивом');
		}

		// Проверка типов элементов массива
		for (const val of values) {
			if (typeof val !== 'number' && typeof val !== 'string') {
				throw new TypeError('Элементы массива должны быть числами или строками');
			}
		}

		if (this.#rule) {
			// Сопоставление значений с CSS-свойствами
			for (let i = 0; i < Math.min(values.length, cssProperties.length); i++) {
				const value = values[i];
				const property = cssProperties[i];

				// Сохраняем значение в экземпляре класса
				//this[`_${property.replace('--', '')}`] = value;

				this.#rule.setProperty(property, `${value}`);
			}
		}
	}

	isInRange(num, min, max, inclusive = true) {
		const lower = Math.min(min, max);
		const upper = Math.max(min, max);
		const compareLower = inclusive ? '>=' : '>';
		const compareUpper = inclusive ? '<=' : '<';
		
		return eval(`num ${compareLower} ${lower} && num ${compareUpper} ${upper}`);
	}
	

	/**
	 * Подключение стилей к shadowRoot
	 */
	connectedCallback() {
		super.connectedCallback(); // Вызов родительского метода LitElement

		if (this.shadowRoot) {
			this.shadowRoot.adoptedStyleSheets = [
				...this.shadowRoot.adoptedStyleSheets,
				this.#mySheet
			];
		}
	}

	// Линейное преобразование
	mapRange(value, inMin, inMax, outMin, outMax) {
		// Проверка на деление на ноль
		if (inMin === inMax) {
			throw new Error("Входной диапазон не может быть нулевым (inMin === inMax)");
		}
		// Вычисляем процент значения value относительно входного диапазона
		const percent = (value - inMin) / (inMax - inMin);
		
		// Применяем этот процент к выходному диапазону
		return outMin + (outMax - outMin) * percent;
	}
    
    /**
     * Находит первый элемент в shadow DOM
     * @param {string} selector
     * @returns {Element|null}
     */
	$(selector) {
		try {
			return this.shadowRoot?.querySelector(selector) || null;
		} catch (e) {
			return null;
		}
	}

    /**
     * Находит все элементы в shadow DOM
     * @param {string} selector
     * @returns {NodeList}
     */
	$$(selector) {
		try {
			return this.shadowRoot?.querySelectorAll(selector) || [];
		} catch (e) {
			return [];
		}
	}
}
