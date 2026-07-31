# Rent1000 Development Context

## 1. Project Overview

Rent1000 is a full-stack rental property application for tenants and property managers. Tenants can browse public listings, search with filters and a map, view property details, save favorite properties, submit rental applications, track application status, and view current residences. Managers can create and edit property listings, upload property photos, review applications for their properties, approve or deny applications, and maintain manager settings.

The frontend is a Next.js 15 / React 19 application under `client/`. It uses the App Router under `client/src/app`, Tailwind CSS, shadcn/Radix-style UI primitives, Redux Toolkit, RTK Query, AWS Amplify UI/Auth, Mapbox GL, React Hook Form, Zod, FilePond, and Sonner toasts. Client API calls are centralized in `client/src/state/api.ts`, which reads `NEXT_PUBLIC_API_BASE_URL`, obtains the AWS Cognito ID token through Amplify, and sends it as a `Bearer` token.

The backend is a TypeScript Express API under `server/`. It uses Prisma 7 with PostgreSQL, the `@prisma/adapter-pg` adapter, PostGIS geography columns, AWS S3 uploads through the AWS SDK, Nominatim address geocoding, Multer in-memory multipart handling, Helmet, CORS, Morgan logging, and JWT decoding for tenant/manager role gating. The database schema is defined in `server/prisma/schema.prisma`, with the current migration in `server/prisma/migrations/20250326160244_init/migration.sql`.

**Spec-driven development**

All non-trivial features, enhancements, refactors, database changes, API changes, authentication changes, deployment architecture changes, or UI workflow changes should follow a spec-driven development workflow.

Before writing implementation code:

1. Read this file, `ai_context/CONTRACTS.md`, and the relevant existing source files.
2. Search for an existing related spec under `ai_context/`.
3. Create a new specification document if none exists for the proposed change.
4. Never overwrite an existing specification. Use the format `spec_<feature-name>.md`.
5. Review the spec against the current architecture before implementation begins.
6. Implement incrementally after the spec is accepted.
7. Update `DEVELOPMENT_CONTEXT.md` and `CONTRACTS.md` when durable architecture or contract facts change.

Each specification should include, where applicable:

- Feature
- Goals
- Functional requirements
- Data model changes
- API contracts
- UI/UX changes
- External service impact
- Implementation plan
- Acceptance criteria
- Rollback or migration notes

### Specification Required

A specification is required for:

- New features
- Feature enhancements
- Database schema changes
- Prisma migration changes
- API route or response changes
- Authentication, role, or authorization changes
- File upload/storage changes
- Search/filter/map behavior changes
- Deployment, hosting, or environment changes
- Refactors affecting multiple modules
- Performance optimizations

A specification is NOT required for:

- Typo fixes
- Formatting-only changes
- Comments
- Simple one-file fixes with no behavioral change
- Dependency version bumps where no code or deployment behavior changes

### Recommended Workflow

1. Inspect the relevant component, route, controller, service, and Prisma model.
2. Check whether the behavior already has a contract in `CONTRACTS.md`.
3. Create or update a `spec_<feature>.md` file when the change is non-trivial.
4. Keep the change inside the smallest existing boundary that can safely own it.
5. Validate locally before changing deployment or environment settings.
6. Update durable docs only after the implementation reflects the documented behavior.

## 2. Project Structure

The repository has two main applications: `client` for the Next.js frontend and `server` for the Express/Prisma backend.

