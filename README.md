# Showroom Expense Tracker

Tracks a showroom's daily income and expenses in two separate payment modes, **GPay** and **Cash**, with automatic balances, monthly opening/closing carry-forward, charts and Excel/PDF reports.

**Stack:** React 18 + Vite + Tailwind CSS + Recharts + Day.js (client) · Node.js + Express + Mongoose (server) · MongoDB · JWT authentication.

---

## 1. Folder structure

```
showroom-expense-tracker/
├── README.md
├── render.yaml                  # optional Render blueprint for the API
├── server/
│   ├── .env.example
│   ├── package.json
│   ├── scripts/seedSample.js    # demo data (Oct-Nov 2026)
│   ├── tests/calc.test.js       # unit tests for the money logic
│   └── src/
│       ├── server.js            # entry: connect DB, seed defaults, listen
│       ├── app.js               # express app, CORS, security headers
│       ├── config/db.js
│       ├── models/              # User, Transaction, Category, Settings
│       ├── middleware/          # auth (JWT, admin), error handler
│       ├── routes/index.js
│       ├── controllers/         # auth, transactions, categories, settings, reports
│       ├── services/
│       │   ├── calc.js          # PURE calculation logic (unit tested)
│       │   ├── ledgerService.js # runs aggregations, feeds calc.js
│       │   └── seedDefaults.js  # default categories + settings
│       └── utils/               # helpers, zod validators
└── client/
    ├── .env.example
    ├── vercel.json              # SPA rewrite for Vercel
    ├── vite.config.js, tailwind.config.js, postcss.config.js
    └── src/
        ├── App.jsx, main.jsx, index.css
        ├── context/             # AuthContext, ToastContext
        ├── utils/               # api (axios), format (₹, dates), hooks
        ├── components/          # Layout, SummaryCard, TransactionForm, TransactionTable,
        │                        # MonthYearFilter, MonthlyReportCard, Charts, Modal, ConfirmDialog
        └── pages/               # Login, Dashboard, ModePage (GPay + Cash), Transactions,
                                 # MonthlyReports, Categories, Settings
```

---

## 2. Database schema (MongoDB)

Collections map to the tables in the brief. MongoDB creates them automatically on first use; indexes are created by Mongoose when the server starts.

**users** – `_id (user_id)`, `name`, `email` (unique), `password` (bcrypt hash, never returned), `role` (`admin` | `user`), `created_at`

**transactions** – `_id (transaction_id)`, `transactionDate`, `type` (`RECEIVED` | `EXPENSE`), `paymentMode` (`GPAY` | `CASH`), `amount` (> 0, 2 decimals), `category` (ref → categories, required for expenses), `description`, `receivedFrom`, `paidTo`, `notes`, `clientRequestId` (unique, sparse – duplicate-submit guard), `createdBy` (ref → users), `createdAt`, `updatedAt`
Index: `{ transactionDate: -1, paymentMode: 1, type: 1 }`

**categories** – `_id (category_id)`, `name`, `nameKey` (lower-case, unique), `isDefault`, `created_at`

**settings** (one document) – `openingBalances.GPAY`, `openingBalances.CASH`, `allowNegative`

**Monthly balances are derived, not stored.** The brief's `Monthly Balances` table (opening/closing per month and mode) is computed on demand from the transactions. Storing it would create a second copy of the truth that goes stale whenever a transaction is edited or deleted. Deriving it means every edit/delete automatically corrects every month, which is rule 9 of the brief.

---

## 3. Financial calculation logic

All of it lives in `server/src/services/calc.js` and is covered by tests.

```
Opening balance of a month  = Initial opening balance (Settings)
                              + net (received − expenses) of ALL earlier transactions
Closing balance             = Opening + Received − Expenses
Next month's opening        = This month's closing        (automatic carry-forward)
Combined                    = GPay + Cash                 (always)
```

* GPay and Cash are computed separately; Combined is the sum of the two.
* Money is calculated in **integer paise**, so `0.1 + 0.2` is exactly `0.30`.
* Nothing is ever incremented or decremented by hand. Balances are recomputed from the transaction records on every request.
* **Negative-balance guard:** an expense (or an edit/delete that lowers a balance) that would take GPay or Cash below zero is rejected with a warning unless the admin turns on *Allow negative balances* in Settings. The form also shows a live warning while typing.
* **Duplicate protection:** every form submission carries a unique `clientRequestId` (same id → same record returned, never inserted twice), the submit button locks while saving, and the server also rejects an identical transaction created within the last 30 seconds.

Run the tests (they use the sample figures from the brief: GPay ₹50,000/₹15,000 → ₹35,000, Cash ₹30,000/₹10,000 → ₹20,000, Combined ₹80,000/₹25,000 → ₹55,000):

```
cd server
npm test
```

---

## 4. Run locally (Windows, PowerShell)

Requirements: Node.js 18+ and either local MongoDB or a free MongoDB Atlas cluster (section 5).

```powershell
# 1. API
cd showroom-expense-tracker\server
npm install
copy .env.example .env
notepad .env          # set MONGODB_URI and JWT_SECRET
npm run dev           # http://localhost:5000

# 2. Web app (second terminal)
cd showroom-expense-tracker\client
npm install
npm run dev           # http://localhost:5173
```

Open http://localhost:5173. The first visit shows **Create the administrator account**; after that, registration closes and everyone signs in. Then open **Settings** and enter the showroom's opening GPay and Cash balances.

Optional demo data (October–November 2026):

