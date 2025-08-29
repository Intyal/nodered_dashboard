import { html, svg } from '../lit-html.js';
import { WidgetBase } from "./WidgetBase.js";

class BuiGaugeCircle2 extends WidgetBase {
	static properties = {
		// Размер в сетке. Переопределяет свойства width и height.
		size: {	type: String, noRender: true, parser: (value) => value.split(' ').map(Number) },
		// Позиция в сетке. Переопределяет свойства left и top.
		position: {	type: String, noRender: true, parser: (value) => value.split(' ').map(Number) },
		// Позиция по горизонтали (старт столбца). Отражается в CSS-переменной `--left`.
		left: { type: Number, watched: false, cssVar: true, noRender: true },
		// Ширина ячейки в единицах сетки. Отражается в CSS-переменной `--width`.
		width: { type: Number, watched: false, cssVar: true, noRender: true },
		// Позиция по вертикали (старт строки). Отражается в CSS-переменной `--top`.
		top: { type: Number, watched: false, cssVar: true, noRender: true },
		// Высота ячейки в единицах сетки. Отражается в CSS-переменной `--height`.
		height: { type: Number, watched: false, cssVar: true, noRender: true },
		// Число для отображения.
		value: { type: Number, reflect: true },
		// Количество знаков после запятой при отображении.
		fixed: { type: Number },
		// Единицы измерения
		units: { type: String },
		// Минимальное значение
		minValue: { attribute: 'min-value', type: Number },
		// Максимальное значение
		maxValue: { attribute: 'max-value', type: Number },
		// Тип шкалы
		gaugeStyle: { attribute: 'gauge-style', type: String },
		// Цвета секторов: [[start, end, color], ...]
		sectors: { type: Array },
		// Отображать ли значение
		visibleValueOff: { attribute: 'visible-value-off', type: Boolean },
		// Отображать ли диапазоны
		visibleRangeOff: { attribute: 'visible-range-off', type: Boolean },
	}

