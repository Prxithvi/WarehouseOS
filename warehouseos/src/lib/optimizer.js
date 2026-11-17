// ---------------------------------------------------------------------------
// Inventory Optimizer — transparent, rule-based recommendations.
// No machine learning, no "AI": every number is derived with an explicit,
// documented formula so the DAA examiner can verify each recommendation.
// ---------------------------------------------------------------------------

const num = (x) => Number(x) || 0

/** Inventory value at cost = on-hand quantity × purchase price. */
export function productValue(p) {
  return num(p.quantity) * num(p.purchase_price)
}

/**
 * ABC classification by inventory value (Pareto / 80-20 rule).
 *   A — the items that account for the top 80% of cumulative value
 *   B — the next 15% (80% → 95%)
 *   C — the remaining 5% (95% → 100%)
 */
export function abcClassification(products) {
  const sorted = [...products]
    .map((p) => ({ ...p, value: productValue(p) }))
    .sort((a, b) => b.value - a.value)
  const total = sorted.reduce((s, p) => s + p.value, 0) || 1
  let cum = 0
  return sorted.map((p) => {
    cum += p.value
    const cumPct = (cum / total) * 100
    let cls = 'C'
    if (cumPct <= 80) cls = 'A'
    else if (cumPct <= 95) cls = 'B'
    return {
      ...p,
      class: cls,
      valueShare: total ? (p.value / total) * 100 : 0,
      cumulativeShare: cumPct,
    }
  })
}

/**
 * Reorder recommendations. Rules:
 *   - out_of_stock (q ≤ 0):        reorder up to max_stock
 *   - low_stock (0 < q ≤ min):     reorder up to max_stock
 *   - overstock (q ≥ max):         reorder = 0, suggest redistribution
 *   - healthy:                     no action
 */
export function reorderRecommendations(products) {
  const out = []
  const low = []
  const over = []
  const healthy = []
  for (const p of products) {
    const q = num(p.quantity)
    const min = num(p.min_stock)
    const max = num(p.max_stock)
    const reorderQty = Math.max(0, max - q)
    const base = {
      ...p,
      current: q,
      recommended: max,
      reorderQty,
      estCost: reorderQty * num(p.purchase_price),
    }
    if (q <= 0) {
      out.push({ ...base, reason: 'Out of stock — reorder immediately to restore availability.' })
    } else if (q <= min) {
      low.push({ ...base, reason: `On-hand (${q}) is at/below the minimum safety level (${min}). Reorder to bring stock up to the maximum (${max}).` })
    } else if (max > 0 && q >= max) {
      over.push({ ...base, reorderQty: 0, reason: `On-hand (${q}) has reached/exceeded the maximum (${max}). Hold ordering; consider redistributing the excess.` })
    } else {
      healthy.push({ ...base, reason: 'Stock level is within the healthy min–max band.' })
    }
  }
  return { out, low, over, healthy, all: [...out, ...low, ...over] }
}

/**
 * Inventory health score (0–100). Pure additive penalty model.
 *   start 100
 *   − 40 × (out-of-stock ratio)
 *   − 30 × (low-stock ratio)
 *   − 15 × (overstock ratio)
 *   − 15 × (expiring-within-14-days ratio)
 */
export function inventoryHealthScore(products, today = new Date()) {
  const total = products.length || 1
  let out = 0
  let low = 0
  let over = 0
  let expiring = 0
  for (const p of products) {
    const q = num(p.quantity)
    const min = num(p.min_stock)
    const max = num(p.max_stock)
    if (q <= 0) out++
    else if (q <= min) low++
    else if (max > 0 && q >= max) over++
    if (p.expiry_date) {
      const days = (new Date(p.expiry_date) - today) / 86400000
      if (days <= 14 && days >= 0) expiring++
    }
  }
  const score = Math.max(
    0,
    Math.min(
      100,
      100 - 40 * (out / total) - 30 * (low / total) - 15 * (over / total) - 15 * (expiring / total)
    )
  )
  return {
    score: Math.round(score),
    counts: { total, out, low, over, expiring },
    ratios: {
      out: out / total,
      low: low / total,
      over: over / total,
      expiring: expiring / total,
    },
    grade: score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Fair' : 'Poor',
  }
}

/**
 * Redistribution suggestions: pair overstocked products with low-stock products
 * of the SAME category in a different warehouse and propose a transfer of the
 * surplus (capped at what the destination needs to reach its max).
 */
export function redistributionSuggestions(products) {
  const rec = reorderRecommendations(products)
  const suggestions = []
  for (const over of rec.over) {
    const candidates = rec.low.filter(
      (p) => p.category_id === over.category_id && p.warehouse_id !== over.warehouse_id
    )
    for (const dest of candidates) {
      const needed = Math.max(0, num(dest.recommended) - num(dest.current))
      if (needed <= 0) continue
      const surplus = num(over.current) - num(over.recommended)
      const moveQty = Math.min(needed, surplus)
      if (moveQty <= 0) continue
      suggestions.push({
        productId: over.id,
        productName: over.name,
        category: over.category_name,
        fromWarehouse: over.warehouse_name,
        toWarehouse: dest.warehouse_name,
        quantity: moveQty,
        reason: `${over.name} is overstocked in ${over.warehouse_name}; ${dest.name} in ${dest.warehouse_name} is below safety stock. Move ${moveQty} units to balance.`,
      })
    }
  }
  return suggestions
}
