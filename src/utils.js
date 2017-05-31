const {
  hasOwnProperty,
  toString
} = {};
const charactersToEscape = [
  '.',
  '+', '*', '?',
  '(', ')',
  '[', ']',
  '{', '}',
  '<', '>',
  '^', '$',
  '!',
  '=',
  ':',
  '-',
  '|',
  ',',
  '\\'
];
const charactersToEscapeRegExp = new RegExp(
  charactersToEscape
    .map((character) => (
      `\\${ character }`
    ))
    .join('|'),
  'g'
);

export function toStringTag(value) {
  return value::toString().slice(8, -1);
}

export const { isArray } = Array;

export function isEmpty(object) {
  return iterate(object, () => false) !== false;
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
    /* istanbul ignore else */
    if (hasOwn(object, key)) {
      /* istanbul ignore if */
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

export function replaceString(string, stringToReplace, replacement) {
  return string
    .split(stringToReplace)
    .join(replacement);
}

export function escapeRegExp(string) {
  return string.replace(charactersToEscapeRegExp, '\\$&');
}

export function keysCount(object) {
  let count = 0;

  iterate(object, () => {
    count++;
  });

  return count;
}

export function hasOwn(object, key) {
  return object::hasOwnProperty(key);
}

export function get(object, key, defaultValue) {
  return hasOwn(object, key)
    ? object[key]
    : defaultValue;
}

export function omit(object, paths) {
  const newObject = {};

  iterate(object, (value, key) => {
    if (paths.indexOf(key) === -1) {
      newObject[key] = value;
    }
  });

  return newObject;
}

export const encode = encodeURIComponent;
export const decode = decodeURIComponent;

export const { create } = Object;
