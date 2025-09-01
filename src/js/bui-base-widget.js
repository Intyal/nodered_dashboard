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
	updatingCustomVariables(cssProperties, values) {
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

const mathUtilities = {
	/**
	 * Проверяет, находится ли число в указанном диапазоне.
	 * @param {number} num - Число для проверки.
	 * @param {number} min - Минимальное значение диапазона.
	 * @param {number} max - Максимальное значение диапазона.
	 * @param {boolean} [inclusive=true] - Включать ли границы диапазона в проверку.
	 * @returns {boolean} - `true`, если число попадает в диапазон, иначе `false`.
	 * 
	 * @example
	 * isInRange(5, 1, 10); // true
	 * isInRange(5, 10, 1); // true (диапазон автоматически корректируется)
	 * isInRange(5, 6, 10, false); // false
	 */
	isInRange: function(num, min, max, inclusive = true) {
		const lower = Math.min(min, max);
		const upper = Math.max(min, max);
		const compareLower = inclusive ? '>=' : '>';
		const compareUpper = inclusive ? '<=' : '<';
		
		return eval(`num ${compareLower} ${lower} && num ${compareUpper} ${upper}`);
	},
	/**
	 * Линейное преобразование значения из одного диапазона в другой.
	 * @param {number} value - Входное значение для преобразования.
	 * @param {number} inMin - Минимальное значение исходного диапазона.
	 * @param {number} inMax - Максимальное значение исходного диапазона.
	 * @param {number} outMin - Минимальное значение целевого диапазона.
	 * @param {number} outMax - Максимальное значение целевого диапазона.
	 * @returns {number} - Преобразованное значение в новом диапазоне.
	 * @throws {Error} - Если входной диапазон имеет нулевую длину (inMin === inMax).
	 * 
	 * @example
	 * // Преобразование 25°C в °F (используя формулу °F = °C * 9/5 + 32)
	 * mapRange(25, 0, 100, 32, 212); // 77
	 * 
	 * // Нормализация значения 0.75 в диапазон [0, 100]
	 * mapRange(0.75, 0, 1, 0, 100); // 75
	 */
	mapRange: function(value, inMin, inMax, outMin, outMax) {
		// Проверка на деление на ноль
		if (inMin === inMax) {
			throw new Error("Входной диапазон не может быть нулевым (inMin === inMax)");
		}
		// Вычисляем процент значения value относительно входного диапазона
		const percent = (value - inMin) / (inMax - inMin);
		
		// Применяем этот процент к выходному диапазону
		return outMin + (outMax - outMin) * percent;
	},
};

const colorUtilities = {
	/**
	 * Проверяет, является ли переданное значение допустимым CSS-цветом.
	 * @param {string} color - Цвет в виде строки (hex, rgb, rgba и т.д.).
	 * @returns {string|undefined} - Возвращает исходный цвет, если он валиден, иначе `undefined`.
	 * 
	 * @example
	 * colorIsValid("#ff0000"); // "#ff0000"
	 * colorIsValid("red"); // "red"
	 * colorIsValid("invalid-color"); // undefined
	 * 
	 * @note Метод использует встроенную логику браузера для проверки цвета через объект стилей.
	 */
	colorIsValid: function(color) {
		let style = new Option().style;
		style.color = color;
		if (style.color == color.toLowerCase())
			return color;
		else
			return undefined;
	},
	/**
	 * Преобразует цвет в строку формата RGB/RGBA.
	 * @param {string} color - Цвет в любом допустимом CSS-формате (hex, rgb, rgba, название цвета и т.д.).
	 * @returns {string} - Строка в формате `rgb(R, G, B)` или `rgba(R, G, B, A)`, представляющая переданный цвет.
	 * 
	 * @example
	 * colorToRgb("#ff0000"); // "rgb(255, 0, 0)"
	 * colorToRgb("rgba(0, 255, 0, 0.5)"); // "rgba(0, 255, 0, 0.5)"
	 * colorToRgb("blue"); // "rgb(0, 0, 255)"
	 * 
	 * @note Функция временно добавляет элемент `<div>` в DOM для получения вычисленного цвета через `getComputedStyle`.
	 *       Элемент автоматически удаляется после выполнения.
	 */
	colorToRgb: function(color) {
		const div = document.createElement('div');
		div.style.color = color;
		document.body.appendChild(div);
		const style = window.getComputedStyle(div);
		const rgbValue = style.color;
		document.body.removeChild(div);
		
		return rgbValue;
	},
	/**
	 * Преобразует цвет из формата RGB в HSL ( Hue, Saturation, Lightness ).
	 * @param {string} rgb - Строка в формате `rgb(R, G, B)`, где R, G, B — целые числа от 0 до 255.
	 * @returns {Object} - Объект с полями:
	 *   - `h` (hue) — оттенок в градусах (0–360),
	 *   - `s` (saturation) — насыщенность в процентах (0–100),
	 *   - `l` (lightness) — светлота в процентах (0–100).
	 * 
	 * @example
	 * rgbToHsl("rgb(255, 0, 0)"); // { h: 0, s: 100, l: 50 }
	 * rgbToHsl("rgb(0, 255, 0)"); // { h: 120, s: 100, l: 50 }
	 * rgbToHsl("rgb(0, 0, 255)"); // { h: 240, s: 100, l: 50 }
	 * 
	 * @note Если все компоненты RGB равны (например, серый цвет), то насыщенность (`s`) и оттенок (`h`) равны 0.
	 *       Алгоритм основан на стандартном преобразовании RGB→HSL.
	 */
	rgbToHsl: function(rgb) {
		let r = parseInt(rgb.slice(4, -1).split(',')[0]) / 255;
		let g = parseInt(rgb.slice(4, -1).split(',')[1]) / 255;
		let b = parseInt(rgb.slice(4, -1).split(',')[2]) / 255;

		let max = Math.max(r, g, b),
			min = Math.min(r, g, b);
		let h, s, l = (max + min) / 2;

		if (max === min) {
			h = s = 0; // achromatic
		} else {
			var d = max - min;
			s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

			switch (max) {
				case r: h = (g - b) / d + (g < b ? 6 : 0); break;
				case g: h = (b - r) / d + 2; break;
				case b: h = (r - g) / d + 4; break;
			}
			h /= 6;
		}

		return { h: h * 360, s: s * 100, l: l * 100 };
	},
};

export { colorUtilities, mathUtilities };