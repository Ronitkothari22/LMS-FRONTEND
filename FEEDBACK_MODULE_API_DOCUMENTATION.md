# Feedback Module API Documentation

## Overview

The Feedback Module provides a comprehensive system for collecting, managing, and analyzing feedback from session participants. It supports multiple feedback forms per session with flexible question types, anonymous responses, and detailed analytics.

## Base URL
```
/api/feedback
```

## Authentication

All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

- **Admin Required**: Endpoints marked with 🔒 require admin role
- **User Required**: Regular authenticated users (session participants)

## Data Models

### Feedback Form
```typescript
interface Feedback {
  id: string;
  title: string;
  description?: string;
  sessionId: string;
  isActive: boolean;
  isAnonymous: boolean;
  questions: FeedbackQuestion[];
  createdAt: string;
  updatedAt: string;
}
```

### Feedback Question
```typescript
interface FeedbackQuestion {
  id: string;
  feedbackId: string;
  question: string;
  type: 'SMILEY_SCALE' | 'TEXT';
  isRequired: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}
```

### Feedback Response
```typescript
interface FeedbackResponse {
  id: string;
  feedbackId: string;
  questionId: string;
  userId: string;
  rating?: 'VERY_POOR' | 'POOR' | 'AVERAGE' | 'GOOD' | 'EXCELLENT';
  textAnswer?: string;
  isAnonymous: boolean;
  createdAt: string;
}
```

## Enums

### Feedback Type
```typescript
enum FeedbackType {
  SMILEY_SCALE = 'SMILEY_SCALE', // 5-point smiley scale (default)
  TEXT = 'TEXT' // Open text response
}
```

### Smiley Rating
```typescript
enum SmileyRating {
  VERY_POOR = 'VERY_POOR',     // 1 - 😞
  POOR = 'POOR',               // 2 - 😟
  AVERAGE = 'AVERAGE',         // 3 - 😐
  GOOD = 'GOOD',               // 4 - 😊
  EXCELLENT = 'EXCELLENT'      // 5 - 😁
}
```

---

## API Endpoints

### 1. Create Feedback Form 🔒

Create a new feedback form for a session.

**Endpoint:** `POST /api/feedback/:sessionId`

**Authentication:** Admin required

**Parameters:**
- `sessionId` (UUID): Session ID in URL path

**Request Body:**
```json
{
  "title": "Session Feedback Form",
  "description": "Please provide your feedback about this session",
  "isAnonymous": false,
  "questions": [
    {
      "question": "How would you rate the overall session quality?",
      "type": "SMILEY_SCALE",
      "isRequired": true
    },
    {
      "question": "How engaging was the presenter?",
      "type": "SMILEY_SCALE",
      "isRequired": true
    },
    {
      "question": "Any additional comments or suggestions?",
      "type": "TEXT",
      "isRequired": false
    }
  ]
}
```

**Validation Rules:**
- `title`: Required, 1-255 characters
- `description`: Optional string
- `isAnonymous`: Optional boolean, defaults to false
- `questions`: Array of 1-20 questions
- `questions[].question`: Required, 1-500 characters
- `questions[].type`: Optional, defaults to 'SMILEY_SCALE'
- `questions[].isRequired`: Optional, defaults to true

