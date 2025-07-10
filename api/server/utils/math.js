/**
 * Evaluates a mathematical expression provided as a string and returns the result.
 *
 * If the input is already a number, it returns the number as is.
 * If the input is not a string or contains invalid characters, an error is thrown.
 * If the evaluated result is not a number, an error is thrown.
 * math 함수는 문자열로 된 수학 수식(expression) 을 안전하게 평가하여 숫자 결과를 반환하는 유틸 함수입니다.
 * 또한 예외 상황에 대비해 fallback 값(대체값) 을 지정할 수 있게 설계되어 있습니다
 *
 * @param {string|number} str - The mathematical expression to evaluate, or a number.
 * @param {number} [fallbackValue] - The default value to return if the input is not a string or number, or if the evaluated result is not a number.
 *
 * @returns {number} The result of the evaluated expression or the input number.
 *
 * @throws {Error} Throws an error if the input is not a string or number, contains invalid characters, or does not evaluate to a number.
 */
function math(str, fallbackValue) {
  const fallback = typeof fallbackValue !== 'undefined' && typeof fallbackValue === 'number';
  if (typeof str !== 'string' && typeof str === 'number') {
    return str;
  } else if (typeof str !== 'string') {
    if (fallback) {
      return fallbackValue;
    }
    throw new Error(`str is ${typeof str}, but should be a string`);
  }

  const validStr = /^[+\-\d.\s*/%()]+$/.test(str);

  if (!validStr) {
    if (fallback) {
      return fallbackValue;
    }
    throw new Error('Invalid characters in string');
  }

  const value = eval(str);

  if (typeof value !== 'number') {
    if (fallback) {
      return fallbackValue;
    }
    throw new Error(`[math] str did not evaluate to a number but to a ${typeof value}`);
  }

  return value;
}

module.exports = math;
