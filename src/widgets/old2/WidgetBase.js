// src/WidgetBase.js
import { html, render } from '../lit-html.js';

/**
 * Базовый класс для кастомных элементов с поддержкой lit-html и реактивности.
 * Предоставляет хуки жизненного цикла и автоматический рендер.
 */
export class WidgetBase extends HTMLElement {
	/**
	 * Объект свойств компонента.
	 * 
	 * cssVar:	true | DOM → CSS | При изменении свойства — обновить переменную CSS
	 * noRender: true |  | При изменении атрибута/свойства — не вызывать update()
	 * watched: true | DOM → JS | При изменении атрибута — обновить свойство
	 * reflect: true | JS → DOM | При изменении свойства — обновить атрибут
	 *
	 * @type {Object<string, {
	 *   type?: Function,
	 *   attribute?: string,
	 *   cssVar?: boolean,
	 *   watched?: boolean,
	 *   reflect?: boolean,
	 *   noRender?: boolean,
	 *   parser?: (value: string) => any,
	 *   converter?: (value: any) => string
	 * }>}
	 */
	static properties = {};

	/**
	 * Режим теневого DOM: 'open' или 'closed'.
	 * @type {'open'|'closed'}
	 * @static
	 */
	static shadowMode = 'open';

	/**
	 * Автоматическая регистрация при подключении.
	 * @type {boolean}
	 * @static
	 */
	static autoRegister = false;

	/**
	 * Стили компонента. Может быть строкой или функцией.
	 * @type {string|function(): string}
	 * @static
	 */
	static styles = '';

	/**
	 * Кэш стилей на уровне класса.
	 * @private
	 * @static
	 */
	static _sharedStyles = new WeakMap();

