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

	connectedCallback() {
		super.connectedCallback();

		// Обработчик события открытия страницы
		this.handleOpenPage = eventIn => { // сохраняем обработчик как свойство класса
			// Ищем нужную страницу
			if (eventIn.detail.page) {
				const page = this.querySelector(`#${eventIn.detail.page}`) || this.querySelector(`bui-page[label="${eventIn.detail.page}"]`);
				// Если страница найдена, отправяем ей сообщение
				if (page) {
					const eventOut = new CustomEvent('bui-page:select', {
						detail: {
							page: eventIn.detail.page,
							params: eventIn.detail,
						},
						bubbles: true,
						composed: true
					});
					this.dispatchEvent(eventOut);
					// Если страница не найдена, отправляем в NodeRed запрос страницы
				} else {
					//console.log('reassembly');
					const eventOut = new CustomEvent('index:request-page', {
						detail: {
							page: eventIn.detail.page,
							params: eventIn.detail,
						},
						bubbles: true,
						composed: true
					});
					this.dispatchEvent(eventOut);
					//
					// const waitForElement = () => {
					// 	const page = this.querySelector(`#${eventIn.detail.page}`) || this.querySelector(`bui-page[label="${eventIn.detail.page}"]`);
					// 	if (page) {
					// 		console.log(`Страница "${eventIn.detail.page}" найдена в DOM`);
					// 		// Выполнить нужные действия
					// 		return;
					// 	}
					// 	requestAnimationFrame(waitForElement); // Повторить проверку на следующем кадре
					// };
					// waitForElement();

					const abortController = new AbortController();
					// Ждём элемент
					this.waitForElement(eventIn.detail.page, 5000, abortController.signal)
						.then(element => {
							//console.log('Страница найдена:', element);
							const event = new CustomEvent('bui-page:select', {
								detail: {
									page: eventIn.detail.page,
									params: eventIn.detail,
								},
								bubbles: true,
								composed: true
							});
							this.dispatchEvent(event);
						})
						.catch(error => {
							console.error(error.message);
						});

					// Отменить ожидание через 2 секунды
					// setTimeout(() => {
					// 	abortController.abort();
					// }, 2000);
				}
			}
		};

		document.addEventListener('bui-book:open-page', this.handleOpenPage);
	}

	disconnectedCallback() {
		document.removeEventListener('bui-book:open-page', this.handleOpenPage);
		delete this.handleOpenPage;

		super.disconnectedCallback();
	}

	waitForElement(id, timeout = 5000, abortSignal) {
		return new Promise((resolve, reject) => {
			const startTime = performance.now();

			const check = () => {
				if (abortSignal?.aborted) {
					reject(new Error(`Ожидание страницы "${id}" отменено`));
					return;
				}

				const element = this.querySelector(`#${id}`) || this.querySelector(`bui-page[label="${id}"]`);
				if (element) {
					//resolve(element);
					resolve();
					return;
				}

				const elapsed = performance.now() - startTime;
				if (elapsed >= timeout) {
					reject(new Error(`Страница "${id}" не найден за ${timeout} мс`));
					return;
				}

				requestAnimationFrame(check);
			};

			check();
		});
	}

}

customElements.define('bui-book', BUIBook);