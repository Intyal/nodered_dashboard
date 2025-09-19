// @ts-nocheck
// -- Виджеты BUI -->
import "./widgets/all.js";
import { registerIconLibrary, getIconLibrary } from './js/icon-library.js';

// https://icons.getbootstrap.com/
registerIconLibrary('default', {
	resolver: name => `./icons/bootstrap-icons-1.13.1/${name}.svg`,
	mutator: svg => svg.setAttribute('fill', 'currentColor')
});
// https://fontawesome.com/
registerIconLibrary('fa', {
	resolver: name => {
		const filename = name.replace(/^fa[rbs]-/, '');
		let folder = 'regular';
		if (name.substring(0, 4) === 'fas-') folder = 'solid';
		if (name.substring(0, 4) === 'fab-') folder = 'brands';
		return `https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.15.1/svgs/${folder}/${filename}.svg`;
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

// Другой компонент ловит событие
document.addEventListener('bui-message', (event) => {
	if (event.detail.message === 'user-login') {
		console.log('Пользователь вошел:', event.detail.params.userId);
		// Обновляем интерфейс, показываем приветствие и т.д.
	}
});

document.addEventListener('bui-topic-set', (event) => {
	if (event.detail.type === 'toggle') {
		console.log(`Отправить 'TOGGLE' в топик ${event.detail.params.topic} для свойства ${event.detail.params.property}`);
	}
});