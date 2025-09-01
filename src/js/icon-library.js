// Хранилище зарегистрированных библиотек иконок
const iconLibraries = new Map();

export class IconLibrary {
	constructor(name, config) {
		this.name = name;
		this.resolver = config.resolver;
		this.mutator = config.mutator || ((svg) => svg);
		this.spriteSheet = config.spriteSheet || false;
	}

	async getIcon(name) {
		try {
			// Получаем URL иконки через резолвер
			const url = this.resolver(name);

			// Загружаем SVG
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(`Failed to load icon: ${url}`);
			}

			const svgText = await response.text();
			const parser = new DOMParser();
			const doc = parser.parseFromString(svgText, 'image/svg+xml');
			const svg = doc.documentElement;

			// Применяем мутатор для кастомизации SVG
			if (this.mutator) {
				this.mutator(svg);
			}

			return svg;
		} catch (error) {
			console.error(`Error loading icon "${name}" from library "${this.name}":`, error);
			return this.createErrorIcon(name);
		}
	}

	createErrorIcon(name) {
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.setAttribute('viewBox', '0 0 24 24');
		svg.setAttribute('width', '24');
		svg.setAttribute('height', '24');
		svg.setAttribute('fill', 'red');

		const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
		text.setAttribute('x', '12');
		text.setAttribute('y', '12');
		text.setAttribute('text-anchor', 'middle');
		text.setAttribute('dominant-baseline', 'middle');
		text.textContent = '?';

		svg.appendChild(text);
		return svg;
	}
}

// Функция для регистрации новой библиотеки иконок
export function registerIconLibrary(name, config) {
	if (iconLibraries.has(name)) {
		console.warn(`Icon library "${name}" is already registered. Overwriting.`);
	}

	const library = new IconLibrary(name, config);
	iconLibraries.set(name, library);

	return library;
}

// Функция для получения зарегистрированной библиотеки
export function getIconLibrary(name) {
	return iconLibraries.get(name);
}

// Функция для проверки существования библиотеки
export function hasIconLibrary(name) {
	return iconLibraries.has(name);
}

// Функция для удаления библиотеки
export function unregisterIconLibrary(name) {
	return iconLibraries.delete(name);
}

// Получение списка всех зарегистрированных библиотек
export function getRegisteredLibraries() {
	return Array.from(iconLibraries.keys());
}