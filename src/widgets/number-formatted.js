import { html } from '../js/lit-all.min.js';
import { BUIBaseWidget } from '../js/bui-base-widget.js';

export class TimeFormatted extends BUIBaseWidget {
	static defaults = {
		datetime: Date.now(),
		lasttime: undefined,
		year: undefined,
		month: undefined,
		day: undefined,
		hour: undefined,
		minute: undefined,
		second: undefined,
		weekday: undefined,
		numeric: 'auto',
		styleTime: 'short',
		locale: navigator.language,
		timeZone: undefined,
		relative: false,
		live: false,
	};

	static properties = {
		// 
		datetime: {
			type: String,
			attribute: 'date-time',
			reflect: true,
		},
		// 
		lasttime: {
			type: String,
			attribute: 'last-time',
		},
		// 
		year: {
			type: String,
		},
		// 
		month: {
			type: String,
		},
		// 
		day: {
			type: String,
		},
		// 
		hour: {
			type: String,
		},
		// 
		minute: {
			type: String,
		},
		// 
		second: {
			type: String,
		},
		// 
		weekday: {
			type: String,
		},
		//
		numeric: {
			type: String,
		},
		// 
		styleTime: {
			type: String,
			attribute: 'style-time',
		},
		// 
		locale: {
			type: String,
		},
		// 
		timeZone: {
			type: String,
			attribute: 'time-zone',
		},
		// 
		relative: {
			type: Boolean,
		},
		// 
		live: {
			type: Boolean,
		},
	};

	constructor() {
		super();

		Object.assign(this, this.defaults);

		this.timeoutId = null;
	}

	set datetime(value) {
		this._datetime = this.toDate(value);

		if (this.live) {
			this.scheduleAction();
		}
	}
	get datetime() {
		return this._datetime;
	}

	set lasttime(value) {
		this._lasttime = this.toTimestamp(value);
	}
	get lasttime() {
		return this._lasttime;
	}

	set live(value) {
		this._live = value;

		if (value) {
			this.delayedAction();
		}
	}
	get live() {
		return this._live;
	}

	render() {
		// Выбираем режим работы: относительное время или абсолютная дата
		if (this.lasttime) {
			return html`${this.updateRelativeTime()}`;
		} else if (this.relative) {
			return html``;
		} else {
			return html`${this.updateFormattedTime()}`;
		}
	}

	updateFormattedTime() {
		const date = new Date(this.datetime);

		// Опции форматирования на основе атрибутов элемента
		const options = {
			year: this.year,
			month: this.month,
			day: this.day,
			hour: this.hour,
			minute: this.minute,
			second: this.second,
			weekday: this.weekday,
			timeZone: this.timeZone,
		};

		return new Intl.DateTimeFormat(this.locale, options).format(date);
	}

	updateRelativeTime() {
		const timestamp = parseInt(this.lasttime, 10);
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
			const rtf = new Intl.RelativeTimeFormat(this.locale, {
				numeric: this.numeric,
				style: this.styleTime
			});
			return rtf.format(-value, unit);
		} catch (e) {
			console.error('Ошибка при форматировании относительного времени:', e);
			return '';
		}
	}

	// Функция, которую будем выполнять по таймеру
	delayedAction() {
		this.datetime = Date.now(); // обновляем дату
	}

	// Запуск отложенного действия
	scheduleAction(delayMs = 60000) {
		// Настраиваем обновление с интеллектуальным интервалом
		if (this.lasttime) {
			const now = Date.now();
			const diff = now - this.lasttime;
			// Реже обновляем для старых дат
			if (diff < 60000) { // Менее 1 минуты - обновляем каждую секунду
				delayMs = 1000;
			} else if (diff < 600000) { // Менее 10 минут - каждые 10 секунд
				delayMs = 10000;
			} else if (diff < 3600000) { // Менее 1 часа - каждые 60 секунд
				delayMs = 60000;
			}
		} else {
			if (this.second) {
				delayMs = 1000; // 1 секунда
			} else if (this.minute) {
				delayMs = 5000; // 5 секунд
			} else if (this.hour) {
				delayMs = 60000; // 60 секунд
			} else if (this.day) {
				delayMs = 300000; // 5 минут
			} else if (this.month) {
				delayMs = 1800000; // 30 минут
			}
		}

		// Сначала отменяем предыдущий, если был
		this.clearScheduledAction();

		this.timeoutId = setTimeout(() => {
			this.delayedAction();
			this.timeoutId = null; // сбросить после выполнения
		}, delayMs);
	}

	// Отмена запланированного действия
	clearScheduledAction() {
		if (this.timeoutId !== null) {
			clearTimeout(this.timeoutId);
			this.timeoutId = null;
		}
	}

	toDate(value) {
		let date;

		if (value instanceof Date) {
			date = value;
		} else if (typeof value === 'number') {
			date = new Date(value);
		} else if (typeof value === 'string') {
			// Сначала пробуем интерпретировать как timestamp (число в строке)
			const num = Number(value);
			if (!isNaN(num)) {
				date = new Date(num);
			} else {
				// Иначе — как строку даты (ISO, RFC и т.п.)
				date = new Date(value);
			}
		} else {
			// Неподдерживаемый тип: null, undefined, object, boolean и т.д.
			return '';
		}

		// Проверяем, что дата валидна
		if (isNaN(date.getTime())) {
			return '';
		}

		return date;
	}

	/**
	 * Преобразует значение в timestamp (мс с Unix Epoch).
	 * Поддерживает: Date, number, string (ISO-дата или строка с числом).
	 * @param {*} value — входное значение
	 * @returns {number | ''} — timestamp или пустая строка при ошибке
	 */
	toTimestamp(value) {
		let date;

		if (value instanceof Date) {
			date = value;
		} else if (typeof value === 'number') {
			// Уже timestamp — проверим, что это валидное число
			if (isNaN(value) || !isFinite(value)) {
				return '';
			}
			date = new Date(value);
		} else if (typeof value === 'string') {
			// Попытка интерпретировать как число (timestamp в строке)
			const num = Number(value);
			if (!isNaN(num) && isFinite(num)) {
				date = new Date(num);
			} else {
				// Иначе — как строку даты
				date = new Date(value);
			}
		} else {
			// null, undefined, boolean, object и т.д.
			return '';
		}

		// Проверка валидности даты
		const time = date.getTime();
		if (isNaN(time)) {
			return '';
		}

		return time; // возвращает число (timestamp в мс)
	}

	connectedCallback() {
		super.connectedCallback();
		// При добавлении в DOM

	}

	disconnectedCallback() {
		super.disconnectedCallback();

		this.clearScheduledAction();
	}

}

customElements.define('time-formatted', TimeFormatted);
