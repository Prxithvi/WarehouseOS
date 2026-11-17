# WarehouseOS — Smart Warehouse Inventory & Optimization System

> A SY BTech CSE **Design and Analysis of Algorithms (DAA)** mini project.

WarehouseOS is a complete, production-style warehouse management web app built with **React + Vite + Tailwind CSS** and backed by **Supabase** (PostgreSQL + Auth). It ships with a fully working **demo mode** (localStorage) so it runs with zero backend setup, and is pre-configured for **one-command deployment to GitHub Pages**.

Four core DAA algorithms — **Greedy (bin packing)**, **Dijkstra**, **Merge Sort** and **Binary Search** — are implemented from scratch and applied to real warehouse problems in the interactive **DAA Algorithm Lab**.

---

## ✨ Features

- **Dashboard** — live KPIs (products, units, low/out of stock, inventory value, pending orders) computed from real records, plus movement, category, utilization and top-selling charts and alert cards.
- **Inventory management** — searchable / filterable / sortable / paginated table with add, remove, set, reserve, release, transfer, per-product transaction history, and CSV import/export. Negative inventory is prevented.
- **Products** — full CRUD with React Hook Form + Zod validation and inline image upload.
- **Warehouses** — multi-warehouse with the `Warehouse → Zone → Aisle → Rack → Shelf → Bin` hierarchy and live capacity utilization.
- **Storage locations** — bin-level cards with colour indicators (green = available, yellow = partial, red = full, grey = inactive).
- **Stock transfers** — inter-warehouse moves, fully logged.
- **Orders** — create orders, reserve stock on creation, advance through `Pending → Processing → Packed → Shipped → Delivered`, cancel (releases reserved stock), deliver (commits the sale).
- **Suppliers** — vendor CRUD with live product counts.
- **Smart Optimizer** — ABC classification (Pareto 80/15/5), reorder recommendations, inventory health score, and redistribution suggestions. All rules are transparent and documented — no fake AI.
- **Picking Route Optimizer** — warehouse graph (nodes = locations, edges = weighted paths), **Dijkstra** shortest legs + **greedy nearest-neighbour** sequencing, with a comparison against sequential picking and an SVG graph visualization.
- **DAA Algorithm Lab** — theory, pseudocode, flowchart, step-by-step execution, comparison/operation counts and full complexity analysis for all four algorithms. Run them on your own input.
- **Analytics** — six reports (valuation, movement, low stock, overstock, utilization, order performance) with date filters, charts and CSV export.
- **Reports** — structured CSV export center.
- **Settings** — dark/light theme, backend status, demo-data reset, profile.
- **Dark + Light themes** with persistence, responsive sidebar + topbar, global search, notifications, breadcrumbs.

---

## 🧱 Tech stack

| Layer | Choice |
| --- | --- |
| Framework | React 18 + Vite 5 |
| Language | JavaScript (JSX) |
| Styling | Tailwind CSS 3 (CSS-variable theming) |
| Icons | Lucide React |
| Routing | React Router 6 — **HashRouter** (GitHub Pages safe) |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Deploy | GitHub Pages via GitHub Actions |

No paid backend hosting is required. Supabase's free tier covers the whole project.

---

## 🚀 Quick start (demo mode)

> No Supabase account needed — the app boots into **demo mode** automatically and seeds localStorage with 3 warehouses, 30 products, 8 categories, 5 suppliers, 15 orders and 20 storage locations.

```bash
npm install
npm run dev
```

Open the printed URL. Sign in with **any** email and password.

Build for production:

```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build locally
```

---

## 🔌 Connecting Supabase (optional, recommended)

