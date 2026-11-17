# 🏭 WarehouseOS
### Smart Warehouse Management & Algorithm-Based Optimization System

**WarehouseOS** is a web-based warehouse management and optimization system developed as a Design and Analysis of Algorithms (DAA) mini project for SY BTech CSE, Academic Year 2026–27.

The application combines practical warehouse operations with algorithmic problem-solving techniques to improve inventory organization, storage allocation and warehouse picking routes.

It demonstrates the practical application of four fundamental DAA algorithms through an interactive Algorithm Lab with step-by-step execution, pseudocode, flowcharts and complexity analysis.

---

## 🚀 Key Features

### 1. Dashboard
- Real-time inventory overview and key performance indicators.
- Warehouse utilization statistics.
- Inventory movement and category analytics.
- Low-stock and out-of-stock alerts.
- Pending order overview.

### 2. Inventory Management
- Add, update and manage inventory.
- Search, filter, sort and paginate products.
- Stock reservation and release.
- Stock transfers between warehouses.
- Inventory transaction history.
- CSV import and export.

### 3. Warehouse Management
- Manage multiple warehouses.
- Organize storage through a hierarchical structure:
  - Warehouse
  - Zone
  - Aisle
  - Rack
  - Shelf
  - Bin
- Monitor storage capacity and utilization.

### 4. Smart Optimizer
- ABC inventory classification using the Pareto principle.
- Automatic reorder recommendations.
- Inventory health scoring.
- Stock redistribution suggestions.

### 5. Picking Route Optimization
- Represent warehouse locations as a weighted graph.
- Calculate shortest paths using Dijkstra's Algorithm.
- Use a Greedy Nearest-Neighbour strategy to select the next picking location.
- Compare optimized routes with sequential picking.
- Visualize warehouse routes.

### 6. DAA Algorithm Lab
An interactive environment for understanding and executing algorithms.

- Algorithm selection.
- Custom input testing.
- Step-by-step execution.
- Pseudocode and flowcharts.
- Operation and comparison counts.
- Time and space complexity analysis.

### 7. Additional Modules
- Product management.
- Supplier management.
- Order processing.
- Stock transfers.
- Analytics and reports.
- CSV report exports.
- Dark and light themes.

---

## 🧠 Algorithms Implemented

WarehouseOS demonstrates four major algorithms from Design and Analysis of Algorithms.

| Algorithm | DAA Strategy | Application |
|---|---|---|
| First-Fit Decreasing | Greedy | Warehouse storage allocation |
| Dijkstra's Algorithm | Graph / Greedy | Shortest warehouse picking routes |
| Merge Sort | Divide and Conquer | Inventory sorting |
| Binary Search | Decrease and Conquer | Product SKU searching |

### 1. First-Fit Decreasing (FFD)
Used for warehouse bin-packing and storage allocation.

- Sorts items in descending order of size.
- Places each item into the first available bin with sufficient capacity.
- Opens a new bin when no existing bin can accommodate the item.

**Time Complexity:** O(n²) worst case  
**Space Complexity:** O(n)

FFD is an approximation heuristic and does not guarantee an optimal packing in every case.

### 2. Dijkstra's Algorithm
Used to calculate the shortest walking distance between warehouse locations.

- Models warehouse locations as graph vertices.
- Represents walking paths as weighted edges.
- Calculates shortest distances.
- Reconstructs paths using predecessor information.

**Time Complexity:** O(V²) using the array-based implementation.  
**Space Complexity:** O(V + E) for the graph and supporting data structures.

### 3. Merge Sort
Used to sort inventory records based on numerical fields.

- Divides the array into smaller parts.
- Recursively sorts each part.
- Merges sorted arrays.

**Time Complexity:** O(n log n)  
**Space Complexity:** O(n)

### 4. Binary Search
Used to locate products using their SKU in a sorted catalogue.

- Checks the middle element.
- Eliminates half of the remaining search space.
- Repeats until the target is found or the search space is empty.

**Best Case:** O(1)  
**Average Case:** O(log n)  
**Worst Case:** O(log n)  
**Space Complexity:** O(1) for iterative search.

For detailed pseudocode, flowcharts, examples and complexity analysis, refer to `DAA_ALGORITHM_DOCUMENTATION.md`.

