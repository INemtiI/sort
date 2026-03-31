export type AlgorithmType = 'bubble' | 'selection' | 'merge' | 'quick' | 'bogo';

export interface AlgorithmInfo {
  name: string;
  code: string;
  pythonCode: string;
  description: string;
  timeComplexity: string;
  spaceComplexity: string;
  fn: (arr: { id: string; value: number }[]) => {
    array: { id: string; value: number }[];
    comparing: number[];
    swapping: number[];
    sorted: number[];
  }[];
}

export const ALGORITHMS: Record<AlgorithmType, AlgorithmInfo> = {
  bubble: {
    name: 'Bubble Sort',
    description: 'Repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order.',
    timeComplexity: 'O(n²)',
    spaceComplexity: 'O(1)',
    fn: (arr) => {
      const steps = [];
      const a = [...arr];
      const n = a.length;
      const sortedIndices: number[] = [];
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n - i - 1; j++) {
          steps.push({ array: [...a], comparing: [j, j + 1], swapping: [], sorted: [...sortedIndices] });
          if (a[j].value > a[j + 1].value) {
            [a[j], a[j + 1]] = [a[j + 1], a[j]];
            steps.push({ array: [...a], comparing: [], swapping: [j, j + 1], sorted: [...sortedIndices] });
          }
        }
        sortedIndices.push(n - i - 1);
        steps.push({ array: [...a], comparing: [], swapping: [], sorted: [...sortedIndices] });
      }
      return steps;
    },
    code: `function bubbleSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}`,
    pythonCode: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr`
  },
  selection: {
    name: 'Selection Sort',
    description: 'Divides the input list into two parts: a sorted sublist of items built up from left to right and a sublist of the remaining unsorted items.',
    timeComplexity: 'O(n²)',
    spaceComplexity: 'O(1)',
    fn: (arr) => {
      const steps = [];
      const a = [...arr];
      const n = a.length;
      const sortedIndices: number[] = [];
      for (let i = 0; i < n; i++) {
        let minIdx = i;
        for (let j = i + 1; j < n; j++) {
          steps.push({ array: [...a], comparing: [minIdx, j], swapping: [], sorted: [...sortedIndices] });
          if (a[j].value < a[minIdx].value) minIdx = j;
        }
        if (minIdx !== i) {
          [a[i], a[minIdx]] = [a[minIdx], a[i]];
          steps.push({ array: [...a], comparing: [], swapping: [i, minIdx], sorted: [...sortedIndices] });
        }
        sortedIndices.push(i);
        steps.push({ array: [...a], comparing: [], swapping: [], sorted: [...sortedIndices] });
      }
      return steps;
    },
    code: `function selectionSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    let minIdx = i;
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[j] < arr[minIdx]) minIdx = j;
    }
    [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
  }
  return arr;
}`,
    pythonCode: `def selection_sort(arr):
    for i in range(len(arr)):
        min_idx = i
        for j in range(i + 1, len(arr)):
            if arr[j] < arr[min_idx]:
                min_idx = j
        arr[i], arr[min_idx] = arr[min_idx], arr[i]
    return arr`
  },
  merge: {
    name: 'Merge Sort',
    description: 'An efficient, stable, comparison-based, divide and conquer sorting algorithm.',
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(n)',
    fn: (arr) => {
      const steps: any[] = [];
      const a = [...arr];
      const recordMergeSort = (start: number, end: number) => {
        if (start >= end) return;
        const mid = Math.floor((start + end) / 2);
        recordMergeSort(start, mid);
        recordMergeSort(mid + 1, end);
        let left = a.slice(start, mid + 1);
        let right = a.slice(mid + 1, end + 1);
        let i = 0, j = 0, k = start;
        while (i < left.length && j < right.length) {
          steps.push({ array: [...a], comparing: [start + i, mid + 1 + j], swapping: [], sorted: [] });
          if (left[i].value <= right[j].value) { a[k] = left[i]; i++; }
          else { a[k] = right[j]; j++; }
          steps.push({ array: [...a], comparing: [], swapping: [k], sorted: [] });
          k++;
        }
        while (i < left.length) { a[k] = left[i]; steps.push({ array: [...a], comparing: [], swapping: [k], sorted: [] }); i++; k++; }
        while (j < right.length) { a[k] = right[j]; steps.push({ array: [...a], comparing: [], swapping: [k], sorted: [] }); j++; k++; }
      };
      recordMergeSort(0, a.length - 1);
      steps.push({ array: [...a], comparing: [], swapping: [], sorted: Array.from({length: a.length}, (_, i) => i) });
      return steps;
    },
    code: `function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  return merge(left, right);
}

