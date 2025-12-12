import { svg, css } from '../js/lit-all.min.js';
import { BUIBaseWidget, mathUtilities } from '../js/bui-base-widget.js';

class BuiGaugeCircle2 extends BUIBaseWidget {
	static defaults = {
		size: [2, 2],
		position: [0, 0],
		minmax: [0, 100],
		value: 0,
		valueToDisplay : undefined,
		//fixed: 0,
		units: '',
		gaugeStyle: 'arc',
		sectors: [[0, 50, "var(--color-red-200)"], [50, 100, "var(--color-lime-500)"]],
		visibleRangeOff: false,
		visibleValueOff: false,
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

		// Вычисление значений для отрисовки шкалы
		this._gauge = {
			// #gaugeCalculate()
			//fixedValue: null, // Значение, которое будет отображено.
			valueToDisplay: null,
			halfWidth: null,	// Половина ширины поля
			radiusPin: null,
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

	set value(value) {
		if (isNaN(value)) {
			console.warn(`[${this.constructor.name}][value] Новое значение не является числом`);
			return;
		}
		this._value = value;
	}
	get value() {
		return this._value;
	}

	#gaugeCalculate() {
		//this._gauge.fixedValue = this.fixed ? this.value.toFixed(this.fixed) : this.value;
		this._gauge.valueToDisplay = this.valueToDisplay ? this.valueToDisplay : this.value;

		this._gauge.halfWidth = this.viewBoxWidth / 2;	// Половина ширины поля
		this._gauge.radiusPin = this.sectorWidth / 4 + 2;

		this._gauge.majorTicksRadius = this.viewBoxWidth / 2 - this.sectorWidth / 2;
		this._gauge.majorTicksCircumference = 2 * Math.PI * this._gauge.majorTicksRadius;
		this._gauge.majorAngleToArc = mathUtilities.mapRange(1, 0, 360, 0, this._gauge.majorTicksCircumference);

		this._gauge.pointsClockHand = `${this._gauge.halfWidth},${this._gauge.halfWidth + this.sectorWidth / 4} ${this.viewBoxWidth - this.sectorWidth / 2},${this._gauge.halfWidth} ${this._gauge.halfWidth},${this._gauge.halfWidth - this.sectorWidth / 4} ${this._gauge.halfWidth - this.sectorWidth / 2},${this._gauge.halfWidth - 3} ${this._gauge.halfWidth - this.sectorWidth / 2},${this._gauge.halfWidth + 3}`;
	}

	#gaugeStyleUpdate() {
		const styles = {
            full: {
                angle: 0,
                heightViewBox: this.viewBoxHeight,
                valuePosition: [this._gauge.halfWidth, this.sectorWidth + (this._gauge.halfWidth - this._gauge.radiusPin - this.sectorWidth) / 2, 0, 15], // 36 / 4 + 6 = 15
                unitsPosition: [this._gauge.halfWidth, (this._gauge.halfWidth + this._gauge.radiusPin) + ((this.viewBoxWidth - this.sectorWidth) - (this._gauge.halfWidth + this._gauge.radiusPin)) / 2, 0, 5] // 20 / 4 = 5
            },
            half: {
                angle: 180,
                heightViewBox: this.viewBoxHeight / 2 + 20,
                valuePosition: [this._gauge.halfWidth, this.sectorWidth + (this._gauge.halfWidth - this._gauge.radiusPin - this.sectorWidth) / 2, 0, 9 + (this.units ? 0 : 6)], // 36 / 4 = 9
                unitsPosition: [this._gauge.halfWidth, this._gauge.halfWidth - this._gauge.radiusPin, 0, -5]
            },
            arc: {
                angle: 90,
                heightViewBox: this.viewBoxHeight,
                valuePosition: ["50%", this.viewBoxWidth - this.sectorWidth, 0, 9], // 36 / 4 = 9
                unitsPosition: [this._gauge.halfWidth, this.sectorWidth + (this._gauge.halfWidth - this._gauge.radiusPin - this.sectorWidth) / 2, 0, 7] // 20 / 4 + 2 = 7
            }
        };
        Object.assign(this._gauge, styles[this.gaugeStyle] || styles.full);
		
		this._gauge.pointStart = this._gauge.angle / 2; // Начало сектора
		this._gauge.pointEnd = 360 - this._gauge.angle; // Конец сектора
	}

	#gaugeSectorUpdate() {
		if (!Array.isArray(this.sectors)) {
			console.warn('sectors должен быть массивом');
			return;
		}

