import { html, css } from '../js/lit-all.min.js';
import { BUIBaseWidget } from '../js/bui-base-widget.js';

export class BuiClick extends BUIBaseWidget {
	static defaults = {
		target: '',
		event: '',
		action: 'none',
		actionLong: 'none',
		data: '',
		params: '{}',
		actionClass: '',
		duration: 500,
	};

	static properties = {
		// ID целевого элемента для привязки события
		target: {
			type: String,
		},
		event: {
			type: String,
		},
		// Тип реакции на короткое нажатие
		action: {
			type: String,
		},
		// Данные для разных типов действий
		data: {
			type: String,
		},
		// Дополнительные параметры в формате JSON
		params: {
			type: String,
		},
		// CSS класс для целевого элемента
		actionClass: {
			attribute: 'action-class',
			type: String,
		},
		// Тип реакции на долгое нажатие
		actionLong: {
			attribute: 'action-long',
			type: String,
		},
		// Данные для разных типов действий
		dataLong: {
			attribute: 'data-long',
			type: String,
		},
		// Дополнительные параметры в формате JSON
		paramsLong: {
			attribute: 'params-long',
			type: String,
		},
	};

	static styles = css`
		:host {
			display: none;
		}
	`;

	constructor() {
		super();

		Object.assign(this, this.defaults);

		this._targetElement = null;
		this._pressTimer = null;
		this._isLongPress = false;
		this._activePointerId = null;
		this._startX = 0;
		this._startY = 0;

		this._boundPointerDown = this._handlePointerDown.bind(this);

		this._boundGlobalPointerUp = this._handleGlobalPointerUp.bind(this);
		this._boundGlobalPointerCancel = this._handleGlobalPointerCancel.bind(this);
		this._boundGlobalPointerMove = this._handleGlobalPointerMove.bind(this);
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

		if (changedProperties.has('target') ||
			changedProperties.has('action') ||
			changedProperties.has('data')) {
			this._unbindEventHandler();
			this._bindEventHandler();
		}
	}

	_bindEventHandler() {
		if (!this.target) return;

		this._targetElement = document.getElementById(this.target);
		if (!this._targetElement) {
			console.warn(`BuiClick: Элемент "${this.target}" не найден`);
			return;
		}

		this._targetElement.addEventListener('pointerdown', this._boundPointerDown, { passive: false });

		if (this.actionClass) {
			this.actionClass.split(" ").forEach(cls => this._targetElement.classList.add(cls));
		}
	}

	_unbindEventHandler() {
		// Отменяем всё, что может быть активно
		this._cancelPress();
		this._activePointerId = null;

		if (this._targetElement) {
			this._targetElement.removeEventListener('pointerdown', this._boundPointerDown);
			this._targetElement = null;
		}

		// На всякий случай убираем глобальные слушатели (хотя {once} должен был их убрать)
		window.removeEventListener('pointermove', this._boundGlobalPointerMove);
	}

	_handlePointerDown(event) {
		if (event.button !== undefined && event.button !== 0) return;
		event.preventDefault();

		// Защита: если уже активно нажатие — игнорируем
		//if (this._activePointerId !== null) return;

		this._startX = event.clientX;
		this._startY = event.clientY;
		this._isLongPress = false;

		// Запоминаем ID указателя (для мультитача)
		this._activePointerId = event.pointerId;

		this._pressTimer = setTimeout(() => {
			this._isLongPress = true;
			this.onLongPress(event);
		}, this.duration);

		// Вешаем pointerup и pointermove на window, чтобы ловить отпускание везде
		window.addEventListener('pointerup', this._boundGlobalPointerUp, { once: true });
		window.addEventListener('pointercancel', this._boundGlobalPointerCancel, { once: true });
		window.addEventListener('pointermove', this._boundGlobalPointerMove, { passive: false });
	}

