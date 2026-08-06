# PeerSlot

Policy-aware scheduling for student meetings.

PeerSlot is a small scheduling application for teachers, tutors, mentors, and
student-support teams. Teachers publish the times when they are available, and
students can move an existing appointment without asking an administrator to do
it manually.

Unlike a general-purpose booking link, PeerSlot is built around educational
rules. The first version focuses on a deliberately narrow workflow:

- A student may reschedule an appointment only once.
- The change must happen more than 24 hours before the current appointment.
- The replacement must be an available future slot with the same teacher.
- Two students can never claim the same slot.

> [!NOTE]
> PeerSlot is in the initial development stage. The Next.js application and
> Neon schema, authentication routes, and initial slot APIs are in place.
> Scheduling screens and the complete appointment workflow are still being
> implemented.

## The problem

Student meetings are often recurring or assigned in advance. When a student
needs a different time, a teacher or coordinator has to check availability,
move the meeting, notify everyone, and ensure the change does not create a
conflict.

PeerSlot makes that process self-service while keeping the teacher's scheduling
policy in control.

## Core workflow

1. A teacher creates available meeting slots.
2. A student signs in and sees their upcoming appointment.
3. PeerSlot determines whether that appointment may be changed.
4. The student chooses from valid, unoccupied alternatives.
5. The server performs the change atomically.
6. The appointment records that its one permitted reschedule has been used.

## Planned MVP

### Student experience

- Sign in securely
- View the next scheduled meeting
- See whether the meeting is eligible for rescheduling
- Browse valid replacement times
- Confirm a one-time appointment change
- Receive useful feedback when a slot becomes unavailable

### Teacher experience

- Create and remove availability slots
- Review upcoming appointments
- View a weekly, color-coded schedule
- See whether an appointment has already been rescheduled

### Scheduling guarantees

- One reschedule per appointment
- A strict 24-hour cutoff
- No double-booking
- Server-side authorization for every protected operation
- Database constraints for shared scheduling state
- UTC storage with timezone-aware presentation

## Tech stack

The repository currently uses:

