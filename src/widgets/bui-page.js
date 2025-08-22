import { html } from '../lit-html.js';
import { WidgetBase } from "./WidgetBase.js";

class BuiPage extends WidgetBase {
	static properties = {
		// Количество ячейки на странице по горизонтали. Отражается в CSS-переменной `--number-cells`.
		numberOfCells: { attribute: 'number-cells', type: Number, cssVar: true, noRender: true },
	};

	static styles = `
		:host {
			display: none;
			width: 100%;
			font-size: var(--page-atom-size);
			font-family: var(--bui-font-family);
			font-weight: 200;
			letter-spacing: -0.1em;
			/*height: 100vh;*/
		}
		:host([active]) {
			display: block;
		}
		#page {
			--bui-background-cell-size: calc(100dvmin / var(--number-cells));
			--bui-background-cell-height-count: 5;
			
			display: grid;
			grid-auto-flow: row;
			grid-template-columns: repeat(auto-fill, var(--bui-background-cell-size));
			grid-template-rows: repeat(var(--bui-background-cell-height-count), var(--bui-background-cell-size));
			grid-auto-rows: var(--bui-background-cell-size);
			gap: 0px;

			background: var(--bui-page-background-color);
			/*height: 100%;*/
		}
  `;

	constructor() {
		super();

		this.debug = true;

		this.numberOfCells = 20;
	}

	render() {
		return html`
			<div part="page" id="page">
				<slot></slot>
			</div>
		`;
	}

}

BuiPage.register();