1. Create a free project at <https://supabase.com>.
2. In the **SQL Editor**, run [`supabase/migrations/schema.sql`](supabase/migrations/schema.sql). This creates all tables, indexes, constraints, Row Level Security policies and an atomic `adjust_stock` function.
3. In **Project Settings → API**, copy the **Project URL** and the **anon public** key.
4. Copy `.env.example` to `.env` and fill it in:

   ```bash
   cp .env.example .env
   ```

   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```

5. Restart `npm run dev`. The sidebar badge switches from **Demo mode** to **Supabase**.

### Security notes

- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are **public browser credentials** — they are safe to ship in the client bundle because **Row Level Security** (not key secrecy) protects the data.
- **Never** put the Supabase *service-role* key in this repo. It is not used by the app.
- The included RLS policies let any authenticated user read/write the shared warehouse data. Tighten them (e.g. scope by `owner_id`) for multi-tenant use.

---

## 🌐 Deploy to GitHub Pages

The repo is pre-wired for GitHub Pages via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

1. Push this project to a new GitHub repository.
2. In the repo, go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
3. Push to `main`. The workflow installs dependencies, runs `npm run build`, and deploys `dist/` to GitHub Pages.
4. Your site goes live at `https://<your-username>.github.io/<your-repo>/`.

### Why this works without 404s on refresh

- **`base: './'`** in `vite.config.js` makes every emitted asset URL relative to `index.html`, so the build works at any sub-path (root, project page, or custom domain).
- **HashRouter** keeps all routes after the `#`, so the browser always loads `index.html` and never hits the server for a deep link. Refreshing any page works.
- No SSR, no backend API routes — the output is a fully static `dist/`.

If you use **GitHub Secrets** to supply Supabase credentials at build time, add repository secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` and reference them in the workflow's `env:` block. (They are optional — without them the deploy simply runs in demo mode.)

---

## 📁 Project structure

```
warehouseos/
├── .github/workflows/deploy.yml      # GitHub Pages CI/CD
├── public/favicon.svg
├── src/
│   ├── main.jsx                      # entry
│   ├── App.jsx                       # providers + HashRouter + routes
│   ├── index.css                     # Tailwind + theme variables
│   ├── lib/
│   │   ├── supabase.js               # client + demo/supabase detection
│   │   ├── demoData.js               # seed generator (3 wh / 30 prod / …)
│   │   ├── store.js                  # localStorage demo store + atomic stock
│   │   ├── format.js  csv.js  nav.js  chartColors.js
│   │   ├── optimizer.js              # ABC, reorder, health, redistribution
│   │   └── algorithms/
│   │       ├── greedy.js             # First-Fit Decreasing bin packing
│   │       ├── dijkstra.js           # shortest path + greedy picking route
│   │       ├── mergeSort.js
│   │       └── binarySearch.js
│   ├── context/
│   │   ├── ThemeContext.jsx
│   │   ├── AuthContext.jsx
│   │   └── DataContext.jsx           # unified data API (demo OR supabase)
│   ├── components/
│   │   ├── Layout.jsx  Sidebar.jsx  Topbar.jsx  ThemeToggle.jsx
│   │   ├── StatCard.jsx  DataTable.jsx  ui.jsx
│   └── pages/                        # Dashboard, Inventory, Products, …
├── supabase/migrations/schema.sql    # full SQL schema + RLS
├── .env.example
├── index.html
├── vite.config.js   tailwind.config.js   postcss.config.js
└── package.json
```

See [`DAA_ALGORITHM_DOCUMENTATION.md`](DAA_ALGORITHM_DOCUMENTATION.md) for the full academic write-up of the four algorithms (problem, pseudocode, flowchart, complexity, example trace).

---

## 🧮 DAA algorithms at a glance

| Algorithm | Technique | Application in WarehouseOS | Complexity |
| --- | --- | --- | --- |
| Greedy (First-Fit Decreasing) | Greedy | Storage bin allocation (bin packing) | O(n²) worst |
| Dijkstra | Greedy + shortest path | Picking route shortest legs | O(V²) |
| Merge Sort | Divide & Conquer | Inventory sorting | O(n log n) all cases |
| Binary Search | Decrease & Conquer | SKU lookup in sorted catalogue | O(log n) |

The **DAA Algorithm Lab** page lets you run each algorithm on custom input and inspect every step.

---

## 📜 Available scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |

---

## 📄 License

MIT — free to use for academic and personal projects. Built as a DAA mini project.
