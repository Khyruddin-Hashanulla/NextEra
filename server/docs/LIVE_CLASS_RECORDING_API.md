# Live Class Recording Storage API Documentation

## Overview

Live class recordings are automatically synced from Zoom cloud recordings into the LMS. When a scheduled live class ends and its cloud recording is processed, Zoom fires a webhook. The server verifies the webhook signature, matches the recording to the corresponding Live Class, and stores recording **metadata only** (no binaries, no server-side downloads) in MongoDB. Instructors can manage recordings, enrolled students can watch them inside the course player, and admins can search/delete any recording.

```
Zoom (cloud recording ready)
        │  POST /api/v1/live-classes/webhook/zoom  (signed with ZOOM_WEBHOOK_SECRET)
        ▼
Express raw-body route (mounted BEFORE express.json())
        │  verifyZoomWebhookSignature()  (HMAC-SHA256 + replay-window check)
        ▼
liveClassService.handleZoomRecordingWebhook(payload)   (idempotent, transactional)
        │
        ▼
LiveClassRecording (metadata)  ──►  Instructor UI / Student course player / Admin console
```

## Authentication & RBAC

- **Webhook endpoint**: no JWT. Verified by Zoom signature (`x-zm-signature` + `x-zm-request-timestamp`).
- **All other endpoints**: require `Authorization: Bearer <jwt>`.
- **Instructor endpoints**: `instructor` or `admin` role. Ownership of a live class/recording is enforced in the service (`instructorId` of the class must match the caller, or caller is admin).
- **Student endpoints**: any authenticated user; recordings are scoped to the student's **enrolled courses** (`Enrollment`). If `courseId` is provided it must be an enrolled course, otherwise an empty result is returned.
- **Admin endpoints**: `admin` role only (mounted under the existing admin router which also applies `auditMiddleware`).

## Base URL

```
/api/v1
```

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `ZOOM_ACCOUNT_ID` | for sync | Zoom Server-to-Server OAuth account id |
| `ZOOM_CLIENT_ID` | for sync | Zoom OAuth client id |
| `ZOOM_CLIENT_SECRET` | for sync | Zoom OAuth client secret |
| `ZOOM_WEBHOOK_SECRET` | for webhook | Secret token used to sign Zoom webhooks (set in Zoom app dashboard) |

Add `ZOOM_WEBHOOK_SECRET` to `server/.env` and register the webhook URL `https://<server>/api/v1/live-classes/webhook/zoom` in the Zoom app (Event subscription: `recording.ready`, `recording.file.completed`, `recording.deleted`, etc.). The webhook receives a verification POST with `endpoint.url_validation` on registration; the server replies with the encrypted token automatically.

## Data Model — `LiveClassRecording`

`server/src/models/liveClassRecording.model.ts`

| Field | Type | Notes |
| --- | --- | --- |
| `liveClass` | ObjectId ref `LiveClass` | required, indexed |
| `course` | ObjectId ref `Course` | required, indexed |
| `instructor` | ObjectId ref `User` | required, indexed |
| `title` / `description` / `topic` | string | metadata |
| `url` | string | primary play URL (set = `play_url`), used by existing UIs |
| `playUrl` / `downloadUrl` | string | Zoom `play_url` / `download_url` (empty when download disabled) |
| `password` | string | meeting passcode if any |
| `duration` | number | seconds |
| `fileSize` | number | bytes |
| `format` | string | file type (e.g. `MP4`) |
| `zoomRecordingId` | string | Zoom recording file id (dedupe key), indexed |
| `meetingId` | string | Zoom meeting UUID/number this file belongs to |
| `hostId` | string | Zoom host id |
| `recordingStart` / `recordingEnd` | Date | optional |
| `status` | enum | `pending` \| `processing` \| `completed` \| `failed` \| `deleted` (+ legacy `available`) |
| `views` / `downloadable` / `thumbnailUrl` | mixed | existing fields retained |

Compound indexes: `{ liveClass, status }`, `{ course, status }`, `{ instructor, createdAt }`, `{ zoomRecordingId }`.

> **Legacy status:** records created before the status model used `available`. The enum keeps `available` for backward compatibility and completed-recording queries match both `completed` and `available` (`COMPLETED_RECORDING_STATUSES`), so existing recordings stay visible. New records use the five standard statuses.

## Webhook Endpoint

```
POST /live-classes/webhook/zoom
Content-Type: application/json
x-zm-signature: <base64(HMAC-SHA256(ZOOM_WEBHOOK_SECRET, `${timestamp}.${rawBody}`))>
x-zm-request-timestamp: <unix time, ms or seconds>
```

The route is mounted **before** `express.json()` in `app.ts` so the raw body is available for signature verification, and is exempt from CSRF via `skipCsrfProtection` in `server/src/config/csrf.ts`. A dedicated rate limiter (`zoomWebhookLimiter`) is applied.

**Verification** (`server/src/utils/zoomWebhook.ts`):

1. Signature must be present and match `base64(HMAC-SHA256(secret, `${timestamp}.${rawBody}`))` (constant-time compare).
2. Timestamp must be within a 5-minute window (replay protection). Both millisecond and second epoch formats are accepted.

On failure the endpoint responds `401`. On success:

