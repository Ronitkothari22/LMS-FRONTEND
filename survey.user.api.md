# Survey Module – **User-Side** REST API

These endpoints are intended for *employees/participants* who take surveys. Administrative routes such as survey creation, question management, and analytics are **not** included here.

## Base URL

```
https://<your-domain>/api
```

All routes require a valid JWT access token in the `Authorization` header:

```
Authorization: Bearer <token>
```

---

## Table of Contents

1. [List Assigned Surveys](#1-list-assigned-surveys)
2. [Get Survey Details](#2-get-survey-details)
3. [Submit Survey Response](#3-submit-survey-response)
4. [Get My Survey Responses](#4-get-my-survey-responses)
5. [Common Error Format](#common-error-format)

---

## 1. List Assigned Surveys

Retrieve every survey associated with the current session that the user can take.

| Method | URL |
|--------|-----|
| GET | `/sessions/{sessionId}/surveys` |

### Path Parameters
| Name | Type | Description |
|------|------|-------------|
| `sessionId` | `string (uuid)` | ID of the session in which the surveys were created |

### Success — 200 OK
```json
{
  "success": true,
  "message": "Surveys retrieved successfully",
  "data": [
    {
      "id": "12c1c9fc-a1c3-4602-9e1d-bc4f1f4a23d8",
      "title": "Employee Satisfaction – Q2",
      "description": "Quarterly pulse survey for all employees",
      "status": "ACTIVE",
      "startDate": "2024-06-01T00:00:00.000Z",
      "endDate": "2024-06-15T23:59:59.000Z",
      "isAnonymous": true,
      "isOptional": true,
      "allowMultipleResponses": false
    }
  ]
}
```

---

## 2. Get Survey Details

Retrieve full metadata and questions for a single survey so the user can render it.

| Method | URL |
|--------|-----|
| GET | `/surveys/{id}` |

### Path Parameters
| Name | Type | Description |
|------|------|-------------|
| `id` | `string (uuid)` | Survey ID |

### Success — 200 OK
```json
{
  "success": true,
  "message": "Survey retrieved successfully",
  "data": {
    "id": "12c1c9fc-a1c3-4602-9e1d-bc4f1f4a23d8",
    "title": "Employee Satisfaction – Q2",
    "description": "Quarterly pulse survey for all employees",
    "questions": [
      {
        "id": "q-uuid-1",
        "questionText": "How satisfied are you with your role?",
        "questionType": "RATING_SCALE",
        "options": null,
        "orderIndex": 1,
        "isRequired": true
      }
    ],
    "startDate": "2024-06-01T00:00:00.000Z",
    "endDate": "2024-06-15T23:59:59.000Z",
    "isAnonymous": true,
    "settings": {
      "reminders": true
    }
  }
}
```

---

## 3. Submit Survey Response

Post answers for a survey. The backend enforces **one response per user per survey**, so duplicate submissions will be rejected.

| Method | URL |
|--------|-----|
| POST | `/survey-responses` |

### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Request Body
```json
{
  "surveyId": "12c1c9fc-a1c3-4602-9e1d-bc4f1f4a23d8",
  "responses": [
    {
      "questionId": "q-uuid-1",
      "responseValue": 4  // rating scale value
    },
    {
      "questionId": "q-uuid-2",
      "responseValue": "I feel valued at work"
    }
  ]
}
```

### Success — 201 Created
```json
{
  "success": true,
  "message": "Survey response submitted successfully",
  "data": {
    "id": "resp-uuid",
    "surveyId": "12c1c9fc-a1c3-4602-9e1d-bc4f1f4a23d8",
    "submittedAt": "2024-06-05T12:00:00.000Z",
    "questionResponses": [
      {
        "questionId": "q-uuid-1",
        "responseValue": 4
      }
    ]
  }
}
```

---

## 4. Get My Survey Responses

Allows a user to view their own survey submissions. Optional query param `sessionId` filters responses by session.

| Method | URL |
|--------|-----|
| GET | `/users/{userId}/survey-responses?sessionId={optional}` |

### Path Parameters
| Name | Type | Description |
|------|------|-------------|
| `userId` | `string (uuid)` | The authenticated user’s ID. (Admins can supply other IDs, but in user context this will be the user’s own ID.) |

### Query Parameters
| Name | Type | Description |
|------|------|-------------|
| `sessionId` | `string (uuid)` | (Optional) Restrict to a given session |

### Success — 200 OK
```json
{
  "success": true,
  "message": "User survey responses retrieved successfully",
  "data": [
    {
      "id": "resp-uuid",
      "surveyId": "12c1c9fc-a1c3-4602-9e1d-bc4f1f4a23d8",
      "submittedAt": "2024-06-05T12:00:00.000Z",
      "questionResponses": [ /* ... */ ]
    }
  ]
}
```

---

## Common Error Format

All error responses share the same shape:

```json
{
  "success": false,
  "message": "Human-readable error",
  "error": "Detailed server error when available"
}
```

---

## Changelog

| Date       | Version | Author | Notes |
|------------|---------|--------|-------|
| 2025-07-07 | 1.0     | Docs-Bot | Initial user-side API reference | 