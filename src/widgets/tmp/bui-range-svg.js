import { svg, css } from '../js/lit-all.min.js';
import { BUIBaseWidget, mathUtilities } from '../js/bui-base-widget.js';

class BUIRange2 extends BUIBaseWidget {
	static defaults = {
		size: [2, 2],
		position: [0, 0],
		minValue: 0,
		maxValue: 100,
		value: 0,
		valueToDisplay : null,
		units: '',
		zeroOffset: 90,
		gaugeStyle: 'arc',
		sectors: [
			[0, 50, "var(--color-red-200)"],
			[50, 100, "var(--color-lime-500)"]
		],
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
		// Единицы измерения
		units: {
			type: String
		},
		// Минимальное и максимальное значение
		minValue: {
			attribute: 'min-value',
			type: Number,
		},
		maxValue: {
			attribute: 'max-value',
			type: Number,
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
	};

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
		.svg {
			width: 100%;
			height: 100%;
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

		// Размер поля
		this.viewBoxWidth = 200;
		this.viewBoxHeight = 200;
		this.halfWidth = this.viewBoxWidth / 2;
		//
		this.sectorWidth = 30; // Ширина сектора
		this.widthTicksLine = 1; // Ширина линии делений
		this.radiusPin = 10; // Радиус метки
		//
		this.pointsClockHand = `${this.halfWidth},${this.halfWidth + this.sectorWidth / 4} ${this.viewBoxWidth - this.sectorWidth / 2},${this.halfWidth} ${this.halfWidth},${this.halfWidth - this.sectorWidth / 4} ${this.halfWidth - this.sectorWidth / 2},${this.halfWidth - 3} ${this.halfWidth - this.sectorWidth / 2},${this.halfWidth + 3}`;

		this.styles = {
            full: {
                angle: 0,
                heightViewBox: this.viewBoxHeight,
				pointStart: 0, // Начало сектора (angle / 2)
				pointEnd: 360, // Конец сектора (360 - angle)
                valuePosition: {
					x: this.halfWidth,
					y: this.sectorWidth + (this.halfWidth - this.radiusPin - this.sectorWidth) / 2,
					dx: 0,
					dy: 15, // 36 / 4 + 6 = 15
				},
                unitsPosition: {
					x: this.halfWidth,
					y: (this.halfWidth + this.radiusPin) + ((this.viewBoxWidth - this.sectorWidth) - (this.halfWidth + this.radiusPin)) / 2,
					dx: 0,
					dy: 5, // 20 / 4 = 5
				},
            },
			arc: {
                angle: 90,
                heightViewBox: this.viewBoxHeight,
				pointStart: 45, // Начало сектора (angle / 2)
				pointEnd: 270, // Конец сектора (360 - angle)
                valuePosition: {
					x: "50%",
					y: this.viewBoxWidth - this.sectorWidth,
					dx: 0,
					dy: 9, // 36 / 4 = 9
				},
                unitsPosition: {
					x: this.halfWidth,
					y: this.sectorWidth + (this.halfWidth - this.radiusPin - this.sectorWidth) / 2,
					dx: 0,
					dy: 7, // 20 / 4 + 2 = 7
				},
            },
            half: {
                angle: 180,
                heightViewBox: this.viewBoxHeight / 2 + 20,
				pointStart: 90, // Начало сектора (angle / 2)
				pointEnd: 180, // Конец сектора (360 - angle)
                valuePosition: {
					x: this.halfWidth,
					y: this.sectorWidth + (this.halfWidth - this.radiusPin - this.sectorWidth) / 2,
					dx: 0,
					dy: 9 + (this.units ? 0 : 6), // 36 / 4 = 9
				},
                unitsPosition: {
					x: this.halfWidth,
					y: this.halfWidth - this.radiusPin,
					dx: 0,
					dy: -5,
				},
            },
        };

		// Значения для отрисовки шкалы
		this.gauge = {
			normalizedSectors: null,
			majorTicksRadius: null,
			majorTicksCircumference: null,
			majorAngleToArcnull: null,
			angleValue: null,
		};
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
		if (value > this.maxValue || value < this.minValue) {
			return;
		}
		this._value = value;
	}
	get value() {
		return this._value;
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
		
	}

	// Вызывается перед update() для вычисления значений, необходимых во время обновления.
	willUpdate(changedProperties) {
		//console.log(changedProperties);
		// Метод .every() (для "все"), .some() (для "хотя бы один"):
		if (['value', 'valueToDisplay'].some(key => changedProperties.has(key))) {
			this.#gaugeCalculate();
			this.#gaugeValueUpdate();
		}
		// Если изменился тип шкалы
		if (['gaugeStyle', 'minValue', 'maxValue'].some(key => changedProperties.has(key))) {
			this.#gaugeSectorUpdate();
			this.#gaugeValueUpdate();
		}
	}

	// Вызывается update() и должен быть реализован так, чтобы возвращать рендерируемый результат, используемый для рендеринга DOM компонента.
	render() {
		return this.#templateGauge();
	}

	// Вызывается после первого обновления DOM компонента, непосредственно перед вызовом updated().
	firstUpdated() {
		
	}

	// Вызывается, когда обновление компонента завершено и DOM элемента обновлен и отрендерен.
	updated(changedProperties) {
		this.#gaugeAnimate();
	}

	// -----

	#templateGauge() {
		// Трэк
		const track = svg`
			<line x1="0" y1="50%" x2="100%" y2="50%" stroke="var(--bui-background-line-color)" stroke-width="8" />
		`;
		// Ручка
		const thumbs = svg`
			<circle
				id="thumb"
				cx="25%"
				cy="50%"
				fill="var(--color-gray-800)"
				r="${this.radiusPin}"
				stroke-width="1" 
				stroke="var(--color-gray-400)"
			/>
		`;
		// Мин/Макс значения
		const minmaxText = svg`
			<g fill="var(--colorValue)"><g fill="var(--colorValue)">
				<text x="0" y="100%" dx="0" dy="0" text-anchor="start" class="label-ranges">${this.minValue}</text>
				<text x="100%" y="100%" dx="0" dy="0" text-anchor="end" class="label-ranges">${this.maxValue}</text>
			</g>
		`;

		return svg`
			<svg class="svg">
				${track}
				${thumbs}
				${this.visibleRangeOff ? `` : minmaxText}
			</svg>
		`;
	}

