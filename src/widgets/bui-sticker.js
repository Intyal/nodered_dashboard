import { html, css } from '../js/lit-all.min.js';
import { BUIBaseWidget } from '../js/bui-base-widget.js';

export class BUISticker extends BUIBaseWidget {
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
			converter: (value, type) => {
				return value.split(' ').map(Number);
			}
		},
	};

	static styles = css`
    :host {
      grid-column-end: span var(--width);
      grid-row-end: span var(--height);
      grid-column-start: var(--left);
      grid-row-start: var(--top);

      display: grid;
      overflow: hidden;
      grid-auto-flow: row dense;
      grid-template-columns: repeat(var(--width), 1fr);
      grid-template-rows: repeat(var(--height), 1fr);
      gap: 0px;
	  box-sizing: border-box;

      border-radius: var(--bui-widget-border-radius, 0.5rem);
      padding: var(--padding, 8px);
      margin: var(--margin, 1px 2px);
      background: var(--bui-widget-background-color, hsl(240 5.1% 15%));
      font-size: var(--page-atom-size);
    }
  `;

	constructor() {
		super();

		this.size = [2, 2];
		this.position = [0, 0];
	}

	set size(value) {
		this.updatingCustomVariables(value, ['--width', '--height']);
	}

	set position(value) {
		this.updatingCustomVariables(value, ['--left', '--top']);
	}

	render() {
		return html`
      <slot></slot>
    `;
	}
}

customElements.define('bui-sticker', BUISticker);
