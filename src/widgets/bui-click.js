import { html, css } from '../js/lit-all.min.js';
import { BUIBaseWidget } from '../js/bui-base-widget.js';

export class BuiClick extends BUIBaseWidget {
	static defaults = {
		target: '',
		event: '',
		action: 'none',
		data: '',
		params: '{}',
		actionClass: '',
		duration: 500,
	};

	static properties = {
		target: { type: String },
		event: { type: String },
		action: { type: String },
		data: { type: String },
		params: { type: String },
		actionClass: { attribute: 'action-class', type: String },
	};

	static styles = css`:host { display: none; }`;

	constructor() {
		super();
		Object.assign(this, this.defaults);
		this._controller = null; // для управления слушателями
	}

	render() {
		return html``;
	}

	connectedCallback() {
		super.connectedCallback();
		this._bindEventHandler();

	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this._unbindEventHandler();
	}

	updated(changedProperties) {
		super.updated(changedProperties);
		if (changedProperties.has('target')) {
			this._unbindEventHandler();
			this._bindEventHandler();
		}
	}

	_bindEventHandler() {
		if (!this.target) return;

		const target = document.getElementById(this.target);
		if (!target) {
			console.warn(`BuiClick: Элемент "${this.target}" не найден`);
			return;
		}
		// Чтобы на мобилках работал pointerup
		target.style.touchAction = 'none';

		// Применяем классы
		if (this.actionClass) {
			target.classList.add(...this.actionClass.split(' '));
		}

		// Используем AbortController для автоматической отмены
		this._controller = new AbortController();
		const { signal } = this._controller;

		target.addEventListener('pointerdown', (e) => this._handlePointerDown(e, target), {
			passive: false,
			signal,
		});
	}

	_unbindEventHandler() {
		if (this._controller) {
			this._controller.abort(); // автоматически убирает все слушатели
			this._controller = null;
		}

		// Убираем классы (опционально)
		if (this.target && this.actionClass) {
			const target = document.getElementById(this.target);
			if (target) {
				this.actionClass.split(' ').forEach(cls => target.classList.remove(cls));
			}
		}
	}

	_handlePointerDown(event, target) {
		if (event.button !== undefined && event.button !== 0) return;
		//event.preventDefault(); // важно для тача

		const startX = event.clientX;
		const startY = event.clientY;
		let isLongPress = false;
		let pressTimer = null;

		const MOVE_THRESHOLD = 20;
		let isActive = true;

		// Долгое нажатие
		pressTimer = setTimeout(() => {
			isLongPress = true;
			isActive = false;
			this._triggerAction(event, 'longPress');
		}, this.duration);

		// Обработчики завершения
		const handleEnd = (endEvent) => {
			//if (!isActive) return;
			isActive = false;
			clearTimeout(pressTimer);
			if (!isLongPress) {
				this._triggerAction(event, 'shortPress');
			}
			this._triggerAction(event, 'up');
		};

		const handleMove = (moveEvent) => {
			if (!isActive) return;
			const dx = Math.abs(moveEvent.clientX - startX);
			const dy = Math.abs(moveEvent.clientY - startY);
			if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
				isActive = false;
				clearTimeout(pressTimer);
			}
		};

		// Вешаем глобальные слушатели
		window.addEventListener('pointerup', handleEnd, { once: true });
		window.addEventListener('pointercancel', handleEnd, { once: true });
		window.addEventListener('pointermove', handleMove, { passive: false });
	}

	_triggerAction(event, type) {
		if (this.event !== type) return;

		const data = this.data || event.target?.value;
		try {
			const params = JSON.parse(this.params || '{}');
			this._dispatchAction(this.action, data, params);
		} catch (error) {
			console.error('BuiClick: Ошибка при разборе JSON:', error);
		}
	}

	_dispatchAction(action, data, params) {
		if (action === 'none') return;

		// Карта действий → событий
		const eventMap = {
			'topic-set': 'index:topic-set',
			'open-page': 'bui-book:open-page',
			'close-active-page': 'bui-page:select',
			'message': 'index:message',
			'state': 'index:topic-toggle',
		};

		const eventName = eventMap[action];
		if (!eventName) {
			console.warn(`BuiClick: Неизвестное действие "${action}"`);
			return;
		}

		// Формируем detail
		let detail = { source: this.id, params };
		if (action === 'topic-set') {
			detail.value = data;
		} else if (action === 'open-page') {
			detail.page = data;
		} else if (action === 'close-active-page') {
			detail.page = null;
		}
		console.log(detail);

		this.dispatchEvent(new CustomEvent(eventName, {
			detail,
			bubbles: true,
			composed: true,
		}));
	}
}

customElements.define('bui-click', BuiClick);