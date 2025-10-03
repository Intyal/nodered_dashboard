import { html, css } from '../js/lit-all.min.js';
import { BUIBaseWidget } from '../js/bui-base-widget.js';

export class BUIBook extends BUIBaseWidget {
	static styles = css`
		:host {
			min-height: 100%;
			max-height: 100vh;
			min-width: 100vw;
			max-width: 100vw;
			display: flex;
			flex-direction: column;
			align-items: normal;
			gap: 0px;
		}
		.status_bar {
			flex-grow: 0;
		}
		.pages_group {
			flex-grow: 1;

			display: flex;
		}
		.bookmarks_group {
			flex-grow: 0;
		}
		slot[name="pages"] {
			flex-grow: 1;

			display: flex;
    	}
	`;

	constructor() {
		super();
	}

	render() {
		return html`
			<div class="status_bar">
				<slot name="status" id="status"></slot>
			</div>
			<div class="pages_group">
				<slot name="pages" id="pages"></slot>
			</div>
			<div class="bookmarks_group">
				<slot name="bookmarks" id="bookmarks"></slot>
			</div>
		`;
	}

}

customElements.define('bui-book', BUIBook);