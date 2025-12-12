import { svg, css } from '../js/lit-all.min.js';
import { BUIBaseWidget, mathUtilities } from '../js/bui-base-widget.js';

class BUIRange2 extends BUIBaseWidget {
	static defaults = {
		size: [2, 2],
		position: [0, 0],
		minmax: [0, 100],
		value: 0,
		valueToDisplay : undefined,
		//fixed: 0,
		units: '',
		zeroOffset: 90,
		gaugeStyle: 'arc',
		sectors: [[0, 50, "var(--color-red-200)"], [50, 100, "var(--color-lime-500)"]],
		visibleRangeOff: false,
		visibleValueOff: false,
		minValue: 0,
		maxValue: 100,
	};

	static properties = {
		// Размер в сетке. Переопределяет кастомные переменные --width и --height.
		size: {
			type: Array,
			converter: function (value, type) {
				return value.split(' ').map(Number);
			}
		},
		// Позиция в сетке. Переопределяет кастомные переменные --left и --top.
		position: {
			type: Array,
			converter: function (value, type) {
				return value.split(' ').map(Number);
			}
		},
		// Значение.
		value: {
			type: Number
		},
		// Значение для отображения.
		valueToDisplay: {
			attribute: 'display-value',
			type: Number
		},
		// Количество знаков после запятой при отображении.
		// fixed: {
		// 	attribute: 'fraction-digits',
		// 	type: Number
		// },
		// Единицы измерения
		units: {
			type: String
		},
		// Минимальное и максимальное значение
		minmax: {
			attribute: 'min-max',
			type: Array,
			converter: function (value, type) {
				return value.split(' ').map(Number);
			}
		},
		// Тип шкалы
		gaugeStyle: {
			attribute: 'gauge-style',
			type: String
		},
		zeroOffset: {
			attribute: 'zero-offset',
			type: Number,
		},
		// Цвета секторов: [[start, end, color], ...]
		sectors: {
			type: Array,
			converter: function (value, type) {
				const elements = value.split(',');
				const sectors = [];
				// Формируем массив групп по три элемента
				for (let i = 0; i < elements.length; i += 3) {
					const firstNum = parseInt(elements[i]);
					const secondNum = parseInt(elements[i + 1]);
					const thirdElem = elements[i + 2];
					// Проверяем, что первые два элемента — действительные числа, а третий — строка
					if (
						Number.isInteger(firstNum) &&
						Number.isInteger(secondNum) &&
						typeof thirdElem === 'string'
					) {
						sectors.push([firstNum, secondNum, thirdElem]); // добавляем правильную группу
					} else {
						console.error(`Ошибка в группе: ${elements.slice(i, i + 3)}`);
					}
				}
				return sectors;
			}
		},
		// Отображать ли значение
		visibleValueOff: {
			attribute: 'visible-value-off',
			type: Boolean
		},
		// Отображать ли диапазоны
		visibleRangeOff: {
			attribute: 'visible-range-off',
			type: Boolean
		},
	}

	static styles = css`
		:host {
			grid-column-start: var(--left);
			grid-row-start: var(--top);
			grid-column-end: span var(--width);
			grid-row-end: span var(--height);

			display: flex;
			justify-content: space-between;
			align-items: flex-end;

			font-size: var(--font-size);
		}
		.value {
			font-size: 36px;
			font-weight: 400;
			line-height: 0.75;
			letter-spacing: -0.025em;
		}
		.units {
			font-size: 20px;
		}
		.label-ranges {
			font-size: 20px;
		}
		.no-select {
			-webkit-touch-callout: none;   /* отключает всплывающее меню на iOS */
			-webkit-user-select: none;     /* отключает выделение текста */
			-moz-user-select: none;
			-ms-user-select: none;
			user-select: none;

			/* Отключает системный "долгий тап → контекстное меню" */
			touch-action: manipulation;
		}
	`;

