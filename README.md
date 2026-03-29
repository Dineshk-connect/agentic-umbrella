# Agentic Umbrella Platform

A full-stack B2B contractor payroll platform connecting Agencies, Umbrella Companies, and Contractors under UK employment law compliance rules.

Built as a portfolio project demonstrating production-grade backend architecture, financial state machines, and role-based access control.

**Live demo**: https://agenticumbrella.vercel.app  
**Backend API**: https://agentic-umbrella-production.up.railway.app/api/health

---

## Demo credentials

| Role | Email | Password |
|------|-------|----------|
| Agency Admin | alice@agency.com | password123 |
| Umbrella Admin | bob@umbrella.com | password123 |
| Contractor | charlie@contractor.com | password123 |

---

## What it does

The platform manages the complete lifecycle of contractor work — from timesheet submission through to tax filing with HMRC — enforcing the rule that **payroll cannot run before payment is received**.

### End-to-end workflow
```
Contractor submits timesheet
        ↓
Agency approves timesheet → Invoice auto-generated
        ↓
Agency approves invoice → Agency initiates payment
        ↓
Bank confirms payment → Payment reconciled
        ↓
Umbrella runs payroll → Gross-to-net calculated
        ↓
Contractor receives net salary + payslip PDF
        ↓
Umbrella files RTI submission to HMRC
        ↓
Work record marked complete
```

---

## Key technical features

### Finite state machine
Every work record moves through 10 strictly enforced states. Invalid transitions are rejected and logged. No state can be skipped.
```
WORK_SUBMITTED → WORK_APPROVED → INVOICE_GENERATED → INVOICE_APPROVED
→ PAYMENT_PENDING → PAYMENT_RECEIVED → PAYROLL_PROCESSING
→ PAYROLL_COMPLETED → COMPLIANCE_SUBMITTED → COMPLETED
```

### UK payroll engine
Full gross-to-net calculation using 2025/26 HMRC rates:
- Income tax (PAYE) with personal allowance, basic, higher, and additional rate bands
- Employee and employer National Insurance contributions
- Pension auto-enrolment (5%)
- Umbrella company fee
- Student loan deductions (Plan 2)

### Payment reconciliation
Banking webhook simulation verifies payment reference, exact amount, and source bank account. Any mismatch raises an exception and blocks the workflow.

### Immutable audit trail
Every state transition, approval, rejection, and payment event is written to an append-only audit log. No update or delete endpoints exist for audit records.

### Version-controlled timesheets
Every resubmission creates a new version. Previous versions are preserved. Optimistic locking prevents concurrent approval conflicts.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS v4 |
| Backend | Node.js, Express |
| ORM | Prisma v7 |
| Database | PostgreSQL (Neon) |
| Auth | JWT + RBAC middleware |
| PDF generation | jsPDF |
| Deployment | Railway (backend), Vercel (frontend) |

---

## Architecture
```
agentic-umbrella/
├── client/                  # React + Vite frontend
│   └── src/
│       ├── components/      # Layout, Sidebar, StateBadge, UI primitives
│       ├── context/         # Auth context with role-based routing
│       ├── pages/           # Agency, Umbrella, Contractor dashboards
│       ├── lib/             # Axios API client
│       └── utils/           # PDF generation
└── server/                  # Node.js + Express backend
    ├── prisma/              # Schema and migrations
    └── src/
        ├── controllers/     # Auth, timesheet, invoice, payroll, compliance
        ├── middleware/      # JWT auth, RBAC, audit logging
        ├── routes/          # All API routes
        └── services/        # State machine, tax engine, payroll, compliance
```

---

## Running locally

### Prerequisites
- Node.js 22+
- A PostgreSQL database (Neon free tier recommended)

### Backend
```bash
cd server
npm install
```

Create `server/.env`:
```
DATABASE_URL="your-neon-connection-string"
JWT_SECRET="your-secret-at-least-64-chars"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV=development
```
```bash
npx prisma migrate dev
npx prisma generate
npm run dev
```

### Frontend
```bash
cd client
npm install
```

Create `client/.env`:
```
VITE_API_URL=http://localhost:5000/api
```
```bash
npm run dev
```

Open `http://localhost:5173`

---

## API overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register agency or umbrella |
| POST | `/api/auth/register/contractor` | Register contractor with org links |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/organisations` | List all orgs (public) |
| POST | `/api/timesheets` | Submit timesheet |
| POST | `/api/timesheets/:id/approve` | Agency approves timesheet |
| POST | `/api/timesheets/:id/reject` | Agency rejects timesheet |
| GET | `/api/invoices` | List invoices |
| POST | `/api/invoices/:id/approve` | Approve invoice |
| POST | `/api/invoices/:id/pay` | Initiate payment |
| POST | `/api/webhooks/payment` | Bank payment confirmation |
| POST | `/api/payroll/:id/run` | Trigger payroll (requires PAYMENT_RECEIVED) |
| GET | `/api/payroll/:id/payslip` | Get payslip |
| POST | `/api/compliance/:id/validate` | Run compliance checks + RTI |
| POST | `/api/compliance/:id/complete` | Mark work record complete |
| GET | `/api/audit` | Full audit log |
| GET | `/api/audit/work-record/:id` | Audit trail for one work record |
| GET | `/api/exceptions` | Exception queue |
| POST | `/api/exceptions/:id/resolve` | Resolve exception with justification |

---

## Compliance and security

- **Multi-tenancy**: every query is scoped to the authenticated user's organisation
- **RBAC**: every endpoint declares minimum required role
- **Soft deletes**: no data is ever hard deleted
- **Optimistic locking**: concurrent updates on the same record are rejected
- **Audit immutability**: no update or delete endpoints on audit logs
- **Manual override justification**: any exception resolution requires a written reason stored permanently

---

## Roadmap

- [ ] Email notifications on state transitions
- [ ] Real HMRC RTI API integration
- [ ] Multi-contractor batch payroll
- [ ] Real banking API integration (GoCardless / Modulr)
- [ ] P60 and P45 document generation
- [ ] Admin panel for platform-level management
