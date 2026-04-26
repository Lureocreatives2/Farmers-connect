# 🌿 Farmers Connect

> Nigeria's earthy, modern farm-to-buyer marketplace.  
> Farmers list produce. Buyers discover and contact via WhatsApp. Admin reviews everything.

**Designed & Built by Opeyemi Adeshina**

---

## 📁 Project Structure

```
farmers-connect/              ← Frontend (deploy to Netlify)
├── index.html                ← Homepage (hero, categories, featured, how it works)
├── shop.html                 ← Product browser (search, filter by cat/state, pagination)
├── product.html              ← Product detail + WhatsApp CTA
├── farmer-profile.html       ← Farmer's public profile + all their listings
├── farmers.html              ← Farmer directory (search + state filter)
├── register-farmer.html      ← Farmer registration form
├── list-product.html         ← Farmer product listing form (with image upload)
├── about.html                ← Mission, values, timeline, impact stats
├── contact.html              ← Contact form + info cards
├── faq.html                  ← Accordion FAQ (tabbed: Buyers / Farmers / Platform)
├── admin.html                ← Full admin panel (login protected)
├── _redirects                ← Netlify URL routing rules
├── netlify.toml              ← Netlify build + cache headers config
├── css/
│   ├── styles.css            ← Full design system (Fraunces + Jakarta Sans)
│   └── admin.css             ← Admin-only styles (dark sidebar layout)
└── js/
    └── api.js                ← API client, shared utilities, nav/footer injection

farmers-connect-backend/      ← Backend (deploy to Render)
├── server.js                 ← Express entry point
├── package.json
├── .env.example              ← Environment variable template
├── prisma/
│   ├── schema.prisma         ← Database schema (User, Farmer, Product + enums)
│   └── seed.js               ← Sample data (5 farmers, 12 products)
├── routes/
│   ├── products.js           ← GET /products, GET /products/:id, POST /products
│   ├── farmers.js            ← POST /register, GET /:id, GET /lookup/:phone
│   └── admin.js              ← All /admin/* routes + login handler
└── middleware/
    ├── upload.js             ← Cloudinary image upload via Multer
    └── validate.js           ← express-validator rules for products & farmers
```

---

## 🗄️ Database Schema

```
User           ──┐
  id (uuid)     │ 1:1
  name          │
  phone (unique)│
  role          ↓
              Farmer ──┐
                id      │ 1:many
                farmName│
                state   │
                verified│
                        ↓
                      Product
                        id
                        name
                        category   (GRAINS|VEGETABLES|FRUITS|TUBERS|LEGUMES|LIVESTOCK|DAIRY|OTHER)
                        price
                        unit
                        description
                        imageUrl   (Cloudinary)
                        available  (boolean)
                        status     (PENDING|APPROVED|REJECTED|FLAGGED)
                        createdAt
```

---

## 🔌 API Reference

### Public endpoints

| Method | Endpoint                      | Description                          |
|--------|-------------------------------|--------------------------------------|
| GET    | /health                       | Server health check                  |
| GET    | /api/products                 | Browse products (filter/search/page) |
| GET    | /api/products/:id             | Single product details               |
| POST   | /api/products                 | Create listing (multipart/form-data) |
| PATCH  | /api/products/:id/toggle      | Toggle product availability          |
| POST   | /api/farmers/register         | Register a new farmer                |
| GET    | /api/farmers/lookup/:phone    | Look up farmer by phone number       |
| GET    | /api/farmers/:id              | Farmer profile + their products      |

### Admin endpoints (require `x-admin-token` header)

| Method | Endpoint                          | Description                   |
|--------|-----------------------------------|-------------------------------|
| POST   | /api/admin/login                  | Authenticate + receive token  |
| GET    | /api/admin/stats                  | Dashboard summary stats       |
| GET    | /api/admin/products               | All products with filters     |
| PATCH  | /api/admin/products/:id/status    | Approve / reject / flag       |
| DELETE | /api/admin/products/:id           | Permanently delete product    |
| GET    | /api/admin/farmers                | All farmers with filters      |
| PATCH  | /api/admin/farmers/:id/verify     | Verify / unverify farmer      |
| DELETE | /api/admin/farmers/:id            | Remove farmer + all listings  |

---

## ⚙️ Local Development Setup

### 1. Clone & install backend dependencies

```bash
cd farmers-connect-backend
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
# Edit .env — fill in your database URL and Cloudinary credentials
```

### 3. Set up the database

```bash
# Push schema to your PostgreSQL database
npx prisma db push

# (Recommended) Generate Prisma client
npx prisma generate

# (Optional) Seed with sample farmers and products
npm run db:seed

# (Optional) Browse your data in a visual editor
npm run db:studio
```

### 4. Start the backend server

```bash
npm run dev       # Development (auto-restarts on file changes)
npm start         # Production
```

### 5. Open the frontend

```bash
# No build step needed — open directly in browser
open farmers-connect/index.html

# Or use a local HTTP server (recommended):
npx serve farmers-connect
# Then visit: http://localhost:3000
```

### 6. Update the API base URL

Open `farmers-connect/js/api.js` and update:

