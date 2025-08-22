/**
 * Базовый класс для создания кастомных элементов с реактивными свойствами.
 * Предоставляет механизм синхронизации атрибутов, свойств, стилей и обновлений.
 *
 * @abstract
 * @extends HTMLElement
 */
export class WidgetBase extends HTMLElement {
	/**
	 * Объект, определяющий свойства компонента.
	 * Ключ — имя свойства, значение — конфигурация.
	 *
	 * @example
	 * static properties = {
	 *   minValue: { attribute: 'min-value', type: Number, watched: true },
	 *   count: { type: Number, default: 0 }
	 * };
	 *
	 * @type {Object<string, {
	 *   type?: Function,
	 *   attribute?: any,
	 *   cssVar?: boolean,
	 *   watched?: boolean,
	 *   default?: any
	 * }>}
	 */
	static properties = {};

	/**
	 * Регистрирует кастомный элемент с автоматическим именем на основе имени класса.
	 *
	 * @param {string} [tagName=''] - Имя тега для регистрации. Если не указано, генерируется из имени класса.
	 * @returns {string} Зарегистрированное имя тега.
	 * @throws {Error} Если имя тега не содержит дефис.
	 * @static
	 */
	static register(tagName = '') {
		const name = tagName || this.name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
		if (!name.includes('-')) {
		  throw new Error(`Имя тега "${name}" должно содержать дефис.`);
		}
		if (customElements.get(name)) {
		  console.warn(`Компонент "${name}" уже зарегистрирован.`);
		  return name;
		}
		customElements.define(name, this);
		return name;
	  }

	/**
	 * Возвращает массив имён атрибутов, за изменениями которых нужно наблюдать (`watched` равно `true`).
	 *
	 * @static
	 * @returns {string[]} Список имён атрибутов для отслеживания.
	 */
	static get observedAttributes() {
		const attr = [];
		for (const [key, config] of Object.entries(this._getModifiedProperties())) {
			if (config.watched) {
				attr.push(config.attribute);
			}
		}
		return attr;
	}

	/**
	 * Возвращает модифицированную копию статического объекта `properties` с установкой не указанных свойств по умолчанию.
	 *
	 * @static
	 * @private
	 * @returns {Object} Объект свойств с заполненными конфигурациями.
	 */
	static _getModifiedProperties() {
		return Object.entries(this.properties || {}).reduce((acc, [key, config]) => {
			// Если `attribute` равно `false`, то атрибут не будет отслеживаться (`watched` = `false`)
			let isWatched = true;
			if (config.attribute === false) isWatched = false;

			acc[key] = {
				attribute: key,
				type: String,
				cssVar: false,
				watched: isWatched,
				...config,
			};
			return acc;
		}, {});
	}

	/**
	 * Конструктор класса. Инициализирует теневой DOM, свойства, стили и аксессоры.
	 */
	constructor() {
		super();
		
		/** @private */
		this._shadowRoot = this.attachShadow({ mode: 'open' });
		/** @private */
		this._properties = this.constructor._getModifiedProperties();
		/** @private */
		this._styles = new CSSStyleSheet();
		/** @private */
		this._stylesUser = new CSSStyleSheet();
		/** @private */
		this._state = {};

		// Применяем стили к теневому DOM.
		this._applyStyles();
		// Устанавливаеи значения свойств по умолчанию.
		this._setStateDefault();
		// Создаёт геттеры и сеттеры для каждого свойства.
		this._createAccessors();
	}

	/**
	 * Устанавливает значения по умолчанию из конфигурации свойств в внутреннее состояние.
	 *
	 * @private
	 */
	_setStateDefault() {
		for (const [key, config] of Object.entries(this._properties)) {
			if (config.hasOwnProperty('default')) {
				this._state[key] = config.default;
				this._updateStyleProperty(key, config.attribute ? config.attribute : key, config.default);
			}
		}
	}

	/**
	 * Создаёт геттеры и сеттеры для каждого свойства, обеспечивая реактивность.
	 *
	 * @private
	 */
	_createAccessors() {
		for (const [key, config] of Object.entries(this._properties)) {
			Object.defineProperty(this, key, {
				get() {
					return this._state[key];
				},
				set(value) {					
					// Приведение к типу
					let newValue = config.type ? config.type(value) : value;

					// Применяем converter, если есть, и передаём `this` как контекст
					if (typeof config.converter === 'function') {
						newValue = config.converter.call(this, newValue);
					}
			  
					const oldValue = this._state[key];

					if (newValue === oldValue) return;

					this._state[key] = newValue;

					// Обновляем атрибут
					this._updateAttribute(config.attribute, newValue);	
					// Обновляем CSS-переменную (кастомное свойство)
					this._updateStyleProperty(key, config.attribute ? config.attribute : key, newValue);
					// Вызываем пользовательский обработчик
					this._onPropertyChanged(key, newValue, oldValue);
				},
				enumerable: true,
				configurable: true,
			});
		}
	}