	_handleGlobalPointerMove(event) {
		// Игнорируем события от других указателей (при мультитаче)
		if (event.pointerId !== this._activePointerId) return;

		if (this._isLongPress) return;

		const MOVE_THRESHOLD = 10;
		const dx = Math.abs(event.clientX - this._startX);
		const dy = Math.abs(event.clientY - this._startY);

		if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
			this._cancelPress();
		}
	}

	_handleGlobalPointerUp(event) {
		// Убираем move-слушатель (он не {once})
		window.removeEventListener('pointermove', this._boundGlobalPointerMove);

		// Игнорируем другие указатели
		if (event.pointerId !== this._activePointerId) return;

		if (!this._isLongPress) {
			this._cancelPress(); // очищаем таймер
			this.onShortPress(event);
		}
	}

	_handleGlobalPointerCancel(event) {
		window.removeEventListener('pointermove', this._boundGlobalPointerMove);
		if (event.pointerId === this._activePointerId) {
			this._cancelPress();
		}
	}

	_cancelPress() {
		if (this._pressTimer) {
			clearTimeout(this._pressTimer);
			this._pressTimer = null;
		}
		this._isLongPress = true; // блокируем последующие вызовы
	}

	onShortPress(event) {
		//console.log('Событие:', event);
		//console.log('Тип указателя:', event.pointerType); // 'mouse', 'touch', 'pen'
		//console.log('Координаты:', event.clientX, event.clientY);
		if (this.event === 'shortPress') {
			this._switchAction(event, this.action, this.data, JSON.parse(this.params || '{}'));
		}
	}

	onLongPress(event) {
		//console.log(`Долгое нажатие на элементе ${this.target}`, event);
		if (this.event === 'longPress') {
			this._switchAction(event, this.action, this.data, JSON.parse(this.params || '{}'));
		}
	}

	_switchAction(event, action, data, params) {
		try {
			//const params = JSON.parse(this.params || '{}');

			switch (action) {
				case 'none':
					console.log(`Нет действия`);
					break;
				case 'topic-set':
					this._changeTopic(data, params);
					break;
				case 'message':
					this._sendMessage(data, params);
					break;
				case 'open-page':
					this._openPage(data, params);
					break;
				case 'close-active-page':
					this._closePage(null, params);
					break;
				case 'state':
					this._toggleState(data, params);
					break;
				case 'custom':
					this._executeCustomAction(data, params);
					break;
				default:
					console.warn(`BuiClick: Не известный тип действия "${action}"`);
			}
		} catch (error) {
			console.error('BuiClick: Ошибка при разборе параметров JSON:', error);
		}
	}

	_changeTopic(value, params) {
		if (!value) return;

		const event = new CustomEvent('index:topic-set', {
			detail: {
				value: value,
				params: params,
				source: this.id
			},
			bubbles: true,
			composed: true
		});

		//console.log(`BuiClick: Передать значение "${value}" в свойство ${params.property} топика "${params.topic} ".`, params);
		this.dispatchEvent(event);
	}

	_sendMessage(message, params) {
		if (!message) return;

		// Отправляем кастомное событие с сообщением
		const event = new CustomEvent('index:message', {
			detail: {
				message: message,
				params: params,
				source: this.id
			},
			bubbles: true,
			composed: true
		});

		//console.log(`BuiClick: Message sent - "${message}"`, params);
		this.dispatchEvent(event);
	}

	// Смена страницы
	_openPage(pageName, params) {
		if (!pageName) return;

		// Отправляем событие смены страницы
		const event = new CustomEvent('bui-book:open-page', {
			detail: {
				page: pageName,
				//saveSelected: true,
				params: params,
			},
			bubbles: true,
			composed: true
		});

		//console.log(`BuiClick: Выбор страницы`, pageName, params, this.target);
		this.dispatchEvent(event);
	}

	// 
	_closePage(pageName = null, params) {

		// Отправляем событие смены страницы
		const event = new CustomEvent('bui-page:select', {
			detail: {
				page: pageName,
				//saveSelected: false,
				params: params,
			},
			bubbles: true,
			composed: true
		});

		//console.log(`BuiClick: Выбор страницы`, pageName, params, this.target);
		this.dispatchEvent(event);
	}

	_toggleState(stateName, params) {
		if (!stateName) return;

		// Переключаем состояние через кастомное событие
		// params='{"topic": "zigbee2mqtt/light_switch_hall", "property": "state", "states": "[ON, OFF]", "current": "OFF"}'
		const event = new CustomEvent('index:topic-toggle', {
			detail: {
				state: stateName,
				value: params.value,
				toggle: params.toggle !== false,
				source: this.id
			},
			bubbles: true,
			composed: true
		});

		this.dispatchEvent(event);
		//console.log(`BuiClick: State "${stateName}" toggled`, params);
	}

	_executeCustomAction(actionName, params) {
		if (!actionName) return;

		// Выполняем кастомное действие
		const event = new CustomEvent('index:custom-action', {
			detail: {
				action: actionName,
				params: params,
				source: this.id
			},
			bubbles: true,
			composed: true
		});

		this.dispatchEvent(event);
		//console.log(`BuiClick: Custom action "${actionName}" executed`, params);
	}
}

customElements.define('bui-click', BuiClick);