```txt
Rent1000-fullstack/
|-- .agents/                                      <- Agent/tooling metadata; not project runtime source.
|-- .codex/                                       <- Codex metadata; not project runtime source.
|-- .git/                                         <- Git metadata.
|-- .gitignore                                    <- Root ignore rules.
|-- ai_context/
|   |-- CONTRACTS.md                              <- Durable project contracts and guardrails.
|   `-- DEVELOPMENT_CONTEXT.md                    <- Developer/AI onboarding and architecture handbook.
|-- client/
|   |-- .env                                      <- Local frontend environment values; do not commit real secrets.
|   |-- components.json                           <- shadcn-style component configuration.
|   |-- eslint.config.mjs                         <- Frontend ESLint config.
|   |-- next.config.ts                            <- Next image remote patterns.
|   |-- package.json                              <- Frontend dependencies and scripts.
|   |-- postcss.config.mjs                        <- PostCSS/Tailwind config.
|   |-- tailwind.config.ts                        <- Tailwind theme and content paths.
|   |-- tsconfig.json                             <- Frontend TypeScript config.
|   |-- public/
|   |   `-- logo.svg                              <- Navbar logo asset.
|   `-- src/
|       |-- app/
|       |   |-- layout.tsx                        <- Root layout with Providers and Toaster.
|       |   |-- page.tsx                          <- Root landing page shell.
|       |   |-- providers.tsx                     <- Redux + Amplify Authenticator providers.
|       |   |-- (auth)/
|       |   |   `-- authProvider.tsx              <- Amplify Cognito setup and auth-page/dashboard gating.
|       |   |-- (nondashboard)/
|       |   |   |-- layout.tsx                     <- Public/non-dashboard layout with Navbar and auth redirect checks.
|       |   |   |-- landing/                       <- Marketing/landing sections.
|       |   |   `-- search/                        <- Listing search, filters, map, details, application modal, edit route.
|       |   `-- (dashboard)/
|       |       |-- layout.tsx                      <- Role-gated dashboard layout and sidebar.
|       |       |-- managers/                       <- Manager properties, new property, applications, settings.
|       |       `-- tenants/                        <- Tenant favorites, applications, residences, settings.
|       |-- components/
|       |   |-- AppSidebar.tsx                    <- Dashboard navigation by role.
|       |   |-- ApplicationCard.tsx               <- Shared application display card.
|       |   |-- Card.tsx                          <- Full property card.
|       |   |-- CardCompact.tsx                   <- Compact property card.
|       |   |-- FormField.tsx                     <- Shared form field, including FilePond image input.
|       |   |-- ManagerPropertyCard.tsx           <- Manager-facing listing card/actions.
|       |   |-- Navbar.tsx                        <- Public and dashboard navbar.
|       |   |-- PropertyForm.tsx                  <- Create/edit property form.
|       |   |-- SettingsForm.tsx                  <- Tenant/manager settings form.
|       |   `-- ui/                               <- shadcn/Radix-style reusable UI primitives.
|       |-- lib/
|       |   |-- constants.ts                      <- Enum mirrors, icons, navbar height, dev test user constants.
|       |   |-- schemas.ts                        <- Zod validation schemas.
|       |   `-- utils.ts                          <- UI helpers, query param cleanup, toast wrapper, user bootstrap helper.
|       |-- state/
|       |   |-- api.ts                            <- RTK Query API layer and endpoint hooks.
|       |   |-- index.ts                          <- Global filter/view Redux slice.
|       |   `-- redux.tsx                         <- Store setup and typed hooks.
|       `-- types/
|           |-- index.d.ts                         <- Global frontend types.
|           `-- prismaTypes.d.ts                   <- Prisma-generated types copied from server output.
`-- server/
    |-- .env                                      <- Local backend environment values; do not commit real secrets.
    |-- ecosystem.config.js                       <- PM2 dev process config.
    |-- package.json                              <- Backend dependencies and scripts.
    |-- prisma.config.ts                          <- Prisma config.
    |-- prisma/
    |   |-- schema.prisma                         <- PostgreSQL/PostGIS data model.
    |   |-- seed.ts                               <- Seed runner.
    |   |-- seedData/                             <- JSON seed data for locations, managers, properties, tenants, leases, applications, payments.
    |   `-- migrations/
    |       `-- 20250326160244_init/migration.sql <- Current initial database migration.
    `-- src/
        |-- index.ts                              <- Express app bootstrap and route mounting.
        |-- lib/prisma.ts                         <- Prisma client singleton with PostgreSQL adapter.
        |-- middleware/authMiddleware.ts          <- Cognito JWT decode and role gate.
        |-- routes/                               <- Express route definitions.
        |-- controllers/                          <- Request parsing and HTTP response handling.
        `-- services/                             <- Business/data logic for managers, tenants, properties, applications.
