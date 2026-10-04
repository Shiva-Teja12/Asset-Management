# Enfec-one — Asset Management Portal

A standalone full-stack Asset Management project with separate Asset Admin and Employee experiences.

## Included features

### Asset Admin
- Login
- Dashboard counts
- Full asset CRUD
- Lifecycle statuses: IN_STOCK, ASSIGNED, IN_REPAIR, RETIRED
- Assign an asset to an employee with a reason
- Return an assigned asset
- Assignment history
- Lifecycle history with actor, reason, and timestamp
- Employee list
- Ticket queue and ticket status updates

### Employee
- Signup and login
- Employee dashboard
- View personal details
- View assigned assets
- Raise asset tickets/requests
- View own tickets

### Ticket request types
- ISSUE
- NEW_ASSET
- REPLACEMENT
- RETURN

### Ticket statuses
- OPEN
- IN_PROGRESS
- RESOLVED
- REJECTED

## Technology
- Backend: Java 21, Spring Boot 3.5.4, Spring Data JPA, Spring Security
- Database: PostgreSQL
- Frontend: Next.js 16 / React / TypeScript
- Backend port: 8086
- Frontend port: 3000

## PostgreSQL setup

Create the database and user:

```sql
CREATE USER assets WITH PASSWORD 'assets';
CREATE DATABASE enfec_one_assets OWNER assets;
```

The backend uses Hibernate `ddl-auto=update`, so the tables are created automatically.

Default Asset Admin is seeded automatically:

- Email: admin@enfec.local
- Password: ChangeMe123!

## Run backend

PowerShell:

```powershell
cd .\backend
.\gradlew.bat bootRun
```

If your machine does not have the included Gradle wrapper runtime available, open `backend` in IntelliJ and run `EnfecOneApplication`.

## Run frontend

PowerShell:

```powershell
cd .\frontend
npm install
npm run dev
```

Open:

http://localhost:3000

## Main API routes

Authentication:
- POST `/api/auth/login`
- POST `/api/auth/signup`

Assets:
- POST `/api/v1/assets`
- GET `/api/v1/assets`
- GET `/api/v1/assets/{id}`
- PUT `/api/v1/assets/{id}`
- DELETE `/api/v1/assets/{id}`
- PATCH `/api/v1/assets/{id}/status`
- GET `/api/v1/assets/{id}/events`
- POST `/api/v1/assets/{id}/assign`
- POST `/api/v1/assets/{id}/return`
- GET `/api/v1/assets/{id}/assignments`

Employees:
- GET `/api/v1/employees`
- GET `/api/v1/employees/me`
- GET `/api/v1/employees/me/assets`

Tickets:
- POST `/api/v1/tickets`
- GET `/api/v1/tickets/my`
- GET `/api/v1/tickets`
- PATCH `/api/v1/tickets/{id}/status`

## Important design rule

An asset should normally become `ASSIGNED` through the Assign Asset operation, because that operation records the employee, assignment reason, assigned-by user, and timestamp. Returning an asset closes the assignment and sets the asset back to `IN_STOCK`.

`IN_REPAIR` and `RETIRED` require a reason in the lifecycle status API.


## Backend package structure

The backend is separated by responsibility:
- `controller` — REST endpoints only
- `service` — business workflows
- `repository` — Spring Data persistence
- `entity` — JPA database entities
- `dto` — request/response contracts grouped by domain
- `enums` — roles and lifecycle/ticket states
- `security` — token authentication and authorization
- `exception` — typed exceptions and global handler
- `config` — seed/configuration
- `util` — small reusable helpers
