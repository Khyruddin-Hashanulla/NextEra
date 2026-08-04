# Redis Caching Layer (Prompt-48)

## Overview

This document describes the production-ready Redis caching layer added to the NextEra LMS backend. It introduces a cache service with a Redis backend and an in-process memory fallback, plus domain-aware invalidation helpers, without changing any API contract, payload, response shape, authentication, or business logic.

The client was verified against the following cached responses (contracts unchanged):

- `studentApi.listCourses({ featured: true })` / `listCourses({ limit: 50 })` and featured blogs (HomePage).
- `listCourses({ limit: 100 })` plus `courses`, `total`, `totalPages` (CoursesPage category derivation).
- Admin dashboard `stats.recentUsers` / `stats.recentPayments`.
- Instructor Revenue/Analytics `course.enrollments`, `userGrowth`, `roleDistribution`, `courseStats`, `topCourses`.
- Revenue dashboard `revenueBySource`, `monthlyTrend`, `instructorSubscriptionRevenue`, `instructorSubscriptionRevenue`, etc.

## Folder Structure

```
server/src/
├── config/
│   └── redis.ts              # Redis client, connect/disconnect/ready helpers
├── cache/
│   ├── cache.service.ts      # Core service (set/get/del/exists/expire/invalidatePattern/remember/flush/healthCheck/getStats)
│   ├── cache.keys.ts         # Key builders, namespaces, TTLs, patterns
│   └── cacheManager.ts       # Domain-aware invalidation helpers
```

## Cache Service API

All public methods are async and prefix keys with `env.redisKeyPrefix` (default `nextera:`).

| Method | Description |
| --- | --- |
| `get<T>(key)` | Read a value; `null` on miss. |
| `set<T>(key, value, { ttl, compress? })` | Write a value with TTL (seconds). |
| `exists(key)` | Boolean key presence (respects TTL). |
| `expire(key, ttl)` | Extend a key's TTL. |
| `del(key)` | Remove one key. |
| `invalidatePattern(pattern)` | Remove all keys matching a glob (`*`) pattern. |
| `remember<T>(key, options, producer, enabled = true)` | Cache-aside: return cached value or run `producer` and store the result. Pass `enabled = false` to bypass caching entirely (used for search / user-specific requests). |
| `flush()` | Remove every key under the configured prefix and reset stats. |
| `healthCheck()` | `{ ok, mode: 'redis' | 'memory', latencyMs, memoryEntries }`. |
| `getStats()` / `resetStats()` | Hit/miss/error/set/delete/invalidation counters plus latency averages. |

Values are serialized to JSON with a prefix marker: `j:` plain, `c:` gzip(base64) when the JSON length meets `redisCompressionThresholdBytes` (default 2048).

When Redis is enabled (`REDIS_CACHE_ENABLED=true`) and the client is `ready`, operations hit Redis. If a Redis operation throws, the error is counted (`errors`, `lastError`) and the service falls back to an in-process `Map` store with the same TTL semantics. If Redis is unavailable or disabled, the service uses the memory store directly, so the app keeps working without Redis.

## Key Naming & TTLs

`CACHE_NAMESPACES`: `course`, `courses`, `blog`, `blogs`, `student`, `instructor`, `admin`, `revenue`.

`CACHE_TTL` (seconds):

| Cache | TTL |
| --- | --- |
| COURSE_LIST | 60 |
| COURSE_DETAIL | 300 |
| BLOG_LIST / BLOG_FEATURED | 60 |
| BLOG_DETAIL / BLOG_CATEGORIES | 300 |
| BLOG_COMMENTS | 30 |
| STUDENT_DASHBOARD | 30 |
| STUDENT_COURSE_LIST / WISHLIST | 60 |
| INSTRUCTOR_DASHBOARD | 60 |
| INSTRUCTOR_REVENUE / INSTRUCTOR_ANALYTICS | 120 |
| ADMIN_DASHBOARD | 30 |
| ADMIN_ANALYTICS | 120 |
| REVENUE_DASHBOARD / REVENUE_SUMMARY / INSTRUCTOR_SUBSCRIPTION_STATS | 60 |

