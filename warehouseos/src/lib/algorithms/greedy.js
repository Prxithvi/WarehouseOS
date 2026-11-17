// ---------------------------------------------------------------------------
// Greedy Algorithm — First-Fit Decreasing (FFD) Bin Packing
// Application: Warehouse storage allocation.
//
// Problem: Given a set of items each with a size (units to store) and storage
// bins each with a fixed capacity, allocate every item into a bin so that no
// bin exceeds its capacity, while minimizing the number of bins used.
//
// Greedy strategy:
//   1. Sort items by size descending (handle the largest, hardest-to-fit items
//      first — this is the greedy choice that makes FFD effective).
//   2. For each item, place it into the FIRST bin that still has room; if no
//      existing bin fits, open a new bin.
//
// The greedy choice is locally optimal (pack the biggest remaining item into
// the first bin that can take it) and never back-tracks, which is exactly what
// makes this a greedy algorithm.
// ---------------------------------------------------------------------------

/**
 * @param {Array<{id:string,size:number}>} items
 * @param {number} capacity  bin capacity
 * @returns {{bins, binCount, packed, comparisons, operations, steps, sorted}}
 */
export function greedyBinPacking(items, capacity) {
  const ops = { comparisons: 0, operations: 0 }
  const steps = []
  const safeItems = (items || [])
    .map((it, i) => ({ id: it.id ?? `item-${i + 1}`, size: Number(it.size) || 0 }))
    .filter((it) => it.size > 0)
  const cap = Number(capacity) || 0

  if (cap <= 0) {
    return {
      bins: [],
      binCount: 0,
      packed: 0,
      comparisons: 0,
      operations: 0,
      steps: [{ note: 'Invalid capacity — no allocation possible.', bins: [] }],
      sorted: [],
      error: 'Capacity must be greater than 0.',
    }
  }

  // Step 1 — greedy sort: largest first.
  const sorted = [...safeItems].sort((a, b) => {
    ops.comparisons++
    return b.size - a.size
  })
  ops.operations += sorted.length
  steps.push({
    phase: 'sort',
    note: 'Sort items by size, descending (greedy ordering).',
    order: sorted.map((s) => ({ id: s.id, size: s.size })),
  })

  // Step 2 — first-fit placement.
  const bins = [] // each: { index, capacity, used, items: [] }
  for (const item of sorted) {
    let placed = false
    if (item.size > cap) {
      // Item larger than any bin — record overflow.
      steps.push({
        phase: 'overflow',
        note: `${item.id} (size ${item.size}) exceeds capacity ${cap}; skipped.`,
        bins: bins.map(snapshotBin),
      })
      continue
    }
    for (const bin of bins) {
      ops.comparisons++
      if (bin.used + item.size <= bin.capacity) {
        bin.items.push(item)
        bin.used += item.size
        ops.operations++
        placed = true
        steps.push({
          phase: 'place',
          note: `Place ${item.id} (size ${item.size}) into Bin ${bin.index}.`,
          bins: bins.map(snapshotBin),
        })
        break
      }
    }
    if (!placed) {
      const bin = { index: bins.length + 1, capacity: cap, used: 0, items: [] }
      bin.items.push(item)
      bin.used += item.size
      bins.push(bin)
      ops.operations++
      steps.push({
        phase: 'open',
        note: `No existing bin fits ${item.id} (size ${item.size}); open Bin ${bin.index}.`,
        bins: bins.map(snapshotBin),
      })
    }
  }

  return {
    bins: bins.map(snapshotBin),
    binCount: bins.length,
    packed: bins.reduce((s, b) => s + b.items.length, 0),
    comparisons: ops.comparisons,
    operations: ops.operations,
    steps,
    sorted: sorted.map((s) => ({ id: s.id, size: s.size })),
    // The lower bound on bins = ceil(total size / capacity).
    lowerBound: Math.ceil(safeItems.reduce((s, it) => s + it.size, 0) / cap),
  }
}

function snapshotBin(b) {
  return {
    index: b.index,
    capacity: b.capacity,
    used: b.used,
    free: b.capacity - b.used,
    utilization: Math.round((b.used / b.capacity) * 100),
    items: b.items.map((it) => ({ id: it.id, size: it.size })),
  }
}

export const greedyMeta = {
  name: 'Greedy Algorithm — First-Fit Decreasing',
  application: 'Warehouse storage allocation (bin packing)',
  bestCase: 'O(n log n)',
  averageCase: 'O(n log n)',
  worstCase: 'O(n²)  (sort O(n log n) + packing O(n·m))',
  spaceComplexity: 'O(n)',
  pseudocode: [
    'function FFD(items, capacity):',
    '    sort items by size DESCENDING',
    '    bins ← empty list',
    '    for each item in items:',
    '        placed ← false',
    '        for each bin in bins:',
    '            if bin.used + item.size ≤ capacity:',
    '                add item to bin',
    '                placed ← true',
    '                break',
    '        if not placed:',
    '            open new bin with item',
    '    return bins',
  ],
}