	constructor() {
		super();

		Object.assign(this, this.defaults);

		//
		this.sectorWidth = 30; // Ширина сектора
		this.widthTicksLine = 1; // Ширина линии делений
		// Размер поля
		this.viewBoxWidth = 200;
		this.viewBoxHeight = 200;

		// Значения для отрисовки шкалы
		this.gauge = {
			valueToDisplay: null,
			halfWidth: null,	// Половина ширины поля
			zeroOffsetRAD: null, // Смещение нуля в радианах
			radiusPin: 20,
			pointsClockHand: null, // Стрелка
			// Деления
			majorTicksRadius: null, // Радиус
			majorTicksCircumference: null, // Длина окружности
			majorAngleToArc: null, // Длина окружности в 1 градусе

			// #gaugeStyleUpdate()
			// Тип шкалы
			angle: null,
			heightViewBox: null,
			valuePosition: null,
			unitsPosition: null,
			pointStart: null,
			pointEnd: null,

			sectors: null,

			// #gaugeValueUpdate()
			angleValue: null,
		};

		// Привязка для pointer
		this._boundGlobalPointerMove = this.#onGlobalPointerMove.bind(this);
		this._boundGlobalPointerUp = this.#onGlobalPointerUp.bind(this);
	  
		// Привязка для touch
		this._boundTouchMove = this.#onTouchMove.bind(this);
		this._boundTouchEnd = this.#onTouchEnd.bind(this);

		this.#gaugeCalculate();
		this.#gaugeStyleUpdate();
		this.#gaugeSectorUpdate();
		this.#gaugeValueUpdate();
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

	set minmax(value) {
		this.minValue = value[0];
		this.maxValue = value[1];
		this._minmax = value;
	}
	get minmax() {
		return this._minmax;
	}

	set value(value) {
		if (isNaN(value)) {
			console.warn(`[${this.constructor.name}][value] Новое значение не является числом`);
			return;
		}
		if (value > this.maxValue || value < this.minValue) {
			return;
		}
		this._value = value;
	}
	get value() {
		return this._value;
	}

	#gaugeCalculate() {
		//this.gauge.fixedValue = this.fixed ? this.value.toFixed(this.fixed) : this.value;
		this.gauge.valueToDisplay = this.valueToDisplay ? this.valueToDisplay : this.value;

		this.gauge.halfWidth = this.viewBoxWidth / 2;	// Половина ширины поля
		this.gauge.radiusPin = this.sectorWidth / 4 + 2;

		this.gauge.zeroOffsetRAD = (this.zeroOffset * Math.PI) / 180;

		this.gauge.majorTicksRadius = this.viewBoxWidth / 2 - this.sectorWidth / 2;
		this.gauge.majorTicksCircumference = 2 * Math.PI * this.gauge.majorTicksRadius;
		this.gauge.majorAngleToArc = mathUtilities.mapRange(1, 0, 360, 0, this.gauge.majorTicksCircumference);

		this.gauge.pointsClockHand = `${this.gauge.halfWidth},${this.gauge.halfWidth + this.sectorWidth / 4} ${this.viewBoxWidth - this.sectorWidth / 2},${this.gauge.halfWidth} ${this.gauge.halfWidth},${this.gauge.halfWidth - this.sectorWidth / 4} ${this.gauge.halfWidth - this.sectorWidth / 2},${this.gauge.halfWidth - 3} ${this.gauge.halfWidth - this.sectorWidth / 2},${this.gauge.halfWidth + 3}`;
	}

	#gaugeStyleUpdate() {
		const styles = {
            full: {
                angle: 0,
                heightViewBox: this.viewBoxHeight,
                valuePosition: [this.gauge.halfWidth, this.sectorWidth + (this.gauge.halfWidth - this.gauge.radiusPin - this.sectorWidth) / 2, 0, 15], // 36 / 4 + 6 = 15
                unitsPosition: [this.gauge.halfWidth, (this.gauge.halfWidth + this.gauge.radiusPin) + ((this.viewBoxWidth - this.sectorWidth) - (this.gauge.halfWidth + this.gauge.radiusPin)) / 2, 0, 5] // 20 / 4 = 5
            },
            half: {
                angle: 180,
                heightViewBox: this.viewBoxHeight / 2 + 20,
                valuePosition: [this.gauge.halfWidth, this.sectorWidth + (this.gauge.halfWidth - this.gauge.radiusPin - this.sectorWidth) / 2, 0, 9 + (this.units ? 0 : 6)], // 36 / 4 = 9
                unitsPosition: [this.gauge.halfWidth, this.gauge.halfWidth - this.gauge.radiusPin, 0, -5]
            },
            arc: {
                angle: 90,
                heightViewBox: this.viewBoxHeight,
                valuePosition: ["50%", this.viewBoxWidth - this.sectorWidth, 0, 9], // 36 / 4 = 9
                unitsPosition: [this.gauge.halfWidth, this.sectorWidth + (this.gauge.halfWidth - this.gauge.radiusPin - this.sectorWidth) / 2, 0, 7] // 20 / 4 + 2 = 7
            }
        };
        Object.assign(this.gauge, styles[this.gaugeStyle] || styles.full);
		
