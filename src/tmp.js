В JavaScript можно расширить функционал импортируемого класса несколькими способами. Ниже приведены основные подходы:

1. Использование extends (наследование)
Это стандартный и безопасный способ расширения класса. Создаётся подкласс, который наследует функционал родительского класса и добавляет/переопределяет методы.

Пример:
javascript
// parent.js
export class Parent {
    greet() {
        console.log("Hello from Parent");
    }
}

// child.js
import { Parent } from './parent.js';

export class Child extends Parent {
    // Новый метод
    sayHi() {
        console.log("Hi from Child");
    }

    // Переопределённый метод
    greet() {
        super.greet(); // Вызов метода родителя
        console.log("Extended greeting in Child");
    }
}

// main.js
import { Child } from './child.js';

const instance = new Child();
instance.greet(); // Hello from Parent + Extended greeting in Child
instance.sayHi(); // Hi from Child
Плюсы:

Чистый и предсказуемый код.
Не изменяет оригинальный класс.
Поддерживает принципы ООП.
2. Модификация прототипа (не рекомендуется)
Можно добавить методы к прототипу импортированного класса. Однако этот подход может вызвать конфликты, если класс используется в других частях приложения.

Пример:
javascript
// parent.js
export class Parent {
    greet() {
        console.log("Hello from Parent");
    }
}

// main.js
import { Parent } from './parent.js';

// Добавляем метод к прототипу
Parent.prototype.newMethod = function () {
    console.log("New method added to Parent");
};

const instance = new Parent();
instance.newMethod(); // New method added to Parent
Минусы:

Может сломать другие части кода, использующие этот класс.
Сложнее отладка и поддержка.
3. Миксины (Mixins)
Миксины позволяют "внедрить" дополнительные методы в класс без наследования. Полезно, если нужно добавить функционал нескольким классам.

Пример:
javascript
// mixin.js
export const LoggerMixin = (baseClass) => class extends baseClass {
    log(message) {
        console.log(`[LOG] ${message}`);
    }
};

// child.js
import { Parent } from './parent.js';
import { LoggerMixin } from './mixin.js';

export class Child extends LoggerMixin(Parent) {}

// main.js
import { Child } from './child.js';

const instance = new Child();
instance.greet(); // Hello from Parent
instance.log("Test"); // [LOG] Test
Плюсы:

Гибкий способ добавления общих методов.
Поддерживает композицию классов.
4. Декораторы (экспериментально)
Декораторы позволяют модифицировать классы или методы на этапе объявления. Требуют поддержки Babel/TypeScript.

Пример:
javascript
// decorator.js
export function withLogging(target) {
    return class extends target {
        greet() {
            console.log("Before greeting");
            super.greet();
            console.log("After greeting");
        }
    };
}

// child.js
import { Parent } from './parent.js';
import { withLogging } from './decorator.js';

@withLogging
export class Child extends Parent {}

// main.js
import { Child } from './child.js';

const instance = new Child();
instance.greet(); 
// Before greeting
// Hello from Parent
// After greeting
Примечание:
Декораторы пока не поддерживаются в браузерах по умолчанию (на момент 2023 года). Требуется транспиляция.

Рекомендации:
✅ Используйте extends, если нужно создать подкласс с новыми/переопределенными методами.
⚠️ Избегайте модификации прототипа, если только вы не уверены в последствиях.
🛠️ Для повторного использования логики — применяйте миксины.
🔧 Декораторы полезны для метапрограммирования, но требуют настройки инструментов.