```

### Backend Package Map

```txt
server/src/
|-- index.ts
|-- lib/
|   `-- prisma.ts
|-- middleware/
|   `-- authMiddleware.ts
|-- routes/
|   |-- applicationRoutes.ts
|   |-- leaseRoutes.ts
|   |-- managerRoutes.ts
|   |-- propertyRoutes.ts
|   `-- tenantRoutes.ts
|-- controllers/
|   |-- applicationControllers.ts
|   |-- leaseControllers.ts
|   |-- managerControllers.ts
|   |-- propertyControllers.ts
|   `-- tenantControllers.ts
`-- services/
    |-- applicationService.ts
    |-- managerService.ts
    |-- propertyService.ts
    `-- tenantService.ts
```

## 3. Module Documentation

### A. Application Bootstrap

**Frontend**

- Root layout: `client/src/app/layout.tsx`.
- Root page: `client/src/app/page.tsx`.
- Shared providers: `client/src/app/providers.tsx`.
- The root layout imports global CSS, sets up Geist fonts, wraps all pages in the Redux/Amplify provider stack, and renders a Sonner `Toaster`.
- The root page renders the shared `Navbar` and the landing page from `client/src/app/(nondashboard)/landing/page.tsx`.
- Metadata currently still uses default Create Next App text. Treat brand/SEO metadata as unfinished unless it is changed deliberately.

**Backend**

- API entrypoint: `server/src/index.ts`.
- The server loads `.env`, creates an Express app, enables JSON parsing, Helmet, Morgan, body-parser, and CORS, mounts routes, and listens on `process.env.PORT` or `3002`.
- Mounted route roots are `/applications`, `/properties`, `/leases`, `/tenants`, and `/managers`.

### B. Authentication and Role Gating

- Authentication is provided by AWS Cognito through AWS Amplify UI/Auth.
- Amplify is configured in `client/src/app/(auth)/authProvider.tsx` using:
  - `NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID`
  - `NEXT_PUBLIC_AWS_COGNITO_USER_POOL_CLIENT_ID`
- Signup adds a required Cognito custom attribute named `custom:role`.
- Supported application roles are currently `tenant` and `manager`.
- `client/src/state/api.ts` obtains the current Amplify auth session and attaches the ID token as `Authorization: Bearer <token>` for API calls.
- `server/src/middleware/authMiddleware.ts` decodes the token, reads `sub` as the Cognito user id, reads `custom:role`, lowercases the role for access checks, and stores `{ id, role }` on `req.user`.
- Tenant route groups are mounted behind `authMiddleware(["tenant"])`.
- Manager route groups are mounted behind `authMiddleware(["manager"])`.
- Individual application and lease routes apply role gates inside their route files.

Current security caveat: the backend currently decodes JWTs but does not verify the token signature, issuer, audience, expiration, or Cognito key set. Treat this as a known gap before production hardening.

### C. API State and Client Data Fetching

- RTK Query API definition: `client/src/state/api.ts`.
- Base URL: `process.env.NEXT_PUBLIC_API_BASE_URL`.
- Tag types: `Managers`, `Tenants`, `Properties`, `PropertyDetails`, `Leases`, `Payments`, `Applications`.
- Shared success/error toast wrapping is done by `withToast` in `client/src/lib/utils.ts`.
- Auth bootstrap is done through `getAuthUser`, which:
  - reads the current Cognito user and ID token,
  - determines the role from `custom:role`,
  - fetches `/managers/:cognitoId` or `/tenants/:cognitoId`,
  - creates the manager or tenant row if the API returns `404`.
- Prisma-generated frontend types are expected at `client/src/types/prismaTypes.d.ts`.

### D. Public Routes and Listing UX

- Public landing route is rendered from `client/src/app/page.tsx` and `client/src/app/(nondashboard)/landing/page.tsx`.
- Search route is `client/src/app/(nondashboard)/search/page.tsx`.
- Property detail route is `client/src/app/(nondashboard)/search/[id]/page.tsx`.
- The search page combines:
  - `FiltersBar`
  - `FiltersFull`
  - `Map`
  - `Listings`
- The global filter slice defaults to Nairobi coordinates `[36.82, -1.29]`, where the tuple is `[longitude, latitude]`.
- Map rendering uses Mapbox GL and `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`.
- Property detail displays image previews, overview, details, location, and a contact/application widget.
- Property owner controls appear when the authenticated manager's Cognito user id matches `property.managerCognitoId`.

### E. Dashboard Routes

Dashboard layout: `client/src/app/(dashboard)/layout.tsx`.

Manager routes:

- `/managers/properties` lists properties owned by the manager.
- `/managers/newproperty` creates a new property.
- `/managers/properties/[id]/edit` edits a manager-owned property.
- `/managers/properties/[id]/view` reuses the property detail experience for manager context.
- `/managers/applications` lists and filters applications for the manager's properties.
- `/managers/settings` updates manager profile fields.

Tenant routes:

- `/tenants/favorites` displays favorited properties.
- `/tenants/applications` displays tenant applications and status.
- `/tenants/residences` displays current residences connected to the tenant.
- `/tenants/residences/[id]` displays a residence detail page.
- `/tenants/settings` updates tenant profile fields.

The dashboard layout prevents managers from accessing tenant routes and tenants from accessing manager routes by redirecting to the appropriate dashboard home.

### F. Property Search, Map, and Filtering

Server-side property search is implemented in `server/src/services/propertyService.ts`.

Supported query filters:

- `favoriteIds`
- `priceMin`
- `priceMax`
- `beds`
- `baths`
- `propertyType`
- `squareFeetMin`
- `squareFeetMax`
- `amenities`
- `availableFrom`
- `latitude`
- `longitude`

Search uses Prisma raw SQL against PostgreSQL:

- property rows come from `"Property"` aliased as `p`,
- location rows come from `"Location"` aliased as `l`,
- PostGIS functions are used for distance filtering and coordinate extraction,
- API responses shape `location.coordinates` as `{ longitude, latitude }`.

When changing search behavior, update both:

- frontend filter serialization in `client/src/state/api.ts` and search UI components,
- backend filter parsing and SQL generation in `server/src/services/propertyService.ts`.

### G. Property Management and Photos

Property create/edit UI is centralized in `client/src/components/PropertyForm.tsx`.

Client-side validation is in `client/src/lib/schemas.ts`:

- `propertySchema`
- `applicationSchema`
- `settingsSchema`

Property forms submit `FormData`:

- uploaded files are appended under `photos`,
- `managerCognitoId` is appended during creation,
- edit forms can append `existingPhotos` and `photosToRemove`.

Server-side property routes:

- `GET /properties`
- `GET /properties/:id`
- `POST /properties`
- `PUT /properties/:id`
- `DELETE /properties/:id`

Photo handling:

- Multer uses in-memory storage.
- New property photos are uploaded to S3 through `@aws-sdk/lib-storage`.
- Uploaded S3 object URLs are stored in `Property.photoUrls`.
- Current update behavior preserves `existingPhotos` and appends newly uploaded S3 URLs.
- Removing an existing photo from the edit UI removes it from the retained URL list sent back to the server, but S3 object deletion is not implemented in the current service.

Location handling:

- The server geocodes submitted address fields through Nominatim.
- New locations are inserted with `ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)`.
- Existing property update creates a new `Location` row when address fields are supplied.

### H. Tenants, Managers, Favorites, and Settings

Manager data:

- Prisma model: `Manager`.
- API controller/service: `managerControllers.ts`, `managerService.ts`.
- Primary lookup key for app behavior is `cognitoId`, not numeric database `id`.
- Managers own properties through `Property.managerCognitoId`.

Tenant data:

- Prisma model: `Tenant`.
- API controller/service: `tenantControllers.ts`, `tenantService.ts`.
- Primary lookup key for app behavior is `cognitoId`.
- Tenants can favorite properties through the many-to-many `TenantFavorites` relation.
- Tenants are connected to current residences through the many-to-many `TenantProperties` relation.

Settings:

- Shared UI component: `client/src/components/SettingsForm.tsx`.
- Manager settings route calls `updateManagerSettings`.
- Tenant settings route calls `updateTenantSettings`.
- Current settings fields are `name`, `email`, and `phoneNumber`.

### I. Applications, Leases, and Payments

Application data:

- Prisma model: `Application`.
- API controller/service: `applicationControllers.ts`, `applicationService.ts`.
- Status enum values are exactly `Pending`, `Denied`, and `Approved`.
- Tenant application creation uses `POST /applications` and requires tenant auth.
- Manager status updates use `PUT /applications/:id/status` and require manager auth.
- Listing applications uses `GET /applications?userId=<cognitoId>&userType=<tenant|manager>` and requires tenant or manager auth.

Lease data:

- Prisma model: `Lease`.
- Lease reads are handled directly in `server/src/controllers/leaseControllers.ts`.
- Lease routes expose `GET /leases` and `GET /leases/:id/payments`, both role-gated for managers and tenants.
- `applicationService.calculateNextPaymentDate` derives a current next payment date for application responses when a lease exists.

Current implementation note: `createApplication` creates a lease immediately when the tenant submits an application, and `approveApplication` creates another lease when the manager approves an application. Clarify the intended business rule before changing application/lease behavior.

### J. Persistence and Database Layer

Database stack:

- PostgreSQL
- PostGIS extension
- Prisma schema and migrations
- Prisma PostgreSQL adapter

Prisma config:

- Schema: `server/prisma/schema.prisma`
- Migration: `server/prisma/migrations/20250326160244_init/migration.sql`
- Client singleton: `server/src/lib/prisma.ts`
- Seed runner: `server/prisma/seed.ts`

Main models:

- `Property`
- `Manager`
- `Tenant`
- `Location`
- `Application`
- `Lease`
- `Payment`

Main enums:

- `Highlight`
- `Amenity`
- `PropertyType`
- `ApplicationStatus`
- `PaymentStatus`

Important persistence rules:

- `Manager.cognitoId` and `Tenant.cognitoId` are unique and serve as auth-linked identifiers.
- `Property.managerCognitoId` references `Manager.cognitoId`.
- `Application.tenantCognitoId` and `Lease.tenantCognitoId` reference `Tenant.cognitoId`.
- `Location.coordinates` is a PostGIS `geography(Point, 4326)` value.
- Several API responses convert database WKT/geography output into `{ longitude, latitude }`.

### K. External Services

AWS Cognito:

- Handles signup/signin.
- Supplies user id through token `sub`.
- Supplies role through `custom:role`.

AWS S3:

- Stores property photos.
- Required backend environment values include `S3_BUCKET_NAME`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY`.