| Area            | Technology                                                                       |
| --------------- | -------------------------------------------------------------------------------- |
| Framework       | [Next.js 16](https://nextjs.org/) App Router                                     |
| Language        | [TypeScript](https://www.typescriptlang.org/)                                    |
| UI runtime      | [React 19](https://react.dev/)                                                   |
| Styling         | [Tailwind CSS 4](https://tailwindcss.com/)                                       |
| Localization    | [next-intl](https://next-intl.dev/)                                              |
| Database        | [Neon Postgres](https://neon.com/)                                               |
| Database driver | [`@neondatabase/serverless`](https://neon.com/docs/serverless/serverless-driver) |
| ORM             | [Drizzle ORM](https://orm.drizzle.team/)                                         |
| Authentication  | [Better Auth](https://www.better-auth.com/) persisted in Neon                    |
| Package manager | [pnpm](https://pnpm.io/)                                                         |

Better Auth provides email/password sessions, short-lived JWT access tokens,
and optional Google and Microsoft OAuth. PeerSlot application APIs accept
15-minute JWTs; the revocable Better Auth session is used to issue and refresh
them. Public verification keys are exposed through JWKS. Authentication
establishes who the user is. A provider profile grants the capability to
publish availability, while every authenticated user can book appointments.

FullCalendar and Resend are installed for the later calendar and notification
work, but are not integrated into the current UI yet.

## Architecture

PeerSlot is designed as a modular Next.js monolith. React and the App Router
provide the user interface, server actions or route handlers enforce the
application rules, and Neon Postgres owns durable scheduling state.

```mermaid
flowchart LR
    Student["Student"]
    Teacher["Teacher"]
    App["Next.js application"]
    Auth["Better Auth"]
    Database["Neon Postgres"]

    Student --> App
    Teacher --> App
    App --> Auth
    App --> Database
```

There is no separate microservice backend in the MVP. Keeping the application
in one TypeScript codebase makes the project faster to build and easier to
deploy while the workflow is being validated.

## Initial data model

Better Auth manages its authentication records in Neon. PeerSlot initially
uses four application tables:

```mermaid
erDiagram
    PROFILES ||--o| PROVIDER_PROFILES : enables
    PROVIDER_PROFILES ||--o{ AVAILABILITY_SLOTS : creates
    PROFILES ||--o{ APPOINTMENTS : attends
    AVAILABILITY_SLOTS ||--o| APPOINTMENTS : reserves

    PROFILES {
        text user_id PK
        timestamptz created_at
    }

    PROVIDER_PROFILES {
        text user_id PK
        timestamptz created_at
    }

    AVAILABILITY_SLOTS {
        uuid id PK
        text teacher_id FK
        timestamptz starts_at
        timestamptz ends_at
        timestamptz created_at
    }

    APPOINTMENTS {
        uuid id PK
        text student_id FK
        uuid slot_id FK
        integer reschedule_count
        enum status
        timestamptz created_at
        timestamptz updated_at
    }
```

The appointment's `slot_id` will be unique so PostgreSQL, rather than a
browser-side check, prevents double-booking. The database will also constrain
`reschedule_count` to `0` or `1`.

An audit table for reschedule history can be introduced after the basic
workflow is working.

## Rescheduling safely

The reschedule operation must be one server-controlled database operation. It
will update an appointment only when all of these conditions are true:

1. The signed-in student owns the appointment.
2. The appointment is still scheduled.
3. Its reschedule count is zero.
4. Its current start time is more than 24 hours away.
5. The new slot is in the future and belongs to the same teacher.
6. The new slot is not occupied.

If two requests race for the same replacement slot, a unique database
constraint allows only one to succeed.

## Getting started

### Prerequisites

- Node.js 20 or newer
- pnpm

### Install and run

```bash
git clone <repository-url>
cd peerslot
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Localization

The website is available in English at `/en` and Turkish at `/tr`. Visiting
the root URL selects a locale from the saved preference or the browser's
language and redirects to the matching localized route. Page copy and metadata
live in `messages/en.json` and `messages/tr.json`. API routes remain unprefixed
under `/api`.

### Available commands

| Command                            | Purpose                                   |
| ---------------------------------- | ----------------------------------------- |
| `pnpm dev`                         | Start the local development server        |
| `pnpm build`                       | Create a production build                 |
| `pnpm start`                       | Run the production build                  |
| `pnpm lint`                        | Run ESLint                                |
| `pnpm typecheck`                   | Run TypeScript without emitting files     |
| `pnpm test`                        | Run the Vitest suite                      |
| `pnpm auth:schema`                 | Regenerate the Better Auth Drizzle schema |
| `pnpm db:generate`                 | Generate a migration from schema changes  |
| `pnpm db:migrate`                  | Apply pending migrations                  |
| `pnpm db:studio`                   | Open Drizzle Studio                       |
| `pnpm user:grant-provider <email>` | Grant provider capability to a local user |

Copy `.env.example` to `.env.local` and provide the Neon connection string,
Better Auth secret, application URL, and any OAuth credentials you enable.
Secrets must remain in local environment files and must never be committed.

For endpoint examples and the included Bruno collection, see
[`docs/API_TESTING.md`](docs/API_TESTING.md).

## Development principles

- **Keep the student flow focused.** Students should see valid choices, not an
  administrative calendar.
- **Enforce policy on the server.** Client-side validation is for usability,
  not security.
- **Let PostgreSQL protect shared state.** Constraints are the final defense
  against scheduling races.
- **Start with explicit slots.** Recurring availability can be added after the
  fundamental workflow is reliable.
- **Use color accessibly.** Calendar states also need text labels or icons.
- **Avoid speculative infrastructure.** The application remains a monolith
  until real requirements justify another service.

## Roadmap

### Foundation

- [x] Create the Next.js and TypeScript application
- [x] Configure Tailwind CSS
- [x] Add the Neon serverless driver
- [x] Add Drizzle ORM and Drizzle Kit
- [x] Add the Drizzle configuration and initial schema
- [x] Add migrations and database scripts
- [x] Configure Better Auth
- [x] Add a Bruno API collection

### MVP

- [x] Add user profiles and provider capabilities
- [x] Add initial teacher availability APIs
- [ ] Build teacher availability management
- [ ] Build the student appointment view
- [ ] Implement atomic one-time rescheduling
- [ ] Add the teacher calendar
- [ ] Add scheduling-rule unit tests
- [ ] Add end-to-end tests for the primary workflows
- [ ] Deploy the application

### Later

- [ ] Reschedule history and audit events
- [ ] Teacher overrides
- [ ] Recurring availability
- [ ] Email confirmations and reminders
- [ ] Calendar synchronization
- [ ] Organization-specific policies
- [ ] Multiple teachers per organization
- [ ] Group and peer meeting rules
- [ ] Appointment swaps
- [ ] Attendance and rescheduling analytics

## Out of scope for the MVP

- Payments and subscriptions
- Native mobile applications
- Microservices
- Complex recurrence editing
- Automated student matching
- Multi-organization billing

## License

No open-source license has been selected. Unless a license is added, all rights
are reserved.
