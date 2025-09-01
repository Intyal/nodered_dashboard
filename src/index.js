// @ts-nocheck
// -- Виджеты BUI -->
import "./widgets/all.js";
import { registerIconLibrary, getIconLibrary } from './js/icon-library.js';

// https://icons.getbootstrap.com/
registerIconLibrary('default', {
	resolver: name => `./icons/bootstrap-icons-1.13.1/${name}.svg`,
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