	/**
	 * Регистрирует компонент с автоматическим именованием.
	 *
	 * @param {string} [tagName='']
	 * @returns {string}
	 */
	static register(tagName = '') {
		const name = tagName || this.name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
		console.log(`Компонент "${name}" зарегистрирован.`);
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
	 * Возвращает атрибуты для отслеживания.
	 * @static
	 * @returns {string[]}
	 */
	static get observedAttributes() {
		return Object.entries(this._getModifiedProperties())
			.filter(([, config]) => config.watched)
			.map(([, config]) => config.attribute);
	}

	/**
	 * Возвращает нормализованную конфигурацию свойств с автоматическими parser и converter.
	 * Если parser/converter не заданы вручную — используются встроенные по типу.
	 *
	 * Поддерживаемые типы: String, Number, Boolean, Array, Object, Date.
	 *
	 * @private
	 * @static
	 * @returns {Object<string, PropertyConfig>}
	 */
	static _getModifiedProperties() {
		const props = this.properties || {};
		const result = {};

		// Встроенные парсеры: строка → нужный тип
		const defaultParsers = {
			String: (value) => (value === null ? '' : String(value)),
			Number: (value) => {
				const n = Number(value);
				return isNaN(n) ? 0 : n;
			},
			Boolean: (value) => {
				// Если значение уже булево — возвращаем его
				if (typeof value === 'boolean') return value;
				// Если строка
				if (typeof value === 'string') {
					if (value === 'false' || value === '0') return false;
					if (value === 'true' || value === '1' || value === '') return true;
					return true; // любая непустая строка — true
				}
				// Если null/undefined
				if (value == null) return false;
				// Остальные: 0 → false, всё остальное → true
				return !!value;
			},
			Array: (value) => {
				if (Array.isArray(value)) return value;
				try {
					return value === null || value === '' ? [] : JSON.parse(value);
				} catch (e) {
					console.warn(`[WidgetBase] Не удалось распарсить массив: ${value}`, e);
					return [];
				}
			},
			Object: (value) => {
				if (Object.prototype.toString.call(obj).slice(8, -1) === 'Object') return value;
				try {
					return value === null || value === '' ? {} : JSON.parse(value);
				} catch (e) {
					console.warn(`[WidgetBase] Не удалось распарсить объект: ${value}`, e);
					return {};
				}
			},
			Date: (value) => {
				if (Object.prototype.toString.call(obj).slice(8, -1) === 'Date') return value;
				try {
					return value ? new Date(value) : new Date();
				} catch (e) {
					console.warn(`[WidgetBase] Неверный формат даты: ${value}`, e);
					return new Date();
				}
			}
		};

		// Встроенные конвертеры: значение → строка (для атрибута)
		const defaultConverters = {
			String: (value) => value,
			Number: (value) => String(value),
			Boolean: (value) => (value ? '' : null), // true → атрибут есть, false → удалить
			Array: (value) => JSON.stringify(value),
			Object: (value) => JSON.stringify(value),
			Date: (value) => (value instanceof Date ? value.toISOString() : ''),
		};

		for (const [key, config] of Object.entries(props)) {
			const attribute = config.attribute === false ? false : (config.attribute || key);

			// Определяем type (по умолчанию String)
			const type = config.type || String;

			// Автоматические parser и converter по имени типа
			const parser = config.parser || (type && defaultParsers[type.name]);
			const converter = config.converter || (type && defaultConverters[type.name]);

			result[key] = {
				// Значения по умолчанию
				type,
				attribute,
				cssVar: false,
				noRender: false,
				watched: attribute !== false,
				reflect: false,
				// Пользовательская конфигурация (переопределяет defaults)
				...config,
				// Устанавливаем parser и converter (включая автоматические)
				parser,
				converter,
			};
		}

		return result;
	}

	constructor() {
		super();

		this.debug = false;

		this._shadowRoot = this.attachShadow({ mode: this.constructor.shadowMode });
		this._properties = this.constructor._getModifiedProperties();
		this._state = {};
		this._stylesUser = new CSSStyleSheet();
		this._stylesUser.replaceSync(':host {}');
		this._updatePending = false;
		this._updateDebounce = null;
		this._pendingChanges = new Map();
		this._hasRendered = false;
		this._hasFirstUpdated = false;

		this._applyStyles();
		this._createAccessors();
	}

	/**
	 * Внутренний метод для отладочного логирования.
	 * Выводит сообщение, только если debug = true.
	 *
	 * @param {string} message - Сообщение
	 * @param {...any} data - Дополнительные данные
	 * @private
	 */
	_debug(message, ...data) {
		if (this.debug) {
			console.groupCollapsed(
				`%c[.debugLine ] %c${this.localName} #${this.id ? this.id : '?'} %c${message}`,
				'color: #999; font-size: 0.8em;',
				'color: #4285f4; font-weight: bold;',
				'color: #777;'
			);
			console.log('Component:', this);
			if (data.length > 0) console.log('Data:', ...data);
			console.groupEnd();
		}
	}

	/**
	 * Создаёт реактивные геттеры/сеттеры.
	 * @private
	 */
	_createAccessors() {
		for (const [key, config] of Object.entries(this._properties)) {
			Object.defineProperty(this, key, {
				get() { return this._state[key]; },
				set(value) {
					let newValue;

					// Если есть пользовательское преобразование
					if (typeof config.parser === 'function') {
						newValue = config.parser.call(this, value);
					} else if (typeof config.type === 'function') {
						newValue = config.type(value);
					} else {
						newValue = value;
					}

					const oldValue = this._state[key];
					if (newValue === oldValue) return;

					this._state[key] = newValue;

					// Обновление атрибута в DOM
					if (config.reflect) {
						let converterValue = newValue;
						// Если есть пользовательское преобразование
						if (typeof config.converter === 'function') {
							converterValue = config.converter.call(this, newValue);
						}
						this._updateAttribute(config.attribute, converterValue);
					}

					// Обновление CSS-переменной
					if (config.cssVar && config.attribute !== false) {
						this._updateStyleProperty(key, config.attribute, newValue);
					}

					// Обновление элемента в DOM
					this._onPropertyChanged(key, newValue, oldValue);
				},
				enumerable: true,
				configurable: true
			});
		}
	}

	/**
	 * Применяет статические стили (кэшируются на классе).
	 * @private
	 */
	_applyStyles() {
		const Ctor = this.constructor;
		let sheets = WidgetBase._sharedStyles.get(Ctor);

		if (!sheets) {
			const styles = typeof Ctor.styles === 'function'
				? Ctor.styles.call(this)
				: (Ctor.styles || '');

			const styleArray = Array.isArray(styles) ? styles : [styles];
			sheets = styleArray.map(style => {
				const sheet = new CSSStyleSheet();
				const styleContent = typeof style === 'function' ? style.call(this) : style;
				sheet.replaceSync(styleContent || '');
				return sheet;
			});
			WidgetBase._sharedStyles.set(Ctor, sheets);
		}

		this._shadowRoot.adoptedStyleSheets = [...sheets, this._stylesUser];
	}

	/**
	 * Обновляет атрибут
	 * @private
	 */
	_updateAttribute(attr, value) {
		if (attr === false) return;
		if (value == null) {
			this.removeAttribute(attr);
		} else {
			let strValue;
			try {
				strValue = typeof value === 'object'
					? JSON.stringify(value, (k, v) => v === this ? '<self>' : v)
					: String(value);
			} catch (e) {
				strValue = 'invalid';
			}
			this.setAttribute(attr, strValue);
		}
	}

	/**
	 * Обновляет CSS-переменную.
	 * @private
	 */
	_updateStyleProperty(key, attr, value) {
		if (this._properties[key]?.cssVar && attr !== false) {
			const rule = this._stylesUser.cssRules[0];
			if (rule) {
				rule.style.setProperty(`--${attr}`, value);
			}
		}
	}

	/**
	 * Добавляет изменение в очередь.
	 * @private
	 */
	_onPropertyChanged(key, newValue, oldValue) {
		this._debug('Property changed', { key, oldValue, newValue });

		const config = this._properties[key];

		// Если noRender — обновляем всё, кроме рендера
		if (config.noRender) {
			this._debug('→ noRender: true → update skipped');
			this.afterPropertyUpdate(key, newValue, oldValue);
			return;
		}

		this._pendingChanges.set(key, { newValue, oldValue });

		// Обычное поведение: буферизация и рендер
		if (!this._updatePending) {
			this._debug('→ Scheduling update...');
			this._updatePending = true;
            
            // Отменяем предыдущий запрос анимации, если есть
            if (this._updateDebounce) {
                cancelAnimationFrame(this._updateDebounce);
            }
            
            // Используем requestAnimationFrame для визуальных обновлений
            this._updateDebounce = requestAnimationFrame(() => {
                this._performUpdate();
            });
        }
    }

    /**
     * Выполняет обновление компонента.
     * @private
     */
    _performUpdate() {
		this._updatePending = false;
		this._updateDebounce = null;
		const changes = new Map(this._pendingChanges);
		this._pendingChanges.clear();
		this._debug('→ Running update', { changes: [...changes.keys()] });
		this.update(changes);
	}

	/**
	 * Основной метод обновления. Вызывается при изменении свойств.
	 * Автоматически вызывает:
	 * 1. beforeUpdate() — до рендера
	 * 2. _render() — отрисовка
	 * 3. afterUpdate() — после рендера
	 *
	 * @param {Map<string, { newValue: any, oldValue: any }>} changedProperties
	 * @protected
	 */
	update(changedProperties) {
        if (!this.isConnected) {
            this._debug('Skipping update - element disconnected');
            return;
        }

		this._debug('update() called', { changed: [...changedProperties.keys()] });
		this.beforeUpdate(changedProperties);
		this._render();
		this.afterUpdate(changedProperties);
		if (!this._hasFirstUpdated) {
			this.firstUpdated(changedProperties);
			this._hasFirstUpdated = true;
		}
	}

	/**
	 * Хук: вызывается перед рендером.
	 * Используй для:
	 * - подготовки данных
	 * - обновления стилей
	 * - логики, которая должна быть до отрисовки
	 *
	 * @param {Map<string, { newValue: any, oldValue: any }>} changedProperties
	 * @protected
	 */
	beforeUpdate(changedProperties) { }

	/**
	 * Хук: вызывается после рендера.
	 * Используй для:
	 * - работы с DOM (уже обновлён)
	 * - фокусировки, скролла, аналитики
	 * - уведомлений
	 *
	 * @param {Map<string, { newValue: any, oldValue: any }>} changedProperties
	 * @protected
	 */
	afterUpdate(changedProperties) { }

	/**
	 * Хук: вызывается при первом рендере.
	 * Аналогично connectedCallback, но после первого render().
	 * Идеально для инициализации DOM-зависимой логики.
	 *
	 * @param {Map<string, { newValue: any, oldValue: any }>} changedProperties
	 * @protected
	 */
	firstUpdated(changedProperties) { }

	/**
	 * Хук, вызываемый после обновления свойства, **даже если рендеринг был пропущен** (например, при `noRender: true`).
	 * 
	 * Полезен для:
	 * - Логирования изменений
	 * - Отправки аналитики
	 * - Обновления внешних систем
	 * - Реакции на служебные свойства (например, `debug`, `theme`, `trackingId`)
	 * 
	 * ⚠️ Важно: этот хук вызывается **вне очереди рендеринга**, поэтому:
	 * - Не используй для операций, требующих обновлённого DOM
	 * - Не вызывай асинхронные операции, которые могут нарушить порядок обновлений
	 * 
	 * @example
	 * afterPropertyUpdate(key, newValue, oldValue) {
	 *   if (key === 'debug') {
	 *     console.debug(`Режим отладки: ${newValue}`);
	 *   }
	 *   if (key === 'sessionId') {
	 *     analytics.track('session_changed', { id: newValue });
	 *   }
	 * }
	 *
	 * @param {string} key - Имя свойства, которое изменилось
	 * @param {any} newValue - Новое значение свойства
	 * @param {any} oldValue - Старое значение свойства
	 * @protected
	 */
	afterPropertyUpdate(key, newValue, oldValue) { }

	/**
	 * Отрисовывает шаблон с помощью lit-html.
	 * @private
	 */
	_render() {
        try {
		this._debug('Rendering template...');
		render(this.render(), this._shadowRoot, { host: this });
		this._hasRendered = true;
        } catch (error) {
            console.error(`Render error in ${this.localName}:`, error);
            // Fallback UI
            render(html`<div style="color: red; padding: 1rem;">
                Render error: ${error.message}
            </div>`, this._shadowRoot);
        }
	}

	/**
	 * Абстрактный метод: должен возвращать TemplateResult.
	 * @abstract
	 * @returns {TemplateResult}
	 */
	render() {
		return html``;
	}

	/**
	 * Жизненный цикл: вызывается при подключении.
	 * Регистрирует компонент (если autoRegister), выполняет первую отрисовку.
	 */
	connectedCallback() {
		this._debug('connectedCallback');
		if (this.constructor.autoRegister && !customElements.get(this.localName)) {
			this.constructor.register();
		}
		if (!this._hasRendered) {
			this._render();
		}
		this.onMounted();
	}

	/**
	 * Жизненный цикл: при удалении из DOM.
	 */
	disconnectedCallback() {
		this._debug('disconnectedCallback');
        // Отменяем pending updates
        if (this._updateDebounce) {
            cancelAnimationFrame(this._updateDebounce);
            this._updateDebounce = null;
        }
        this._updatePending = false;
		this.onUnmounted();
	}

	/**
	 * Жизненный цикл: при перемещении между DOM.
	 */
	adoptedCallback() {
		this._debug('adoptedCallback');
		this.onAdopted();
	}

	/**
	 * Жизненный цикл: вызывается при изменении атрибута.
	 */
	attributeChangedCallback(name, oldValue, newValue) {
		if (newValue === oldValue) return;
		this._debug('attributeChanged', { name, oldValue, newValue });
		for (const [key, config] of Object.entries(this._properties)) {
			if (config.attribute === name) {
				this[key] = newValue;
				//this._setPropertyFromAttribute(key, newValue);
				return;
			}
		}
	}

	/**
	 * Возвращает Promise, разрешающийся после завершения обновления.
	 * @returns {Promise<void>}
	 */
	get updateComplete() {
		this._debug('get updateComplete()');
        if (!this._updatePending && !this._updateDebounce) {
			return Promise.resolve();
		}

		return new Promise((resolve, reject) => {
			if (!this.isConnected) {
				reject(new Error('Element disconnected before update'));
				return;
			}

            const check = () => {
                if (!this._updatePending && !this._updateDebounce) {
					resolve();
                } else {
                    requestAnimationFrame(check);
                }
            };

            check();

            // Таймаут на случай зависших обновлений
            setTimeout(() => reject(new Error('Update timeout')), 5000);
        });
    }

    /**
     * Принудительно обновляет компонент, пропуская очередь.
     * @public
     */
    forceUpdate() {
        this._pendingChanges.clear();
        this._performUpdate();
	}

	// ────────────────────────────────────────────────────────
	// Жизненные циклы
	// ────────────────────────────────────────────────────────
	onMounted() { }
	onUnmounted() { }
	onAdopted() { }

	// ────────────────────────────────────────────────────────
	// Утилиты
	// ────────────────────────────────────────────────────────
    
    /**
     * Находит первый элемент в shadow DOM
     * @param {string} selector
     * @returns {Element|null}
     */
	$(selector) {
		try {
			return this._shadowRoot?.querySelector(selector) || null;
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
			return this._shadowRoot?.querySelectorAll(selector) || [];
		} catch (e) {
			return [];
		}
	}

    /**
     * Возвращает корень shadow DOM
     * @returns {ShadowRoot}
     */
    $$$() {
        return this._shadowRoot;
    }

    /**
     * Создаёт и отправляет кастомное событие
     * @param {string} name - Имя события
     * @param {Object} [detail={}] - Данные события
     * @param {boolean} [bubbles=true] - Всплытие
     * @param {boolean} [composed=true] - Переход через shadow boundary
     */
    dispatchCustomEvent(name, detail = {}, bubbles = true, composed = true) {
        this.dispatchEvent(new CustomEvent(name, {
            detail,
            bubbles,
            composed
        }));
    }

    /**
     * Устанавливает свойство без триггера рендера
     * @param {string} name - Имя свойства
     * @param {any} value - Значение
     */
    setPropertySilent(name, value) {
        this._state[name] = value;
    }

	//
	_setPropertyFromAttribute(name, value) {
		this[name] = value;
	}

	/**
	 * Создаёт parser для даты с поддержкой локали.
	 * Поддерживает: ISO, DD.MM.YYYY, MM/DD/YYYY, и текстовые форматы.
	 *
	 * @param {string} locale - 'ru', 'en', и т.д.
	 * @returns {function(string): Date}
	 */
	createDateParser(locale = 'en') {
		const parsers = {
			// ISO: 2025-04-05
			iso(value) {
				const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
				if (match) {
					return new Date(+match[1], +match[2] - 1, +match[3]);
				}
				return null;
			},

			// DD.MM.YYYY (для ru, de и др.)
			europe(value) {
				const match = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
				if (match) {
					return new Date(+match[3], +match[2] - 1, +match[1]);
				}
				return null;
			},

			// MM/DD/YYYY (для en-US)
			us(value) {
				const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
				if (match) {
					return new Date(+match[3], +match[1] - 1, +match[2]);
				}
				return null;
			},

			// Текстовые даты: "5 апреля 2025", "April 5, 2025"
			text(value) {
				const date = new Date(value);
				return isNaN(date.getTime()) ? null : date;
			}
		};

		return function (value) {
			if (!value) return new Date();

			// Попробуем все форматы
			for (const [name, parser] of Object.entries(parsers)) {
				if (locale === 'ru' && name === 'us') continue; // не для ru
				if (locale === 'en' && name === 'europe') continue; // не для en

				const date = parser(value.trim());
				if (date) return date;
			}

			// Последняя попытка — через конструктор
			const fallback = new Date(value);
			if (!isNaN(fallback.getTime())) {
				return fallback;
			}

			console.warn(`[WidgetBase] Не удалось распарсить дату: ${value}`);
			return new Date();
		};
	}

	/**
	 * Создаёт parser для объекта с дефолтами и валидацией.
	 *
	 * @param {Object} defaults - Значения по умолчанию
	 * @param {Object} rules - Правила валидации (массив допустимых значений)
	 * @returns {function(string): Object}
	 */
	createValidatedObjectParser(defaults = {}, rules = {}) {
		return function (value) {
			let parsed;
			try {
				parsed = value ? JSON.parse(value) : {};
			} catch (e) {
				console.warn(`[WidgetBase] Invalid JSON in attribute: ${value}`);
				parsed = {};
			}

			const result = { ...defaults };

			for (const [key, defaultValue] of Object.entries(defaults)) {
				if (parsed.hasOwnProperty(key)) {
					const allowed = rules[key];
					if (Array.isArray(allowed)) {
						if (allowed.includes(parsed[key])) {
							result[key] = parsed[key];
						} else {
							console.warn(`[WidgetBase] Недопустимое значение для ${key}: ${parsed[key]}`);
						}
					} else {
						result[key] = parsed[key];
					}
				}
			}

			return result;
		};
	}
}