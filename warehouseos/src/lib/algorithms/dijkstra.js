// ---------------------------------------------------------------------------
// Dijkstra's Algorithm — Single-Source Shortest Path
// Application: Shortest warehouse picking route.
//
// Problem: Given a weighted graph (storage locations as nodes, walking paths
// as weighted edges) and a start node, compute the minimum walking distance
// from the start to every other node, plus the predecessor used to rebuild
// the shortest path.
//
// This implementation uses the classic O(V²) array-based version so every
// step of the priority selection is visible in the visualization.
// ---------------------------------------------------------------------------

/**
 * @param {{nodes:string[], edges:{from:string,to:string,weight:number}[]}} graph
 * @param {string} start
 */
export function dijkstra(graph, start) {
  const ops = { comparisons: 0, operations: 0 }
  const steps = []
  const nodes = [...(graph.nodes || [])]
  const adj = new Map()
  nodes.forEach((n) => adj.set(n, []))
  ;(graph.edges || []).forEach((e) => {
    if (!adj.has(e.from)) {
      adj.set(e.from, [])
      nodes.push(e.from)
    }
    if (!adj.has(e.to)) {
      adj.set(e.to, [])
      nodes.push(e.to)
    }
    adj.get(e.from).push({ to: e.to, weight: Number(e.weight) || 0 })
    // Treat the warehouse graph as undirected (you can walk both ways).
    adj.get(e.to).push({ to: e.from, weight: Number(e.weight) || 0 })
    ops.operations++
  })

  if (!nodes.includes(start)) {
    return { distances: {}, predecessors: {}, steps, comparisons: 0, operations: 0, error: 'Start node not in graph.' }
  }

  const dist = {}
  const prev = {}
  const visited = new Set()
  nodes.forEach((n) => {
    dist[n] = Infinity
    prev[n] = null
  })
  dist[start] = 0

  steps.push({
    note: `Initialize: dist[${start}] = 0, all others = ∞.`,
    current: null,
    distances: { ...dist },
    visited: [],
  })

  while (visited.size < nodes.length) {
    // Pick the unvisited node with the smallest tentative distance.
    let u = null
    let best = Infinity
    for (const n of nodes) {
      if (visited.has(n)) continue
      ops.comparisons++
      if (dist[n] < best) {
        best = dist[n]
        u = n
      }
    }
    if (u === null || dist[u] === Infinity) break // remaining nodes unreachable
    visited.add(u)
    ops.operations++

    for (const edge of adj.get(u) || []) {
      if (visited.has(edge.to)) continue
      ops.comparisons++
      const alt = dist[u] + edge.weight
      if (alt < dist[edge.to]) {
        dist[edge.to] = alt
        prev[edge.to] = u
        ops.operations++
      }
    }
    steps.push({
      note: `Visit ${u} (dist=${dist[u]}). Relax its neighbours.`,
      current: u,
      distances: { ...dist },
      visited: [...visited],
    })
  }

  return {
    distances: dist,
    predecessors: prev,
    visited: [...visited],
    comparisons: ops.comparisons,
    operations: ops.operations,
    steps,
  }
}

/** Rebuild the path from start -> target using the predecessor map. */
export function reconstructPath(prev, start, target) {
  if (!prev || prev[target] === null && target !== start) return null
  const path = [target]
  let cur = target
  while (cur !== start && cur !== null) {
    cur = prev[cur]
    if (cur === null) return null
    path.unshift(cur)
  }
  return path
}

/**
 * Greedy nearest-neighbour picking route that visits a set of target nodes
 * starting from `start`, using Dijkstra for each leg. Returns the ordered
 * visit sequence, the total distance, and the per-leg distances.
 */
export function greedyPickingRoute(graph, start, targets) {
  const ops = { comparisons: 0, operations: 0 }
  const remaining = [...(targets || [])].filter((t) => t !== start)
  const route = [start]
  const legs = []
  let total = 0
  let current = start

  while (remaining.length > 0) {
    const d = dijkstra(graph, current)
    ops.comparisons += d.comparisons
    ops.operations += d.operations
    let bestIdx = -1
    let bestDist = Infinity
    for (let i = 0; i < remaining.length; i++) {
      ops.comparisons++
      const dist = d.distances[remaining[i]]
      if (dist !== undefined && dist < bestDist) {
        bestDist = dist
        bestIdx = i
      }
    }
    if (bestIdx === -1) break // unreachable target
    const next = remaining[bestIdx]
    const path = reconstructPath(d.predecessors, current, next)
    legs.push({ from: current, to: next, distance: bestDist, path })
    total += bestDist
    route.push(next)
    remaining.splice(bestIdx, 1)
    current = next
  }

  // Return to start (optional leg) — included so the picker comes back.
  if (current !== start) {
    const back = dijkstra(graph, current)
    const backDist = back.distances[start] ?? Infinity
    if (Number.isFinite(backDist)) {
      legs.push({ from: current, to: start, distance: backDist, path: reconstructPath(back.predecessors, current, start) })
      total += backDist
      route.push(start)
    }
  }

  return {
    route,
    legs,
    totalDistance: total,
    comparisons: ops.comparisons,
    operations: ops.operations,
    legCount: legs.length,
  }
}

export const dijkstraMeta = {
  name: "Dijkstra's Shortest Path Algorithm",
  application: 'Shortest warehouse picking route',
  bestCase: 'O(V²)',
  averageCase: 'O(V²)  (array-based; O((V+E) log V) with a binary heap)',
  worstCase: 'O(V²)',
  spaceComplexity: 'O(V)',
  pseudocode: [
    'function Dijkstra(graph, source):',
    '    for each vertex v in graph:',
    '        dist[v] ← ∞ ; prev[v] ← undefined',
    '    dist[source] ← 0',
    '    Q ← set of all vertices',
    '    while Q is not empty:',
    '        u ← vertex in Q with min dist[u]',
    '        remove u from Q',
    '        for each neighbour v of u:',
    '            alt ← dist[u] + weight(u, v)',
    '            if alt < dist[v]:',
    '                dist[v] ← alt ; prev[v] ← u',
    '    return dist, prev',
  ],
}
