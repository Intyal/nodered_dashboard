/**
Переменная					По умолчанию		Описание
--track-color				#e0e0e0				Цвет пустой дорожки
--progress-color-start		#007bff				Начало градиента заполнения
--progress-color-end		#28a745				Конец градиента заполнения
--thumb-color-min			#007bff				Цвет ползунка min (если не задан thumbSvgMin)
--thumb-color-max			#28a745				Цвет ползунка max/single (если не задан thumbSvgMax)
--tooltip-bg				#333				Фон подсказки
--tooltip-color				white				Цвет текста подсказки
--font-size, --color							Стандартные для BUI
--left, --top, --width, --height				Управляются через position и size
 */

import { html, css, svg, unsafeHTML } from '../js/lit-all.min.js';
import { BUIBaseWidget } from '../js/bui-base-widget.js';

/**
 * Расширенный кастомный слайдер (range input) с поддержкой:
 * - Одиночного и двойного режима (min/max)
 * - Горизонтальной и вертикальной ориентации
 * - Отключения (disabled)
 * - Кастомных SVG-ползунков
 * - Подсказки со значением при перетаскивании
 * - Полной поддержки мыши и сенсорных экранов
 * - Настройки цветов через CSS-переменные
 */
export class BUIRange extends BUIBaseWidget {
	/**
	 * Значения по умолчанию для всех настраиваемых параметров.
	 */
	static defaults = {
		size: [1, 2],
		position: [0, 0],
		mode: 'single',        // 'single' | 'dual'
		min: 0,
		max: 100,
		value: 50,
		minVal: 25,
		maxVal: 75,
		step: 1,
		orientation: 'horizontal', // 'horizontal' | 'vertical'
		disabled: false,       // компонент отключён
		thumbSvgMin: '',       // SVG-строка для min-ползунка (без <svg>)
		thumbSvgMax: '',       // SVG-строка для max/single-ползунка
	};

	static properties = {
		size: {
			type: Array,
			converter: (value) => value.split(' ').map(Number),
		},
		position: {
			type: Array,
			converter: (value) => value.split(' ').map(Number),
		},
		mode: { type: String },
		min: { type: Number },
		max: { type: Number },
		value: { type: Number },
		minVal: {
			attribute: 'min-val',
			type: Number,
		},
		maxVal: {
			attribute: 'max-val',
			type: Number,
		},
		step: { type: Number },
		orientation: { type: String },
		disabled: { type: Boolean },
		thumbSvgMin: { type: String },
		thumbSvgMax: { type: String },
	};

