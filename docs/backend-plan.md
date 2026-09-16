# ThoorigAI Admin Dashboard — Backend & Serverless Plan

## Recommended direction

This project should stay as a Next.js frontend-first application, but the app should be structured so it can move from mock data to a production-ready serverless architecture without a large rewrite.

### Recommended stack

- Frontend: Next.js App Router
- Hosting: Vercel
- Database: Supabase Postgres
- Authentication: Supabase Auth
- Storage: Vercel Blob or Supabase Storage
- Email/notifications: Resend or Supabase Edge Functions
- PDF generation: `pdf-lib`, `jspdf`, or server-rendered HTML export

## Why this is the best fit

- The current app is already a UI dashboard with client-side state.
- Next.js can serve both UI and API routes from the same project.
- Vercel makes deployment simple for a serverless-first app.
- Supabase provides the quickest path to real persistence and auth without managing infrastructure.

## Target architecture

### 1. Frontend shell

- Dashboard overview
- Student records management
- Payment tracking
- Invoice list and print view
- Certificate generation
- Search, filter, and basic analytics

### 2. Data layer

Create the following domain entities:

- students
- payments
- invoices
- certificates
- users/admins

Suggested schema:

- students: id, register_id, name, phone, course, batch, total_fee, paid_amount, status
- payments: id, student_id, method, amount, invoice_number, payment_date
- invoices: id, payment_id, invoice_number, gst_amount, taxable_amount
- certificates: id, student_id, certificate_id, issued_on, file_url

### 3. API layer

Use Next.js route handlers for:

- GET /api/health
- GET /api/students
- POST /api/students
- GET /api/payments
- POST /api/payments
- GET /api/invoices
- POST /api/invoices
- GET /api/certificates
- POST /api/certificates

The implemented routes use Supabase when `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are configured, and retain mock fallback for local UI development when those variables are absent.

Implemented routes:

- `GET/POST /api/students`
- `GET/POST /api/payments`
- `GET /api/reports`
- `GET /api/invoices/:invoice/download` (PDF)
- `GET /api/health`

## Serverless-first implementation plan

### Phase 1 — Frontend stabilization

- Finish reusable components and page structure
- Centralize types and mock data
- Add API route scaffolds
- Ensure build and lint stability

### Phase 2 — Database backbone

- Create Supabase project
- Add tables for students, payments, and certificates
- Seed a few sample records
- Replace mock state with real fetch calls

### Phase 3 — Auth and roles

- Add admin login
- Restrict modifications to authorized users
- Support role-based access for admin and finance users

### Phase 4 — PDF and exports

- Generate invoice PDFs via HTML-to-PDF or `pdf-lib`
- Store generated certificate documents in Supabase storage
- Add download and print actions

### Phase 5 — Production readiness

- Add validation and sanitization
- Add error monitoring
- Add analytics
- Add automated tests and smoke checks

## Recommended migration path from the current mock app

1. Keep current UI as the design baseline.
2. Move data access from local arrays to fetch-based service calls.
3. Create Supabase tables matching the current student/payment models.
4. Add a server action or route handler for creating students and recording payments.
5. Add invoice/certificate persistence and storage.
6. Deploy on Vercel and connect env variables securely.

## Key recommendation

If the goal is speed and simplicity, do not build a custom backend from scratch. Use:

- Next.js API routes for application logic
- Supabase for persistence and auth
- Vercel for deployment

This is the most practical serverless frontend architecture for this project.

## Current Supabase setup

1. Create a Supabase project and apply `supabase/migrations/202609150001_initial_schema.sql`.
2. Copy `.env.example` to `.env.local`.
3. Set `NEXT_PUBLIC_SUPABASE_URL` and the server-only `SUPABASE_SERVICE_ROLE_KEY`.
4. Run `pnpm build` and verify `/api/health`, `/api/students`, `/api/payments`, and `/api/reports`.

The service-role key is intentionally used only inside route handlers. It must never be prefixed with `NEXT_PUBLIC_` or sent to the browser. Authentication and role checks should be added before exposing the write routes publicly.
