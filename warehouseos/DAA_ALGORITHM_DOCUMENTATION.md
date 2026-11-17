# DAA Algorithm Documentation — WarehouseOS

This document is the academic companion to the **DAA Algorithm Lab** in WarehouseOS. Each of the four algorithms is described with its problem statement, input/output, pseudocode, flowchart, complexity analysis and a worked example. The implementations live in `src/lib/algorithms/` and are executed live in the app.

---

## A. Greedy Algorithm — First-Fit Decreasing (FFD) Bin Packing

**Application in WarehouseOS:** storage allocation — assign incoming stock items to storage bins of fixed capacity using the fewest bins.

### Problem statement
Given a set of `n` items, each with a positive size `sᵢ`, and identical bins of capacity `C`, pack every item into a bin so that the sum of item sizes in any bin never exceeds `C`, while minimizing the number of bins used. This is the classical **bin packing** problem (NP-hard in the general case); the greedy FFD heuristic gives a strong approximation in polynomial time.

### Input / Output
- **Input:** list of `{id, size}` items and a bin capacity `C > 0`.
- **Output:** a packing (list of bins, each with its items, used/free capacity), the number of bins used, and a lower bound `⌈Σsᵢ / C⌉`.

### Greedy strategy
1. **Sort items by size descending** — handle the largest, hardest-to-fit items first (the greedy choice that makes FFD effective).
2. For each item, place it into the **first bin** that still has room; if none fits, **open a new bin**.

The choice is locally optimal (pack the biggest remaining item into the first bin that can take it) and the algorithm never back-tracks — exactly what makes it a greedy algorithm.

### Pseudocode
```
function FFD(items, capacity):
    sort items by size DESCENDING
    bins ← empty list
    for each item in items:
        placed ← false
        for each bin in bins:
            if bin.used + item.size ≤ capacity:
                add item to bin ; placed ← true ; break
        if not placed:
            open a new bin and put item in it
    return bins
```

### Flowchart
```
[Start: read items + capacity]
        ↓
[Sort items by size DESC]
        ↓
<For each item?> ── no ──→ [Output bins]
        ↓ yes
<First bin that fits?>
        ↓ yes            ↓ no
[Add to that bin]   [Open new bin]
        ↓                ↓
        └──→ loop ───────┘
```

### Complexity
| Case | Time |
| --- | --- |
| Best | O(n log n) — the sort dominates |
| Average | O(n log n) |
| Worst | O(n²) — sort O(n log n) + packing O(n·m) where m is the number of bins |
| Space | O(n) |

FFD uses at most `(11/9)·OPT + 6/9` bins in the worst case (Dósa–Sgall bound), and is within ~22% of optimal in practice.

### Worked example
Items `{60, 55, 45, 40, 30, 25, 20, 15}`, capacity `100`:
- Sorted desc: `60, 55, 45, 40, 30, 25, 20, 15`.
- Bin 1: 60 → 60; 55? no; 45? no; 40? 100 → fits → 60+40=100. **Bin 1 full.**
- Bin 2: 55 → 55; 45? 100 → fits → 55+45=100. **Bin 2 full.**
- Bin 3: 30 → 30; 25 → 55; 20 → 75; 15 → 90. **Bin 3 = 90.**
- Result: **3 bins** (lower bound ⌈290/100⌉ = 3 — optimal).

---

## B. Dijkstra's Algorithm — Single-Source Shortest Path

**Application in WarehouseOS:** compute the shortest walking distance from the packing station to each storage location, and assemble a multi-stop picking route.

### Problem statement
Given a weighted graph `G = (V, E)` with non-negative edge weights and a source vertex `s`, compute the minimum-distance path from `s` to every other vertex.

### Input / Output
- **Input:** graph `{nodes, edges:[{from, to, weight}]}` and a start node.
- **Output:** `dist[]` (shortest distance to each node) and `prev[]` (predecessor chain for path reconstruction).

### Strategy (greedy relaxation)
Maintain a set of visited nodes and a tentative distance for each node. Repeatedly select the **unvisited node with the smallest tentative distance** (greedy choice), mark it visited, and **relax** its outgoing edges: if `dist[u] + w(u,v) < dist[v]`, update `dist[v]` and set `prev[v] = u`.

### Pseudocode
```
function Dijkstra(graph, source):
    for each v: dist[v] ← ∞ ; prev[v] ← undefined
    dist[source] ← 0
    Q ← all vertices
    while Q not empty:
        u ← vertex in Q with min dist[u]
        remove u from Q
        for each neighbour v of u:
            alt ← dist[u] + weight(u, v)
            if alt < dist[v]:
                dist[v] ← alt ; prev[v] ← u
    return dist, prev
```

### Flowchart
```
[Init: dist[source]=0, others=∞]
        ↓
<Unvisited nodes?> ── no ──→ [Output distances + paths]
        ↓ yes
[Pick unvisited node u with min dist]
        ↓
<For each neighbour v of u>
        ↓
[alt ← dist[u] + w(u,v)]
        ↓
<alt < dist[v]?> ── yes ──→ [dist[v]=alt, prev[v]=u]
        ↓ no
        └──→ loop ───────────┘
```

### Complexity
| Case | Time (array-based) | Time (binary heap) |
| --- | --- | --- |
| Best | O(V²) | O((V+E) log V) |
| Average | O(V²) | O((V+E) log V) |
| Worst | O(V²) | O((V+E) log V) |
| Space | O(V) | O(V) |

WarehouseOS uses the array-based O(V²) implementation so every min-selection step is visible in the step trace.