function merge(left, right) {
  let result = [], l = 0, r = 0;
  while (l < left.length && r < right.length) {
    if (left[l] < right[r]) result.push(left[l++]);
    else result.push(right[r++]);
  }
  return result.concat(left.slice(l)).concat(right.slice(r));
}`,
    pythonCode: `def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)

def merge(left, right):
    result = []
    l = r = 0
    while l < len(left) and r < len(right):
        if left[l] < right[r]:
            result.append(left[l])
            l += 1
        else:
            result.append(right[r])
            r += 1
    result.extend(left[l:])
    result.extend(right[r:])
    return result`
  },
  quick: {
    name: 'Quick Sort',
    description: 'An efficient sorting algorithm, serving as a systematic method for placing the elements of an array in order.',
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(log n)',
    fn: (arr) => {
      const steps: any[] = [];
      const a = [...arr];
      const partition = (low: number, high: number) => {
        let pivot = a[high];
        let i = low - 1;
        for (let j = low; j < high; j++) {
          steps.push({ array: [...a], comparing: [j, high], swapping: [], sorted: [] });
          if (a[j].value < pivot.value) {
            i++;
            [a[i], a[j]] = [a[j], a[i]];
            steps.push({ array: [...a], comparing: [], swapping: [i, j], sorted: [] });
          }
        }
        [a[i + 1], a[high]] = [a[high], a[i + 1]];
        steps.push({ array: [...a], comparing: [], swapping: [i + 1, high], sorted: [] });
        return i + 1;
      };
      const recordQuickSort = (low: number, high: number) => {
        if (low < high) {
          let pi = partition(low, high);
          recordQuickSort(low, pi - 1);
          recordQuickSort(pi + 1, high);
        }
      };
      recordQuickSort(0, a.length - 1);
      steps.push({ array: [...a], comparing: [], swapping: [], sorted: Array.from({length: a.length}, (_, i) => i) });
      return steps;
    },
    code: `function quickSort(arr, low = 0, high = arr.length - 1) {
  if (low < high) {
    let pi = partition(arr, low, high);
    quickSort(arr, low, pi - 1);
    quickSort(arr, pi + 1, high);
  }
}

function partition(arr, low, high) {
  let pivot = arr[high];
  let i = low - 1;
  for (let j = low; j < high; j++) {
    if (arr[j] < pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  return i + 1;
}`,
    pythonCode: `def quick_sort(arr, low=0, high=None):
    if high is None:
        high = len(arr) - 1
    if low < high:
        pi = partition(arr, low, high)
        quick_sort(arr, low, pi - 1)
        quick_sort(arr, pi + 1, high)

def partition(arr, low, high):
    pivot = arr[high]
    i = low - 1
    for j in range(low, high):
        if arr[j] < pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1`
  },
  bogo: {
    name: 'Bogo Sort',
    description: 'Also known as permutation sort, stupid sort, or slowsort. It is a highly inefficient sorting algorithm based on the generate and test paradigm.',
    timeComplexity: 'O(n · n!)',
    spaceComplexity: 'O(1)',
    fn: (arr) => {
      const steps = [];
      const a = [...arr];
      const n = a.length;
      const maxSteps = 100;
      let count = 0;
      const isSorted = (arr: any[]) => {
        for (let i = 1; i < arr.length; i++) if (arr[i - 1].value > arr[i].value) return false;
        return true;
      };
      const shuffle = (arr: any[]) => {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
      };
      while (!isSorted(a) && count < maxSteps) {
        shuffle(a);
        steps.push({ array: [...a], comparing: [], swapping: Array.from({length: n}, (_, i) => i), sorted: [] });
        count++;
      }
      if (isSorted(a)) steps.push({ array: [...a], comparing: [], swapping: [], sorted: Array.from({length: n}, (_, i) => i) });
      return steps;
    },
    code: `function bogoSort(arr) {
  while (!isSorted(arr)) {
    shuffle(arr);
  }
  return arr;
}

function isSorted(arr) {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i-1] > arr[i]) return false;
  }
  return true;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}`,
    pythonCode: `import random

def bogo_sort(arr):
    while not is_sorted(arr):
        random.shuffle(arr)
    return arr

def is_sorted(arr):
    for i in range(1, len(arr)):
        if arr[i-1] > arr[i]:
            return False
    return True`
  }
};
