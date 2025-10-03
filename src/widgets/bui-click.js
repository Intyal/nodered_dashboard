import { html, css } from '../js/lit-all.min.js';
import { BUIBaseWidget } from '../js/bui-base-widget.js';

export class BuiClick extends BUIBaseWidget {
	static defaults = {
		target: '',
		action: 'message',
		data: '',
		params: '{}',
		actionClass: '',
	};

	static properties = {
		// ID целевого элемента для привязки события
		target: {
			type: String
		},
		// Тип реакции: 'message', 'page', 'state', 'custom'
		action: {
			type: String
		},
		// Данные для разных типов действий
		data: {
			type: String
		},
		// Дополнительные параметры в формате JSON
		params: {
			type: String
		},
		// CSS класс для целевого элемента
		actionClass: {
			attribute: 'action-class',
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

		this._boundHandler = null;
		this._targetElement = null;
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
			console.warn(`BuiClick: Целевой элемент с идентификатором "${this.target}" не найден`);
			return;
		}

		this._boundHandler = this._handleEvent.bind(this);
		this._targetElement.addEventListener('click', this._boundHandler);
		// Добавляем, если уканан, CSS класс к целевому элементу
		if (this.actionClass) {
			const classes = this.actionClass.split(" ");
			classes.forEach(className => {
				if (!this._targetElement.classList.contains(className)) {
					this._targetElement.classList.add(className);
				}
			});
		}
	}

	_unbindEventHandler() {
		if (this._targetElement && this._boundHandler) {
			this._targetElement.removeEventListener('click', this._boundHandler);
			this._boundHandler = null;
			this._targetElement = null;
		}
	}

	_handleEvent() {
		try {
			const params = JSON.parse(this.params || '{}');
			
			switch (this.action) {
				case 'topic-set':
					this._changeTopic(this.data, params);
					break;
				case 'message':
					this._sendMessage(this.data, params);
					break;
				case 'select-page':
					this._selectPage(this.data, params);
					break;
				case 'state':
					this._toggleState(this.data, params);
					break;
				case 'custom':
					this._executeCustomAction(this.data, params);
					break;
				default:
					console.warn(`BuiClick: Unknown action type "${this.action}"`);
			}
		} catch (error) {
			console.error('BuiClick: Ошибка при разборе параметров JSON:', error);
		}
	}

	_changeTopic(value, params) {
		if (!value) return;

		const event = new CustomEvent('bui-topic-set', {
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
		const event = new CustomEvent('bui-message', {
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

	// Обработка события смены страницы
	_selectPage(pageName, params) {
		if (!pageName) return;

		// Отправляем событие смены страницы
		const event = new CustomEvent('bui-select-page', {
			detail: {
				page: pageName,
				params: params
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
		const event = new CustomEvent('bui-click-toggle', {
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
		const event = new CustomEvent('bui-custom-action', {
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