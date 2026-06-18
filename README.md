# ABK Nest App — Business Management API

A NestJS backend for managing inventory, sales, customers, suppliers, employees, and financial reporting. The system supports two product lines — **Ceramic** and **Healthy** — with full invoice workflows, stock tracking, QR codes, customer balance ledgers, and role-based access control.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Docker](#docker)
- [Database Backups](#database-backups)
- [Environment Variables](#environment-variables)
- [Database & Schema Sync](#database--schema-sync)
- [Seeding](#seeding)
- [Authentication](#authentication)
- [Roles & Permissions](#roles--permissions)
- [Modules & API Reference](#modules--api-reference)
- [Business Logic](#business-logic)
- [Static Files & Uploads](#static-files--uploads)
- [API Documentation (Swagger)](#api-documentation-swagger)
- [Scripts](#scripts)
- [Project Structure](#project-structure)
- [Additional Documentation](#additional-documentation)

---

## Overview

This API powers an internal business management platform for ABK. It handles:

| Domain | Purpose |
|--------|---------|
| **Inventory** | Ceramic and healthy product catalogs with stock, pricing, images, and QR codes |
| **Sales** | Invoice creation with automatic stock deduction and customer balance updates |
| **Customers** | Customer profiles, running balance, and payment/adjustment history |
| **Suppliers** | Supplier records and account balances |
| **Finance** | General balance reports, expenses, and employee salary tracking |
| **Users & Access** | Bearer token authentication with roles and granular permissions |
| **Notifications** | In-app notification management |

All protected endpoints require a valid Bearer token. Interactive API docs are available at `/api/docs`.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [NestJS](https://nestjs.com/) 11 |
| Language | TypeScript 5 |
| Database | PostgreSQL |
| ORM | TypeORM 0.3 (with schema sync enabled) |
| Auth | Custom Bearer tokens + bcrypt password hashing |
| Validation | class-validator / class-transformer |
| API Docs | Swagger (OpenAPI) via `@nestjs/swagger` |
| QR Codes | `qrcode` |
| Config | `@nestjs/config` |

---

## Architecture

The application follows NestJS modular architecture. Each domain is a self-contained module with its own controller, service, entities, and DTOs.

```
┌─────────────────────────────────────────────────────────────┐
│                        AppModule                            │
├─────────────┬─────────────┬──────────────┬──────────────────┤
│  AuthModule │ UsersModule │ RolesModule  │  DatabaseModule  │
├─────────────┼─────────────┼──────────────┼──────────────────┤
│ ItemsModule │InvoicesModule│CustomersModule│ SuppliersModule │
├─────────────┼─────────────┼──────────────┼──────────────────┤
│BalanceModule│ExpensesModule│Notifications │EmployeeSalaries  │
└─────────────┴─────────────┴──────────────┴──────────────────┘
                              │
                    PostgreSQL (TypeORM)
```

**Cross-cutting concerns:**

- `AuthTokenGuard` — validates Bearer tokens on all protected routes
- `@CurrentUser()` / `@UserRole()` — inject authenticated user and role into controllers
- Database transactions — used for invoices and customer balance updates to ensure consistency

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm

### Installation

```bash
npm install
```

### Database Setup

1. Create a PostgreSQL database (default name: `my_new_db`).
2. Copy environment variables (see [Environment Variables](#environment-variables)).
3. Start the application — TypeORM will auto-sync the schema on boot.

```bash
npm run start:dev
```

### Initial Seed (Roles & Permissions)

Run once after the database is created to seed default roles and permissions:

```bash
npm run seed
```

This creates:

- **superAdmin** — full access (all permissions assigned)
- **admin** — no default permissions (assign manually as needed)
- **employee** — limited access role placeholder

---

## Docker

Run the full stack (API + PostgreSQL) with Docker Compose.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Docker Compose)

### Quick start

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Build and start API + PostgreSQL
docker compose up -d --build

# 3. Seed roles and permissions (first time only)
docker compose --profile seed run --rm seed
```

The API will be available at:

- **API:** http://localhost:6000
- **Swagger:** http://localhost:6000/api/docs
- **PostgreSQL:** localhost:5432

### Services

| Service | Container | Description |
|---------|-----------|-------------|
| `api` | `abk-api` | NestJS backend (port 6000) |
| `db` | `abk-postgres` | PostgreSQL 16 (port 5432) |
| `seed` | — | One-off seeder (profile: `seed`) |

### Useful commands

```bash
# View logs
docker compose logs -f api

# Stop all services
docker compose down

# Stop and remove volumes (deletes database data)
docker compose down -v

# Rebuild after code changes
docker compose up -d --build

# Run seed again
docker compose --profile seed run --rm seed
```

### Volumes

| Volume | Purpose |
|--------|---------|
| `postgres_data` | Persistent PostgreSQL data |
| `uploads_data` | Product image uploads (`public/uploads`) |

### How it works

1. **PostgreSQL** starts first with a health check.
2. **API** waits for the database, then starts (`docker/entrypoint.sh`).
3. **TypeORM** auto-syncs the schema on startup (`synchronize: true`).
4. **Seed** is run manually once to create roles and permissions.

Inside Docker, the API connects to the database using `DB_HOST=db` (the Docker service name, not `localhost`).

### Server deployment (production)

After cloning the repo on your Linux server:

#### 1. Install Docker (one time)

```bash
# Ubuntu / Debian
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out and back in so docker runs without sudo
```

#### 2. Clone and configure

```bash
git clone <your-repo-url> nest-app
cd nest-app

cp .env.example .env
nano .env   # set a strong DB_PASSWORD
```

Example `.env` for the server:

```env
PORT=6000
DB_USERNAME=postgres
DB_PASSWORD=your_strong_password_here
DB_NAME=abk_db
```

> Do not set `DB_HOST` in `.env` for Docker — the API container uses `db` automatically via docker-compose.

#### 3. Build, start, and seed

**Option A — deploy script:**

```bash
chmod +x deploy.sh
./deploy.sh
```

**Option B — manual steps:**

```bash
docker compose up -d --build
docker compose --profile seed run --rm seed
```

#### 4. Verify

```bash
docker compose ps
docker compose logs -f api
curl http://localhost:6000
```

Open in browser: `http://YOUR_SERVER_IP:6000/api/docs`

#### 5. Firewall (if enabled)

```bash
# Ubuntu UFW — allow API port only (PostgreSQL stays internal)
sudo ufw allow 6000/tcp
sudo ufw enable
```

PostgreSQL is bound to `127.0.0.1` only — not exposed to the internet. Only the API port is public.

#### Updating after a git pull

```bash
cd nest-app
git pull
docker compose up -d --build
```

Data persists in Docker volumes (`postgres_data`, `uploads_data`) across rebuilds.

---

## Database Backups

Automated daily PostgreSQL backups at **1:00 AM** (server local time). Each run replaces the previous dump — only the latest backup is kept.

### Backup location on server

```
/var/www/abou-khalil-backend/backups/
├── abk_db_latest.sql.gz   ← latest database dump
└── backup.log             ← backup history log
```

(Replace `/var/www/abou-khalil-backend` with your project path.)

### Setup on the server (one time)

```bash
cd /var/www/abou-khalil-backend
git pull

chmod +x scripts/backup-db.sh scripts/install-backup-cron.sh scripts/restore-db.sh

# Install cron job: every day at 1:00 AM
./scripts/install-backup-cron.sh
```

Verify cron is installed:

```bash
crontab -l
```

You should see:

```
0 1 * * * /var/www/abou-khalil-backend/scripts/backup-db.sh
```

### Run a backup manually

```bash
./scripts/backup-db.sh
```

### Check backup file

```bash
ls -lh backups/abk_db_latest.sql.gz
tail -20 backups/backup.log
```

### Restore from backup

```bash
./scripts/restore-db.sh
```

Type `RESTORE` when prompted. This overwrites the current database with the latest dump.

### Custom schedule

```bash
CRON_SCHEDULE="0 2 * * *" ./scripts/install-backup-cron.sh
```

Remove and re-add cron manually if you need to change an existing entry:

```bash
crontab -e
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Server
PORT=6000

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=abk_db
```

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `6000` | HTTP port the server listens on |
| `DB_HOST` | `localhost` | PostgreSQL host (`db` when using Docker Compose) |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USERNAME` | `postgres` | Database user |
| `DB_PASSWORD` | `postgres` | Database password |
| `DB_NAME` | `abk_db` | Database name |

---

## Database & Schema Sync

This project uses **TypeORM schema synchronization** instead of manual migrations.

### How it works

In `src/database.module.ts`:

```typescript
TypeOrmModule.forRoot({
  // ...
  synchronize: true,
  logging: true,
})
```

When the application starts (or when `npm run seed` runs), TypeORM compares all registered entities against the live PostgreSQL schema and automatically:

- Creates missing tables
- Adds new columns
- Updates column types where safe

The seed script (`src/seed.ts`) also calls `dataSource.synchronize()` explicitly before inserting roles and permissions.

### Registered entities

| Entity | Table | Description |
|--------|-------|-------------|
| `User` | `users` | Application users |
| `Role` | `roles` | User roles |
| `Permission` | `permissions` | Resource/action permissions |
| `AccessToken` | `access_tokens` | Active session tokens |
| `Employee` | `employees` | Staff records |
| `EmployeeSalary` | `employee_salaries` | Monthly salary records |
| `Customer` | `customers` | Customer profiles |
| `CustomerHistoryEntry` | `customer_history_entries` | Balance ledger entries |
| `Supplier` | `suppliers` | Supplier records |
| `ProductType` | `product_types` | Product categories |
| `CeramicItem` | `ceramic_items` | Ceramic inventory |
| `HealthyItem` | `healthy_items` | Healthy product inventory |
| `Invoice` | `invoices` | Sales invoices |
| `InvoiceItem` | `invoice_items` | Line items on invoices |
| `Expense` | `expenses` | Business expenses |
| `Notification` | `notifications` | System notifications |

### Important notes

> **Development only:** `synchronize: true` is convenient during active development but can cause data loss if entity definitions change in breaking ways (e.g., renaming columns). For production, disable `synchronize` and use TypeORM migrations instead.

> **SQL logging:** `logging: true` prints all SQL queries to the console. Disable in production.

---

## Seeding

```bash
npm run seed
```

The seed process:

1. Initializes the database connection
2. Runs schema synchronization
3. Creates roles (`admin`, `superAdmin`, `employee`) if they do not exist
4. Creates permissions for all resources (`create`, `read`, `update`, `delete` × 8 resources)
5. Assigns all permissions to `superAdmin`
6. Leaves `admin` with no permissions by default
7. Creates a default **superAdmin user** if one does not exist

**Default admin credentials** (override in `.env`):

| Variable | Default |
|----------|---------|
| `SEED_ADMIN_USERNAME` | `hassan` |
| `SEED_ADMIN_PASSWORD` | `P@ssw0rd` |
| `SEED_ADMIN_PHONE` | `0000000000` |

**Seeded permission resources:** `users`, `roles`, `employees`, `customers`, `suppliers`, `items`, `invoices`, `balance`

---

## Authentication

Authentication uses **stateful Bearer tokens** stored in the database.

### Flow

```
Client                          Server
  │                               │
  │  POST /auth/login             │
  │  { username, password }       │
  │ ─────────────────────────────►│  Validate credentials (bcrypt)
  │                               │  Generate 96-char hex token
  │                               │  Store in access_tokens table
  │  { accessToken: "..." }       │
  │ ◄─────────────────────────────│
  │                               │
  │  GET /users  (or any route)   │
  │  Authorization: Bearer <token>│
  │ ─────────────────────────────►│  AuthTokenGuard validates token
  │                               │  Attaches user + role to request
  │  200 OK                       │
  │ ◄─────────────────────────────│
```

### Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/auth/login` | Public | Login with username and password |
| `POST` | `/auth/logout` | Bearer | Invalidate the current token |
| `GET` | `/auth/me` | Bearer | Get the authenticated user profile |

### Usage

```bash
# Login
curl -X POST http://localhost:6000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "your_password"}'

# Authenticated request
curl http://localhost:6000/users \
  -H "Authorization: Bearer <access_token>"
```

See [BEARER_TOKEN_AUTH.md](./BEARER_TOKEN_AUTH.md) for decorator usage and role-based authorization patterns.

---

## Roles & Permissions

### Roles

| Role | Description |
|------|-------------|
| `superAdmin` | Full system access — all CRUD permissions on all resources |
| `admin` | Administrator — no permissions assigned by default |
| `employee` | Standard employee — limited access (configure as needed) |

### Permission model

Permissions follow a **resource + action** pattern:

```
{resource}:{action}
```

- **Resources:** `users`, `roles`, `employees`, `customers`, `suppliers`, `items`, `invoices`, `balance`
- **Actions:** `create`, `read`, `update`, `delete`

Roles and permissions are linked via a many-to-many `role_permissions` join table.

> **Note:** Permission enforcement guards (`@RequireRole`, `RoleGuard`) are prepared but not yet applied to endpoints. All authenticated users can currently access all protected routes. See [BEARER_TOKEN_AUTH.md](./BEARER_TOKEN_AUTH.md) for the planned RBAC implementation.

---

## Modules & API Reference

Base URL: `http://localhost:6000`  
All routes below (except `/auth/login`) require `Authorization: Bearer <token>`.

### Users — `/users`

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/users` | Create a user (password is bcrypt-hashed) |
| `GET` | `/users` | List all users |
| `GET` | `/users/:id` | Get user by ID |
| `PATCH` | `/users/:id` | Update user |
| `DELETE` | `/users/:id` | Delete user |

### Roles — `/roles`

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/roles` | List all roles with permissions |

### Employees — `/employees`

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/employees` | Create employee |
| `GET` | `/employees` | List all employees |
| `GET` | `/employees/:id` | Get employee by ID |
| `PATCH` | `/employees/:id` | Update employee |
| `DELETE` | `/employees/:id` | Delete employee |

### Employee Salaries — `/employee-salaries`

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/employee-salaries` | Create salary record |
| `GET` | `/employee-salaries` | List all salary records |
| `GET` | `/employee-salaries/unpaid` | List unpaid salaries |
| `GET` | `/employee-salaries/employee/:employee_id` | Salaries for an employee |
| `GET` | `/employee-salaries/by-month?year=&month=` | Salaries by year/month |
| `GET` | `/employee-salaries/:id` | Get salary by ID |
| `PATCH` | `/employee-salaries/:id` | Update salary |
| `PATCH` | `/employee-salaries/:id/pay` | Mark salary as paid |
| `DELETE` | `/employee-salaries/:id` | Delete salary record |

### Customers — `/customers`

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/customers` | Create customer (optional opening balance) |
| `GET` | `/customers` | List all customers |
| `GET` | `/customers/:id` | Get customer by ID |
| `GET` | `/customers/:id/history` | Get balance history ledger |
| `POST` | `/customers/:id/history` | Add payment or adjustment entry |
| `PATCH` | `/customers/:id` | Update customer |
| `DELETE` | `/customers/:id` | Delete customer |

### Suppliers — `/suppliers`

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/suppliers` | Create supplier |
| `GET` | `/suppliers` | List all suppliers |
| `GET` | `/suppliers/:id` | Get supplier by ID |
| `PATCH` | `/suppliers/:id` | Update supplier |
| `DELETE` | `/suppliers/:id` | Delete supplier |

### Product Types — `/product-types`

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/product-types` | Create product category |
| `GET` | `/product-types` | List all product types |
| `GET` | `/product-types/:id` | Get product type by ID |
| `PATCH` | `/product-types/:id` | Update product type |
| `DELETE` | `/product-types/:id` | Delete product type |

### Items — `/items`

Ceramic and healthy products are managed as separate catalogs.

#### Ceramic Items

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/items/ceramic` | Create ceramic item (auto-generates QR code) |
| `GET` | `/items/ceramic` | List all ceramic items |
| `GET` | `/items/ceramic/:id` | Get ceramic item by ID |
| `PATCH` | `/items/ceramic/:id` | Update ceramic item |
| `DELETE` | `/items/ceramic/:id` | Delete ceramic item |
| `GET` | `/items/ceramic/qr/:id` | Get QR code data URL |
| `POST` | `/items/ceramic/scan-qr` | Lookup item by scanned QR data |
| `POST` | `/items/ceramic/:id/upload-image` | Upload product image |
| `GET` | `/items/ceramic/image/:id` | Get product image |

#### Healthy Items

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/items/healthy` | Create healthy item (auto-generates QR code) |
| `GET` | `/items/healthy` | List all healthy items |
| `GET` | `/items/healthy/:id` | Get healthy item by ID |
| `PATCH` | `/items/healthy/:id` | Update healthy item |
| `DELETE` | `/items/healthy/:id` | Delete healthy item |
| `GET` | `/items/healthy/qr/:id` | Get QR code data URL |
| `POST` | `/items/healthy/scan-qr` | Lookup item by scanned QR data |
| `POST` | `/items/healthy/:id/upload-image` | Upload product image |
| `GET` | `/items/healthy/image/:id` | Get product image |

**Ceramic item fields:** title, quantity, bag, bag_quantity, width, height, price, main_price, type_id  
**Healthy item fields:** title, quantity, color, price, main_price, type_id

### Invoices — `/invoices`

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/invoices` | Create invoice (atomic: items + stock + customer balance) |
| `GET` | `/invoices` | List all invoices with customer and items |
| `GET` | `/invoices/:id` | Get invoice with full item details |
| `PATCH` | `/invoices/:id` | Update invoice (reverses/restocks items if changed) |
| `DELETE` | `/invoices/:id` | Delete invoice (restores stock and customer balance) |

Invoice numbers are auto-generated in the format `AKC-000001`.

### Balance — `/balance`

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/balance/general?fromDate=&toDate=` | General balance and profit report |

Returns inventory value, sold totals, profit margins, and customer counts. Optional date range filters sold items and new customer counts.

### Expenses — `/expenses`

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/expenses` | Create expense |
| `GET` | `/expenses` | List all expenses |
| `GET` | `/expenses/:id` | Get expense by ID |
| `PATCH` | `/expenses/:id` | Update expense |
| `DELETE` | `/expenses/:id` | Delete expense |

### Notifications — `/notifications`

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/notifications` | Create notification |
| `GET` | `/notifications` | List all notifications |
| `GET` | `/notifications/unread/count` | Count unread notifications |
| `GET` | `/notifications/:id` | Get notification by ID |
| `PATCH` | `/notifications/:id/read` | Mark as read |
| `PATCH` | `/notifications/mark-all-as-read` | Mark all as read |
| `PATCH` | `/notifications/:id` | Update notification |
| `DELETE` | `/notifications/:id` | Delete notification |

---

## Business Logic

### Invoice lifecycle

Creating an invoice runs inside a **database transaction**:

1. Generate sequential invoice number (`AKC-XXXXXX`)
2. Calculate `total_amount = amount - discount + delivery_price`
3. Increase the customer's running balance by `total_amount`
4. Record a customer history entry (type: `invoice`)
5. For each line item:
   - Validate stock availability
   - Decrement item quantity
   - Create an `invoice_items` record

Updating or deleting an invoice **reverses stock changes** and adjusts the customer balance accordingly.

### Customer balance ledger

Each customer maintains a running `amount` (balance owed). History entries track changes:

| Type | Effect on balance | Use case |
|------|-------------------|----------|
| `invoice` | Increases balance | Auto-created when an invoice is issued |
| `payment` | Decreases balance | Customer pays (amount stored as negative) |
| `adjustment` | Increases balance | Manual corrections, opening balance |

Payments cannot exceed the current customer balance.

### Stock management

Stock is adjusted automatically through invoices:

- **Create invoice** → decrements stock
- **Update invoice items** → restores old stock, then decrements new quantities
- **Delete invoice** → restores all stock

Insufficient stock throws a `400 Bad Request`.

### Balance report

`GET /balance/general` aggregates:

- **Inventory value** — total selling price and cost price for all ceramic/healthy items in stock
- **Sold totals** — revenue, cost, profit, and quantity sold (optionally filtered by date)
- **Customer metrics** — total customers and new customers in date range

Profit is calculated as `price - main_price` at the unit level.

### QR codes

On item creation, a QR code is generated containing:

```json
{ "type": "ceramic|healthy", "id": 1, "title": "Item Name" }
```

The QR is stored as a base64 data URL on the item record and can be retrieved or scanned via dedicated endpoints.

---

## Static Files & Uploads

Product images are served from the `public/` directory:

```
/public/uploads/items/ceramic-item-{id}.jpg
/public/uploads/items/healthy-item-{id}.jpg
```

Static assets are mounted at `/public` via NestJS Express static middleware.

---

## API Documentation (Swagger)

Interactive OpenAPI documentation is available at:

```
http://localhost:6000/api/docs
```

Use the **Authorize** button to enter your Bearer token for testing protected endpoints.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run start` | Start the application |
| `npm run start:dev` | Start in watch mode (development) |
| `npm run start:debug` | Start with debugger attached |
| `npm run start:prod` | Run compiled production build |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run seed` | Seed roles and permissions |
| `npm run lint` | Run ESLint with auto-fix |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run test:cov` | Run tests with coverage report |

---

## Project Structure

```
nest-app/
├── src/
│   ├── main.ts                    # Bootstrap, Swagger, static files
│   ├── app.module.ts              # Root module
│   ├── database.module.ts         # TypeORM config & schema sync
│   ├── seed.ts                    # Database seed entry point
│   │
│   ├── auth/                      # Login, logout, token guard
│   ├── users/                     # User management
│   ├── roles/                     # Roles & permissions
│   │
│   ├── employees/                 # Employee records
│   ├── employee-salaries/         # Monthly salary tracking
│   │
│   ├── customers/                 # Customers & balance history
│   ├── suppliers/                 # Supplier management
│   │
│   ├── product-types/             # Product categories
│   ├── items/                     # Ceramic & healthy inventory
│   ├── invoices/                  # Sales invoices & stock sync
│   │
│   ├── balance/                   # Financial reports
│   ├── expenses/                  # Business expenses
│   ├── notifications/             # In-app notifications
│   │
│   └── database/
│       ├── seeders/               # Permission seeder
│       └── commands/              # CLI seed commands
│
├── public/                        # Static uploads (images)
├── docker/                        # Docker entrypoint script
├── scripts/                       # backup-db.sh, restore-db.sh, cron installer
├── backups/                       # daily DB dumps (on server, not in git)
├── Dockerfile                     # Multi-stage production build
├── docker-compose.yml             # API + PostgreSQL stack
├── .env.example                   # Environment template
├── test/                          # E2E tests
├── BEARER_TOKEN_AUTH.md           # Auth implementation guide
└── README.md
```

---

## Additional Documentation

- [BEARER_TOKEN_AUTH.md](./BEARER_TOKEN_AUTH.md) — Bearer token authentication, decorators, and planned RBAC

---

## License

UNLICENSED — Private project.