	/**
	 * Применяет базовый стиль и кастомные свойства к теневому DOM.
	 *
	 * @private
	 */
	_applyStyles() {
		this._styles.replaceSync(this.constructor.styles || '');
		this._stylesUser.replaceSync(':host {}');
		this._shadowRoot.adoptedStyleSheets = [this._styles, this._stylesUser];
	}

	/**
	 * Обновляет значение атрибута в DOM, если свойство `attribute` не `false`.
	 * Для объектов и массивов используется JSON.stringify.
	 *
	 * @private
	 * @param {string} key - Имя атрибута.
	 * @param {any} value - Новое значение.
	 */
	_updateAttribute(key, value) {
		if (this._properties[key]?.attribute === false) return;

		if (value === null || value === undefined) {
			this.removeAttribute(key);
		} else {
			const strValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
			this.setAttribute(key, strValue);
		}
	}

	/**
	 * Обновляет CSS-переменную (кастомное свойство), если свойство `cssVar` равно `true`.
	 *
	 * @private
	 * @param {string} key - Имя свойства.
	 * @param {string} attr - Имя атрибута (используется как имя CSS-переменной).
	 * @param {any} value - Новое значение.
	 */
	_updateStyleProperty(key, attr, value) {
		if (this._properties[key]?.cssVar === false) return;

		const rule = this._stylesUser.cssRules[0];
		if (rule) {
			rule.style.setProperty(`--${attr}`, value);
		}
	}

	/**
	 * Вызывается при изменении свойства. Делегирует обработку методу `update`.
	 *
	 * @protected
	 * @param {string} key - Имя изменённого свойства.
	 * @param {any} newValue - Новое значение.
	 * @param {any} oldValue - Старое значение.
	 */
	_onPropertyChanged(key, newValue, oldValue) {
		requestAnimationFrame(() => {
			// Здесь атрибуты и свойства уже обновлены
			this.update(key, newValue, oldValue);
		});
	}

	/**
	 * Отрисовывает HTML-содержимое в теневом DOM с помощью шаблона.
	 *
	 * @protected
	 */
	_render() {
		this._shadowRoot.innerHTML = this.template();
	}

	/**
	 * Абстрактный метод для генерации HTML-шаблона компонента.
	 * Должен быть переопределён в дочерних классах.
	 *
	 * @abstract
	 * @returns {string} HTML-разметка компонента.
	 */
	template() {
		return '';
	}

	/**
	 * Абстрактный метод, вызываемый при изменении свойства.
	 * Может использоваться для реактивного поведения, перерисовки и т.д.
	 *
	 * @abstract
	 * @param {string} key - Имя свойства.
	 * @param {any} newValue - Новое значение.
	 * @param {any} oldValue - Старое значение.
	 */
	update(key, newValue, oldValue) { }

	/**
	 * Колбэк, вызываемый при изменении наблюдаемого атрибута.
	 * Синхронизирует значение атрибута со свойством компонента.
	 *
	 * @param {string} name - Имя атрибута.
	 * @param {string} oldValue - Старое значение атрибута.
	 * @param {string} newValue - Новое значение атрибута.
	 */
	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) return;

		for (const [key, config] of Object.entries(this._properties)) {
			if (config.attribute === name) {
				this[key] = newValue;
				return;
			}
		}
	}

	/**
	 * Жизненный цикл: вызывается при добавлении элемента в DOM.
	 * Выполняет рендеринг и вызывает обработчик монтирования.
	 */
	connectedCallback() {
		this._render();
		this.onMounted();
	}

	/**
	 * Жизненный цикл: вызывается при удалении элемента из DOM.
	 * Вызывает обработчик размонтирования.
	 */
	disconnectedCallback() {
		this.onUnmounted();
	}

	/**
	 * Обработчик, вызываемый после монтирования компонента.
	 *
	 */
	onMounted() { }

	/**
	 * Обработчик, вызываемый перед размонтированием компонента.
	 *
	 */
	onUnmounted() { }

	/**
	 * @param {any} selector
	 */
	$(selector) {
		return this._shadowRoot.querySelector(selector);
	}
	/**
	 * @param {any} selector
	 */
	$$(selector) {
		return this._shadowRoot.querySelectorAll(selector);
	}
	$$$() {
		return this._shadowRoot;
	}

}