const {
  hasOwnProperty,
  toString
} = {};
const charactersToEscape = [];
const charactersToEscapeRegExp = new RegExp(map(charactersToEscape, (character) => (
  `\\${ character }`
)).join('|'), 'g');

export function toStringTag(value) {
  return toString
    .call(value)
    .slice(8, -1);
}

export const isArray = Array.isArray || ((value) => (
  toStringTag(value) === 'Array'
));

export function isEmpty(object) {
  for (const key in object) {
    if (hasOwnProperty.call(object, key)) {
      return false;
    }
  }

  return true;
}

export function isFunction(value) {
  return typeof value === 'function' || toStringTag(value) === 'Function';
}

export function isNil(value) {
  return typeof value === 'undefined';
}

export function isObject(value) {
  return typeof value && (typeof value === 'object' || isFunction(value));
}

export function isRegExp(value) {
  return toStringTag(value) === 'RegExp';
}

export function isString(value) {
  return toStringTag(value) === 'String';
}

export function isUndefined(value) {
  return typeof value === 'undefined';
}

export function assign(target, ...objects) {
  iterate(objects, (source) => {
    iterate(source, (value, key) => {
      target[key] = value;
    });
  });

  return target;
}

export function iterate(object, callback) {
  const array = isArray(object);

  let iterated = 0;
  const { length } = object || {};

  for (const key in object) {
    if (hasOwnProperty.call(object, key)) {
      if (array && iterated++ >= length) {
        break;
      }

      const returnValue = callback(object[key], array ? +key : key, object);

      if (!isUndefined(returnValue)) {
        return returnValue;
      }
    }
  }
}

export function find(object, callback) {
  return iterate(object, (value, key) => (
    callback(value, key, object)
      ? value
      : undefined
  ));
}

export function map(object, callback) {
  const newObject = isArray(object)
    ? []
    : {};

  iterate(object, (value, key) => {
    newObject[key] = callback(value, key, object);
  });

  return newObject;
}

export function replaceString(string, stringToReplace, replacement) {
  return string
    .split(stringToReplace)
    .join(replacement);
}

export function escapeRegExp(string) {
  return string.replace(charactersToEscapeRegExp, '');
}

export function keysCount(object) {
  let count = 0;

  for (const key in object) {
    if (hasOwnProperty.call(object, key)) {
      count++;
    }
  }

  return count;
}

export function allKeysCount(object) {
  let count = 0;

  /* eslint guard-for-in: 0 */
  for (const key in object) {
    count++;
  }

  return count;
}

export function setProto(object, proto) {
  Object.setPrototypeOf(object, proto);
}
