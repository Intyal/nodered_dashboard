import { html, css } from '../js/lit-all.min.js';
import { BUIBaseWidget, mathUtilities } from '../js/bui-base-widget.js';

export class BUIPage extends BUIBaseWidget {
	static defaults = {
		numberOfCells: 20,
		innerSize: [20, 1],
	};
	
	static properties = {
		// Количество ячейки на странице по горизонтали. Отражается в CSS-переменной `--number-cells`.
		numberOfCells: {
			attribute: 'number-cells',
			type: Number
		},
		innerSize: {
			type: Array,
			state: true,
		},
		active: {
			type: Boolean,
			reflect: true,
		},
	};

	static styles = css`
		:host {
			--bui-background-cell-size: calc(100dvw / var(--number-cells));
			--page-atom-size: calc(var(--bui-background-cell-size) / 5);
			
			display: none;
			width: 100%;

			font-size: var(--page-atom-size);
			font-family: var(--bui-font-family);
			font-weight: 200;
			letter-spacing: -0.1em;
		}
		:host([active]) {
			display: flex;
		}
		#page {
			flex-grow: 1;

			display: grid;
			grid-auto-flow: row;
			grid-template-columns: repeat(auto-fill, var(--bui-background-cell-size));
			grid-template-rows: repeat(auto-fill, var(--bui-background-cell-size));
			grid-auto-rows: var(--bui-background-cell-size);
			gap: 0px;

			background: var(--bui-page-background-color);
		}
  `;

	constructor() {
		super();

		Object.assign(this, this.defaults);
	}

	set numberOfCells(value) {
		if (isNaN(value)) {
			console.warn(`[${this.constructor.name}][numberOfCells] Новое значение не является числом`);
			return;
		}
		if (!mathUtilities.isInRange(value, 1, 128)) {
			console.warn(`[${this.constructor.name}][numberOfCells] Новое значение не входит в диапазон от 1 до 128`);
		}
		this.updatingCustomVariables(['--number-cells'], [Math.ceil(value)]);
		this._numberOfCells = Math.ceil(value);
		this.innerSize = [this._numberOfCells, 1];
	}
	get numberOfCells() {
		return this._numberOfCells;
	}

	firstUpdated() {
		if (this.slot === 'pages') {
			// Проверяем, выбрана ли эта страница
			const selectedPage = window.localStorage.getItem(`${window.location.pathname}selectedPage`);
			if (selectedPage) {
				if (selectedPage === this.id) {
					this.active = true;
					this.activeLabels(this.id);
				}
			} else {
				// Если никакая страница не выбрана
				this.active = true;
				this.activeLabels(this.id);
				
				// Записываем выбранную страницу в localStorage
				window.localStorage.setItem(`${window.location.pathname}selectedPage`, this.id);
			}
		}
	}

	render() {
		return html`
			<div part="page" id="page">
				<slot></slot>
			</div>
		`;
	}

	connectedCallback() {
		super.connectedCallback();
		
		// Скрыть/показать страницу
		if (this.slot === 'pages') {
			this.handleTopicSet = event => { // сохраняем обработчик как свойство класса
				if (event.detail.page === this.id) {
					//console.log(event.detail, this.id);
					if (!this.active) {
						this.active = true;
						this.activeLabels(this.id);
						
						// Записываем выбранную страницу в localStorage
						window.localStorage.setItem(`${window.location.pathname}selectedPage`, this.id);
					}
				} else {
					this.active = false;
				}
			};
			
			document.addEventListener('bui-select-page', this.handleTopicSet);
		}
	}
	
	disconnectedCallback() {
		if (this.slot === 'pages') {
			document.removeEventListener('bui-select-page', this.handleTopicSet);
			delete this.handleTopicSet;
		}
		
		super.disconnectedCallback();
	}

	activeLabels(pageId) {
		// Ставим/убираем атрибут active для всех элементов с классом bookmarks в bui-page slot="bookmarks"
		const labelsAll = document.querySelectorAll('.bookmark-a-page');
		labelsAll.forEach(label => {
			label.removeAttribute('active')
		});
		//console.log(labelsAll);
		const labelsSelected = document.querySelectorAll(`.bookmark-a-page.${pageId}`);
		labelsSelected.forEach(label => {
			label.setAttribute('active', '');
		});
		//console.log(labelsSelected);
	}
}

customElements.define('bui-page', BUIPage);