- `endpoint.url_validation` → responds with the plain JSON `{ "encryptedToken": "..." }` required by Zoom (no wrapper).
- Recording events → processed by `handleZoomRecordingWebhook` and acknowledged with `200`.

**Handled events**

| Event | Behaviour |
| --- | --- |
| `endpoint.url_validation` | return `{ encryptedToken }` |
| `recording.ready`, `recording.completed`, `recording.file.completed` | upsert recording files (dedupe by `zoomRecordingId`) |
| `recording.deleted`, `recording.trashed` | mark matching recordings `deleted` |
| `recording.paused` / `recording.resumed` / `recording.started` | acknowledged, no DB change |
| other | acknowledged and ignored |

**Idempotency:** each webhook event (`event_id`) is recorded in `WebhookEvent` (unique index) inside the same transaction as the recording upsert. Re-delivered events are acknowledged without side effects. Per-file dedupe uses `zoomRecordingId` (`findOne` before insert/update inside the transaction).

**Matching:** the payload's meeting identifiers (`object.id`, `object.uuid`, and each file's `meeting_id`) are matched against `LiveClass.zoomMeetingId`. Unknown meetings are logged and acknowledged.

## Instructor & Admin REST API

### Instructor (role: instructor | admin)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/live-classes/instructor/recordings` | List own recordings (paginated) |
| POST | `/live-classes/instructor/recordings` | Manually add a recording (existing) |
| POST | `/live-classes/instructor/recordings/sync` | Re-sync recordings for a live class from Zoom |
| GET | `/live-classes/instructor/recordings/:id` | Get one recording (ownership enforced) |
| DELETE | `/live-classes/instructor/recordings/:id` | Delete own recording (existing) |

**Sync request:**

```json
{ "liveClassId": "60d5f2e7b3f5a9b2c8d4e1a3" }
```

Sync fetches `GET https://api.zoom.us/v2/meetings/{meetingId}/recordings` (Server-to-Server OAuth) and upserts all completed files transactionally. Responds `400` if Zoom integration is not configured or Zoom returns an error, `403` if the class belongs to another instructor.

### Student (any authenticated user)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/live-classes/student/recordings` | Recordings across enrolled courses (paginated) |
| GET | `/live-classes/student/recordings?courseId=...` | Recordings for one enrolled course (empty if not enrolled) |
| POST | `/live-classes/recordings/:id/view` | Increment view count (existing) |

### Admin (role: admin)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/admin/recordings` | List all recordings; filters: `courseId`, `instructorId`, `status`, `search` (title/topic/meeting id), `page`, `limit` |
| GET | `/admin/recordings/:id` | Get any recording |
| POST | `/admin/recordings/sync` | Re-sync any live class from Zoom |
| DELETE | `/admin/recordings/:id` | Delete any recording (audited, `RECORDING_DELETED`) |

All admin list/get/delete endpoints are registered under the existing admin router (`server/src/routes/admin.routes.ts`) which enforces `authorize(ROLES.ADMIN)` and `auditMiddleware`.

## Frontend Changes

- `client/src/types/liveClass.ts` — `LiveClassRecording` extended with `meetingId`, `hostId`, `topic`, `playUrl`, `downloadUrl`, `recordingStart/End`, and the new status union.
- `client/src/api/endpoints/liveClass.ts` — added `syncRecordings`, `getInstructorRecording`, and `courseId` param on `listStudentRecordings`.
- `client/src/api/endpoints/admin.ts` — added `listRecordings`, `getRecording`, `syncRecording`, `deleteRecording`.
- Instructor `LiveClassesPage.tsx` — recordings tab shows friendly status labels, a per-recording **Refresh from Zoom** action, Watch and Delete.
- Student `CoursePlayerPage.tsx` — new **Live Recordings** section listing recordings for the current course with Watch links (view counted on click).
- Admin — new `RecordingManagementPage` (search, status filter, pagination, delete) at route `/admin/recordings`, wired into `routes/index.tsx`, `AdminSidebar`, and `ROUTES.ADMIN_RECORDINGS`.

## Security Considerations

- Webhook signature verified against the **raw** body with constant-time comparison; replay window enforced.
- Webhook path is CSRF-exempt only for that exact route and rate-limited.
- Recording metadata contains only URLs; play/download URLs come from Zoom and are protected by Zoom's own auth. No video binaries stored.
- Student access is enrollment-scoped server-side (never trusts a client-provided `courseId`).
- Instructor ownership verified in the service; admin deletes are audited.
- Search input is regex-escaped (`escapeRegex`) before use in queries.

## Error Handling

Standard `ApiError` responses (`400`, `401`, `403`, `404`) with a consistent `{ success, message }` envelope. Webhook failures are logged; unknown/unmatched events are acknowledged (never retried into a loop).

## Testing

New test files in `server/src/__tests__/`:

- `zoomWebhook.test.ts` — signature verification, tamper, replay window, missing headers.
- `liveClassRecording.service.test.ts` — idempotency (duplicate event), unmatched meeting, upsert/dedupe, delete-marking, `endpoint.url_validation`, non-completed file skipping.
- `liveClassRecording.api.test.ts` — RBAC (instructor/student/admin/anon) for all new endpoints, validator 400s, and webhook route acceptance/rejection (valid, invalid, missing, stale signatures; url validation response).

Run: `npx jest --silent` (server) and `npx tsc -b` / `npx vitest run` / `npx vite build` (client).