	static styles = css`
		:host {
			grid-column-start: var(--left);
			grid-row-start: var(--top);
			grid-column-end: span var(--width);
			grid-row-end: span var(--height);

			display: flex;
			overflow: hidden;
			justify-content: center;
			align-items: center;
			font-size: var(--font-size);
			color: var(--color);
		}

		/* Состояние: отключено */
		:host([disabled]) {
			opacity: 0.6;
			pointer-events: none; /* Полностью блокирует взаимодействие */
		}

		/* Основной контейнер */
		.wrapper {
			position: relative;
			width: 100%;
			height: 100%;
			touch-action: none; /* Критично для touch-устройств */
		}

		/* Скрытый <input> для семантики и доступности */
		.range-input {
			opacity: 0;
			position: absolute;
			pointer-events: none;
		}

		/* Дорожка и прогресс — общие стили */
		.range-track,
		.range-progress {
			position: absolute;
			pointer-events: none;
			border-radius: 2px;
		}

		/* === ГОРИЗОНТАЛЬНЫЙ РЕЖИМ (по умолчанию) === */
		:host(:not([orientation="vertical"])) .wrapper {
			height: 60px;
		}
		:host(:not([orientation="vertical"])) .range-track,
		:host(:not([orientation="vertical"])) .range-progress {
			top: 50%;
			left: 0;
			width: 100%;
			height: 4px;
			transform: translateY(-50%);
		}

		/* === ВЕРТИКАЛЬНЫЙ РЕЖИМ === */
		:host([orientation="vertical"]) .wrapper {
			width: 60px;
			height: 100%;
		}
		:host([orientation="vertical"]) .range-track,
		:host([orientation="vertical"]) .range-progress {
			left: 50%;
			top: 0;
			width: 4px;
			height: 100%;
			transform: translateX(-50%);
		}

		/* Цвета через CSS-переменные с резервными значениями */
		.range-track {
			background: var(--track-color, #e0e0e0);
		}

		.range-progress {
			background: linear-gradient(
				to right,
				var(--progress-color-start, #007bff),
				var(--progress-color-end, #28a745)
			);
			transition: left 0.1s, width 0.1s, top 0.1s, height 0.1s;
		}

		:host([orientation="vertical"]) .range-progress {
			background: linear-gradient(
				to bottom,
				var(--progress-color-start, #007bff),
				var(--progress-color-end, #28a745)
			);
		}

		/* Контейнер ползунка */
		.thumb-container {
			position: absolute;
		}
		:host(:not([orientation="vertical"])) .thumb-container {
			top: 30px; /* 60px / 2 */
		}
		:host([orientation="vertical"]) .thumb-container {
			left: 30px; /* 60px / 2 */
		}

		/* SVG-ползунок */
		.range-thumb {
			width: 32px;
			height: 32px;
			pointer-events: none;
		}
		:host(:not([orientation="vertical"])) .range-thumb {
			position: absolute;
			top: 50%;
			transform: translateY(-50%);
		}
		:host([orientation="vertical"]) .range-thumb {
			position: absolute;
			left: 50%;
			transform: translateX(-50%);
		}

		/* Подсказка (tooltip) */
		.tooltip {
			position: absolute;
			background: var(--tooltip-bg, #333);
			color: var(--tooltip-color, white);
			font-size: 12px;
			padding: 4px 8px;
			border-radius: 4px;
			white-space: nowrap;
			opacity: 0;
			pointer-events: none;
			transition: opacity 0.15s ease;
		}
		:host(:not([orientation="vertical"])) .tooltip {
			top: -36px;
			left: 50%;
			transform: translateX(-50%);
		}
		:host([orientation="vertical"]) .tooltip {
			left: -40px;
			top: 50%;
			transform: translateY(-50%);
		}
		.tooltip.visible {
			opacity: 1;
		}
  `;

	/**
	 * Конструктор: инициализация значений и состояния.
	 */
	constructor() {
		super();

		Object.assign(this, this.defaults);

		this._dragTarget = null; // 'single', 'min', 'max'
		this._isDragging = false;
	}

	set size(value) {
		this._size = this.validateAndSetArr(this.defaults.size, value);
		
		// Изменение размеров под родителя, если значения равны 0.
		if (this.parentElement) {
			if (this._size[0] === 0) {
				this._size[0] = this.parentElement?.innerSize[0];
			}
			if (this._size[1] === 0) {
				this._size[1] = this.parentElement?.innerSize[1];
			}
		}

		this.updatingCustomVariables(['--width', '--height'], this._size);
	}
	get size() {
		return this._size;
	}

	set position(value) {
		this._position = this.validateAndSetArr(this.defaults.position, value);
		this.updatingCustomVariables(['--left', '--top'], this._position);
	}
	get position() {
		return this._position;
	}

