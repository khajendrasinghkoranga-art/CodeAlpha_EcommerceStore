# NOVA Store (Local)

This project is a static frontend with an optional Express backend to serve files and provide simple API endpoints.

Quick start:

1. Install dependencies

```bash
npm install
```

2. Run in development (auto-restarts on changes)

```bash
npm run dev
```

3. Or run production server

```bash
npm start
```

The server serves the frontend at http://localhost:3000 and exposes a basic API:

- `GET /api/products` — list products (supports `category`, `q`, `sort` query params)
- `GET /api/products/:id` — product details
- `POST /api/checkout` — submit a checkout payload (returns a fake order id)

Order persistence & payments (demo)
- Orders are persisted in `data.db` (SQLite) in the project root.
- `POST /api/checkout` creates an order with status `pending` and returns `{ orderId }`.
- `POST /api/pay/:orderId` simulates payment and marks order `paid`.
- `GET /api/orders` and `GET /api/orders/:id` return saved orders.
- `GET /invoice/:orderId` returns a simple HTML invoice.

If you prefer a lightweight static server without Node, you can also use Python's `http.server`:

```bash
python -m http.server 8000
```

Let me know if you want me to wire the frontend to call the new `/api` endpoints directly (instead of using the in-browser `PRODUCTS` array).
