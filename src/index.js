// @ts-nocheck
// -- Виджеты BUI -->
import "./widgets/all.js";
import { registerIconLibrary, getIconLibrary } from './js/icon-library.js';

// https://icons.getbootstrap.com/
registerIconLibrary('default', {
	resolver: name => `./icons/bootstrap-icons-1.13.1/${name}.svg`,
	mutator: svg => svg.setAttribute('fill', 'currentColor')
});
// https://fontawesome.com/download
// https://fontawesome.com/search?ic=free&o=r
registerIconLibrary('fa', {
	resolver: name => {
		const filename = name.replace(/^fa[rbs]-/, '');
		let folder = 'regular';
		if (name.substring(0, 4) === 'fas-') folder = 'solid';
		if (name.substring(0, 4) === 'fab-') folder = 'brands';
		return `./icons/fontawesome-free-7.0.1-web/svgs-full/${folder}/${filename}.svg`;
	},
	mutator: svg => svg.setAttribute('fill', 'currentColor')
});
// https://cdn.boxicons.com/svg/<PACK_NAME>/<ICON_NAME_WITH_PREFIX_BX_OR_BXS>.svg
registerIconLibrary('boxicons', {
	resolver: name => `https://cdn.boxicons.com/svg/basic/${name}.svg`,
	mutator: svg => {
		svg.setAttribute('fill', 'currentColor');
		svg.setAttribute('viewBox', '0 0 24 24');
	}
});
//
registerIconLibrary('yandex_weather', {
	resolver: name => `https://yastatic.net/weather/i/icons/funky/dark/${name}.svg`,
	mutator: svg => svg.setAttribute('fill', 'currentColor')
});

// const library = getIconLibrary('default');
// console.log(library);
// if (!library) {
// 	throw new Error(`Icon library "${libraryName}" not found`);
// }
// console.log(await library.getIcon('stars'));


/** Simple example of using uibuilder with modern JS Modules
 * Version: 2025-05-16
 * @license MIT
 * @author Totally Information (Julian Knight)
 * 
 * Note that this module loads asynchronously as defined in the HTML.
 * This may have the impact of you needing to wait for everything to be loaded
 * before you can manipulate the HTML DOM.
 */

// See import map in index.html for import shortcuts
import { uibuilder } from '../uibuilder/uibuilder.esm.min.js';

// Listen for incoming messages from Node-RED and action
uibuilder.onChange('msg', (msg) => {
	console.log('Incoming msg: ', msg);
})

//
document.addEventListener('index:message', (event) => {
	if (event.detail.message === 'user-login') {
		console.log('Пользователь вошел:', event.detail.params.userId);
		// Обновляем интерфейс, показываем приветствие и т.д.
	}
});

// Отправка сообщения в Node-RED для установки знрачения в mqtt
document.addEventListener('index:topic-set', (event) => {
	console.log(`Отправить '${event.detail.value}' в топик ${event.detail.params.topic} для свойства ${event.detail.params.property}`);
	uibuilder.send({
		uibuilderCtrl: "mqtt topic set",
		payload: event.detail,
	});
});

//
document.addEventListener('index:request-page', (event) => {
	console.log(`Запрос страницы ${event.detail.page}`);
	uibuilder.send({
		uibuilderCtrl: "request page",
		page: event.detail.page,
	});
});

// Вспомогательная функция для ожидания появления элемента в DOM
function waitForElement(selector, timeout = 10000) {
	return new Promise((resolve, reject) => {
		const element = document.querySelector(selector);
		if (element) {
			resolve(element);
			return;
		}

		const observer = new MutationObserver(() => {
			const element = document.querySelector(selector);
			if (element) {
				resolve(element);
				observer.disconnect();
			}
		});

		observer.observe(document.body, {
			childList: true,
			subtree: true
		});

		setTimeout(() => {
			observer.disconnect();
			reject(new Error(`Элемент ${selector} не найден в DOM за ${timeout} мс`));
		}, timeout);
	});
}

//
// Установка PWA приложения
// https://pwa-workshop.js.org/5-pwa-install/#installing-the-pwa
//
//

let deferredPrompt; // Позволяет отобразить приглашение к установке
let installButton; // Ссылка на кнопку установки

// Функция, вызываемая при клике на кнопку установки
function installApp() {
	console.log('installApp вызвана');
	// Проверяем, что deferredPrompt действительно содержит событие
	if (!deferredPrompt) {
		console.warn('Нет доступного deferredPrompt для установки.');
		return;
	}

	// Отключаем кнопку, чтобы избежать повторного вызова prompt()
	//installButton.disabled = true;
	installButton.classList.add('hidden');

	// Отобразить приглашение к установке
	deferredPrompt.prompt();

	// Ждём, пока пользователь ответит на запрос
	deferredPrompt.userChoice.then((choiceResult) => {
		if (choiceResult.outcome === "accepted") {
			console.log("PWA установка принята пользователем");
		} else {
			console.log("PWA установка отклонена пользователем");
		}
		// Независимо от результата, скрываем кнопку и удаляем ссылку на событие
		//installButton.hidden = true;
		installButton.classList.add('hidden');
		deferredPrompt = null;
	}).catch((err) => {
		console.error("Ошибка при ожидании ответа пользователя на установку PWA:", err);
		// В случае ошибки всё равно отключаем кнопку и очищаем событие
		//installButton.disabled = false;
		installButton.classList.remove('hidden');
		deferredPrompt = null;
	});
}

// Добавляем обработчик события beforeinstallprompt
window.addEventListener("beforeinstallprompt", async (e) => {
	console.log("Событие beforeinstallprompt сработало");
	// Получаем ссылку на кнопку по её ID
	//installButton = document.getElementById("install_button");
	installButton = document.querySelector('.install_button');

	if (!installButton) {
		console.log('Кнопка install_button не найдена, ожидаем...');
		e.preventDefault(); // Всё равно предотвращаем стандартный баннер на всякий случай
		deferredPrompt = e; // Сохраняем событие

		try {
			// Ждём, пока элемент не появится в DOM
			installButton = await waitForElement('.install_button');
			console.log('Кнопка install_button найдена, готовим к установке.');

			// Теперь, когда кнопка точно есть, настраиваем её
			//installButton.hidden = false;
			installButton.classList.remove('hidden');
			installButton.addEventListener('click', installApp);

		} catch (error) {
			console.error('Не удалось найти кнопку установки:', error);
			// deferredPrompt уже сохранён, но кнопки нет. Можно попробовать позже вручную.
		}
	} else {
		// Кнопка уже есть в DOM
		e.preventDefault();
		deferredPrompt = e;
		//installButton.hidden = false;
		installButton.classList.remove('hidden');
		installButton.addEventListener('click', installApp);
	}
});

// Обработчик события appinstalled
// Выполняется, когда приложение успешно установлено
window.addEventListener("appinstalled", (evt) => {
	console.log("Приложение PWA успешно установлено", evt);
	// Здесь можно выполнить дополнительные действия после установки
	if (installButton) {
		//installButton.hidden = true;
		installButton.classList.add('hidden');
	}
});

// -----------------------------------------------------