<p align="center">
  <h1 align="center">🪙 HariomCoins</h1>
  <p align="center">
    A full-stack, single-vendor D2C ecommerce platform — built with <strong>FastAPI</strong>, <strong>React</strong>, and <strong>PostgreSQL</strong>.
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
    <img src="https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
    <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
    <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" />
    <img src="https://img.shields.io/badge/Razorpay-0C2451?style=for-the-badge&logo=razorpay&logoColor=white" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
    <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
  </p>
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Development (Docker)](#option-1-docker-recommended)
  - [Local Development (Manual)](#option-2-manual-setup)
- [Environment Variables](#-environment-variables)
- [Database](#-database)
- [API Reference](#-api-reference)
- [Frontend Pages](#-frontend-pages)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [CI/CD](#-cicd)
- [License](#-license)

---

## 🧠 Overview

**HariomCoins** (internal codename: **BharatShop**) is a production-ready, single-vendor direct-to-consumer ecommerce web application. There is exactly **one seller** (the store owner/admin) and **multiple customers** who can browse products, add to cart, pay via Razorpay, and receive delivery through Shiprocket.

The entire application is deployed as a **single Vercel project** on a unified domain — the React SPA serves as the static frontend, while FastAPI runs as Python serverless functions under `/api/*`. Since both share one origin, **no CORS configuration is needed in production**.

Think **Bewakoof.com** or **Mokobara.com** — a personal brand store, not a marketplace.

---

## ✨ Features

### 🛒 Customer-Facing
- **Product Catalog** — Browse by category, search, filter, sort with pagination
- **Product Detail** — Image gallery, variant selection (size/color), reviews & ratings
- **Cart & Wishlist** — Add/remove items, quantity management, move items between cart and wishlist
- **Checkout** — Address management, pincode serviceability check, coupon codes, order summary
- **Razorpay Payments** — Secure payment with two-layer verification (frontend HMAC + webhook)
- **Order Tracking** — Real-time order status timeline, order history
- **User Accounts** — Registration, login (JWT), profile management, saved addresses
- **Product Reviews** — Star ratings and written reviews on purchased products

### 🛡️ Admin Panel
- **Dashboard** — Sales analytics, recent orders, revenue overview
- **Product Management** — Full CRUD with image upload, variant management (size/color/stock)
- **Order Management** — View, update status, ship orders via Shiprocket integration
- **User Management** — View customers, manage accounts
- **Coupon Management** — Create, edit, and manage discount coupons
- **Review Moderation** — Monitor and manage product reviews

### 🔧 Technical
- **JWT Auth** — Access tokens (15 min) + refresh tokens (7 days, httpOnly cookie)
- **Image Storage** — Images stored as PostgreSQL BYTEA, served via API with on-the-fly Pillow resizing (`?w=`)
- **Shiprocket Integration** — Pincode serviceability, order creation, AWB assignment, tracking
- **Email Notifications** — Transactional emails via Resend (order confirmations, status updates)
- **Database Migrations** — Alembic for schema versioning
- **CI/CD** — GitHub Actions for linting, testing, migration verification, and frontend type-check/build

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui |
| **State Management** | Zustand (auth + cart) + TanStack React Query (server state) |
| **Backend** | FastAPI (Python 3.11+), fully async |
| **ORM** | SQLAlchemy 2.0 (declarative base) + Alembic (migrations) |
| **Validation** | Pydantic v2 (schemas separate from ORM models) |
| **Database** | PostgreSQL 15+ (Neon, pooled/serverless connection) |
| **Auth** | JWT — access token + refresh token (httpOnly cookie) |
| **Payments** | Razorpay (Orders API + Standard Checkout JS) |
| **Shipping** | Shiprocket API |
| **Images** | PostgreSQL BYTEA + Pillow (validation, resize) |
| **Email** | Resend |
| **Hosting** | Vercel (static SPA + Python serverless functions) |
| **CI/CD** | GitHub Actions |

---

## 🏗️ Architecture

```
                    ┌─────────────────────────────────────┐
                    │            Vercel (One Domain)       │
                    │                                     │
  Browser ──────►  │   /*  ──►  React SPA (static build) │
                    │  /api/* ──►  FastAPI (serverless fn) │
                    └──────────────────┬──────────────────┘
                                       │
                            ┌──────────┴──────────┐
                            │  PostgreSQL (Neon)   │
                            │  • User data         │
                            │  • Products/variants │
                            │  • Orders/payments   │
                            │  • Images (BYTEA)    │
                            └──────────────────────┘
                                       │
              ┌────────────────────────┼────────────────────────┐
              │                        │                        │
     ┌────────▼────────┐   ┌──────────▼──────────┐   ┌────────▼────────┐
     │   Razorpay      │   │    Shiprocket        │   │     Resend      │
     │  (Payments)     │   │   (Shipping)         │   │    (Email)      │
     └─────────────────┘   └─────────────────────┘   └─────────────────┘
```

### Key Design Decisions

1. **Single Vercel Project** — Frontend (static) and backend (serverless) share one domain. No CORS needed.
2. **Images in PostgreSQL** — Product images stored as BYTEA columns, served via `/api/images/{id}` with aggressive caching and on-the-fly resizing.
3. **Immutable Order Snapshots** — `order_items` stores product name, price, SKU, size, and color directly (not as foreign keys), preserving historical data.
4. **DB-cached Shiprocket Tokens** — Stored in `service_tokens` table since serverless functions are stateless.
5. **UUIDs for All Primary Keys** — Never sequential integers.

---

## 📂 Project Structure

```
HariomCoins/
├── .github/
│   └── workflows/
│       └── ci.yml                  # GitHub Actions: lint, test, migration check, frontend build
│
├── api/
│   └── index.py                    # Vercel Python serverless entry (re-exports the FastAPI app)
│
├── backend/
│   ├── api/
│   │   └── index.py                # Vercel ASGI handler
│   ├── app/
│   │   ├── main.py                 # FastAPI application factory
│   │   ├── api/
│   │   │   └── routes/
│   │   │       ├── auth.py         # Registration, login, token refresh
│   │   │       ├── products.py     # Product listing, detail, search
│   │   │       ├── cart.py         # Cart CRUD
│   │   │       ├── wishlist.py     # Wishlist CRUD
│   │   │       ├── orders.py       # Checkout, payment verify, order history
│   │   │       ├── reviews.py      # Product reviews
│   │   │       ├── images.py       # Serve images with resize support
│   │   │       ├── addresses.py    # Saved address management
│   │   │       ├── shipping.py     # Pincode serviceability check
│   │   │       ├── coupons.py      # Coupon validation
│   │   │       ├── webhooks.py     # Razorpay & Shiprocket webhooks
│   │   │       └── admin/
│   │   │           ├── dashboard.py  # Analytics & stats
│   │   │           ├── products.py   # Product CRUD + image upload
│   │   │           ├── orders.py     # Order management + ship
│   │   │           ├── users.py      # User management
│   │   │           ├── reviews.py    # Review moderation
│   │   │           └── coupons.py    # Coupon CRUD
│   │   ├── core/
│   │   │   ├── config.py           # Settings via pydantic-settings
│   │   │   ├── database.py         # SQLAlchemy async engine + session
│   │   │   ├── deps.py             # get_db, get_current_user, get_current_admin
│   │   │   └── security.py         # JWT creation/verification, bcrypt
│   │   ├── models/
│   │   │   ├── user.py             # User, RefreshToken, Address
│   │   │   ├── product.py          # Category, Product, ProductVariant, ProductImage
│   │   │   ├── order.py            # Order, OrderItem, OrderStatusHistory, PaymentEvent
│   │   │   ├── cart.py             # CartItem, WishlistItem
│   │   │   ├── coupon.py           # Coupon
│   │   │   ├── review.py           # Review
│   │   │   └── service_token.py    # ServiceToken (Shiprocket token cache)
│   │   ├── schemas/                # Pydantic v2 request/response models
│   │   │   ├── auth.py, address.py, admin.py, cart.py
│   │   │   ├── coupon.py, order.py, product.py
│   │   │   ├── review.py, shipping.py
│   │   └── services/
│   │       ├── auth_service.py     # Registration, login, token management
│   │       ├── catalog_service.py  # Product listing, search, filtering
│   │       ├── cart_service.py     # Cart business logic
│   │       ├── order_service.py    # Checkout, payment, order management
│   │       ├── razorpay_service.py # Razorpay API integration
│   │       ├── shiprocket_service.py # Shipping API + DB-cached auth
│   │       ├── image_service.py    # Pillow validation, EXIF strip, resize
│   │       ├── email_service.py    # Transactional emails via Resend
│   │       ├── review_service.py   # Review logic
│   │       ├── coupon_service.py   # Coupon validation
│   │       ├── address_service.py  # Address CRUD
│   │       ├── wishlist_service.py # Wishlist logic
│   │       └── dashboard_service.py # Admin analytics
│   ├── alembic/                    # Database migrations
│   ├── tests/                      # Pytest test suite
│   │   ├── conftest.py             # Fixtures (async DB, test client)
│   │   ├── test_auth.py
│   │   ├── test_admin_auth.py
│   │   ├── test_admin_dashboard.py
│   │   ├── test_checkout_payment.py
│   │   ├── test_cod_returns.py
│   │   ├── test_coupons.py
│   │   ├── test_reviews.py
│   │   └── test_shipping.py
│   ├── seed_admin.py               # Admin account seeder
│   ├── seed_products.py            # Sample product seeder
│   ├── Dockerfile                  # Local dev container
│   └── requirements.txt            # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx                 # Route definitions (lazy-loaded)
│   │   ├── main.tsx                # React entry point
│   │   ├── index.css               # Global styles
│   │   ├── api/                    # API client layer (Axios)
│   │   │   ├── client.ts           # Axios instance with JWT interceptor
│   │   │   ├── auth.ts, products.ts, cart.ts, orders.ts
│   │   │   ├── admin.ts, adminOps.ts, addresses.ts
│   │   │   ├── reviews.ts, shipping.ts, wishlist.ts, coupons.ts
│   │   ├── components/
│   │   │   ├── ui/                 # shadcn/ui primitives (Button, Card, Input, etc.)
│   │   │   ├── layout/            # Navbar, StoreLayout, AdminLayout
│   │   │   ├── product/           # ProductCard, ProductGallery, VariantSelector, ProductReviews
│   │   │   ├── order/             # TrackingTimeline
│   │   │   └── admin/             # ProductImageManager, VariantManager
│   │   ├── pages/
│   │   │   ├── Home.tsx, ProductListing.tsx, ProductDetail.tsx
│   │   │   ├── Login.tsx, Register.tsx, Account.tsx
│   │   │   ├── Cart.tsx, Checkout.tsx, Wishlist.tsx
│   │   │   ├── OrderHistory.tsx, OrderDetail.tsx
│   │   │   └── admin/             # Dashboard, ProductList/Form, OrderList/Detail, UserList, ReviewList, CouponList
│   │   ├── hooks/                 # useCart, useProducts (React Query)
│   │   ├── store/                 # Zustand: authStore, cartStore
│   │   ├── routes/                # ProtectedRoute, AdminRoute
│   │   ├── types/                 # TypeScript interfaces
│   │   └── lib/                   # Utilities: razorpay.ts, image.ts, format.ts, status.ts
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── docker-compose.yml              # Local dev: Postgres + Backend
├── vercel.json                     # Build, rewrite, and security header config
└── .gitignore
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.11+**
- **Node.js 20+** and **npm**
- **PostgreSQL 15+** (or Docker)
- **Git**

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/harshpatel0204/Ecommerce.git
cd Ecommerce

# Copy environment template
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials (Razorpay, Shiprocket, Resend, etc.)

# Start Postgres + Backend
docker compose up -d

# Run database migrations
docker compose exec backend alembic upgrade head

# Seed the admin account
docker compose exec backend python seed_admin.py

# (Optional) Seed sample products
docker compose exec backend python seed_products.py

# Start the frontend (separate terminal)
cd frontend
npm install
npm run dev
```

The app will be available at:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000/api
- **API Docs (Swagger):** http://localhost:8000/api/docs

### Option 2: Manual Setup

```bash
# Clone the repository
git clone https://github.com/harshpatel0204/Ecommerce.git
cd Ecommerce

# --- Backend ---
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env with your database URL and API keys

# Run migrations
alembic upgrade head

# Seed admin
python seed_admin.py

# Start the backend
uvicorn app.main:app --reload --port 8000

# --- Frontend (separate terminal) ---
cd frontend
npm install
cp .env.example .env
npm run dev
```

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|---|---|---|
| `SECRET_KEY` | JWT signing key | `your-super-secret-key` |
| `DEBUG` | Debug mode | `false` |
| `DATABASE_URL` | PostgreSQL (asyncpg) connection string | `postgresql+asyncpg://user:pass@host/db` |
| `FRONTEND_URL` | Public site URL (for email links) | `https://your-domain.com` |
| `DEV_ALLOWED_ORIGINS` | CORS origins for local dev (empty in prod) | `http://localhost:5173` |
| `RAZORPAY_KEY_ID` | Razorpay API Key ID | `rzp_test_xxx` |
| `RAZORPAY_KEY_SECRET` | Razorpay API Key Secret | `xxx` |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook secret | `xxx` |
| `SHIPROCKET_EMAIL` | Shiprocket account email | `you@domain.com` |
| `SHIPROCKET_PASSWORD` | Shiprocket account password | `xxx` |
| `SHIPROCKET_PICKUP_PINCODE` | Pickup location pincode | `395007` |
| `RESEND_API_KEY` | Resend email API key | `re_xxx` |
| `EMAIL_FROM` | Sender email address | `orders@domain.com` |
| `MAX_IMAGE_UPLOAD_MB` | Max upload size | `5` |
| `IMAGE_ALLOWED_TYPES` | Accepted MIME types | `image/jpeg,image/png,image/webp` |

### Frontend (`frontend/.env`)

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | API base URL (leave empty in prod) | _(empty)_ |
| `VITE_APP_NAME` | Application name | `BharatShop` |
| `VITE_RAZORPAY_KEY_ID` | Razorpay public key ID | `rzp_test_xxx` |

---

## 💾 Database

### Schema Overview

The database uses **UUIDs** for all primary keys and follows these models:

| Model | Purpose |
|---|---|
| `User` | Customer and admin accounts |
| `RefreshToken` | JWT refresh token storage |
| `Address` | Saved delivery addresses |
| `Category` | Product categories |
| `Product` | Product catalog entries |
| `ProductVariant` | Size/color combinations with stock tracking |
| `ProductImage` | Image bytes (BYTEA) with metadata |
| `CartItem` | Shopping cart entries |
| `WishlistItem` | Customer wishlists |
| `Order` | Order records with JSONB shipping address |
| `OrderItem` | Immutable order line item snapshots |
| `OrderStatusHistory` | Status change audit trail |
| `PaymentEvent` | Raw Razorpay webhook payloads |
| `Coupon` | Discount coupon definitions |
| `Review` | Product reviews and ratings |
| `ServiceToken` | Cached API tokens (Shiprocket) |

### Migrations

```bash
cd backend

# Create a new migration
alembic revision --autogenerate -m "description"

# Apply all migrations
alembic upgrade head

# Rollback one step
alembic downgrade -1

# Rollback all
alembic downgrade base
```

> ⚠️ **Never run migrations at serverless boot.** Always run from CLI or CI against the Neon database.

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new customer |
| `POST` | `/api/auth/login` | Login (returns access + refresh token) |
| `POST` | `/api/auth/refresh` | Refresh the access token |
| `GET` | `/api/auth/me` | Get current user profile |

### Products
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products` | List products (search, filter, paginate) |
| `GET` | `/api/products/{slug}` | Get product detail |

### Images
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/images/{id}` | Serve image (supports `?w=` for resize) |

### Cart & Wishlist
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/cart` | Get cart items |
| `POST` | `/api/cart` | Add item to cart |
| `DELETE` | `/api/cart/{id}` | Remove from cart |
| `GET` | `/api/wishlist` | Get wishlist |
| `POST` | `/api/wishlist` | Add to wishlist |
| `DELETE` | `/api/wishlist/{id}` | Remove from wishlist |

### Orders
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/orders/checkout` | Create order + Razorpay order |
| `POST` | `/api/orders/verify-payment` | Verify Razorpay payment signature |
| `GET` | `/api/orders` | List customer's orders |
| `GET` | `/api/orders/{order_number}` | Order detail with tracking |

### Shipping
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/shipping/check-pincode` | Check pincode serviceability |

### Reviews & Coupons
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/reviews` | Submit a product review |
| `GET` | `/api/reviews/{product_id}` | Get reviews for a product |
| `GET` | `/api/coupons/validate` | Validate a coupon code |

### Webhooks
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/webhooks/razorpay` | Razorpay payment webhook |
| `POST` | `/api/webhooks/shiprocket` | Shiprocket status webhook |

### Admin (`/api/admin/*`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/dashboard` | Dashboard analytics |
| `GET/POST` | `/api/admin/products` | List / create products |
| `PATCH/DELETE` | `/api/admin/products/{id}` | Update / delete product |
| `GET` | `/api/admin/orders` | List all orders |
| `PATCH` | `/api/admin/orders/{id}/set-status` | Update order status |
| `POST` | `/api/admin/orders/{id}/ship` | Ship order via Shiprocket |
| `GET` | `/api/admin/users` | List all users |
| `GET/POST/PATCH/DELETE` | `/api/admin/coupons` | Coupon CRUD |
| `GET/DELETE` | `/api/admin/reviews` | Review moderation |

### Health
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api` | App info (name + version) |

> 📖 **Full interactive docs:** Available at `/api/docs` (Swagger UI) when running locally.

---

## 🖥️ Frontend Pages

### Storefront
| Route | Page | Auth Required |
|---|---|---|
| `/` | Home | ❌ |
| `/products` | Product Listing | ❌ |
| `/products/:slug` | Product Detail | ❌ |
| `/login` | Login | ❌ |
| `/register` | Register | ❌ |
| `/cart` | Shopping Cart | ✅ |
| `/checkout` | Checkout | ✅ |
| `/wishlist` | Wishlist | ✅ |
| `/orders` | Order History | ✅ |
| `/orders/:orderNumber` | Order Detail + Tracking | ✅ |
| `/account` | Account Settings | ✅ |

### Admin Panel
| Route | Page |
|---|---|
| `/admin` | Dashboard |
| `/admin/products` | Product List |
| `/admin/products/new` | Create Product |
| `/admin/products/:id/edit` | Edit Product |
| `/admin/orders` | Order List |
| `/admin/orders/:orderId` | Order Detail |
| `/admin/users` | User List |
| `/admin/reviews` | Review Moderation |
| `/admin/coupons` | Coupon Management |

---

## 🧪 Testing

The backend includes a comprehensive test suite powered by **pytest** with an async PostgreSQL test database:

```bash
cd backend

# Install dev dependencies
pip install -r requirements-dev.txt

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run a specific test file
pytest tests/test_auth.py
```

### Test Coverage

| Test File | Coverage |
|---|---|
| `test_auth.py` | Registration, login, token refresh |
| `test_admin_auth.py` | Admin authentication & authorization |
| `test_admin_dashboard.py` | Dashboard analytics endpoints |
| `test_checkout_payment.py` | Checkout flow & Razorpay payment verification |
| `test_cod_returns.py` | Cash-on-delivery & return flows |
| `test_coupons.py` | Coupon validation & application |
| `test_reviews.py` | Product review submission & retrieval |
| `test_shipping.py` | Shiprocket integration & pincode checks |

---

## 🚢 Deployment

The app is designed for **single Vercel project** deployment:

### Quick Deploy

1. **Database** — Create a [Neon](https://neon.tech) project (Postgres 15+). Copy the **pooled** connection string.

2. **Vercel** — Import the GitHub repo. The root `vercel.json` handles:
   - Building `frontend/` → static assets
   - Deploying `backend/api/index.py` as a Python serverless function
   - Rewriting `/api/*` → FastAPI, `/*` → SPA

3. **Environment Variables** — Set all required env vars in Vercel Project Settings.

4. **Migrations** — Run from your machine (not at serverless boot):
   ```bash
   cd backend
   DATABASE_URL="<neon-pooled-url>" alembic upgrade head
   ```

5. **Seed Admin** — Create the admin account:
   ```bash
   DATABASE_URL="..." ADMIN_EMAIL="you@domain.com" ADMIN_PASSWORD="strong-pass" python seed_admin.py
   ```

6. **Webhooks** — Configure in Razorpay & Shiprocket dashboards:
   - Razorpay: `https://your-domain.com/api/webhooks/razorpay`
   - Shiprocket: `https://your-domain.com/api/webhooks/shiprocket`

7. **Smoke Test:**
   ```
   GET https://your-domain.com/api/health → {"status":"ok","version":"1.0.0"}
   ```

> 📄 See [DEPLOYMENT.txt](./DEPLOYMENT.txt) for the full step-by-step deployment guide.

---

## 🔄 CI/CD

GitHub Actions (`.github/workflows/ci.yml`) runs on every push to `main`/`harsh` and on PRs:

### Backend Job
- ✅ Install Python 3.12 + dependencies
- ✅ Lint with **Ruff**
- ✅ Verify Alembic migrations apply **and** reverse cleanly
- ✅ Run full **pytest** suite against a Postgres service container

### Frontend Job
- ✅ Install Node.js 20 + dependencies
- ✅ TypeScript type-check
- ✅ Vite production build

> Vercel's Git integration handles the actual deployment on merge.

---

## 📊 Order Status Flow

```
pending → paid → processing → packed → shipped → out_for_delivery → delivered
                                                                          ↓
                                                                    return_requested → returned → refunded
          ↓
    cancelled (from pending/paid)
          paid → refunded (payment failure or admin refund)
```

---

## ⚙️ Key Configuration Files

| File | Purpose |
|---|---|
| `vercel.json` | Vercel build, rewrites, security headers, function config |
| `docker-compose.yml` | Local dev: Postgres + Backend containers |
| `backend/alembic.ini` | Alembic migration configuration |
| `backend/Dockerfile` | Local dev container image |
| `frontend/vite.config.ts` | Vite build configuration |
| `frontend/tailwind.config.js` | Tailwind CSS theme customization |
| `.github/workflows/ci.yml` | CI pipeline definition |

---

## 📄 License

This project is proprietary. All rights reserved.

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/harshpatel0204">Harsh Patel</a>
</p>
