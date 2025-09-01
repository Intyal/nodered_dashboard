/**
 * Кастомный элемент для форматированного отображения времени и относительных временных промежутков
 * Поддерживает как абсолютные даты, так и относительные (например, "5 минут назад")
 */
class TimeFormatted extends HTMLElement {
	constructor() {
		super();
		// ID интервала для live-обновлений
		this._intervalId = null;
		// Время последнего рендера для throttle
		this._lastRenderTime = 0;
		// Таймер throttle
		this._renderThrottleTimeout = null;
	}

	/**
	 * Вызывается при подключении элемента в DOM
	 */
	connectedCallback() {
		this.render();
	}

	/**
	 * Вызывается при удалении элемента из DOM
	 */
	disconnectedCallback() {
		// Очищаем все интервалы и таймеры
		this.clearInterval();
		if (this._renderThrottleTimeout) {
			clearTimeout(this._renderThrottleTimeout);
			this._renderThrottleTimeout = null;
		}
	}

	/**
	 * Очищает интервал live-обновлений
	 */
	clearInterval() {
		if (this._intervalId) {
			clearInterval(this._intervalId);
			this._intervalId = null;
		}
	}

	/**
	 * Основной метод рендеринга элемента
	 * @param {boolean} throttle - если true, ограничивает частоту обновлений
	 */
	render(throttle = false) {
		// Ограничиваем частоту обновлений при быстрых изменениях атрибутов
		if (throttle) {
			const now = Date.now();
			// Если с последнего рендера прошло меньше 500мс - откладываем обновление
			if (now - this._lastRenderTime < 500) {
				if (!this._renderThrottleTimeout) {
					this._renderThrottleTimeout = setTimeout(() => {
						this.render(false);
						this._renderThrottleTimeout = null;
					}, 500 - (now - this._lastRenderTime));
				}
				return;
			}
		}

		this.clearInterval();
		this._lastRenderTime = Date.now();

		// Получаем атрибуты элемента
		const lastTime = this.getAttribute('last-time');
		const live = this.hasAttribute('live');
		const locale = this.getAttribute('locale') || navigator.language;
		const styleTime = this.getAttribute('style-time') || 'short';

		// Выбираем режим работы: относительное время или абсолютная дата
		if (lastTime) {
			const timestamp = parseInt(lastTime, 10);
			if (!isNaN(timestamp)) {
				this.updateRelativeTime(timestamp, live, locale, styleTime);
			} else {
				this.textContent = ''; // Очищаем при невалидном timestamp
			}
		} else {
			this.updateFormattedTime(live, locale);
		}
	}

	/**
	 * Обновляет элемент в режиме относительного времени (например, "5 минут назад")
	 * @param {number} timestamp - временная метка
	 * @param {boolean} live - нужно ли live-обновление
	 * @param {string} locale - локаль для форматирования
	 * @param {string} styleTime - стиль отображения ('long' или 'short')
	 */
	updateRelativeTime(timestamp, live, locale, styleTime) {
		// Функция для обновления содержимого
		const updateContent = () => {
			this.textContent = this.getTimePassed(timestamp, styleTime, locale);
		};

		// Первоначальное обновление
		updateContent();

		// Настраиваем live-обновление с интеллектуальным интервалом
		if (live) {
			const now = Date.now();
			const diff = now - timestamp;
			let interval = 60000; // По умолчанию обновляем каждую минуту

			// Оптимизация: реже обновляем для старых дат
			if (diff < 60000) { // Менее 1 минуты - обновляем каждую секунду
				interval = 1000;
			} else if (diff < 3600000) { // Менее 1 часа - каждые 10 секунд
				interval = 10000;
			}

			this._intervalId = setInterval(() => {
				updateContent();
			}, interval);
		}
	}

	/**
	 * Обновляет элемент в режиме абсолютного времени
	 * @param {boolean} live - нужно ли live-обновление
	 * @param {string} locale - локаль для форматирования
	 */
	updateFormattedTime(live, locale) {
		const date = new Date(this.getAttribute('datetime') || Date.now());

		// Опции форматирования на основе атрибутов элемента
		const options = {
			year: this.getAttribute('year') || undefined,
			month: this.getAttribute('month') || undefined,
			day: this.getAttribute('day') || undefined,
			hour: this.getAttribute('hour') || undefined,
			minute: this.getAttribute('minute') || undefined,
			second: this.getAttribute('second') || undefined,
			timeZoneName: this.getAttribute('time-zone-name') || undefined,
		};

		const updateContent = () => {
			this.textContent = new Intl.DateTimeFormat(locale, options).format(date);
		};

		updateContent();

		// Live-обновление для абсолютного времени
		if (live) {
			this._intervalId = setInterval(() => {
				this.setAttribute('datetime', new Date());
			}, 1000); // Обновляем каждую секунду
		}
	}

	/**
	 * Список атрибутов, которые нужно отслеживать на изменения
	 */
	static get observedAttributes() {
		return [
			'datetime',
			'last-time',
			'year',
			'month',
			'day',
			'hour',
			'minute',
			'second',
		];
	}

	/**
	 * Вызывается при изменении отслеживаемых атрибутов
	 */
	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue !== newValue) {
			// Для временных атрибутов включаем throttle
			const throttle = name === 'datetime' || name === 'last-time';
			this.render(throttle);
		}
	}

	/**
	 * Форматирует временной промежуток в относительное время (например, "5 минут назад")
	 * @param {number} timestamp - временная метка
	 * @param {string} style - стиль отображения ('long' или 'short')
	 * @param {string} locale - локаль для форматирования
	 * @returns {string} Отформатированная строка времени
	 */
	getTimePassed(timestamp, style = 'long', locale = navigator.language) {
		const now = Date.now();
		const diff = now - timestamp;

		// Рассчитываем все возможные единицы времени
		const seconds = Math.floor(diff / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);
		const months = Math.floor(days / 30);
		const years = Math.floor(days / 365);

		// Выбираем наиболее подходящую единицу времени
		let value, unit;
		if (years > 0) {
			value = years;
			unit = 'year';
		} else if (months > 0) {
			value = months;
			unit = 'month';
		} else if (days > 0) {
			value = days;
			unit = 'day';
		} else if (hours > 0) {
			value = hours;
			unit = 'hour';
		} else if (minutes > 0) {
			value = minutes;
			unit = 'minute';
		} else {
			value = seconds < 0 ? 0 : seconds; // Защита от отрицательных значений
			unit = 'second';
		}

		try {
			// Используем Intl API для красивого форматирования
			const rtf = new Intl.RelativeTimeFormat(locale, {
				numeric: 'auto', // "1 день назад" вместо "1 день назад"
				style: style // 'long' или 'short'
			});
			return rtf.format(-value, unit);
		} catch (e) {
			console.error('Error formatting relative time:', e);
			return ''; // Возвращаем пустую строку при ошибках
		}
	}
}

// Регистрируем кастомный элемент
customElements.define("time-formatted", TimeFormatted);