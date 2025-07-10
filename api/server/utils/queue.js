/**
 * A leaky bucket queue structure to manage API requests.
 * @type {{queue: Array, interval: NodeJS.Timer | null}}
 */
const _LB = {
  queue: [],
  interval: null,
};

/**
 * Interval in milliseconds to control the rate of API requests.
 * Adjust the interval according to your rate limit needs.
 * "Leaky Bucket (누수 버킷)" 알고리즘을 기반으로 하는 간단한 API 요청 큐 시스템입니다. 
 * 주로 API rate limiting을 제어할 때 사용되며, 특히 동시에 많은 요청을 보내면 안 되는 외부 API 호출에서 유용합니다.
 */
const _LB_INTERVAL_MS = Math.ceil(1000 / 60); // 60 req/s 1초에 60번 처리 16.7ms

/**
 * Executes the next function in the leaky bucket queue.
 * This function is called at regular intervals defined by _LB_INTERVAL_MS.
 * 큐에서 하나 꺼내서 실행
 */
const _LB_EXEC_NEXT = async () => {
  if (_LB.queue.length === 0) {
    clearInterval(_LB.interval);
    _LB.interval = null;
    return;
  }

  const next = _LB.queue.shift();
  if (!next) {
    return;
  }

  const { asyncFunc, args, callback } = next;

  try {
    const data = await asyncFunc(...args);
    callback(null, data);
  } catch (e) {
    callback(e);
  }
};

/**
 * Adds an async function call to the leaky bucket queue.
 * @param {Function} asyncFunc - The async function to be executed.
 * @param {Array} args - Arguments to pass to the async function.
 * @param {Function} callback - Callback function for handling the result or error.
 */
function LB_QueueAsyncCall(asyncFunc, args, callback) {
  _LB.queue.push({ asyncFunc, args, callback });

  if (_LB.interval === null) {
    _LB.interval = setInterval(_LB_EXEC_NEXT, _LB_INTERVAL_MS);
  }
}

/**
 * Delays the execution for a specified number of milliseconds.
 *
 * @param {number} ms - The number of milliseconds to delay.
 * @return {Promise<void>} A promise that resolves after the specified delay.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  sleep,
  LB_QueueAsyncCall,
};
