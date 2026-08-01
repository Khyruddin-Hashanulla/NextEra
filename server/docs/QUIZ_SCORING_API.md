# Quiz Scoring System API Documentation

## Overview

The Quiz Scoring System provides quiz attempt management, auto-grading, manual grading, analytics, and reporting. This document describes the actual endpoints exposed by the server.

## Authentication

All endpoints require authentication via JWT token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

Endpoints marked **Instructor/Admin** additionally enforce role-based access via the `authorize` middleware. Attempt-level result reads for students are guarded by the `verifyQuizAttemptOwnership` middleware, so a student can only read their own attempts.

## Base URL

```
/api/v1
```

## Quiz Routes

Routes are mounted under `/quiz` in `server/src/routes/index.ts`.

### Student Quiz Flow (any authenticated user)

| Method | Path | Description |
| --- | --- | --- |
| POST | `/quiz/start` | Start a quiz attempt (`startQuizSchema`) |
| POST | `/quiz/start-enhanced` | Start an enhanced quiz attempt (`startQuizSchema`) |
| POST | `/quiz/submit` | Submit quiz answers (`submitQuizSchema`) |
| POST | `/quiz/auto-submit` | Auto-submit an in-progress attempt on timer expiry (`submitQuizSchema`) |
| POST | `/quiz/resume` | Resume an in-progress attempt (`resumeQuizSchema`) |
| GET | `/quiz/overview` | Global quiz overview + stats for the current student |
| GET | `/quiz/attempts/:lectureId` | All attempts for a lecture by the current student |
| GET | `/quiz/attempts/:attemptId/details` | Full attempt detail including per-question results |
| GET | `/quiz/analytics/:lectureId` | Per-lecture analytics for the current student |
| GET | `/quiz/leaderboard/:lectureId` | Leaderboard for a lecture |
| GET | `/quiz/result/:attemptId` | Attempt details for an owned attempt (ownership enforced) |

### Start Quiz

```http
POST /quiz/start
Content-Type: application/json

{
  "courseId": "60d5f2e7b3f5a9b2c8d4e1a3",
  "lectureId": "60d5f3e8c3f5a9b2c8d4e1a4"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Quiz started",
  "data": {
    "attempt": {
      "_id": "60d6fa1b2f3e8b9c4d5e2f3a",
      "user": "60d5f2e7b3f5a9b2c8d4e1a3",
      "course": "60d5f2e7b3f5a9b2c8d4e1a3",
      "lecture": "60d5f3e8c3f5a9b2c8d4e1a4",
      "quizTitle": "Advanced JavaScript",
      "attemptNumber": 1,
      "score": 0,
      "totalMarks": 0,
      "percentage": 0,
      "passed": false,
      "evaluationStatus": "in_progress",
      "evaluationVersion": 1,
      "startedAt": "2026-01-15T10:30:00.000Z"
    },
    "canResume": false
  }
}
```

The same request shape is used by `/quiz/start-enhanced`.

### Submit Quiz

```http
POST /quiz/submit
Content-Type: application/json

{
  "attemptId": "60d6fa1b2f3e8b9c4d5e2f3a",
  "answers": [
    {
      "questionId": "q_001",
      "question": "What is JavaScript?",
      "selectedAnswer": "A programming language"
    }
  ],
  "autoSubmitted": false
}
```

**Response:**

```json
{
  "success": true,
  "message": "Quiz submitted",
  "data": {
    "attempt": {
      "_id": "60d6fa1b2f3e8b9c4d5e2f3a",
      "score": 145,
      "totalMarks": 150,
      "percentage": 96.67,
      "passed": true,
      "passFail": "pass",
      "letterGrade": "A+",
      "correctAnswers": 29,
      "incorrectAnswers": 2,
      "skippedQuestions": 0,
      "evaluationStatus": "auto_graded",
      "submittedAt": "2026-01-15T11:30:00.000Z",
      "completedAt": "2026-01-15T11:30:00.000Z"
    }
  }
}
```

