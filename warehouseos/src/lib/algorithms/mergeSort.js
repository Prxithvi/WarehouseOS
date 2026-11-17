// ---------------------------------------------------------------------------
// Merge Sort — Divide and Conquer
// Application: Inventory sorting (by stock value, SKU, expiry, etc.).
//
// Problem: Sort an array of comparable records into non-decreasing order.
//
// Strategy:
//   1. DIVIDE  — split the array into two halves.
//   2. CONQUER — recursively sort each half.
//   3. COMBINE — merge the two sorted halves into one sorted array.
//
// Merge sort is stable and guarantees O(n log n) in every case.
// ---------------------------------------------------------------------------

/**
 * @param {Array} input     array of numbers OR objects
 * @param {string} [key]    object field to compare (omit for primitive arrays)
 * @param {'asc'|'desc'} [order]
 */
export function mergeSort(input, key, order = 'asc') {
  const ops = { comparisons: 0, operations: 0 }
  const steps = []
  const arr = [...(input || [])]

  const val = (x) => (key ? Number(x[key]) : Number(x))
  const cmp = (a, b) => {
    ops.comparisons++
    const va = val(a)
    const vb = val(b)
    return order === 'desc' ? vb - va : va - vb
  }

  function merge(left, right, depth) {
    const out = []
    let i = 0
    let j = 0
    while (i < left.length && j < right.length) {
      if (cmp(left[i], right[j]) <= 0) out.push(left[i++])
      else out.push(right[j++])
      ops.operations++
    }
    while (i < left.length) {
      out.push(left[i++])
      ops.operations++
    }
    while (j < right.length) {
      out.push(right[j++])
      ops.operations++
    }
    steps.push({
      phase: 'merge',
      depth,
      left: snapshot(left),
      right: snapshot(right),
      merged: snapshot(out),
      note: `Merge two sorted halves → ${out.length} elements.`,
    })
    return out
  }

  function snapshot(part) {
    return part.map((x) => (key ? { ...x } : x))
  }

  function sort(part, depth = 0) {
    if (part.length <= 1) return part
    const mid = Math.floor(part.length / 2)
    ops.operations++
    const left = sort(part.slice(0, mid), depth + 1)
    const right = sort(part.slice(mid), depth + 1)
    steps.push({
      phase: 'split',
      depth,
      input: snapshot(part),
      left: snapshot(left),
      right: snapshot(right),
      note: `Split array of ${part.length} into ${left.length} + ${right.length}.`,
    })
    return merge(left, right, depth)
  }

  const sorted = sort(arr)
  return {
    sorted,
    comparisons: ops.comparisons,
    operations: ops.operations,
    steps,
    splits: steps.filter((s) => s.phase === 'split').length,
    merges: steps.filter((s) => s.phase === 'merge').length,
  }
}

export const mergeSortMeta = {
  name: 'Merge Sort (Divide & Conquer)',
  application: 'Inventory sorting by any numeric field',
  bestCase: 'O(n log n)',
  averageCase: 'O(n log n)',
  worstCase: 'O(n log n)',
  spaceComplexity: 'O(n)',
  pseudocode: [
    'function mergeSort(A):',
    '    if length(A) ≤ 1: return A',
    '    mid ← length(A) / 2',
    '    left ← mergeSort(A[0..mid])',
    '    right ← mergeSort(A[mid..end])',
    '    return merge(left, right)',
    '',
    'function merge(left, right):',
    '    result ← []',
    '    while left and right not empty:',
    '        if left[0] ≤ right[0]: move left[0] to result',
    '        else: move right[0] to result',
    '    append remaining elements',
    '    return result',
  ],
}
