/**
 * 이 코드는 병합 정렬(Merge Sort) 알고리즘을 일반화한 형태로, 배열을 정렬하기 위해 사용됩니다.
 * compareFn 함수를 인자로 받아 사용자가 원하는 정렬 방식을 유연하게 지정할 수 있도록 설계되어 있습니다.
 * @param {*} arr 
 * @param {*} compareFn 
 * @returns 
 */
function mergeSort(arr, compareFn) {
  if (arr.length <= 1) {
    return arr;
  }

  const mid = Math.floor(arr.length / 2);
  const leftArr = arr.slice(0, mid);
  const rightArr = arr.slice(mid);

  return merge(mergeSort(leftArr, compareFn), mergeSort(rightArr, compareFn), compareFn);
}

function merge(leftArr, rightArr, compareFn) {
  const result = [];
  let leftIndex = 0;
  let rightIndex = 0;

  while (leftIndex < leftArr.length && rightIndex < rightArr.length) {
    if (compareFn(leftArr[leftIndex], rightArr[rightIndex]) < 0) {
      result.push(leftArr[leftIndex++]);
    } else {
      result.push(rightArr[rightIndex++]);
    }
  }

  return result.concat(leftArr.slice(leftIndex)).concat(rightArr.slice(rightIndex));
}

module.exports = mergeSort;