### Multi-stop picking route (greedy nearest-neighbour)
To visit several target locations starting at the packing station:
1. Run Dijkstra from the current node.
2. Move to the **nearest unvisited target** (greedy).
3. Repeat until all targets are visited, then return to the start.

The app compares this against **sequential picking** (visit targets in selection order) and reports the distance saved.

### Worked example
Edges: `PACK-A1:15, A1-A2:10, A2-A3:10, A1-B1:12, B1-B2:10, PACK-B1:20`, start `PACK`:
- Init `dist[PACK]=0`, others ∞.
- Visit PACK → relax: `A1=15, B1=20`.
- Visit A1 (15) → relax: `A2=25, B1=min(20, 15+12)=20` (no change).
- Visit B1 (20) → relax: `B2=30`.
- Visit A2 (25) → relax: `A3=35`.
- Visit B2 (30), A3 (35).
- Final: `A1=15, A2=25, A3=35, B1=20, B2=30`. The shortest PACK→A3 path is `PACK→A1→A2→A3 = 35` (not PACK→B1→… which is longer).

---

## C. Merge Sort — Divide & Conquer

**Application in WarehouseOS:** sort inventory records by any numeric field (stock, price, expiry, value).

### Problem statement
Sort an array of `n` comparable elements into non-decreasing order.

### Strategy (divide & conquer)
1. **Divide** — split the array into two halves.
2. **Conquer** — recursively sort each half.
3. **Combine** — merge the two sorted halves into one sorted array.

### Input / Output
- **Input:** an array of numbers (or objects with a numeric key) and an order (`asc`/`desc`).
- **Output:** a new sorted array.

### Pseudocode
```
function mergeSort(A):
    if length(A) ≤ 1: return A
    mid ← length(A) / 2
    left  ← mergeSort(A[0..mid])
    right ← mergeSort(A[mid..end])
    return merge(left, right)

function merge(left, right):
    result ← []
    while left and right not empty:
        if left[0] ≤ right[0]: move left[0] to result
        else:                  move right[0] to result
    append remaining elements
    return result
```

### Flowchart
```
[length ≤ 1?] ── yes ──→ [return A]
        ↓ no
[Split into left + right]
        ↓
[mergeSort(left)]   [mergeSort(right)]
        ↓                ↓
        └──→ [merge left + right] ──→ [return merged]
```

### Complexity
| Case | Time | Space |
| --- | --- | --- |
| Best | O(n log n) | O(n) |
| Average | O(n log n) | O(n) |
| Worst | O(n log n) | O(n) |

Merge sort is **stable** and guarantees O(n log n) in every case — its main advantage over quicksort, at the cost of O(n) auxiliary space.

### Worked example
Input `[5, 2, 8, 1, 9, 3]`:
- Split → `[5,2,8]` and `[1,9,3]`.
- Sort left: `[5]`, `[2,8]` → `[2,8]`; merge → `[2,5,8]`.
- Sort right: `[1]`, `[3,9]` → `[3,9]`; merge → `[1,3,9]`.
- Merge `[2,5,8]` + `[1,3,9]` → `[1,2,3,5,8,9]`.

---

## D. Binary Search — Decrease & Conquer

**Application in WarehouseOS:** locate a product by its SKU in a sorted catalogue in logarithmic time.

### Problem statement
Given a **sorted** array `A` of `n` elements and a target `x`, return the index of `x` in `A` (or `-1` if absent).

### Precondition
The array **must be sorted**. If the supplied array is not sorted, WarehouseOS sorts it first (using merge sort) and reports that the precondition was enforced.

### Strategy (decrease & conquer)
Compare `x` with the middle element:
- equal → found, return the middle index;
- `x` is greater → search the right half;
- `x` is smaller → search the left half.

Each step discards half of the remaining elements.

### Pseudocode
```
function binarySearch(A, x):
    lo ← 0 ; hi ← length(A) - 1
    while lo ≤ hi:
        mid ← (lo + hi) / 2
        if A[mid] == x: return mid
        else if A[mid] < x: lo ← mid + 1
        else: hi ← mid - 1
    return -1
```

### Flowchart
```
[lo=0, hi=n-1]
        ↓
<lo ≤ hi?> ── no ──→ [return -1]
        ↓ yes
[mid = (lo+hi)/2]
        ↓
<A[mid] == x?> ── yes ──→ [return mid]
        ↓ no
<A[mid] < x?> ── yes ──→ [lo = mid+1]
        ↓ no                    ↓
[hi = mid-1]                    ↓
        └──→ loop ──────────────┘
```

### Complexity
| Case | Time | Space |
| --- | --- | --- |
| Best | O(1) — target is the middle element | O(1) iterative |
| Average | O(log n) | O(1) |
| Worst | O(log n) | O(1) |

At most `⌈log₂ n⌉ + 1` comparisons are ever required.

### Worked example
Sorted catalogue `['SKU-0001','SKU-0005','SKU-0009','SKU-0012','SKU-0017','SKU-0023','SKU-0031']`, target `SKU-0017`:
- lo=0, hi=6, mid=3 → `SKU-0012` < target → lo=4.
- lo=4, hi=6, mid=5 → `SKU-0023` > target → hi=4.
- lo=4, hi=4, mid=4 → `SKU-0017` == target → **return 4**. (3 comparisons.)

---

## Verification

Every algorithm is run on real input inside the **DAA Algorithm Lab** page (`/algorithms`); the step traces, comparison/operation counts and complexity tables shown there are produced by the exact functions documented above — no fake results are displayed.
