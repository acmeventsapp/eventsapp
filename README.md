# ACM Events Center

Event registration and management platform for **ACM Ugwuagba Arch**. Attendees can browse programs, register through dynamic forms, pay via Paystack, and receive confirmation emails with printable name tags. Admins manage events, registrations, organization hierarchy, and payments from a dedicated dashboard.

## Features

### Public

- Browse published events (free and paid)
- Dynamic registration forms per event (text, select, radio, checkbox, date, image upload, org branch picker, and more)
- Conditional form fields based on earlier answers
- Paystack checkout for paid events
- Email confirmation with registration details, assignment info, and reprint link
- Downloadable PDF name tags with QR codes (when enabled for the event)
- Tag reprint flow for confirmed attendees

### Admin

- Secure admin login (JWT session)
- Dashboard with registration and revenue overview
- **Events** — create, edit, publish, and manage events with:
  - Custom registration form builder
  - Speakers
  - Assignment groups (e.g. Bible study groups) with optional response filters
  - Hostel allocation by branch and gender
  - Optional name tag configuration (colors, fields, footer text)
- **Registrations** — search, filter (event, status, payment, zone, unit, branch), view details, update form responses, update status, export to Excel, delete
- **Organization** — manage Archdeaconry → Zone → Unit → Branch hierarchy used by branch picker fields
- **Settings** — Paystack payment keys (database or environment fallback)

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | TypeScript |
| UI | React 19, Tailwind CSS 4, Radix UI, shadcn-style components |
| Forms | React Hook Form, Zod |
| Database | PostgreSQL, [Prisma 7](https://www.prisma.io) |
| Data fetching | React Query |
| Payments | Paystack |
| Email | Resend |
| File uploads | Cloudinary |
| PDF / QR | `@react-pdf/renderer`, `qrcode` |
| Export | SheetJS (`xlsx`) |

## Project structure

```
app/
  page.tsx                 # Public home
  events/                  # Event listing, detail, register, confirmation, reprint
  admin/                   # Admin dashboard, events, registrations, organization, settings
  api/                     # Payment, upload, organization APIs
components/
  admin/                   # Admin modules and layout
  custom/                  # Dynamic registration form, org picker, modals
  pages/                   # Public event pages
data/                      # Server actions (events, registrations, auth, organization)
hooks/                     # React Query hooks
lib/                       # Utilities (assignments, email, export, Paystack, etc.)
prisma/                    # Schema and migrations
validators/                # Zod schemas and shared types
seeds/                     # Admin and sample event seed scripts
```

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io) (recommended) or npm
- PostgreSQL database

## Getting started

### 1. Clone and install

```bash
git clone <repository-url>
cd acm-events-center
pnpm install
```

### 2. Environment variables

Create a `.env` file in the project root:

```env
# Database (required)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/acm_events_center"

# Auth (required in production)
JWT_SECRET="your-long-random-secret"
NEXT_PUBLIC_COOKIE_NAME="asm_auth_token"

# Site URL (used in emails and payment callbacks)
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# Email — Resend (optional; emails skipped if unset)
RESEND_API_KEY=""
RESEND_FROM="ACM Events <noreply@yourdomain.com>"

# Paystack — can also be configured in Admin → Settings → Payment
PAYSTACK_PUBLIC_KEY=""
PAYSTACK_SECRET_KEY=""

# Cloudinary — for banner and registration photo uploads
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
```

### 3. Database setup

```bash
# Generate Prisma client
pnpm db:generate

# Apply migrations
pnpm exec prisma migrate deploy

# Or during development
pnpm db:migrate
```

### 4. Seed data (optional)

```bash
# Default admin account(s) — see seeds/admin.ts
pnpm seed:admins

# Sample events (optional)
pnpm seed:events

# Both
pnpm seed:all
```

Change default admin credentials after first login.

### 5. Run the dev server

```bash
pnpm dev
```

| URL | Description |
| --- | --- |
| [http://localhost:3000](http://localhost:3000) | Public site |
| [http://localhost:3000/events](http://localhost:3000/events) | Event listing |
| [http://localhost:3000/admin](http://localhost:3000/admin) | Admin dashboard |
| [http://localhost:3000/admin/auth/login](http://localhost:3000/admin/auth/login) | Admin login |

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:migrate` | Create/apply migrations (dev) |
| `pnpm db:push` | Push schema to database (prototyping) |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm seed:admins` | Seed admin users |
| `pnpm seed:events` | Seed sample events |
| `pnpm seed:all` | Run all seed scripts |

## Key workflows

### Event registration (paid)

1. Attendee completes the dynamic registration form.
2. Registration is created with `PENDING` / `UNPAID` status.
3. Paystack payment is initiated and verified via webhook/callback.
4. On successful payment, status becomes `CONFIRMED` / `PAID`, confirmation email is sent, and assignment group / hostel may be assigned automatically.

### Event registration (free)

1. Attendee submits the form.
2. Registration is confirmed immediately (`CONFIRMED` / `FREE`).
3. Assignment group and hostel rules run on confirmation.
4. Confirmation email is sent when an email address is provided.

### Admin registration export

From **Admin → Registrations**, apply filters (event, status, payment, zone, unit, branch, search), then export. The Excel file includes only the fields defined on the selected event’s registration form.

## Deployment notes

- Set all required environment variables in production.
- Run `pnpm build` and `pnpm exec prisma migrate deploy` before starting the app.
- Ensure `NEXT_PUBLIC_SITE_URL` matches your production domain (payment callbacks and email links depend on it).
- Use strong values for `JWT_SECRET` and Paystack secret keys.
- Configure Resend with a verified sending domain for production email delivery.

## License

Private — ACM Ugwuagba Arch.