```javascript
// Change this line:
const API_BASE = "https://YOUR-BACKEND.onrender.com/api";

// To your local server:
const API_BASE = "http://localhost:5000/api";
```

---

## 🚀 Deployment

### Step 1 — Database (Supabase — Free PostgreSQL)

1. Go to [supabase.com](https://supabase.com) → Create new project
2. **Settings → Database → Connection string** → copy the URI
3. Paste it as `DATABASE_URL` in your Render environment variables

### Step 2 — Backend (Render — Free Tier)

1. Push `farmers-connect-backend/` to a GitHub repository
2. Go to [render.com](https://render.com) → **New → Web Service**
3. Connect your GitHub repository
4. Set **Build Command:** `npm install && npx prisma generate && npx prisma db push`
5. Set **Start Command:** `npm start`
6. Add these environment variables on Render:

```
DATABASE_URL          = (from Supabase)
CLOUDINARY_CLOUD_NAME = (from Cloudinary dashboard)
CLOUDINARY_API_KEY    = (from Cloudinary dashboard)
CLOUDINARY_API_SECRET = (from Cloudinary dashboard)
ADMIN_USERNAME        = admin
ADMIN_PASSWORD        = your-secure-password
ADMIN_SECRET          = your-long-random-secret-string
FRONTEND_URL          = https://your-site.netlify.app
NODE_ENV              = production
```

7. Deploy → copy your Render URL (e.g. `https://farmers-connect-api.onrender.com`)

### Step 3 — Update frontend API URL

In `farmers-connect/js/api.js`:

```javascript
const API_BASE = "https://farmers-connect-api.onrender.com/api";
```

Also update `admin.html`:
```javascript
const API = "https://farmers-connect-api.onrender.com/api";
```

### Step 4 — Frontend (Netlify)

**Option A — Drag & drop (fastest):**
1. Go to [netlify.com](https://netlify.com) → **Add new site → Deploy manually**
2. Drag the entire `farmers-connect/` folder into the upload area
3. Your site is live instantly

**Option B — GitHub (recommended for updates):**
1. Push `farmers-connect/` to a GitHub repo
2. Netlify → **New site → Import from Git** → connect repo
3. Leave build command empty (static site)
4. Set **Publish directory:** `.` (or leave blank)
5. Deploy

---

## 🔐 Admin Panel

Access at: `https://your-site.netlify.app/admin`

| Field    | Default value          |
|----------|------------------------|
| Username | `admin`                |
| Password | `farmersconnect2024`   |

**Change these** by setting `ADMIN_USERNAME` and `ADMIN_PASSWORD` on Render before going live.

### Admin capabilities:
- **Dashboard** — live stats, category breakdown, top states, activity feed
- **All Products** — search, filter by status/category, approve/reject/flag/delete
- **Pending Review** — dedicated queue for newly listed products
- **Flagged Listings** — reported content requiring action
- **Farmer Accounts** — verify/unverify, search, filter, delete (cascades to products)

---

## 👤 User Journeys

### Farmer journey:
```
1. /register-farmer.html  → Enter name, phone, farm name, state → Save Farmer ID
2. /list-product.html     → Enter phone to verify → Fill product form → Upload photo → Publish
3. Admin approves listing → Product goes live on marketplace
4. Buyer contacts via WhatsApp → Deal made directly
```

### Buyer journey:
```
1. /shop.html             → Browse / search / filter by category & state
2. /product.html?id=xxx   → View full details, farmer info, price
3. Click WhatsApp button  → Pre-filled message opens → Negotiate directly with farmer
```

### Admin journey:
```
1. /admin.html            → Login with username + password
2. Dashboard              → Review pending count, flag alerts, stats
3. Pending Review         → Approve or reject new listings one by one
4. Flagged Listings       → Approve or permanently delete reported content
5. Farmer Accounts        → Verify legitimate farmers, remove bad actors
```

---

## 🎨 Design System

| Token       | Value                           |
|-------------|---------------------------------|
| Display font | Fraunces (serif, optical sizing)|
| Body font   | Plus Jakarta Sans               |
| Forest green| `#245224` → `#3a8a3a`          |
| Terracotta  | `#b04a22` → `#e06b38`          |
| Ochre/gold  | `#aa7800` → `#e8ac14`          |
| Parchment   | `#faf7f2` → `#e8d9c0`          |

---

## 🔮 Post-MVP Roadmap

| Feature                   | Description                         | Tech           |
|---------------------------|-------------------------------------|----------------|
| Farmer verification       | NIN/BVN check or manual doc upload  | —              |
| In-app payments           | Secure escrow transactions          | Paystack        |
| SMS notifications         | Reach farmers without smartphones   | Termii          |
| Real-time buyer-farmer chat | Reduce WhatsApp dependency        | Socket.io       |
| Farmer ratings & reviews  | Build trust in marketplace          | Star system     |
| Logistics integration     | Book delivery from listing page     | Kwik / Sendbox  |
| PWA / offline mode        | Serve rural areas with poor signal  | Service Workers |
| Analytics dashboard       | Revenue, engagement, top categories | Recharts        |

---

**Designed & Built by Opeyemi Adeshina**  
© 2024 Farmers Connect · Empowering Nigerian Agriculture
