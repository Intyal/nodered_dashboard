import { html, css } from '../js/lit-all.min.js';
import { BUIBaseWidget, mathUtilities } from '../js/bui-base-widget.js';

export class BUIPage extends BUIBaseWidget {
	static properties = {
		// Количество ячейки на странице по горизонтали. Отражается в CSS-переменной `--number-cells`.
		numberOfCells: {
			attribute: 'number-cells',
			type: Number
		},
	};

	static styles = css`
		:host {
			--bui-background-cell-size: calc(100dvw / var(--number-cells));
			--bui-background-cell-height-count: 5;
			--page-atom-size: calc(var(--bui-background-cell-size) / 5);
			
			display: none;
			width: 100%;

			font-size: var(--page-atom-size);
			font-family: var(--bui-font-family);
			font-weight: 200;
			letter-spacing: -0.1em;
		}
		:host([active]) {
			display: block;
		}
		#page {
			display: grid;
			grid-auto-flow: row;
			grid-template-columns: repeat(auto-fill, var(--bui-background-cell-size));
			grid-template-rows: repeat(var(--bui-background-cell-height-count), var(--bui-background-cell-size));
			grid-auto-rows: var(--bui-background-cell-size);
			gap: 0px;

			background: var(--bui-page-background-color);
		}
  `;

	constructor() {
		super();

		this.numberOfCells = 20;
	}

	set numberOfCells(value) {
		if (isNaN(value)) {
			console.warn(`[${this.constructor.name}][numberOfCells] Новое значение не является числом`);
			return;
		}
		if (!mathUtilities.isInRange(value, 1, 128)) {
			console.warn(`[${this.constructor.name}][numberOfCells] Новое значение не входит в диапазон от 1 до 100`);
		}
		this.updatingCustomVariables(['--number-cells'], [Math.ceil(value)]);
		this._numberOfCells = Math.ceil(value);
	}
	get numberOfCells() {
		return this._numberOfCells;
	}

	render() {
		return html`
			<div part="page" id="page">
				<slot></slot>
			</div>
		`;
	}
}

customElements.define('bui-page', BUIPage);