---

## 🛠️ Technology Stack

| Category | Technology |
|---|---|
| Frontend | React 18 |
| Build Tool | Vite |
| Programming Language | JavaScript (JSX) |
| Styling | Tailwind CSS |
| UI Icons | Lucide React |
| Routing | React Router |
| Charts | Recharts |
| Forms | React Hook Form |
| Validation | Zod |
| Backend / Database | Supabase |
| Database | PostgreSQL |
| Authentication | Supabase Auth |
| Deployment | GitHub Actions / GitHub Pages |

---

## 📂 Project Structure

```text
warehouseos/
│
├── .github/
│   └── workflows/
│       └── deploy.yml
│
├── public/
│
├── src/
│   ├── components/
│   ├── context/
│   ├── pages/
│   │
│   ├── lib/
│   │   ├── algorithms/
│   │   │   ├── greedy.js
│   │   │   ├── dijkstra.js
│   │   │   ├── mergeSort.js
│   │   │   └── binarySearch.js
│   │   │
│   │   ├── optimizer.js
│   │   ├── supabase.js
│   │   ├── store.js
│   │   └── demoData.js
│   │
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── supabase/
│   └── migrations/
│       └── schema.sql
│
├── .env.example
├── .gitignore
├── DAA_ALGORITHM_DOCUMENTATION.md
├── index.html
├── package.json
├── package-lock.json
├── README.md
└── vite.config.js
```

---

## ⚙️ Installation and Setup

### Prerequisites

- Node.js (recommended: Node.js 20 or later)
- npm
- Git
- VS Code or another code editor

### Step 1: Clone the repository

```bash
git clone https://github.com/Prxithvi/WarehouseOS.git
```

```bash
cd WarehouseOS/warehouseos
```

### Step 2: Install dependencies

```bash
npm install
```

### Step 3: Start the development server

```bash
npm run dev
```

Open the localhost URL displayed in your terminal.

### Step 4: Build for production

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

---

## 🗄️ Database Configuration

WarehouseOS supports two operating modes.

**1. Demo Mode**

- Works without a Supabase account.
- Uses browser localStorage.
- Loads sample warehouse and inventory data.
- Suitable for demonstrations and testing.

**2. Supabase Mode**

To connect your own Supabase project:

1. Create a project at https://supabase.com.
2. Execute the SQL migration in `supabase/migrations/schema.sql`.
3. Obtain your Supabase Project URL and anon/public key.
4. Copy `.env.example` to `.env`.
5. Configure the following variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

6. Restart the development server.

**Security:** Never commit private service-role keys or other secrets. Configure appropriate Row Level Security policies for your deployment.

---

## 📊 Project Objectives

1. Apply DAA concepts to practical warehouse management problems.
2. Demonstrate the implementation of Greedy, Graph, Divide and Conquer, and Decrease and Conquer algorithms.
3. Improve warehouse storage allocation and picking-route planning.
4. Analyze algorithm performance through time and space complexity.
5. Provide an interactive GUI for algorithm visualization and testing.
6. Compare algorithmic approaches through practical test cases.

---

## 🔮 Future Scope

- Advanced warehouse route optimization.
- Dynamic storage allocation.
- Real-time barcode and QR scanning.
- IoT-based inventory monitoring.
- Predictive stock management.
- Multi-user warehouse access.
- Mobile application integration.
- Advanced algorithm performance comparisons.

---

## 📚 Academic Documentation

The project includes a dedicated academic document:

**`DAA_ALGORITHM_DOCUMENTATION.md`**

It contains:
- Problem statements.
- Algorithm strategies.
- Pseudocode.
- Flowcharts.
- Complexity analysis.
- Worked examples.

---

## 👨‍💻 Project Information

**Project Name:** WarehouseOS  
**Subject:** Design and Analysis of Algorithms (DAA)  
**Academic Year:** 2026–27  
**Course:** SY BTech CSE  
**Project Type:** Mini Project

**Developer:** Prithviraj D Masti  
**GitHub:** https://github.com/Prxithvi

---

## 📜 License

This project is intended for academic and educational purposes.

---

⭐ If you find this project interesting, consider starring the repository!
