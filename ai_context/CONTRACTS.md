# Rent1000 Contracts

This file records durable project contracts for future work in `Rent1000-fullstack`. Keep it short, concrete, and synchronized with the code. If behavior changes in a meaningful way, update this file in the same change.

## 1. Workspace Contracts

- The repository root contains two applications: `client/` and `server/`.
- Frontend work belongs under `client/`.
- Backend/API/database work belongs under `server/`.
- Do not assume root-level `npm` scripts exist; run frontend commands from `client/` and backend commands from `server/`.
- Do not edit `node_modules/` or generated build output.
- Do not hand-edit `client/src/types/prismaTypes.d.ts` for schema changes; regenerate it from Prisma output.
- Do not commit real `.env` values.
- Keep existing user changes in the working tree unless the user explicitly asks to revert them.

## 2. Spec and Documentation Contracts

- Read `ai_context/DEVELOPMENT_CONTEXT.md` and this file before non-trivial project work.
- Non-trivial feature, API, auth, database, deployment, or multi-module UI changes require a spec in `ai_context/spec_<feature>.md`.
- Never overwrite an existing spec; create a new appropriately named spec when needed.
- When a durable contract changes, update this file.
- When architecture, flow, or module ownership changes, update `DEVELOPMENT_CONTEXT.md`.

## 3. Runtime and Environment Contracts

Frontend required environment variable names:

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_AWS_COGNITO_USER_POOL_CLIENT_ID`
- `NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID`
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`

Backend required environment variable names:

- `PORT`
- `DATABASE_URL`
- `S3_BUCKET_NAME`
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

Runtime commands:

- Frontend dev/build/start commands run from `client/`.
- Backend dev/build/start/seed commands run from `server/`.
- The Express API defaults to port `3002` when `PORT` is unset.
- The deployed frontend must set `NEXT_PUBLIC_API_BASE_URL` to the deployed Express API base URL.
- Prior AWS Amplify frontend deployment work used `client/` as the app root; do not deploy from the repository root unless the build configuration deliberately changes.

## 4. Auth and Role Contracts

- AWS Cognito is the source of user authentication.
- Cognito `sub` is used as the application user id and is stored as `Manager.cognitoId` or `Tenant.cognitoId`.
- Cognito `custom:role` must be either `tenant` or `manager`.
- The client sends the Cognito ID token as `Authorization: Bearer <token>`.
- The backend currently decodes the token and checks `custom:role`; production hardening must verify the token cryptographically.
- Manager-only UI and APIs must use the manager role.
- Tenant-only UI and APIs must use the tenant role.
- Backend authorization must not rely only on hidden buttons or client redirects.

## 5. API Route Contracts

Base route mounting happens in `server/src/index.ts`.

Properties:

- `GET /properties` returns public searchable listings.
- `GET /properties/:id` returns one property with formatted location coordinates.
- `POST /properties` creates a property and requires manager auth.
- `PUT /properties/:id` updates a property and requires manager auth.
- `DELETE /properties/:id` currently exists without route-level auth in `propertyRoutes.ts`; do not treat it as protected until fixed.
- Property create/update with photos uses multipart form data and the file field name `photos`.

Tenants:

- `/tenants/*` is mounted behind tenant auth.
- `GET /tenants/:cognitoId` returns tenant profile data with favorites.
- `POST /tenants` creates a tenant row for a Cognito user.
- `PUT /tenants/:cognitoId` updates tenant settings.
- `GET /tenants/:cognitoId/current-residences` returns current residences.
- `POST /tenants/:cognitoId/favorites/:propertyId` adds a favorite.
- `DELETE /tenants/:cognitoId/favorites/:propertyId` removes a favorite.

Managers:

- `/managers/*` is mounted behind manager auth.
- `GET /managers/:cognitoId` returns manager profile data.
- `POST /managers` creates a manager row for a Cognito user.
- `PUT /managers/:cognitoId` updates manager settings.
- `GET /managers/:cognitoId/properties` returns properties owned by the manager.

Applications:

- `POST /applications` requires tenant auth.
- `GET /applications` requires manager or tenant auth and accepts `userId` and `userType` query params.
- `PUT /applications/:id/status` requires manager auth.
- Status values are exactly `Pending`, `Denied`, and `Approved`.

Leases and payments:

- `GET /leases` requires manager or tenant auth.
- `GET /leases/:id/payments` requires manager or tenant auth.

## 6. Data Model Contracts

- Prisma schema file: `server/prisma/schema.prisma`.
- Database provider: PostgreSQL.
- Required database extension: PostGIS.
- Location coordinates are stored as `geography(Point, 4326)`.
- Client-facing location coordinates should be shaped as `{ longitude, latitude }`.
- Client filter coordinates are `[longitude, latitude]`.
- Main models are `Property`, `Manager`, `Tenant`, `Location`, `Application`, `Lease`, and `Payment`.
- Main enums are `Highlight`, `Amenity`, `PropertyType`, `ApplicationStatus`, and `PaymentStatus`.
- `Manager.cognitoId` and `Tenant.cognitoId` are unique.
- `Property.managerCognitoId` references `Manager.cognitoId`.
- `Application.tenantCognitoId` and `Lease.tenantCognitoId` reference `Tenant.cognitoId`.
- `Application.leaseId` is unique and optional.

## 7. Frontend State and UI Contracts

- Central API client: `client/src/state/api.ts`.
- Global UI/filter state: `client/src/state/index.ts`.
- Redux store setup: `client/src/state/redux.tsx`.
- Shared property form: `client/src/components/PropertyForm.tsx`.
- Shared settings form: `client/src/components/SettingsForm.tsx`.
- Shared property cards: `client/src/components/Card.tsx`, `client/src/components/CardCompact.tsx`, and `client/src/components/ManagerPropertyCard.tsx`.
- Shared application card: `client/src/components/ApplicationCard.tsx`.
- Keep API hooks in RTK Query unless a spec approves another data-fetching path.
- Keep property form validation aligned with `client/src/lib/schemas.ts`.
- Keep property enum values aligned between `server/prisma/schema.prisma` and `client/src/lib/constants.ts`.
- Dashboard routes are role-gated in `client/src/app/(dashboard)/layout.tsx`.

## 8. External Service Contracts

- AWS Cognito owns authentication and user roles.
- AWS S3 stores property photos; API responses store/display the resulting S3 URLs.
- Mapbox renders the listing map and requires a public token.
- Nominatim geocodes property addresses during create/update.
- External service keys must stay in environment variables, not source files.
- If switching providers for auth, storage, maps, geocoding, hosting, or database, write a spec first.

## 9. Current Risk Contracts

- JWTs are decoded but not verified in the backend middleware.
- CORS is currently open.
- `DELETE /properties/:id` is not currently role-gated in the route file.
- Property mutation ownership is partly enforced by client checks and needs backend enforcement.
- Application submission and approval both create lease data in current service logic; clarify before changing this flow.
- There are no test scripts in the current package files.
- Dedicated `/signin` and `/signup` page files are not visible in the current checkout, although the navbar and auth provider refer to those routes.