	/**
	 * Основной метод рендеринга.
	 */
	render() {
		// Рендерит содержимое ползунка: кастомный SVG или стандартный круг
		const renderThumbContent = (which) => {
			const isMin = which === 'min';
			const customSvg = isMin ? this.thumbSvgMin : this.thumbSvgMax;
			const color = isMin
				? 'var(--thumb-color-min, #007bff)'
				: 'var(--thumb-color-max, #28a745)';

			if (customSvg) {
				// Вставляем SVG-строку как есть (опасная вставка, но контролируемая)
				return html`<g>${unsafeHTML(customSvg)}</g>`;
			} else {
				// Стандартный круг
				return svg`<circle cx="16" cy="16" r="14" fill="${color}" stroke="#fff" stroke-width="2"/>`;
			}
		};

		// Рендерит ползунок с подсказкой
		const renderThumbWithTooltip = (value, which) => {
			// Подсказка видна только при перетаскивании и если не disabled
			const isVisible = this._dragTarget === which && !this.disabled;
			return html`
				<div class="thumb-container">
					<svg class="range-thumb" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
						${renderThumbContent(which)}
					</svg>
					<div class="tooltip ${isVisible ? 'visible' : ''}">${value}</div>
				</div>
			`;
		};

		const isVertical = this.orientation === 'vertical';

		if (this.mode === 'dual') {
			return html`
				<div class="wrapper"
					@pointerdown=${this._onPointerDown}
					@pointermove=${this._onPointerMove}
					@pointerup=${this._onPointerUp}
					@pointercancel=${this._onPointerUp}
				>
					<!-- Семантический input -->
					<input
						type="range"
						class="range-input"
						min=${this.min}
						max=${this.max}
						step=${this.step}
						.value=${Math.round((this.minVal + this.maxVal) / 2)}
						aria-label="Range selector"
						?disabled=${this.disabled}
						tabindex=${this.disabled ? "-1" : "-1"}
						aria-hidden="true"
					/>
					<div class="range-track"></div>
					<div class="range-progress" id="progress"></div>
					${renderThumbWithTooltip(this.minVal, 'min')}
					${renderThumbWithTooltip(this.maxVal, 'max')}
				</div>
			`;
		} else {
			return html`
				<div class="wrapper"
					@pointerdown=${this._onPointerDown}
					@pointermove=${this._onPointerMove}
					@pointerup=${this._onPointerUp}
					@pointercancel=${this._onPointerUp}
				>
					<input
						type="range"
						class="range-input"
						min=${this.min}
						max=${this.max}
						step=${this.step}
						.value=${this.value}
						aria-label="Value selector"
						?disabled=${this.disabled}
						tabindex=${this.disabled ? "-1" : "0"}
					/>
					<div class="range-track"></div>
					<div class="range-progress" id="progress"></div>
					${renderThumbWithTooltip(this.value, 'single')}
				</div>
			`;
		}
	}

	/**
	 * Начало перетаскивания.
	 */
	_onPointerDown(e) {
		// Блокируем, если отключено
		if (this.disabled) return;
		if (e.button && e.button !== 0) return;
		if (e.pointerType === 'touch') e.preventDefault();

		const wrapper = this.shadowRoot.querySelector('.wrapper');
		const rect = wrapper.getBoundingClientRect();
		const isVertical = this.orientation === 'vertical';
		const thumbSize = 32;

		const trackLength = isVertical ? rect.height : rect.width;
		const clickCoord = isVertical ? e.clientY - rect.top : e.clientX - rect.left;

		const getCenter = (val) =>
			((val - this.min) / (this.max - this.min)) * (trackLength - thumbSize) + thumbSize / 2;

		if (this.mode === 'dual') {
			const minCenter = getCenter(this.minVal);
			const maxCenter = getCenter(this.maxVal);
			if (Math.abs(clickCoord - minCenter) <= Math.abs(clickCoord - maxCenter)) {
				this._dragTarget = 'min';
				this._dragOffset = clickCoord - minCenter;
			} else {
				this._dragTarget = 'max';
				this._dragOffset = clickCoord - maxCenter;
			}
		} else {
			this._dragTarget = 'single';
			const singleCenter = getCenter(this.value);
			this._dragOffset = clickCoord - singleCenter;
		}

		this._isDragging = true;
		this._onPointerMove(e);
	}

