import {
  isRegExp,
  isArray,
  isFunction,
  isString,
  iterate,
  create
} from './utils';

export default (validators) => {
  const eventualValidators = create(null);

  iterate(validators, (validator, name) => {
    let eventualValidator;

    if (isRegExp(validator)) {
      eventualValidator = (value) => (
        isString(value) && validator.test(value)
      );
    } else if (isArray(validator)) {
      eventualValidator = (value) => (
        validator.indexOf(value) !== -1
      );
    } else if (isFunction(validator)) {
      eventualValidator = validator;
    } else {
      eventualValidator = (value) => (
        value === validator
      );
    }

    eventualValidators[name] = eventualValidator;
  });

  return eventualValidators;
};
