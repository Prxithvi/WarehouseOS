// ---------------------------------------------------------------------------
// Binary Search
// Application: Product SKU lookup in a sorted catalogue.
//
// Problem: Given a SORTED array and a target value, return the index of the
// target (or -1 if absent) using at most ⌈log₂ n⌉ comparisons.
//
// Precondition: the input MUST be sorted. If the supplied array is not sorted,
// this module sorts it first (using merge sort) and reports that the sort was
// performed, so the precondition is always satisfied for the search itself.
// ---------------------------------------------------------------------------

import { mergeSort } from './mergeSort.js'

/**
 * @param {Array<{sku:string}|string>} input
 * @param {string} target
 */
export function binarySearch(input, target) {
  const ops = { comparisons: 0, operations: 0 }
  const steps = []
  const raw = [...(input || [])]
  const get = (x) => (x && typeof x === 'object' ? String(x.sku ?? x.id ?? '') : String(x))
  const targetStr = String(target ?? '').trim()

  if (raw.length === 0) {
    return { found: false, index: -1, comparisons: 0, operations: 0, steps: [], sorted: [], target: targetStr }
  }

  // Verify / enforce the sorted precondition.
  let sorted = raw
  let sortedArray = raw.map(get)
  let wasSorted = true
  for (let i = 1; i < sortedArray.length; i++) {
    if (sortedArray[i - 1] > sortedArray[i]) {
      wasSorted = false
      break
    }
  }
  if (!wasSorted) {
    const ms = mergeSort(raw.map(get))
    ops.operations += ms.operations
    ops.comparisons += ms.comparisons
    // reorder original objects by the sorted key order
    const order = ms.sorted
    const byKey = new Map()
    raw.forEach((x) => {
      const k = get(x)
      if (!byKey.has(k)) byKey.set(k, [])
      byKey.get(k).push(x)
    })
    sorted = order.map((k) => byKey.get(k).shift())
    sortedArray = order
    steps.push({
      phase: 'precondition',
      note: 'Input was not sorted — sorted it first with merge sort (O(n log n)).',
      array: [...sortedArray],
    })
  } else {
    steps.push({
      phase: 'precondition',
      note: 'Input is already sorted — binary search can proceed directly.',
      array: [...sortedArray],
    })
  }

  if (targetStr === '') {
    return { found: false, index: -1, comparisons: ops.comparisons, operations: ops.operations, steps, sorted: sortedArray, target: targetStr }
  }

  let lo = 0
  let hi = sortedArray.length - 1
  steps.push({
    phase: 'init',
    note: `Search for "${targetStr}" in ${sortedArray.length} sorted SKUs.`,
    lo,
    hi,
    mid: null,
    array: [...sortedArray],
  })

  while (lo <= hi) {
    ops.operations++
    const mid = Math.floor((lo + hi) / 2)
    ops.comparisons++
    const cmpResult = sortedArray[mid].localeCompare(targetStr)
    let outcome
    if (cmpResult === 0) outcome = 'match'
    else if (cmpResult < 0) outcome = 'go-right'
    else outcome = 'go-left'

    steps.push({
      phase: 'compare',
      lo,
      hi,
      mid,
      midValue: sortedArray[mid],
      outcome,
      note:
        outcome === 'match'
          ? `SKU at index ${mid} ("${sortedArray[mid]}") matches the target.`
          : outcome === 'go-right'
          ? `"${sortedArray[mid]}" < target → search right half [${mid + 1}, ${hi}].`
          : `"${sortedArray[mid]}" > target → search left half [${lo}, ${mid - 1}].`,
      array: [...sortedArray],
    })

    if (cmpResult === 0) {
      return {
        found: true,
        index: mid,
        foundItem: sorted[mid],
        comparisons: ops.comparisons,
        operations: ops.operations,
        steps,
        sorted: sortedArray,
        target: targetStr,
      }
    }
    if (cmpResult < 0) lo = mid + 1
    else hi = mid - 1
  }

  return {
    found: false,
    index: -1,
    comparisons: ops.comparisons,
    operations: ops.operations,
    steps,
    sorted: sortedArray,
    target: targetStr,
  }
}

export const binarySearchMeta = {
  name: 'Binary Search',
  application: 'Product SKU lookup in a sorted catalogue',
  bestCase: 'O(1)  (target is the middle element)',
  averageCase: 'O(log n)',
  worstCase: 'O(log n)',
  spaceComplexity: 'O(1)  iterative',
  pseudocode: [
    'function binarySearch(sortedArray, target):',
    '    lo ← 0 ; hi ← length - 1',
    '    while lo ≤ hi:',
    '        mid ← (lo + hi) / 2',
    '        if sortedArray[mid] == target: return mid',
    '        else if sortedArray[mid] < target: lo ← mid + 1',
    '        else: hi ← mid - 1',
    '    return -1   // not found',
  ],
}