**Success Response (201):**
```json
{
  "success": true,
  "message": "Feedback form created successfully",
  "data": {
    "id": "feedback-uuid",
    "title": "Session Feedback Form",
    "description": "Please provide your feedback about this session",
    "sessionId": "session-uuid",
    "isActive": true,
    "isAnonymous": false,
    "questions": [
      {
        "id": "question-uuid-1",
        "question": "How would you rate the overall session quality?",
        "type": "SMILEY_SCALE",
        "isRequired": true,
        "order": 1
      },
      {
        "id": "question-uuid-2",
        "question": "How engaging was the presenter?",
        "type": "SMILEY_SCALE",
        "isRequired": true,
        "order": 2
      },
      {
        "id": "question-uuid-3",
        "question": "Any additional comments or suggestions?",
        "type": "TEXT",
        "isRequired": false,
        "order": 3
      }
    ],
    "session": {
      "title": "Session Title",
      "state": "ACTIVE"
    },
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Not admin user
- `404 Not Found`: Session not found

---

### 2. Get Feedback Forms

Get all feedback forms for a session with submission status.

**Endpoint:** `GET /api/feedback/:sessionId`

**Authentication:** User required (session participant or admin)

**Parameters:**
- `sessionId` (UUID): Session ID in URL path

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "feedback-uuid",
      "title": "Session Feedback Form",
      "description": "Please provide your feedback about this session",
      "sessionId": "session-uuid",
      "isActive": true,
      "isAnonymous": false,
      "questions": [
        {
          "id": "question-uuid-1",
          "question": "How would you rate the overall session quality?",
          "type": "SMILEY_SCALE",
          "isRequired": true,
          "order": 1
        },
        {
          "id": "question-uuid-2",
          "question": "Any additional comments?",
          "type": "TEXT",
          "isRequired": false,
          "order": 2
        }
      ],
      "session": {
        "title": "Session Title",
        "state": "ACTIVE",
        "participants": []
      },
      "hasSubmitted": false,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Not a session participant or admin
- `404 Not Found`: No feedback forms found for session

---

### 3. Submit Feedback Response

Submit responses to a feedback form.

**Endpoint:** `POST /api/feedback/:sessionId/submit`

**Authentication:** User required (session participant)

**Parameters:**
- `sessionId` (UUID): Session ID in URL path

**Request Body:**
```json
{
  "feedbackId": "feedback-uuid",
  "responses": [
    {
      "questionId": "question-uuid-1",
      "rating": "EXCELLENT"
    },
    {
      "questionId": "question-uuid-2",
      "rating": "GOOD"
    },
    {
      "questionId": "question-uuid-3",
      "textAnswer": "Great session! The content was very informative and well-structured."
    }
  ]
}
```

**Validation Rules:**
- `feedbackId`: Required UUID
- `responses`: Array of responses, minimum 1
- `responses[].questionId`: Required UUID
- `responses[].rating`: Optional, valid SmileyRating enum value
- `responses[].textAnswer`: Optional string, max 1000 characters
- Each response must have either `rating` or `textAnswer`
- All required questions must be answered

**Success Response (201):**
```json
{
  "success": true,
  "message": "Feedback submitted successfully",
  "data": {
    "responseCount": 3,
    "submittedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid request data, missing required responses, or already submitted
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Not a session participant
- `404 Not Found`: Feedback form not found

---

### 4. Get Feedback Results 🔒

Get comprehensive feedback results and analytics for a session.

**Endpoint:** `GET /api/feedback/:sessionId/results`

**Authentication:** Admin required

**Parameters:**
- `sessionId` (UUID): Session ID in URL path

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "session": {
      "title": "Session Title"
    },
    "feedbackForms": [
      {
        "feedback": {
          "id": "feedback-uuid",
          "title": "Session Feedback Form",
          "description": "Please provide your feedback about this session",
          "isAnonymous": false,
          "createdAt": "2024-01-15T10:00:00.000Z"
        },
        "statistics": {
          "totalParticipants": 50,
          "totalResponseCount": 35,
          "responseRate": 70.0
        },
        "questionResults": [
          {
            "questionId": "question-uuid-1",
            "question": "How would you rate the overall session quality?",
            "type": "SMILEY_SCALE",
            "responseCount": 35,
            "ratingCounts": {
              "VERY_POOR": 2,
              "POOR": 3,
              "AVERAGE": 8,
              "GOOD": 15,
              "EXCELLENT": 7
            },
            "averageRating": 3.63,
            "responses": [
              {
                "user": {
                  "id": "user-uuid",
                  "name": "John Doe",
                  "email": "john@example.com"
                },
                "rating": "GOOD",
                "submittedAt": "2024-01-15T10:30:00.000Z"
              }
            ]
          },
          {
            "questionId": "question-uuid-2",
            "question": "Any additional comments?",
            "type": "TEXT",
            "responseCount": 25,
            "responses": [
              {
                "user": {
                  "id": "user-uuid",
                  "name": "John Doe",
                  "email": "john@example.com"
                },
                "textAnswer": "Great session! Very informative.",
                "submittedAt": "2024-01-15T10:30:00.000Z"
              }
            ]
          }
        ]
      }
    ]
  }
}
```

**Note:** When `isAnonymous` is true, user information is not included in responses.

**Error Responses:**
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Not admin user
- `404 Not Found`: No feedback forms found for session

---

### 5. Update Feedback Form 🔒

Update properties of an existing feedback form.

**Endpoint:** `PUT /api/feedback/:sessionId`

**Authentication:** Admin required

**Parameters:**
- `sessionId` (UUID): Session ID in URL path

**Request Body:**
```json
{
  "feedbackId": "feedback-uuid",
  "title": "Updated Session Feedback Form",
  "description": "Updated description for the feedback form",
  "isActive": true,
  "isAnonymous": true
}
```

**Validation Rules:**
- `feedbackId`: Required UUID
- `title`: Optional string, 1-255 characters
- `description`: Optional string
- `isActive`: Optional boolean
- `isAnonymous`: Optional boolean

**Success Response (200):**
```json
{
  "success": true,
  "message": "Feedback form updated successfully",
  "data": {
    "id": "feedback-uuid",
    "title": "Updated Session Feedback Form",
    "description": "Updated description for the feedback form",
    "sessionId": "session-uuid",
    "isActive": true,
    "isAnonymous": true,
    "questions": [
      {
        "id": "question-uuid-1",
        "question": "How would you rate the overall session quality?",
        "type": "SMILEY_SCALE",
        "isRequired": true,
        "order": 1
      }
    ],
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid request data or feedback doesn't belong to session
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Not admin user
- `404 Not Found`: Feedback form not found

---

### 6. Delete Feedback Form 🔒

Delete a feedback form and all associated responses.

**Endpoint:** `DELETE /api/feedback/:sessionId`

**Authentication:** Admin required

**Parameters:**
- `sessionId` (UUID): Session ID in URL path

**Request Body:**
```json
{
  "feedbackId": "feedback-uuid"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Feedback form deleted successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid request data or feedback doesn't belong to session
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Not admin user
- `404 Not Found`: Feedback form not found

---

## Question Management APIs

### 7. Add Question to Feedback Form 🔒

Add a new question to an existing feedback form.

**Endpoint:** `POST /api/feedback/:sessionId/questions`

**Authentication:** Admin required

**Parameters:**
- `sessionId` (UUID): Session ID in URL path

**Request Body:**
```json
{
  "feedbackId": "feedback-uuid",
  "question": "How would you rate the session content?",
  "type": "SMILEY_SCALE",
  "isRequired": true,
  "order": 3
}
```

**Validation Rules:**
- `feedbackId`: Required UUID
- `question`: Required string, 1-500 characters
- `type`: Optional, defaults to 'SMILEY_SCALE'
- `isRequired`: Optional, defaults to true
- `order`: Optional, auto-calculated if not provided

**Success Response (201):**
```json
{
  "success": true,
  "message": "Question added successfully",
  "data": {
    "id": "question-uuid",
    "feedbackId": "feedback-uuid",
    "question": "How would you rate the session content?",
    "type": "SMILEY_SCALE",
    "isRequired": true,
    "order": 3,
    "createdAt": "2024-01-15T11:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid data, feedback has responses, or feedback doesn't belong to session
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Not admin user
- `404 Not Found`: Feedback form not found

---

### 8. Update Feedback Question 🔒

Update an existing feedback question.

**Endpoint:** `PUT /api/feedback/:sessionId/questions/:questionId`

**Authentication:** Admin required

**Parameters:**
- `sessionId` (UUID): Session ID in URL path
- `questionId` (UUID): Question ID in URL path

**Request Body:**
```json
{
  "question": "Updated question text",
  "type": "TEXT",
  "isRequired": false,
  "order": 2
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Question updated successfully",
  "data": {
    "id": "question-uuid",
    "feedbackId": "feedback-uuid",
    "question": "Updated question text",
    "type": "TEXT",
    "isRequired": false,
    "order": 2,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid data, question has responses, or doesn't belong to session
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Not admin user
- `404 Not Found`: Question not found

---

### 9. Delete Feedback Question 🔒

Delete a feedback question.

**Endpoint:** `DELETE /api/feedback/:sessionId/questions/:questionId`

**Authentication:** Admin required

**Parameters:**
- `sessionId` (UUID): Session ID in URL path
- `questionId` (UUID): Question ID in URL path

**Success Response (200):**
```json
{
  "success": true,
  "message": "Question deleted successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Last question in form, question has responses, or doesn't belong to session
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Not admin user
- `404 Not Found`: Question not found

---

### 10. Reorder Feedback Questions 🔒

Reorder questions in a feedback form.

**Endpoint:** `PUT /api/feedback/:sessionId/reorder-questions`

**Authentication:** Admin required

**Parameters:**
- `sessionId` (UUID): Session ID in URL path

**Request Body:**
```json
{
  "feedbackId": "feedback-uuid",
  "questionOrders": [
    {
      "questionId": "question-uuid-1",
      "order": 2
    },
    {
      "questionId": "question-uuid-2",
      "order": 1
    },
    {
      "questionId": "question-uuid-3",
      "order": 3
    }
  ]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Questions reordered successfully",
  "data": {
    "id": "feedback-uuid",
    "title": "Session Feedback Form",
    "questions": [
      {
        "id": "question-uuid-2",
        "question": "Question 2",
        "order": 1
      },
      {
        "id": "question-uuid-1",
        "question": "Question 1",
        "order": 2
      },
      {
        "id": "question-uuid-3",
        "question": "Question 3",
        "order": 3
      }
    ]
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid data, missing questions, has responses, or doesn't belong to session
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Not admin user
- `404 Not Found`: Feedback form not found

---

## Common Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

**HTTP Status Codes:**
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## Implementation Notes

### Frontend Integration Guidelines

1. **Authentication**: Include JWT token in all requests
2. **Question Types**: Handle both SMILEY_SCALE and TEXT question types
3. **Validation**: Implement client-side validation matching API rules
4. **Error Handling**: Handle all error states gracefully
5. **Anonymous Feedback**: Respect anonymous feedback settings
6. **Real-time Updates**: Consider implementing real-time updates for active feedback forms

### UI/UX Considerations

1. **Smiley Scale**: Implement intuitive emoji-based rating system
2. **Progress Indicators**: Show completion progress for multi-question forms
3. **Responsive Design**: Ensure forms work well on all devices
4. **Accessibility**: Implement proper ARIA labels and keyboard navigation
5. **Loading States**: Show loading indicators during API calls

### Security Considerations

1. **Rate Limiting**: Implement rate limiting for form submissions
2. **Input Sanitization**: Sanitize text inputs to prevent XSS
3. **CSRF Protection**: Implement CSRF tokens for form submissions
4. **Session Management**: Properly handle session expiration

### Performance Optimization

1. **Caching**: Cache feedback forms and results appropriately
2. **Pagination**: Implement pagination for large result sets
3. **Lazy Loading**: Load feedback results on demand
4. **Debouncing**: Debounce auto-save functionality

---

## Testing

### Test Cases to Implement

1. **Form Creation**: Test creating feedback forms with various configurations
2. **Question Management**: Test adding, updating, deleting, and reordering questions
3. **Response Submission**: Test submitting responses with different question types
4. **Validation**: Test all validation rules and error scenarios
5. **Analytics**: Test feedback results and statistics calculations
6. **Permissions**: Test admin vs user permissions
7. **Anonymous Feedback**: Test anonymous feedback functionality
8. **Edge Cases**: Test edge cases like empty forms, invalid data, etc.

### Sample Test Data

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "feedbackId": "660e8400-e29b-41d4-a716-446655440000",
  "questionId": "770e8400-e29b-41d4-a716-446655440000",
  "userId": "880e8400-e29b-41d4-a716-446655440000"
}
```

---

## Changelog

### Version 1.0
- Initial feedback module implementation
- Support for multiple feedback forms per session
- Smiley scale and text question types
- Anonymous feedback support
- Comprehensive analytics and reporting
- Question management APIs

---

This documentation provides complete implementation details for the feedback module. For any questions or clarifications, please refer to the source code or contact the development team. 