```powershell
cd server
npm run seed:sample            # add demo transactions
npm run seed:sample -- --reset # wipe all transactions first, then add demo data
```

Generate a strong `JWT_SECRET`:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## 5. Database setup

### Option A – MongoDB Atlas (recommended, free tier, needed for deployment)

1. Create an account at https://www.mongodb.com/cloud/atlas and create a **free (M0) cluster**.
2. **Database Access → Add New Database User.** Choose a username and a password (avoid special characters, or URL-encode them). Give it *Read and write to any database*.
3. **Network Access → Add IP Address.** For local development add your current IP. For Render, add `0.0.0.0/0` (Render's outgoing IPs change on the free plan); the database user's password is then your protection, so make it strong.
4. **Database → Connect → Drivers** and copy the connection string, then add the database name before the `?`:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/showroom_expense_tracker?retryWrites=true&w=majority
   ```
5. Put that value in `MONGODB_URI` (`server/.env` locally, Render's environment variables in production).

### Option B – Local MongoDB

Install MongoDB Community Server (https://www.mongodb.com/try/download/community), keep the "run as a service" option, and use:

```
MONGODB_URI=mongodb://127.0.0.1:27017/showroom_expense_tracker
```

### What happens on first start

No manual migration is needed. When the API starts it connects, creates the collections and indexes, inserts the 8 default expense categories (Transportation, Food and Refreshments, Electricity Bill, Maintenance, Staff Expenses, Office Supplies, Cleaning, Miscellaneous) and a settings document with zero opening balances. This is safe to repeat on every restart.

---

## 6. Deployment

Deploy the API to **Render**, the web app to **Vercel**, and keep the database on **Atlas**. Push the project to a GitHub repository first (`.gitignore` already excludes `node_modules` and `.env`).

### Step 1 – API on Render

1. Render dashboard → **New → Web Service** → connect your GitHub repo.
2. Settings:
   * **Root Directory:** `server`
   * **Build Command:** `npm install`
   * **Start Command:** `npm start`
   * **Health Check Path:** `/api/health`
3. **Environment variables:**

   | Key | Value |
   |---|---|
   | `MONGODB_URI` | your Atlas connection string |
   | `JWT_SECRET` | long random string (see above) |
   | `JWT_EXPIRES_IN` | `7d` |
   | `CLIENT_URL` | your Vercel URL, e.g. `https://showroom-expense.vercel.app` (add it after Step 2; no trailing slash; separate several origins with commas) |

   (`render.yaml` in the repo root can create this service as a Blueprint instead.)
4. Deploy. Check `https://<your-service>.onrender.com/api/health` returns `{"ok":true}`.

> On Render's free plan the service sleeps after inactivity, so the first request after a break can take about 30–60 seconds.

### Step 2 – Web app on Vercel

1. Vercel dashboard → **Add New → Project** → import the same repo.
2. Settings:
   * **Root Directory:** `client`
   * **Framework Preset:** Vite (build `npm run build`, output `dist`)
3. **Environment variable:** `VITE_API_URL` = `https://<your-service>.onrender.com/api`
4. Deploy. `client/vercel.json` makes page refreshes on routes like `/transactions` work.
5. Go back to Render and set `CLIENT_URL` to the final Vercel URL, then redeploy the API (CORS only allows that origin).

### Step 3 – First use in production

Open the Vercel URL → create the administrator account → Settings → enter opening balances. Registration closes automatically after the first account.

### Troubleshooting

| Symptom | Fix |
|---|---|
| Browser shows a CORS error | `CLIENT_URL` on Render must exactly match the Vercel URL (https, no trailing slash); redeploy the API |
| "Cannot reach the server" | `VITE_API_URL` is wrong or missing `/api`; Vercel needs a redeploy after changing env vars |
| API crashes with `MongooseServerSelectionError` | Atlas Network Access does not allow Render's IPs (add `0.0.0.0/0`), or the password in the URI has unescaped special characters |
| API exits with "JWT_SECRET must be set" | Add `JWT_SECRET` (16+ characters) |
| Page refresh gives 404 on Vercel | Make sure `client/vercel.json` is present and Root Directory is `client` |

---

## 7. API summary

All routes are under `/api` and need `Authorization: Bearer <token>` except `auth/*` and `health`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/auth/status` | Is first-time registration open? |
| POST | `/auth/register`, `/auth/login` | Create the first admin / sign in |
| GET | `/transactions` | List with filters: `date, month, year, paymentMode, type, category, search, page, limit` |
| POST | `/transactions` | Add received amount or expense |
| PUT / DELETE | `/transactions/:id` | Edit / delete |
| GET/POST/PUT/DELETE | `/categories`, `/categories/:id` | Manage expense categories |
| GET / PUT | `/settings` | Opening balances, allow-negative (PUT: admin only) |
| GET | `/summary?year&month` | Dashboard totals (omit both for all time, year only for the whole year) |
| GET | `/reports/monthly`, `/reports/yearly` | Opening/closing reports with carry-forward |
| GET | `/reports/categories`, `/reports/daily` | Chart data |
| GET | `/reports/export?year&month&format=xlsx\|pdf` | Download monthly report |

---

## 8. Notes and limits

* One administrator account owns the data; the first account registered becomes the admin.
* The negative-balance check compares against the current all-time balance of that payment mode, not the balance on the transaction's date.
* PDF reports show amounts as `Rs.` because the built-in PDF fonts have no ₹ glyph; Excel reports use ₹.
* Dates are treated as calendar days (stored at UTC midnight), so a transaction never shifts to another day or month because of time zones.
