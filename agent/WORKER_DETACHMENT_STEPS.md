# Detaching `ScraperService` Into Worker Nodes

This guide is specific to the current Nest codebase and is designed to avoid breaking the existing app while introducing queue-driven workers.

## Goal

Move scraping out of API request-processing code and into worker pods, while keeping the external API contract unchanged:

- `POST /api/v1/search` returns `202` quickly with `search_id`.
- `GET /api/v1/search/{id}/results` returns `202` until complete, then `200`.

---

## Current baseline (today)

- Scraping still runs from `SearchService.processSearchAsync(...)`.
- `SearchService` directly calls `scraperService.scrapeApartments(...)`.
- No queue producer/consumer code exists yet.
- No per-source task table (`scrape_source_tasks`) exists yet.

---

## Recommended migration strategy (no big-bang cutover)

## Step 1 - Add schema for per-source orchestration

Add Flyway migration for:

- `scrape_source_tasks` table:
  - `id` (uuid pk)
  - `search_id` (fk to `search_requests`)
  - `source` (enum or varchar)
  - `status` (`PENDING`, `PROCESSING`, `DONE`, `FAILED`)
  - `attempts` (int default 0)
  - `error_message` (text nullable)
  - `created_at`, `updated_at`
- indexes:
  - `(search_id)`
  - `(search_id, status)`
  - unique `(search_id, source)`

Add model/repository/service:

- `ScrapeSourceTask` entity
- `ScrapeSourceTaskRepository`
- helper methods:
  - `findBySearchId(...)`
  - `countBySearchIdAndStatusIn(...)`
  - `existsBySearchIdAndStatusIn(...)`

## Step 2 - Introduce message contract + queue publisher in API

Create a payload DTO for queue messages:

- `ScrapeJobMessage`
  - `searchId`
  - `source`
  - search filters needed by worker (`maxPrice`, `minSqft`, optional amenities/bed+bath)

In API module:

- add queue publisher interface `ScrapeJobPublisher`
- create implementation `RabbitScrapeJobPublisher` (or no-op first, toggled by config)

Update `SearchService.createSearch(...)`:

1. create `search_requests` + `scraping_jobs`,
2. create one `scrape_source_tasks` row per source,
3. publish one message per source,
4. return `202`.

Do not remove existing scraping flow yet; keep a feature flag fallback.

## Step 3 - Add worker runtime mode (same repo, separate deployment)

Add worker-specific startup path controlled by profile:

- profile: `worker`
- API profile keeps web endpoints enabled.
- Worker profile runs queue listener and disables API controllers if desired.

Implementation options:

- simplest: keep same Spring Boot app and conditionally enable:
  - web controllers with `@Profile("!worker")`
  - queue listener beans with `@Profile("worker")`
- alternative: separate worker Spring Boot main class/module.

Worker consumer behavior:

1. receive `ScrapeJobMessage`,
2. set task row `(search_id, source)` to `PROCESSING`,
3. run source-specific scrape logic (refactor `ScraperService` to scrape one source),
4. persist apartments with `search_id`,
5. set task row to `DONE` (or `FAILED` + error),
6. ack message.

## Step 4 - Refactor `ScraperService` to source-oriented methods

Current methods:

- `scrapeApartments(SearchRequest)` scrapes both sources and merges cache.

Target methods:

- `scrapeSource(SearchRequest request, String source)` (single-source entrypoint)
- keep cache/dedupe behavior explicit:
  - either in worker per source,
  - or centrally in API scoring stage.

For safe transition:

- keep existing `scrapeApartments(...)` for local fallback until queue mode is stable.

## Step 5 - Update `GET /results` to completion-based orchestration

In `SearchService.getResults(searchId)`:

1. load source tasks for `search_id`,
2. if any task is non-terminal (`PENDING`/`PROCESSING`) -> return `202 PROCESSING`,
3. if all tasks terminal and scores absent -> run scoring once (single-writer guard),
4. return `200 COMPLETED` (or terminal failure).

Single-writer guard options:

- conditional status update (`PROCESSING` -> `SCORING`) with affected row count check,
- DB lock on `scraping_jobs` row,
- idempotency check on existing scores before insert.

## Step 6 - Cutover safely via feature flags

Add toggles:

- `scrape.mode=inline|queue`
- `worker.enabled=true|false`

Rollout:

1. deploy schema + code with defaults still inline,
2. deploy RabbitMQ and worker pods (`replicas=0` -> then scale to >0),
3. enable `scrape.mode=queue`,
4. monitor queue depth + task status convergence + API polling completion.

## Step 7 - Scale workers with KEDA

After queue mode is stable:

- add `ScaledObject` for `nest-worker` based on RabbitMQ queue depth.
- define:
  - min replicas (e.g. 0 or 1)
  - max replicas (e.g. 20)
  - queue length threshold per replica.

---

## Minimal file-level plan in this repo

Likely changes:

- `src/main/java/com/nest/nestapp/service/SearchService.java`
- new `src/main/java/com/nest/nestapp/model/ScrapeSourceTask.java`
- new `src/main/java/com/nest/nestapp/repository/ScrapeSourceTaskRepository.java`
- new `src/main/java/com/nest/nestapp/messaging/ScrapeJobMessage.java`
- new `src/main/java/com/nest/nestapp/messaging/ScrapeJobPublisher.java`
- new Rabbit publisher + consumer classes
- `src/main/resources/db/migration/V*_add_scrape_source_tasks.sql`
- `k8s/worker-deployment.yaml` (already added as template, replicas 0)

---

## Operational checkpoints before enabling queue mode

- API still returns `202` quickly for `POST /search`.
- Worker can persist apartments for a known `search_id`.
- `scrape_source_tasks` reliably reaches terminal states.
- `GET /results` resolves from `PROCESSING` to `COMPLETED` without manual intervention.
- Retry + DLQ behavior tested with simulated source failures.