	/**
	 * Движение при перетаскивании.
	 */
	_onPointerMove(e) {
		if (!this._isDragging || !this._dragTarget || this.disabled) return;

		const wrapper = this.shadowRoot.querySelector('.wrapper');
		const rect = wrapper.getBoundingClientRect();
		const isVertical = this.orientation === 'vertical';
		const thumbSize = 32;

		const cursorCoord = isVertical ? e.clientY - rect.top : e.clientX - rect.left;
		let targetCenter = cursorCoord - this._dragOffset;

		const minCenter = thumbSize / 2;
		const maxCenter = (isVertical ? rect.height : rect.width) - thumbSize / 2;
		targetCenter = Math.max(minCenter, Math.min(maxCenter, targetCenter));

		const trackLength = isVertical ? rect.height : rect.width;
		const ratio = (targetCenter - thumbSize / 2) / (trackLength - thumbSize);
		let val = this.min + ratio * (this.max - this.min);
		val = Math.round(val / this.step) * this.step;
		val = Math.max(this.min, Math.min(this.max, val));

		if (this.mode === 'dual') {
			if (this._dragTarget === 'min') {
				if (val > this.maxVal) val = this.maxVal;
				this.minVal = val;
			} else {
				if (val < this.minVal) val = this.minVal;
				this.maxVal = val;
			}
			this.dispatchEvent(new CustomEvent('range-changed', {
				detail: { min: this.minVal, max: this.maxVal },
				bubbles: true,
				composed: true
			}));
		} else {
			this.value = val;
			this.dispatchEvent(new CustomEvent('value-changed', {
				detail: { value: this.value },
				bubbles: true,
				composed: true
			}));
		}

		this.requestUpdate();
	}

	/**
	 * Завершение перетаскивания.
	 */
	_onPointerUp() {
		this._isDragging = false;
		this._dragTarget = null;
		this.requestUpdate();
	}

	/**
	 * Обновляет позицию визуальных элементов после изменения значений.
	 */
	_updateProgress() {
		requestAnimationFrame(() => {
			const wrapper = this.shadowRoot.querySelector('.wrapper');
			if (!wrapper) return;

			const isVertical = this.orientation === 'vertical';
			const thumbSize = 32;
			const trackLength = isVertical ? wrapper.offsetHeight : wrapper.offsetWidth;

			const getPos = (val) =>
				((val - this.min) / (this.max - this.min)) * (trackLength - thumbSize);

			const progress = this.shadowRoot.getElementById('progress');
			if (!progress) return;

			if (this.mode === 'single') {
				const pos = getPos(this.value);
				if (isVertical) {
					progress.style.top = '0';
					progress.style.height = `${pos + thumbSize / 2}px`;
				} else {
					progress.style.left = '0';
					progress.style.width = `${pos + thumbSize / 2}px`;
				}

				const container = this.shadowRoot.querySelector('.thumb-container');
				if (container) {
					if (isVertical) container.style.top = `${pos}px`;
					else container.style.left = `${pos}px`;
				}
			} else {
				const minPos = getPos(this.minVal);
				const maxPos = getPos(this.maxVal);
				if (isVertical) {
					progress.style.top = `${minPos + thumbSize / 2}px`;
					progress.style.height = `${Math.max(0, maxPos - minPos)}px`;
				} else {
					progress.style.left = `${minPos + thumbSize / 2}px`;
					progress.style.width = `${Math.max(0, maxPos - minPos)}px`;
				}

				const containers = this.shadowRoot.querySelectorAll('.thumb-container');
				if (containers[0]) {
					if (isVertical) containers[0].style.top = `${minPos}px`;
					else containers[0].style.left = `${minPos}px`;
				}
				if (containers[1]) {
					if (isVertical) containers[1].style.top = `${maxPos}px`;
					else containers[1].style.left = `${maxPos}px`;
				}
			}
		});
	}

	updated() {
		this._updateProgress();
	}

	updatePosition() {
		this._updateProgress();
	}
}

// Регистрация компонента
customElements.define('bui-range', BUIRange);