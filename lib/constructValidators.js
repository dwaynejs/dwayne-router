import {
  isRegExp,
  isArray,
  isFunction,
  iterate
} from './utils';

export default (validators) => {
  iterate(validators, (validator, name) => {
    let eventualValidator;

    if (isRegExp(validator)) {
      eventualValidator = (value) => (
        validator.test(value)
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

    validators[name] = eventualValidator;
  });

  return validators;
};