Mapbox:

- Renders the listing map.
- Uses `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`.
- The current map style is configured in `client/src/app/(nondashboard)/search/Map.tsx`.

Nominatim:

- Used for address geocoding during property creation and address updates.
- Current service sends a hard-coded `User-Agent` string in `propertyService.geocodeAddress`.

### L. Validation and Error Handling

Frontend validation:

- Zod schemas in `client/src/lib/schemas.ts`.
- React Hook Form integration in forms.
- RTK Query success/error toasts through `withToast`.

Backend error handling:

- Controllers catch errors and respond with `500` plus a module-specific message.
- Some services return `{ error, status }` objects for expected business failures.
- There is no centralized Express error handler in the current code.
- There is no shared request validation layer on the server side.

### M. Deployment and Runtime Notes

Frontend:

- The deployable frontend app lives in `client/`, not the repository root.
- Build command: run from `client/` with `npm run build`.
- Start command: run from `client/` with `npm run start`.
- Prior Amplify deployment work treated `client/` as the application root and `.next` as the build output.
- `NEXT_PUBLIC_API_BASE_URL` must point to the Express API base URL for deployed environments.

Backend:

- The API app lives in `server/`, not the repository root.
- Build command: run from `server/` with `npm run build`.
- Start command: run from `server/` with `npm run start`.
- Dev command: `npm run dev` builds and runs TypeScript watch plus nodemon/ts-node.
- Default port is `3002` if `PORT` is unset.
- `ecosystem.config.js` starts the backend dev script through PM2.

