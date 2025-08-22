import { html } from '../lit-html.js';
import { WidgetBase } from "./WidgetBase.js";

class BuiBook extends WidgetBase {

	static styles = `
		:host {
			min-height: 100vh;
			max-height: 100vh;
			min-width: 100vw;
			max-width: 100vw;
			display: flex;
			flex-direction: column-reverse;
			align-items: normal;
			gap: 0px;
		}
		.bookmarks_group {
			flex-grow: 0;
		}
		.pages_group {
			flex-grow: 1;
		}
  `;

	render() {
		return html`
			<div class="bookmarks_group">
				<slot name="bookmarks" id="bookmarks"></slot>
			</div>
			<div class="pages_group">
				<slot name="pages" id="pages"></slot>
			</div>
		`;
	}

}

BuiBook.register();