		this.gauge.pointStart = this.gauge.angle / 2; // Начало сектора
		this.gauge.pointEnd = 360 - this.gauge.angle; // Конец сектора
		console.log(this.gauge.pointStart, this.gauge.pointEnd);
	}

	#gaugeSectorUpdate() {
		if (!Array.isArray(this.sectors)) {
			console.warn('sectors должен быть массивом');
			return;
		}

		let sectorIndex = 0;
		let widthTicksStart = this.widthTicksLine;
		let widthTicksEnd = this.widthTicksLine;

		const normalizedSectors = this.sectors.map(([start, end, color]) => {
			if (this.gaugeStyle != 'full') {
				if (sectorIndex == 0) {
					widthTicksStart = 0;
				} else if (sectorIndex == this.sectors.length - 1) {
					widthTicksEnd = 0;
				}
			}
			const startNorm = Math.max(this.minValue, Math.min(start, this.maxValue));
			const endNorm = Math.max(this.minValue, Math.min(end, this.maxValue));
			
			// Вычисление смещений для dasharray
			const fillStart = mathUtilities.mapRange(startNorm, this.minValue, this.maxValue, this.gauge.pointStart, 360 - this.gauge.pointStart) + widthTicksStart;
			const fillEnd = mathUtilities.mapRange(endNorm, this.minValue, this.maxValue, this.gauge.pointStart, 360 - this.gauge.pointStart) - widthTicksEnd;

			sectorIndex++;

			return {
				//start: Math.min(startNorm, endNorm),
				//end: Math.max(startNorm, endNorm),
				fillStart,
				fillEnd,
				color
			};
		});

		// Сохранение результатов
		this.gauge.sectors = normalizedSectors.map(({fillStart, fillEnd, color}) => [fillStart, fillEnd, color]);
	}


	#gaugeValueUpdate() {
		const valueNorm = Math.max(this.minValue, Math.min(this.maxValue, this.value)); 
		this.gauge.angleValue = mathUtilities.mapRange(valueNorm, this.minValue, this.maxValue, this.gauge.pointStart, 360 - this.gauge.pointStart);
	}

	#gaugeAnimate() {
		// Анимация стрелки
		this.$('#hand')?.animate(
			[
				{
					transformOrigin: `${this.gauge.halfWidth}px ${this.gauge.halfWidth}px`
				},
				{
					transform: `rotate(${this.gauge.angleValue}deg)`,
					transformOrigin: `${this.gauge.halfWidth}px ${this.gauge.halfWidth}px`
				}
			],
			{
				duration: 1000,
				easing: 'ease',
				fill: 'forwards'
			}
		);
	}

	willUpdate(changedProperties) {
		// Метод .every() (для "все"), .some() (для "хотя бы один"):
		if (['value', 'valueToDisplay'].some(key => changedProperties.has(key))) {
			this.#gaugeCalculate();
			this.#gaugeValueUpdate();
		}
		// Если изменился тип шкалы
		if (['gaugeStyle', 'minmax'].some(key => changedProperties.has(key))) {
			this.#gaugeStyleUpdate();
			this.#gaugeSectorUpdate();
			this.#gaugeValueUpdate();
		}
	}

	render() {
		return this.#templateGauge();
	}

	connectedCallback() {
		super.connectedCallback();
		// Изменение размеров под родителя, если значения равны 0.
		this.size = [
			this._size[0] || this.parentElement?.innerSize[0],
			this._size[1] || this.parentElement?.innerSize[1]
		];
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		
		this.activePointerId = null;
	}

	firstUpdated() {
		
	}

	updated(changedProperties) {
		this.#gaugeAnimate();
	}

	#onPointerDown(event) {
		event.preventDefault();

		// Запоминаем ID
		this.activePointerId = event.pointerId;

		// ЗАХВАТЫВАЕМ указатель!
		//this.thumb.setPointerCapture(event.pointerId);
		//const target = event.currentTarget;
		// if (typeof target.setPointerCapture === 'function') {
		// 	target.setPointerCapture(event.pointerId);
		// }
		//this.thumb = target; // сохраняем актуальный элемент
		//console.log(this.thumb);
	  
		// Вешаем ГЛОБАЛЬНЫЕ слушатели
		window.addEventListener('pointermove', this._boundGlobalPointerMove, { passive: false });
		window.addEventListener('pointerup', this._boundGlobalPointerUp, { once: true });
		window.addEventListener('pointercancel', this._boundGlobalPointerUp, { once: true });

		//
		const circleRect = this.getBoundingClientRect();
    	this.centerX = circleRect.left + this.gauge.halfWidth;
    	this.centerY = circleRect.top + this.gauge.halfWidth;
    	this.radius = this.gauge.majorTicksRadius;

		document.getElementById('log').innerHTML = `down`;
	}

	#onGlobalPointerMove(event) {
		if (event.pointerId !== this.activePointerId) return;
		event.preventDefault();

		const dx = event.clientX - this.centerX;
		const dy = event.clientY - this.centerY;
		// Стандартный угол от оси X (против ЧС)
		let angleMath = Math.atan2(dy, dx);
		// Преобразуем в угол по часовой стрелке от выбранного нуля
		let relativeAngle = ((angleMath - this.gauge.zeroOffsetRAD) + (2 * Math.PI)) % (2 * Math.PI);
		if (relativeAngle < 0) relativeAngle += 2 * Math.PI;

		const angleDeg = (relativeAngle * 180) / Math.PI;

		//console.log(Math.round(angleDeg) + '°');
		document.getElementById('log').innerHTML = `${Math.round(angleDeg)} °`;

		const anglDegNorm = mathUtilities.mapRange(angleDeg, 0, 360, this.gauge.pointStart, 360 - this.gauge.pointStart);
		console.log(anglDegNorm);

		this.$('#gthumb').style.transform = `rotate(${anglDegNorm}deg)`;
		this.$('#gthumb').style.transformOrigin = `${this.gauge.halfWidth}px ${this.gauge.halfWidth}px`;
	}

	#onGlobalPointerUp(event) {
		// Игнорируем другие указатели
		if (event.pointerId !== this.activePointerId) return;
		
		// Освобождаем захват
		//if (this.thumb?.releasePointerCapture) {
			//this.thumb.releasePointerCapture(this.activePointerId);
		//}
		
		// Убираем move-слушатель
		window.removeEventListener('pointermove', this.#onGlobalPointerMove);
		
		this.activePointerId = null;
		document.getElementById('log').innerHTML = `up`;
	}

	#onTouchStart(event) {
		// Отключаем скролл и долгий тап
		event.preventDefault();
	  
		// Берём первый тач
		const touch = event.changedTouches[0];
		this.activeTouchId = touch.identifier;
		this.startX = touch.clientX;
		this.startY = touch.clientY;
	  
		// Вешаем глобальные слушатели на window
		window.addEventListener('touchmove', this._boundTouchMove, { passive: false });
		window.addEventListener('touchend', this._boundTouchEnd, { once: true });
		window.addEventListener('touchcancel', this._boundTouchEnd, { once: true });
	  
		document.getElementById('log').innerHTML = `touch down`;
	}
	  
	#onTouchMove(event) {
		event.preventDefault();

		const touch = Array.from(event.changedTouches).find(t => t.identifier === this.activeTouchId);
		if (!touch) return;

		const dx = touch.clientX - this.centerX;
		const dy = touch.clientY - this.centerY;
		// Стандартный угол от оси X (против ЧС)
		let angleMath = Math.atan2(dy, dx);
		// Преобразуем в угол по часовой стрелке от выбранного нуля
		let relativeAngle = ((angleMath - this.gauge.zeroOffsetRAD) + (2 * Math.PI)) % (2 * Math.PI);
		if (relativeAngle < 0) relativeAngle += 2 * Math.PI;

		const angleDeg = (relativeAngle * 180) / Math.PI;

		//console.log(Math.round(angleDeg) + '°');
		document.getElementById('log').innerHTML = `${Math.round(angleDeg)} °`;

		this.$('#gthumb').style.transform = `rotate(${angleDeg}deg)`;
		this.$('#gthumb').style.transformOrigin = `${this.gauge.halfWidth}px ${this.gauge.halfWidth}px`;
	}

	#onTouchEnd(event) {
		const touch = Array.from(event.changedTouches).find(t => t.identifier === this.activeTouchId);
		if (!touch) return;

		window.removeEventListener('touchmove', this._boundTouchMove);
		this.activeTouchId = null;
		document.getElementById('log').innerHTML = `touch up`;
	}

	#templateGauge() {
		return svg`
		<svg viewBox="0 0 ${this.viewBoxWidth} ${this.gauge.heightViewBox}">
			<!-- Цветные сектора -->
			<g id="gauge-sections" fill="none" stroke-width="${this.sectorWidth}" transform="rotate(${this.zeroOffset} ${this.gauge.halfWidth} ${this.gauge.halfWidth})">
				${this.gauge.sectors.map(
					(item) => svg`
						<circle
							cx="${this.gauge.halfWidth}"
							cy="${this.gauge.halfWidth}"
							r="${this.gauge.majorTicksRadius}"
							stroke-dasharray="0 ${item[0] * this.gauge.majorAngleToArc} ${(item[1] - item[0]) * this.gauge.majorAngleToArc} ${this.gauge.majorTicksCircumference}"
							stroke="${item[2]}"
						/>
					`
				)}
			</g>
			<g id="gauge-scale" transform="rotate(${this.zeroOffset} ${this.gauge.halfWidth} ${this.gauge.halfWidth})">
				<g id="gthumb">
					<!-- Ручка -->
					<circle
						id="thumb"
						cx="${this.gauge.halfWidth + this.gauge.majorTicksRadius}"
						cy="${this.gauge.halfWidth}"
						fill="var(--color-gray-800)"
						r="${this.gauge.radiusPin}"
						stroke-width="1" 
						stroke="var(--color-gray-400)"
						@pointerdown=${this.#onPointerDown}
						@touchstart=${this.#onTouchStart}
						@contextmenu=${(e) => e.preventDefault()}
						@selectstart=${(e) => e.preventDefault()}
					/>
				</g>
				<g>
					<!-- Стрелка -->
					<polygon
						id="hand"
						points="${this.gauge.pointsClockHand}"
						fill="var(--color-red-300)"
						stroke-width="1"
						stroke="var(--color-gray-800)"
						stroke-opacity="0.3"
						fill-opacity="0.8"
					/>
					<!-- Гвоздик -->
					<circle
						cx="${this.gauge.halfWidth}"
						cy="${this.gauge.halfWidth}"
						fill="var(--color-gray-800)"
						r="${this.gauge.radiusPin}"
						stroke-width="1" 
						stroke="var(--color-gray-400)"
					/>
				</g>
				<!-- Маска выреза -->
				<mask id="mask-gauge" fill="#fff">
					<circle
						cx="${this.gauge.halfWidth}"
						cy="${this.gauge.halfWidth}"
						r="${this.gauge.majorTicksRadius}"
						stroke-dasharray="0 ${(this.gauge.pointStart - 0.5) * this.gauge.majorAngleToArc} ${(this.gauge.pointEnd + 1) * this.gauge.majorAngleToArc} ${this.gauge.majorTicksCircumference}"
						stroke="#fff"
						stroke-width="${this.sectorWidth + 1}"
						fill="none"
					/>
				</mask>
			</g>
			<!-- Текущее значение в цифре -->
			${this.visibleValueOff ? `` : svg`
			<g fill="var(--colorValue)">
				<text id="digit-value" x="${this.gauge.valuePosition[0]}" y="${this.gauge.valuePosition[1]}" dx="${this.gauge.valuePosition[2]}" dy="${this.gauge.valuePosition[3]}" text-anchor="middle" class="value">
					${this.gauge.valueToDisplay}
				</text>
				<text x="${this.gauge.unitsPosition[0]}" y="${this.gauge.unitsPosition[1]}" dx="${this.gauge.unitsPosition[2]}" dy="${this.gauge.unitsPosition[3]}" text-anchor="middle" class="units">
					${this.units}
				</text>
			</g>
			`}
			${this.visibleRangeOff ? `` : svg`
			<!-- Мин/Макс значения -->
			<g fill="var(--colorValue)">
				<text x="0" y="100%" dx="0" dy="0" text-anchor="start" class="label-ranges">${this.minValue}</text>
				<text x="100%" y="100%" dx="0" dy="0" text-anchor="end" class="label-ranges">${this.maxValue}</text>
			</g>
			`}
		</svg>
		`;
	}

}

customElements.define('bui-range2', BUIRange2);