Environment variable names:

- Frontend: `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_AWS_COGNITO_USER_POOL_CLIENT_ID`, `NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID`, `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`.
- Backend: `PORT`, `DATABASE_URL`, `S3_BUCKET_NAME`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`.

Do not commit real `.env` values. If templates are added later, use `.env.example` files with placeholders only.

## 4. System Flows

### Signup / Login / User Bootstrap Flow

1. User visits `/signin` or `/signup` from the navbar.
2. Amplify Authenticator renders the signin/signup UI.
3. Signup requires `custom:role` with either `tenant` or `manager`.
4. `getAuthUser` reads the current Cognito user and ID token.
5. The client selects `/managers/:cognitoId` or `/tenants/:cognitoId` based on the role.
6. If the API returns `404`, the client posts a new manager or tenant record using Cognito user data.
7. Dashboard layouts use the role to route the user to the correct manager or tenant area.

Current gap: the code references `/signin` and `/signup`, but this checkout does not show dedicated page files for those routes. Verify route availability before depending on those pages.

### Property Search Flow

1. Search page reads URL search params.
2. Query params are cleaned and stored in the global Redux filter slice.
3. `Listings` and `Map` call `useGetPropertiesQuery(filters)`.
4. RTK Query serializes filters into API query params.
5. Express handles `GET /properties`.
6. `propertyService.getProperties` builds a raw SQL query with optional filters.
7. Location coordinates are returned as longitude/latitude values.
8. The client renders cards and map markers from the same property result set.

### Property Detail and Application Flow

1. User opens `/search/[id]`.
2. Client calls `GET /properties/:id`.
3. The page renders image previews, overview, details, location, and contact widget.
4. A tenant opens `ApplicationModal`.
5. Client validates the application form with Zod.
6. Client posts to `POST /applications` with tenant auth.
7. Server creates the application and current implementation also creates a lease in the same transaction.
8. Tenant applications page reads application status through `GET /applications`.

### Manager Property Creation Flow

1. Manager opens `/managers/newproperty`.
2. `PropertyForm` validates input and photo files.
3. Page code builds `FormData`, appends `photos`, and appends `managerCognitoId`.
4. Client posts to `POST /properties`.
5. Express applies manager auth and Multer memory upload handling.
6. Server uploads photos to S3.
7. Server geocodes address through Nominatim.
8. Server inserts a PostGIS location row.
9. Server creates the Prisma `Property` row with photo URLs and location id.
10. Client redirects to `/managers/properties`.

### Manager Application Review Flow

1. Manager opens `/managers/applications`.
2. Client calls `GET /applications?userId=<managerCognitoId>&userType=manager`.
3. Server filters applications by `property.managerCognitoId`.
4. Manager can approve or deny pending applications.
5. Status update calls `PUT /applications/:id/status`.
6. Approved status connects tenant to property and creates/links lease data according to current service behavior.

### Tenant Favorites and Residences Flow

1. Tenant opens `/tenants/favorites` or `/tenants/residences`.
2. Favorites page fetches tenant details, then fetches properties by favorite ids.
3. Residences page fetches current properties connected through the tenant-property relation.
4. Favorite add/remove APIs connect or disconnect the tenant and property relation.
5. Current residence data is formatted with `{ longitude, latitude }` coordinates before returning.

## 5. Technical Decisions Summary

- Keep the existing split-app layout: `client/` for Next.js and `server/` for Express.
- Keep shared API calls centralized in `client/src/state/api.ts`.
- Keep role-aware page gating in App Router layouts unless a spec approves a different auth architecture.
- Use Cognito user ids (`cognitoId`) as the application-level identity key for managers and tenants.
- Keep Prisma as the schema authority for backend data model changes.
- Keep PostGIS for geospatial property search and location coordinates.
- Keep S3 URLs as the stored representation of property photos.
- Keep property create/edit payloads as multipart `FormData` when photos are involved.
- Keep frontend validation in Zod/React Hook Form and add server validation before relying on it for security.
- Treat map coordinates as `[longitude, latitude]` in client state and `{ longitude, latitude }` in API responses.
- Treat deployment roots carefully: frontend commands run in `client/`, backend commands run in `server/`.

## 6. Security Notes

- Do not expose real `.env` values in docs, commits, screenshots, or examples.
- The backend currently decodes Cognito JWTs instead of verifying them. Production auth should verify signature, issuer, audience, expiration, and token use against Cognito JWKs.
- Role checks currently depend on `custom:role`. Any change to Cognito attributes must update both client bootstrap and backend middleware.
- Backend routes should not trust client-submitted `managerCognitoId` or `tenantCognitoId` without checking it against the verified token subject.
- `DELETE /properties/:id` is not role-gated in the current `propertyRoutes.ts`; do not assume it is protected until fixed.
- Property update and delete ownership checks should be enforced on the backend, not only in the client UI.
- CORS is currently open through `cors()` with default behavior. Production should restrict allowed origins.
- Multer stores uploads in memory. File count, file size, and MIME validation should be explicit before production use.
- S3 object deletion is not implemented when property photos are removed from a listing.
- Nominatim use should respect rate limits and attribution/usage policy.
- The current server error responses may expose internal error messages. Production APIs should normalize errors.

## 7. Current Gaps and Implementation Notes

- Dedicated `/signin` and `/signup` page files are not visible in the current checkout, even though the navbar and auth provider refer to those routes.
- Root metadata still says "Create Next App".
- No test scripts are defined in the current `client/package.json` or `server/package.json`.
- Backend token verification is incomplete.
- Backend ownership checks for property mutation/deletion need hardening.
- `createApplication` and approval behavior need business-rule clarification because lease creation appears in both submission and approval paths.
- The server has no central request validation middleware.
- The frontend has generated Prisma type output in `client/src/types/prismaTypes.d.ts`; regenerate rather than hand-edit when Prisma types change.
- Deployment documentation is minimal. Prior frontend deployment work used AWS Amplify with `client/` as the app root; backend deployment is not confirmed in this checkout.
- `.env.example` templates are not present in the current root/client/server files.

## 8. Future Improvements

- Add verified Cognito JWT middleware using Cognito JWKs.
- Add backend subject/ownership authorization for manager and tenant resources.
- Add server-side request validation matching the Zod/client contracts.
- Add focused tests for API services, auth middleware, property filtering, application status changes, and critical UI flows.
- Add `.env.example` files for client and server.
- Add deployment docs for frontend, backend, database, S3, Cognito, Mapbox, and migration/seed steps.
- Add S3 cleanup when property photos are removed or listings are deleted.
- Add database indexes for common property search filters and geospatial queries if performance requires it.
- Revisit application/lease lifecycle so lease creation happens at the intended business step only.
- Add production CORS, logging, rate limiting, upload limits, and normalized error handling.