	static styles = `
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

		//this.debug = true;

		this.position = '0 0';
		this.size = '3 3';
		this.value = 0;
		this.fixed = 0;
		this.units = '';
		this.minValue = 0;
		this.maxValue = 100;
		this.gaugeStyle = '34';
		this.sectors = [[0, 10, "var(--color-red-200)"], [10, 40, "var(--color-orange-300)"], [40, 80, "var(--color-green-400)"], [80, 100, "var(--color-lime-500)"]];
		this.visibleValueOff = false;
		this.visibleRangeOff = false;

		//
		this.sectorWidth = 30; // Ширина сектора
		this.widthTicksLine = 1; // Ширина линии делений
		// Размер поля
		this.viewBoxWidth = 200;
		this.viewBoxHeight = 200;

		// Вычисление значений для отрисовки шкалы
		this._gauge = {
			// #gaugeCalculate()
			fixedValue: null, // Значение, которое будет отображено.
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

			majorTicksLine: null,
			sectors: null,

			// #gaugeValueUpdate()
			angleValue: null,
		};

		this.#gaugeCalculate();
		this.#gaugeStyleUpdate();
		this.#gaugeSectorUpdate();
		this.#gaugeValueUpdate();
	}

	#gaugeCalculate() {
		this._gauge.fixedValue = this.fixed ? this.value.toFixed(this.fixed) : this.value;

		this._gauge.halfWidth = this.viewBoxWidth / 2;	// Половина ширины поля
		this._gauge.radiusPin = this.sectorWidth / 4 + 2;

		this._gauge.majorTicksRadius = this.viewBoxWidth / 2 - this.sectorWidth / 2;
		this._gauge.majorTicksCircumference = 2 * Math.PI * this._gauge.majorTicksRadius;
		this._gauge.majorAngleToArc = this.mapRange(1, 0, 360, 0, this._gauge.majorTicksCircumference);

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
            "12": {
                angle: 180,
                heightViewBox: this.viewBoxHeight / 2 + 20,
                valuePosition: [this._gauge.halfWidth, this.sectorWidth + (this._gauge.halfWidth - this._gauge.radiusPin - this.sectorWidth) / 2, 0, 9 + (this.units ? 0 : 6)], // 36 / 4 = 9
                unitsPosition: [this._gauge.halfWidth, this._gauge.halfWidth - this._gauge.radiusPin, 0, -5]
            },
            "34": {
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

		let majorTicksLine = "0";
		let currentOffset = 0;

		const normalizedSectors = this.sectors.map(([start, end, color]) => {
			const startNorm = Math.max(this.minValue, Math.min(start, this.maxValue));
			const endNorm = Math.max(this.minValue, Math.min(end, this.maxValue));
			
			// Вычисление смещений для dasharray
			const fillStart = this.mapRange(startNorm, this.minValue, this.maxValue, this._gauge.pointStart, 360 - this._gauge.pointStart);
			const fillEnd = this.mapRange(endNorm, this.minValue, this.maxValue, this._gauge.pointStart, 360 - this._gauge.pointStart);

			// Формирование dasharray для текущего сектора
			const arcLengthStart = (fillStart - currentOffset) * this._gauge.majorAngleToArc - (currentOffset ? this.widthTicksLine : 0);
			majorTicksLine += ` ${arcLengthStart} ${this.widthTicksLine}`;
			currentOffset = fillStart;

			return {
				//start: Math.min(startNorm, endNorm),
				//end: Math.max(startNorm, endNorm),
				fillStart,
				fillEnd,
				color
			};
		});
		//console.log('normalizedSectors', normalizedSectors);

		// Добавление завершающего значения
		majorTicksLine += ` ${this._gauge.majorTicksCircumference}`;

		// Сохранение результатов
		this._gauge.sectors = normalizedSectors.map(({fillStart, fillEnd, color}) => [fillStart, fillEnd, color]);
		this._gauge.majorTicksLine = majorTicksLine;
	}


	#gaugeValueUpdate() {
		
		const valueNorm = Math.max(this.minValue, Math.min(this.maxValue, this.value)); 

		this._gauge.angleValue = this.mapRange(valueNorm, this.minValue, this.maxValue, this._gauge.pointStart, 360 - this._gauge.pointStart);
		
	}

	_gaugeAnimate() {
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

	render() {

		return this.templateGauge();
	}

	// Хук, вызываемый после обновления свойства (при `noRender: true`). Не вызывает render(), не обновляет DOM.
	afterPropertyUpdate(key, newValue, oldValue) {
		if (key === 'size') {
			[this.width, this.height] = this.size;
		}
		if (key === 'position') {
			[this.left, this.top] = this.position;
		}
	}

	// Хук: вызывается перед рендером.
	beforeUpdate(changedProperties) {
		if (['value', 'fixed', 'minValue', 'maxValue'].some(key => changedProperties.has(key))) {
			this.#gaugeCalculate();
			this.#gaugeValueUpdate();
		}
		// Если изменился тип шкалы
		if (['gaugeStyle'].some(key => changedProperties.has(key))) {
			this.#gaugeStyleUpdate();
			this.#gaugeSectorUpdate();
			this.#gaugeValueUpdate();
		}
	}

	// Хук: вызывается после рендера.
	afterUpdate(changedProperties) {
		this._gaugeAnimate();
	}

	templateGauge() {

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
				<circle
					cx="${this._gauge.halfWidth}"
					cy="${this._gauge.halfWidth}"
					r="${this._gauge.majorTicksRadius}"
					stroke-width="${this.sectorWidth}" 
					stroke-dasharray="${this._gauge.majorTicksLine}"
					stroke-dashoffset="1"
					stroke="var(--color-gray-50)"
					fill="none"
					stroke-opacity="1"
				/>
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
			<g fill="var(--bui-widget-color)">
				<text id="digit-value" x="${this._gauge.valuePosition[0]}" y="${this._gauge.valuePosition[1]}" dx="${this._gauge.valuePosition[2]}" dy="${this._gauge.valuePosition[3]}" text-anchor="middle" class="value">
					${this._gauge.fixedValue}
				</text>
				<text x="${this._gauge.unitsPosition[0]}" y="${this._gauge.unitsPosition[1]}" dx="${this._gauge.unitsPosition[2]}" dy="${this._gauge.unitsPosition[3]}" text-anchor="middle" class="units">
					${this.units}
				</text>
			</g>
			`}
			${this.visibleRangeOff ? `` : svg`
			<!-- Мин/Макс значения -->
			<g fill="var(--bui-widget-color)">
				<text x="0" y="100%" dx="0" dy="0" text-anchor="start" class="label-ranges">${this.minValue}</text>
				<text x="100%" y="100%" dx="0" dy="0" text-anchor="end" class="label-ranges">${this.maxValue}</text>
			</g>
			`}
		</svg>
		`;
	}

	// Линейное преобразование
	mapRange(value, inMin, inMax, outMin, outMax) {
		// Проверка на деление на ноль
		if (inMin === inMax) {
			throw new Error("Входной диапазон не может быть нулевым (inMin === inMax)");
		}
		// Вычисляем процент значения value относительно входного диапазона
		const percent = (value - inMin) / (inMax - inMin);
		
		// Применяем этот процент к выходному диапазону
		return outMin + (outMax - outMin) * percent;
	}

}

BuiGaugeCircle2.register();