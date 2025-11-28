import { svg, css } from '../js/lit-all.min.js';
import { BUIBaseWidget, mathUtilities } from '../js/bui-base-widget.js';

class BUIRange2 extends BUIBaseWidget {
	static defaults = {
		size: [2, 2],
		position: [0, 0],
		minmax: [0, 100],
		value: 0,
		valueToDisplay : undefined,
		units: '',
		zeroOffset: 90,
		gaugeStyle: 'arc',
		sectors: [
			[0, 50, "var(--color-red-200)"],
			[50, 100, "var(--color-lime-500)"]
		],
		visibleRangeOff: false,
		visibleValueOff: false,
		minValue: 0,
		maxValue: 100,
	};

}

customElements.define('bui-range2', BUIRange2);