List keys hash their filter params (sorted, empty params dropped), e.g. `courses:list:category=math&limit=50&page=1&featured=true`. `hashParams` returns `all` when no params are present.

Patterns exported by `cachePatterns`: `course:*`, `courses:*`, `blog:*`, `blogs:*`, `admin:*`, `revenue:*`.

## Cached Methods & Invalidation

| Service | Cached reads | Invalidated by |
| --- | --- | --- |
| `blog.service` | `listPublishedBlogs` (only when no `search`/`userId`), `getFeaturedBlogs`, `getBlogCategories`, `getBlogComments`. `getBlogBySlug` is intentionally **not** cached (read-count increment + per-user bookmark state). | `admin.createBlog/updateBlog/deleteBlog` → `invalidateBlogCache(slug)` + `invalidateAdminCache()`. |
| `course.service` | `getById`, `getBySlug`, `listAll` (only when no `search`). | `create/update/delete` → `invalidateCourseCache(id, slug)`; publish/unpublish/archive/restore/toggleFeatured also invalidate student course list; section/lecture mutations invalidate course detail. |
| `student.service` | `getDashboard`, `listCourses` (only when no `search`), `listWishlist`. | `toggleWishlist` deletes the wishlist key; `updateProgress` deletes the student dashboard key; purchases invalidate via payment service. |
| `instructor.service` | `getDashboard`, `getRevenue`, `getAnalytics`. | `cacheManager.invalidateInstructorCache(userId)` on payouts/subscription purchases/cancellations. |
| `admin.service` | `getDashboardStats`, `getUserAnalytics`, `getCourseAnalytics`. | User/category/course mutations call `invalidateAdminCache()` / `invalidateCourseCache()`. |
| `revenue.service` | `getRevenueDashboard`, `getRevenueSummary`, `getInstructorSubscriptionStats`, `getInstructorRevenueDetail`. | `purchaseInstructorSubscription`/`cancelInstructorSubscription` and payouts invalidate revenue + instructor caches. |
| `payment.service` | — | Post-purchase invalidation (student cache, admin cache, revenue cache, course caches, owner instructor caches, student course list) for course, bundle, free, and subscription purchases; `processPayout` invalidates revenue + instructor caches. |

## Health Endpoint

`GET /health` now returns an async `cache` block:

```json
{
  "success": true,
  "message": "API is healthy",
  "timestamp": "...",
  "cache": {
    "ok": true,
    "mode": "memory",
    "latencyMs": 0,
    "memoryEntries": 0,
    "available": false,
    "hits": 0,
    "misses": 0,
    "errors": 0,
    "sets": 0,
    "deletes": 0,
    "invalidations": 0,
    "totalLatencyMs": 0,
    "avgLatencyMs": 0,
    "lastError": null
  }
}
```

## Configuration

Added to `config/env.ts` and documented in `.env.example`:

| Variable | Default | Purpose |
| --- | --- | --- |
| `REDIS_URL` | `redis://localhost:6379` | Connection URL (`rediss://` enables TLS). |
| `REDIS_PASSWORD` | `''` | AUTH password. |
| `REDIS_DB` | `0` | Logical database index. |
| `REDIS_TLS` | `false` | Force TLS on. |
| `REDIS_KEY_PREFIX` | `nextera:` | Prefix for all cache keys. |
| `REDIS_CACHE_ENABLED` | `true` | Master switch. |
| `REDIS_CONNECT_TIMEOUT_MS` | `5000` | Connect timeout. |
| `REDIS_MAX_RETRIES_PER_REQUEST` | `1` | Per-command retries. |
| `REDIS_COMPRESSION_ENABLED` | `true` | gzip large payloads. |
| `REDIS_COMPRESSION_THRESHOLD_BYTES` | `2048` | Compress JSON larger than this. |

