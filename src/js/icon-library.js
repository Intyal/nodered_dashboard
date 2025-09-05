/**
 * Хранилище зарегистрированных библиотек иконок.
 * @type {Map<string, IconLibrary>}
 */
const iconLibraries = new Map();

/**
 * Placeholder-иконка для ошибок
 */
const errorIcon = (() => {
	const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	svg.setAttribute('viewBox', '0 0 24 24');
	svg.setAttribute('width', '24');
	svg.setAttribute('height', '24');
	svg.setAttribute('fill', 'red');

	const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
	text.setAttribute('x', '12');
	text.setAttribute('y', '12');
	text.setAttribute('text-anchor', 'middle');
	text.setAttribute('dominant-baseline', 'middle');
	text.textContent = '?';

	svg.appendChild(text);
	return svg;
})();

/**
 * Класс для работы с библиотекой иконок.
 * Позволяет загружать и манипулировать SVG-иконками.
 */
export class IconLibrary {
	/**
	 * Конструктор класса IconLibrary.
	 * @param {string} name - Название библиотеки.
	 * @param {Object} config - Конфигурация библиотеки.
	 * @param {Function} config.resolver - Функция, возвращающая URL иконки по её имени.
	 * @param {Function} [config.mutator] - Необязательная функция для модификации SVG-элемента.
	 * @param {boolean} [config.spriteSheet=false] - Признак использования спрайт-сборки.
	 */
	constructor(name, config) {
		this.name = name;
		this.resolver = config.resolver;
		this.mutator = typeof config.mutator === 'function' ? config.mutator : ((svg) => svg);
		this.spriteSheet = config.spriteSheet || false;
		this._iconCache = new Map(); // Кэш для уже загруженных иконок
		this._loadingPromises = new Map(); // Кэш для активных загрузок
	}

	/**
	 * Асинхронно загружает иконку из библиотеки.
	 * @param {string} name - Имя иконки.
	 * @returns {Promise<SVGElement>} - Промис с элементом SVG или placeholder-иконкой при ошибке.
	 */
	async getIcon(name) {
		// Проверяем кэш перед загрузкой
		if (this._iconCache.has(name)) {
			return this._iconCache.get(name).cloneNode(true);
		}

		// Проверяем, не загружается ли иконка уже
		if (this._loadingPromises.has(name)) {
			return this._loadingPromises.get(name).then(svg => svg.cloneNode(true));
		}

		// Создаем новый промис для загрузки
		const loadPromise = this._loadIconInternal(name);
		this._loadingPromises.set(name, loadPromise);

		try {
			const svg = await loadPromise;
			// Сохраняем оригинал в кэш
			this._iconCache.set(name, svg);
			// Удаляем из активных загрузок
			this._loadingPromises.delete(name);
			// Возвращаем клон
			return svg.cloneNode(true);
		} catch (error) {
			// Кэшируем и возвращаем placeholder для ошибок
			this._iconCache.set(name, errorIcon.cloneNode(true));
			this._loadingPromises.delete(name);
			console.error(`Ошибка загрузки иконки "${name}" из библиотеки "${this.name}":`, error);
			return errorIcon.cloneNode(true);
		}
	}

	/**
	 * Внутренний метод загрузки иконки
	 * @private
	 */
	async _loadIconInternal(name) {
		try {
			// Получаем URL иконки через резолвер
			const url = this.resolver(name);

			// Загружаем SVG
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(`Не удалось загрузить иконку: ${url} (${response.status})`);
			}

			const svgText = await response.text();
			const parser = new DOMParser();
			const doc = parser.parseFromString(svgText, 'image/svg+xml');
			
			// Проверка на корректность разбора SVG
			if (doc.documentElement.nodeName !== 'svg') {
				throw new Error(`Некорректный SVG-файл: ${url}`);
			}

			let svg = doc.documentElement;

			// Применяем мутатор для кастомизации SVG
			if (typeof this.mutator === 'function') {
				this.mutator(svg);
			}

			return svg;
		} catch (error) {
			throw error;
		}
	}

	/**
	 * Очищает кэш иконок.
	 */
	clearCache() {
		this._iconCache.clear();
		this._loadingPromises.clear();
	}

	/**
	 * Удаляет конкретную иконку из кэша.
	 * @param {string} name - Имя иконки.
	 */
	removeFromCache(name) {
		this._iconCache.delete(name);
		this._loadingPromises.delete(name);
	}
}

/**
 * Регистрирует новую библиотеку иконок.
 * @param {string} name - Название библиотеки.
 * @param {Object} config - Конфигурация библиотеки.
 * @param {Function} config.resolver - Функция для получения URL иконки.
 * @param {Function} [config.mutator] - Необязательная функция для модификации SVG.
 * @param {boolean} [config.spriteSheet=false] - Признак использования спрайт-сборки.
 * @returns {IconLibrary} - Экземпляр зарегистрированной библиотеки.
 * @throws {Error} - Если библиотека с таким именем уже существует.
 */
export function registerIconLibrary(name, config) {
	if (iconLibraries.has(name)) {
		throw new Error(`Библиотека "${name}" уже зарегистрирована. Используйте другое имя.`);
	}

	const library = new IconLibrary(name, config);
	iconLibraries.set(name, library);

	return library;
}

/**
 * Возвращает зарегистрированную библиотеку иконок.
 * @param {string} name - Название библиотеки.
 * @returns {IconLibrary|undefined} - Экземпляр библиотеки или undefined, если не найдена.
 */
export function getIconLibrary(name) {
	return iconLibraries.get(name);
}

/**
 * Проверяет, существует ли библиотека иконок.
 * @param {string} name - Название библиотеки.
 * @returns {boolean} - true, если библиотека зарегистрирована, иначе false.
 */
export function hasIconLibrary(name) {
	return iconLibraries.has(name);
}

/**
 * Удаляет зарегистрированную библиотеку иконок.
 * @param {string} name - Название библиотеки.
 * @returns {boolean} - true, если удаление прошло успешно, иначе false.
 */
export function unregisterIconLibrary(name) {
	return iconLibraries.delete(name);
}

/**
 * Возвращает список всех зарегистрированных библиотек.
 * @returns {string[]} - Массив названий библиотек.
 */
export function getRegisteredLibraries() {
	return Array.from(iconLibraries.keys());
}