		this.minValue = this.minmax[0];
		this.maxValue = this.minmax[1];

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
			const fillStart = mathUtilities.mapRange(startNorm, this.minValue, this.maxValue, this._gauge.pointStart, 360 - this._gauge.pointStart) + widthTicksStart;
			const fillEnd = mathUtilities.mapRange(endNorm, this.minValue, this.maxValue, this._gauge.pointStart, 360 - this._gauge.pointStart) - widthTicksEnd;

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
		this._gauge.sectors = normalizedSectors.map(({fillStart, fillEnd, color}) => [fillStart, fillEnd, color]);
	}


	#gaugeValueUpdate() {
		const valueNorm = Math.max(this.minValue, Math.min(this.maxValue, this.value)); 
		this._gauge.angleValue = mathUtilities.mapRange(valueNorm, this.minValue, this.maxValue, this._gauge.pointStart, 360 - this._gauge.pointStart);
	}

	#gaugeAnimate() {
		// Анимация стрелки
		this.$('#hand')?.animate(
			[
				{
					transformOrigin: `${this._gauge.halfWidth}px ${this._gauge.halfWidth}px`
				},
				{
					transform: `rotate(${this._gauge.angleValue}deg)`,
					transformOrigin: `${this._gauge.halfWidth}px ${this._gauge.halfWidth}px`
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

	updated(changedProperties) {
		this.#gaugeAnimate();
	}

	#templateGauge() {
		return svg`
		<svg viewBox="0 0 ${this.viewBoxWidth} ${this._gauge.heightViewBox}">
			<!-- Цветные сектора -->
			<g id="gauge-sections" fill="none" stroke-width="${this.sectorWidth}" transform="rotate(90 ${this._gauge.halfWidth} ${this._gauge.halfWidth})">
				${this._gauge.sectors.map(
					(item) => svg`
						<circle
							cx="${this._gauge.halfWidth}"
							cy="${this._gauge.halfWidth}"
							r="${this._gauge.majorTicksRadius}"
							stroke-dasharray="0 ${item[0] * this._gauge.majorAngleToArc} ${(item[1] - item[0]) * this._gauge.majorAngleToArc} ${this._gauge.majorTicksCircumference}"
							stroke="${item[2]}"
						/>
					`
				)}
			</g>
			<g id="gauge-scale" transform="rotate(90 ${this._gauge.halfWidth} ${this._gauge.halfWidth})">
				<!-- Риски -->
				
				<!-- Стрелка -->
				<polygon
					id="hand"
					points="${this._gauge.pointsClockHand}"
					fill="var(--color-red-300)"
					stroke-width="1"
					stroke="var(--color-gray-800)"
					stroke-opacity="0.3"
					fill-opacity="0.8"
				/>
				<!-- Гвоздик -->
				<circle
					cx="${this._gauge.halfWidth}"
					cy="${this._gauge.halfWidth}"
					fill="var(--color-gray-800)"
					r="${this._gauge.radiusPin}"
					stroke-width="1" 
					stroke="var(--color-gray-400)"
				/>
				<!-- Маска выреза -->
				<mask id="mask-gauge" fill="#fff">
					<circle
						cx="${this._gauge.halfWidth}"
						cy="${this._gauge.halfWidth}"
						r="${this._gauge.majorTicksRadius}"
						stroke-dasharray="0 ${(this._gauge.pointStart - 0.5) * this._gauge.majorAngleToArc} ${(this._gauge.pointEnd + 1) * this._gauge.majorAngleToArc} ${this._gauge.majorTicksCircumference}"
						stroke="#fff"
						stroke-width="${this.sectorWidth + 1}"
						fill="none"
					/>
				</mask>
			</g>
			<!-- Текущее значение в цифре -->
			${this.visibleValueOff ? `` : svg`
			<g fill="var(--colorValue)">
				<text id="digit-value" x="${this._gauge.valuePosition[0]}" y="${this._gauge.valuePosition[1]}" dx="${this._gauge.valuePosition[2]}" dy="${this._gauge.valuePosition[3]}" text-anchor="middle" class="value">
					${this._gauge.valueToDisplay}
				</text>
				<text x="${this._gauge.unitsPosition[0]}" y="${this._gauge.unitsPosition[1]}" dx="${this._gauge.unitsPosition[2]}" dy="${this._gauge.unitsPosition[3]}" text-anchor="middle" class="units">
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

customElements.define('bui-gauge-circle2', BuiGaugeCircle2);