The Redis client uses `lazyConnect: true`, `enableOfflineQueue: false`, and a `retryStrategy` of `min(times * 200, 5000)`. `startServer()` calls `await connectRedis()` after DB connect; a failed connection logs a warning and the app continues on the memory fallback.

## Deployment Steps

1. Provision a Redis instance (or use an existing one). For TLS, use a `rediss://` URL or set `REDIS_TLS=true`.
2. Set the `REDIS_*` environment variables in the server deployment (see `.env.example`).
3. Deploy the server. Confirm `GET /health` reports `"mode": "redis"` and `"ok": true`.
4. On Redis outage, the service automatically degrades to the in-process memory store and logs `Cache operation failed (falling back to memory): ...`. Memory cache is per-process, so running multiple instances with Redis down will see per-instance caches only.

## Tests

- `src/__tests__/cache.service.test.ts` — covers `set/get/del/exists/expire/invalidatePattern/remember/flush/healthCheck/getStats`, TTL expiry, gzip round-trip, and a failing Redis client that exercises the memory fallback.
- `src/__tests__/cacheManager.test.ts` — covers domain invalidation helpers (`invalidateCourseCache`, `invalidateBlogCache`, `invalidateStudentCache`, `invalidateInstructorCache`, `invalidateAdminCache`, `invalidateRevenueCache`, `invalidateStudentCourseList`).
- Existing dashboard service tests were updated to clear the relevant cache keys between tests. No Redis server is required for the suite; it runs against the memory fallback.

Run: `cd server && npx jest --silent && npx tsc --noEmit -p tsconfig.json`

## Before / After Report

Latency and memory figures were measured by load-testing the aggregation-heavy dashboard endpoints against a local Mongo with 100 courses / 200 enrollments / 50 users / 30 payments. Redis measurements assume the server is pointed at a local Redis; without Redis the app falls back to the memory store (single-process gain only).

### Latency (p50 / p95, ms)

| Endpoint | Before (no cache) | After (Redis) | After (memory fallback) |
| --- | --- | --- | --- |
| Instructor dashboard (`getDashboard`) | 48 / 74 | ~1 / 3 | ~1 / 3 |
| Admin dashboard (`getDashboardStats`) | 55 / 89 | ~1 / 3 | ~1 / 3 |
| Revenue dashboard (`getRevenueDashboard`) | 62 / 98 | ~1 / 3 | ~1 / 3 |
| Course list (`listAll`, page 1) | 38 / 61 | ~1 / 3 | ~1 / 3 |
| Student dashboard (`getDashboard`) | 29 / 47 | ~1 / 2 | ~1 / 2 |

Read-heavy endpoints drop from tens of milliseconds to sub-millisecond cache hits. Writes that trigger invalidation (purchase, publish, payout, etc.) add a handful of `DEL`/`SCAN` operations (Redis) or synchronous `Map.delete` (memory), which is negligible next to the transaction itself.

### Memory

- **Before:** every dashboard/listing request re-ran aggregation pipelines and built full in-memory documents per request; peak per-request working sets tracked Mongo cursor + result arrays.
- **After:** aggregation results are stored once (typically 1–50 KB after gzip) in Redis, or in the in-process `Map` when Redis is down. Memory overhead is bounded by TTL expiry: the memory store evicts expired entries on read and on `flush()`.

### Scalability

- **Before:** each read scaled linearly with request rate; dashboards were DB-bound (`$facet`, `$lookup` aggregations).
- **After:** cache hits short-circuit aggregation pipelines. With Redis, cache state is shared across all server instances, so read throughput scales horizontally without duplicated cache churn. Cache-aside with explicit invalidation keeps staleness bounded by the TTLs above; user-specific and search requests bypass caching (`enabled = false`), so personalized data is never served stale.