	#gaugeCalculate() {
		this.gauge.majorTicksRadius = this.viewBoxWidth / 2 - this.sectorWidth / 2;
		this.gauge.majorTicksCircumference = 2 * Math.PI * this.gauge.majorTicksRadius;
		this.gauge.majorAngleToArc = mathUtilities.mapRange(1, 0, 360, 0, this.gauge.majorTicksCircumference);
	}

	#gaugeValueUpdate() {
		const valueNorm = Math.max(this.minValue, Math.min(this.maxValue, this.value)); 
		this.gauge.angleValue = mathUtilities.mapRange(valueNorm, this.minValue, this.maxValue, this.styles[this.gaugeStyle].pointStart, 360 - this.styles[this.gaugeStyle].pointStart);
	}

	#gaugeSectorUpdate() {
		let widthTicksStart = this.widthTicksLine;
		let widthTicksEnd = this.widthTicksLine;

		//console.log(this.sectors);
		this.gauge.normalizedSectors = this.sectors.map(([start, end, color], index, array) => {
			if (this.styles[this.gaugeStyle].angle != 0) {
				if (index == 0) {
					widthTicksStart = 0;
				} else if (index === array.length - 1) {
					widthTicksEnd = 0;
				}
			}
			const startNorm = Math.max(this.minValue, Math.min(start, this.maxValue));
			const endNorm = Math.max(this.minValue, Math.min(end, this.maxValue));

			// Вычисление смещений для dasharray
			const fillStart = mathUtilities.mapRange(startNorm, this.minValue, this.maxValue, this.styles[this.gaugeStyle].pointStart, 360 - this.styles[this.gaugeStyle].pointStart) + widthTicksStart;
			const fillEnd = mathUtilities.mapRange(endNorm, this.minValue, this.maxValue, this.styles[this.gaugeStyle].pointStart, 360 - this.styles[this.gaugeStyle].pointStart) - widthTicksEnd;
			//console.log(this.styles[this.gaugeStyle].pointStart);
			const fillColor = color;

			return {
				fillStart,
				fillEnd,
				fillColor
			};
		});
	}

	#gaugeAnimate() {
		// Анимация стрелки
		this.$('#hand')?.animate(
			[
				{
					transformOrigin: `${this.halfWidth}px ${this.halfWidth}px`
				},
				{
					transform: `rotate(${this.gauge.angleValue}deg)`,
					transformOrigin: `${this.halfWidth}px ${this.halfWidth}px`
				}
			],
			{
				duration: 1000,
				easing: 'ease',
				fill: 'forwards'
			}
		);
	}

}

customElements.define('bui-range2', BUIRange2);