### Get Student Overview

```http
GET /quiz/overview
```

**Response:**

```json
{
  "success": true,
  "message": "Student quiz overview fetched",
  "data": {
    "quizzes": [
      {
        "_id": "60d6fa1b2f3e8b9c4d5e2f3a",
        "title": "Advanced JavaScript",
        "attemptNumber": 1,
        "score": 145,
        "totalMarks": 150,
        "percentage": 96.67,
        "passed": true,
        "letterGrade": "A+",
        "correctAnswers": 29,
        "totalQuestions": 30,
        "evaluationStatus": "published",
        "startedAt": "2026-01-15T10:30:00.000Z",
        "submittedAt": "2026-01-15T11:30:00.000Z"
      }
    ],
    "stats": {
      "totalAttempts": 5,
      "averageScore": "90.2",
      "passedCount": 4,
      "latestAttempt": { "attemptId": "60d6fa1b2f3e8b9c4d5e2f3a", "attemptNumber": 5, "percentage": 96.67 },
      "bestAttempt": { "attemptId": "60d6fa1b2f3e8b9c4d5e2f3a", "attemptNumber": 5, "percentage": 96.67 },
      "scoreHistory": [
        { "attemptNumber": 1, "percentage": 88, "completedAt": "2026-01-10T10:00:00.000Z" }
      ],
      "attemptDistribution": { "1": 1, "2": 1, "3": 1 }
    }
  }
}
```

### Instructor / Admin Grading

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| PUT | `/quiz/manual-grade/:attemptId` | Instructor/Admin | Override grade with feedback, letter grade, rubric, publish flag (`overrideGradeSchema`) |
| PUT | `/quiz/publish/:attemptId` | Instructor/Admin | Publish a grade |

### Instructor / Admin Analytics

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| GET | `/quiz/instructor/analytics/:lectureId` | Instructor/Admin | Quiz analytics for a lecture |
| GET | `/quiz/instructor/questions/:lectureId` | Instructor/Admin | Per-question statistics |
| GET | `/quiz/instructor/export/:attemptId` | Instructor/Admin | CSV export data for an attempt |
| POST | `/quiz/instructor/invalidate/:lectureId` | Instructor/Admin | Invalidate cached analytics |

### Admin Analytics

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| GET | `/quiz/admin/analytics` | Admin | Platform-wide quiz analytics (optional `?courseId=` filter) |

## Evaluation Status Flow

An attempt moves through the following `evaluationStatus` values:

- `in_progress` — attempt started, answers not yet submitted
- `auto_graded` — submitted and fully auto-graded
- `pending` — contains coding/essay questions awaiting manual review
- `graded` — manually graded (or updated after review)
- `published` — grade published and visible to the student

## Scoring Behavior

- **single / boolean**: exact (case-insensitive) match.
- **multiple**: exact set match for full credit; if partial marking is enabled, credit is proportional to correct selections.
- **fill_blank**: matches against one or more accepted answers; optional similarity-based partial credit.
- **matching**: per-pair matching with optional proportional partial credit.
- **coding / essay**: never auto-graded; flagged `pending` for manual review.
- **negative marking**: applied to incorrect answers when the lecture enables it (never below zero).
- **bonus questions**: excluded from `totalMarks` while still adding to the score.
- **pass/fail and letter grade** are derived via `computePercentage`, `computePassFail`, and `computeLetterGrade` from `server/src/utils/grading.ts`.

## Error Responses

All errors use the shared error handler:

```json
{
  "success": false,
  "message": "<error message>"
}
```

- **400** — validation or business-rule failures (e.g. cooldown not elapsed, attempt not eligible)
- **401** — missing/invalid token
- **403** — authenticated but forbidden for the role
- **404** — resource not found

## Testing

API route tests live in `server/src/__tests__/quiz.api.test.ts` and scoring-engine unit tests in `server/src/__tests__/quizScoring.service.test.ts`.

Run the suite with:

```bash
cd server && npx jest
```
