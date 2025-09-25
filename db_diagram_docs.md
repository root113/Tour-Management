# Prisma schema — DB tables, diagram, and human-readable documentation

This document describes the final `schema.prisma`. It contains:

- An ASCII ER diagram showing tables and relations.
- Per-table field lists (types, constraints, indexes).
- Relationship explanations (cardinality and direction).
- Important indexes & constraints (unique, composite uniques).
- Migration notes & useful SQL snippets (check constraint, referential actions).
- Suggested small improvements and examples of common queries.

---

## ASCII ER diagram

```
+-----------+       1    *      +---------+      *    1     +---------+
|  PopYear  |-------------------|  PopDay |------------------|  Event  |
|  (years)  |                   |  (days) |                  |  (opt)  |
+-----------+                   +---------+                  +---------+
     |1                             |1  *                         \
     |                               |                             \
     |                               |                              \ (optional)
     |                               |                               
     |                               |                               
     |                               v                               
     |                         +-----------+                          
     |                         |  Concert  |<---* 1 --->| Club |      
     |                         +-----------+           +-----------+   
     |                          * | 1  *               |  club has |   
     |                            |                    |  many     |   
     |                            v                    +-----------+   
     |                         +-------+                               
     |                         | Band  |                               
     |                         +-------+                               
     |
     v
+-----------+
| (PopDay)  |
+-----------+

Note: ASCII diagram above focuses on the key relations: PopYear → PopDay → Concert → (Club, Band) and optional PopDay ↔ Event.
```

---

## Tables & fields

### PopYear
- **Primary key:** `id` (String, ULID)
- **Fields:**
  - `year` Int @db.SmallInt — **unique** (`unique_pop_year`)
  - `start_date` DateTime @db.Date
  - `end_date` DateTime @db.Date
- **Relations:**
  - `pop_day` PopDay[] (one PopYear has many PopDays)
- **Constraints:**
  - Composite unique on `[start_date, end_date]` mapped as `unique_pop_year_range`.

---

### PopDay
- **Primary key:** `id` (String, ULID)
- **Fields:**
  - `day_index` Int @db.SmallInt — **unique** (`unique_pop_day`)
  - `real_date` DateTime @db.Date — **unique**
  - `pop_year_id` String — FK → `PopYear.id`
  - `event_id` String? — nullable FK → `Event.id` (optional 1:1)
- **Relations:**
  - `pop_year` PopYear (many-to-one)
  - `event` Event? (optional one-to-one: enforced by unique on `event_id`)
  - `concert` Concert[] (one PopDay has many Concerts)
- **Constraints & indexes:**
  - `@@unique([event_id], map: "unique_pop_day_event")` — ensures an Event is linked to at most one PopDay (NULL allowed many times)

Notes:
- `event_id` is nullable so PopDay can exist without Event.
- The `@@unique([event_id])` combined with `event_id` being nullable implements the 0-or-1 ↔ 1:1 pattern.

---

### City
- **Primary key:** `id` (String, ULID)
- **Fields:**
  - `name` String @db.VarChar(25) — **unique** (`unique_city_name`)
- **Relations:**
  - `club` Club[] (one City has many Clubs)

---

### Club
- **Primary key:** `id` (String, ULID)
- **Fields:**
  - `name` String @db.VarChar(80) — **unique** (`unique_club_name`)
  - `genre` Genre — enum (stored as mapped labels in DB)
  - `city_id` String — FK → `City.id`
- **Relations:**
  - `city` City (many-to-one)
  - `concert` Concert[] (one Club has many Concerts)

Notes:
- Consider adjusting `VarChar(80)` if club names may be longer.

---

### Band
- **Primary key:** `id` (String, ULID)
- **Fields:**
  - `name` String @db.VarChar(60) — **unique** (`unique_band_name`)
  - `genre` Genre
  - `status` Boolean @default(true)
- **Relations:**
  - `concert` Concert[] (one Band has many Concerts)

---

### Concert
- **Primary key:** `id` (String, ULID)
- **Fields:**
  - `date` DateTime @db.Date (named `concert_date` in DB)
  - `hour` ConcertHour (enum)
  - `genre` Genre
  - `pop_day_id` String — FK → `PopDay.id`
  - `club_id` String — FK → `Club.id`
  - `band_id` String — FK → `Band.id`
- **Relations:**
  - `pop_day` PopDay (many-to-one)
  - `club` Club (many-to-one)
  - `band` Band (many-to-one)
- **Constraints:**
  - `@@unique([date, hour, club_id], map: "unique_concert_entry")` — prevents two concerts occupying the same date+hour (globally)

---

### Event
- **Primary key:** `id` (String, ULID)
- **Fields:**
  - `name` String @db.VarChar(255) — **unique**
- **Relations:**
  - `pop_day` PopDay? (optional back-relation)

Note: Each PopDay may reference an Event via `event_id`. `@@unique([event_id])` on PopDay ensures each Event links to at most one PopDay.

---

## Enums
- **Genre**: Readable labels stored via `@map`, e.g. `RHYTHM_BLUES @map("R&B")`.
- **ConcertHour**: Fixed slots `12:00, 14:00, 16:00, 18:00, 20:00, 22:00` mapped via `@map`.

---

## Important DB-level notes & migration snippets

### Enforce 0-or-1 ↔ 1:1 PopDay ↔ Event
Schema already includes `@@unique([event_id], map: "unique_pop_day_event")` on PopDay. This allows many NULLs but enforces that a non-NULL `event_id` appears at most once.

---

## Suggested small improvements
- **Decide Concert uniqueness scope**: global vs per-club. Adjust `@@unique` accordingly.
- **Tune VARCHAR sizes** for `Club.name`, `Band.name`, `City.name` based on realistic maximums (80/60/25 are OK but consider raising if needed).
- **Consider `timestamptz`** for audit fields elsewhere (we intentionally use `@db.Date` for calendar-only values due to business logic).
- **Define referential actions** (e.g., `onDelete: SetNull` or `Cascade`) in `@relation` if you want specific behavior when parent rows are deleted.
- **Add indexes** for common query patterns (e.g., `pop_year_id` on PopDay is implicitly indexed via FK but explicit indexes can be added if needed).

---

## Example queries (Prisma Client)

- Get all concerts for a given PopDay ordered by hour:

```ts
const concerts = await prisma.concert.findMany({
  where: { pop_day_id: somePopDayId },
  orderBy: { hour: 'asc' }
});
```

- Create PopDay without Event (allowed):

```ts
await prisma.popDay.create({
  data: {
    day_index: 5,
    real_date: new Date('2025-02-10'),
    pop_year_id: 'some-pop-year-id'
  }
});
```

- Link an Event to a PopDay (ensures uniqueness):

```ts
await prisma.popDay.update({
  where: { id: 'popDayId' },
  data: { event: { connect: { id: 'eventId' } } }
});
```

---

## Final notes
- Schema is solid and intentional: ULIDs, `@db.Date` for calendar-only columns, mapped enums for friendly labels, and explicit uniqueness where business logic relies on it.

---
