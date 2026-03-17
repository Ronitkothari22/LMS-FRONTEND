# Joining Dots Backend API Documentation

This document provides detailed information about the Session and Quiz features in the Joining Dots backend, including all related APIs.

## Table of Contents

- [Sessions](#sessions)
  - [Session Model](#session-model)
  - [Session APIs](#session-apis)
- [Quizzes](#quizzes)
  - [Quiz Model](#quiz-model)
  - [Question Model](#question-model)
  - [Quiz Response Model](#quiz-response-model)
  - [Quiz APIs](#quiz-apis)
- [Dashboard](#dashboard)
  - [Dashboard API](#dashboard-api)

## Sessions

### Session Model

The Session model represents interactive sessions that can contain quizzes, polls, and other content.

```typescript
model Session {
  id              String       @id @default(uuid())
  title           String
  description     String?
  state           SessionState @default(UPCOMING) // Session status
  participants    User[]       @relation("SessionParticipants") // Users who joined
  invited         User[]       @relation("SessionInvited") // Invited users
  invitedEmails   String[] // Store all invited email addresses
  joiningCode     String?      @unique // Unique code for joining
  qrCode          String? // URL to generated QR code
  startTime       DateTime?
  endTime         DateTime? // When the session ends
  expiryDate      DateTime? // When the joining code expires
  maxParticipants Int? // Maximum number of participants
  allowGuests     Boolean     @default(false) // Allow guests or not
  isActive        Boolean     @default(true) // Tracks if session is active
  createdBy       User        @relation("SessionCreatedBy", fields: [createdById], references: [id])
  createdById     String
  quizzes         Quiz[]      @relation("SessionQuizzes")
  // Other fields omitted for brevity
}

enum SessionState {
  UPCOMING
  LIVE
  COMPLETED
  CANCELLED
}
```

### Session APIs

#### Create Session (Admin only)

- **Endpoint**: `POST /api/sessions`
- **Authentication**: Required (Admin)
- **Request Body**:
  ```json
  {
    "title": "Session Title",
    "allowGuests": true,
    "participants": ["user1@example.com", "user2@example.com"],
    "startTime": "2023-06-01T10:00:00Z",
    "endTime": "2023-06-01T12:00:00Z"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Session created successfully",
    "data": {
      "id": "uuid",
      "title": "Session Title",
      "joiningCode": "ABC123",
      "allowGuests": true,
      "startTime": "2023-06-01T10:00:00Z",
      "endTime": "2023-06-01T12:00:00Z",
      "state": "UPCOMING",
      "isActive": true
    }
  }
  ```

#### Get All Sessions

- **Endpoint**: `GET /api/sessions`
- **Authentication**: Required
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `state`: Filter by session state (UPCOMING, LIVE, COMPLETED, CANCELLED)
  - `isActive`: Filter by active status (true/false)
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "sessions": [
        {
          "id": "uuid",
          "title": "Session Title",
          "description": "Session Description",
          "state": "UPCOMING",
          "startTime": "2023-06-01T10:00:00Z",
          "endTime": "2023-06-01T12:00:00Z",
          "joiningCode": "ABC123",
          "participants": [
            {
              "id": "uuid",
              "name": "User Name",
              "email": "user@example.com"
            }
          ]
        }
      ],
      "pagination": {
        "total": 20,
        "pages": 2,
        "currentPage": 1,
        "limit": 10
      }
    }
  }
  ```

#### Get User Sessions

- **Endpoint**: `GET /api/sessions/user`
- **Authentication**: Required
- **Response**: Same as Get All Sessions but filtered to sessions where the user is a participant or invited

#### Get Session by ID

- **Endpoint**: `GET /api/sessions/:sessionId`
- **Authentication**: Required
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "title": "Session Title",
      "description": "Session Description",
      "state": "UPCOMING",
      "startTime": "2023-06-01T10:00:00Z",
      "endTime": "2023-06-01T12:00:00Z",
      "joiningCode": "ABC123",
      "participants": [
        {
          "id": "uuid",
          "name": "User Name",
          "email": "user@example.com",
          "companyPosition": "Position",
          "department": "Department"
        }
      ],
      "createdBy": {
        "id": "uuid",
        "name": "Admin Name",
        "email": "admin@example.com"
      },
      "invited": [
        {
          "id": "uuid",
          "name": "Invited User",
          "email": "invited@example.com"
        }
      ],
      "quizzes": [
        {
          "id": "uuid",
          "title": "Quiz Title",
          "timeLimitSeconds": 600,
          "pointsPerQuestion": 10,
          "passingScore": 70
        }
      ]
    }
  }
  ```

#### Join Session

- **Endpoint**: `POST /api/sessions/join`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "joiningCode": "ABC123"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Successfully joined session",
    "data": {
      "session": {
        "id": "uuid",
        "title": "Session Title",
        "description": "Session Description",
        "startTime": "2023-06-01T10:00:00Z",
        "endTime": "2023-06-01T12:00:00Z",
        "quizzes": [
          {
            "id": "uuid",
            "title": "Quiz Title"
          }
        ]
      }
    }
  }
  ```

#### Update Session (Admin only)

- **Endpoint**: `PUT /api/sessions/:sessionId`
- **Authentication**: Required (Admin)
- **Request Body**:
  ```json
  {
    "startTime": "2023-06-01T11:00:00Z",
    "endTime": "2023-06-01T13:00:00Z",
    "maxParticipants": 50,
    "allowGuests": true,
    "state": "LIVE"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Session updated successfully",
    "data": {
      "id": "uuid",
      "title": "Session Title",
      "startTime": "2023-06-01T11:00:00Z",
      "endTime": "2023-06-01T13:00:00Z",
      "maxParticipants": 50,
      "allowGuests": true,
      "state": "LIVE"
    }
  }
  ```

#### Toggle Session Status (Admin only)

- **Endpoint**: `PATCH /api/sessions/:sessionId`
- **Authentication**: Required (Admin)
- **Response**:
  ```json
  {
    "success": true,
    "message": "Session status toggled successfully",
    "data": {
      "id": "uuid",
      "isActive": false
    }
  }
  ```

## Quizzes

### Quiz Model

The Quiz model represents quizzes that can be added to sessions.

```typescript
model Quiz {
  id                String         @id @default(uuid())
  title             String
  session           Session        @relation("SessionQuizzes", fields: [sessionId], references: [id])
  sessionId         String
  timeLimitSeconds  Int? // Time limit for quiz in seconds
  pointsPerQuestion Int            @default(10) // Points per question
  passingScore      Int? // Minimum score to pass
  totalMarks        Int? // Total marks for the quiz
  questions         Question[]     @relation("QuizQuestions")
  responses         QuizResponse[] @relation("QuizResponses")
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
  retryQuiz         Boolean        @default(false) // Option to retry the quiz
}
```

### Question Model

```typescript
model Question {
  id            String       @id @default(uuid())
  quiz          Quiz         @relation("QuizQuestions", fields: [quizId], references: [id])
  quizId        String
  text          String // Question text
  type          QuestionType // e.g., MULTIPLE_CHOICE, TEXT, MULTI_CORRECT
  imageUrl      String? // Optional URL to an image for the question
  options       String? // Comma-separated options (e.g., "A,B,C,D")
  correctAnswer String? // Correct answer
  order         Int // Order of question in quiz
  timeTaken     Int? // Time taken to solve the question in milliseconds
  marks         Int? // Marks assigned to the question
}

enum QuestionType {
  MULTIPLE_CHOICE
  MULTI_CORRECT
  TEXT
  MATCHING
}
```

### Quiz Response Model

```typescript
model QuizResponse {
  id          String    @id @default(uuid())
  quiz        Quiz      @relation("QuizResponses", fields: [quizId], references: [id])
  quizId      String
  user        User      @relation("UserQuizResponses", fields: [userId], references: [id])
  userId      String
  score       Float?
  completedAt DateTime?
  answers     String? // Comma-separated answers (e.g., "A,C" or "User's text")
  createdAt   DateTime  @default(now())
  timeTaken   Int? // Time taken for each question in seconds
  totalScore  Float? // Total score for the quiz
}
```

### Quiz APIs

#### Create Quiz (Admin only)

- **Endpoint**: `POST /api/quizzes`
- **Authentication**: Required (Admin)
- **Request Body**:
  ```json
  {
    "title": "Quiz Title",
    "sessionId": "session-uuid",
    "timeLimitSeconds": 600,
    "pointsPerQuestion": 10,
    "passingPercentage": 70,
    "totalMarks": 100,
    "questions": [
      {
        "text": "Question text",
        "type": "MULTIPLE_CHOICE",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "Option A",
        "marks": 10
      }
    ]
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Quiz created successfully",
    "data": {
      "id": "uuid",
      "title": "Quiz Title",
      "sessionId": "session-uuid",
      "timeLimitSeconds": 600,
      "pointsPerQuestion": 10,
      "passingScore": 70,
      "totalMarks": 100
    }
  }
  ```

#### Get All Quizzes

- **Endpoint**: `GET /api/quizzes?sessionId=session-uuid`
- **Authentication**: Required
- **Query Parameters**:
  - `sessionId`: ID of the session to get quizzes from (required)
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "title": "Quiz Title",
        "sessionId": "session-uuid",
        "timeLimitSeconds": 600,
        "pointsPerQuestion": 10,
        "passingScore": 70,
        "totalMarks": 100,
        "createdAt": "2023-06-01T10:00:00Z",
        "updatedAt": "2023-06-01T10:00:00Z"
      }
    ]
  }
  ```

#### Get Quiz by ID

- **Endpoint**: `GET /api/quizzes/:quizId`
- **Authentication**: Required
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "title": "Quiz Title",
      "sessionId": "session-uuid",
      "timeLimitSeconds": 600,
      "pointsPerQuestion": 10,
      "passingScore": 70,
      "totalMarks": 100,
      "questions": [
        {
          "id": "uuid",
          "text": "Question text",
          "type": "MULTIPLE_CHOICE",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "order": 1,
          "marks": 10
        }
      ]
    }
  }
  ```

#### Add Questions to Quiz (Admin only)

- **Endpoint**: `POST /api/quizzes/:quizId/questions`
- **Authentication**: Required (Admin)
- **Request Body**:
  ```json
  [
    {
      "text": "Question text",
      "type": "MULTIPLE_CHOICE",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "imageUrl": "https://example.com/image.jpg",
      "marks": 10
    }
  ]
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Questions added successfully",
    "data": {
      "questions": [
        {
          "id": "uuid",
          "text": "Question text",
          "type": "MULTIPLE_CHOICE",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "order": 1
        }
      ]
    }
  }
  ```

#### Join Quiz

- **Endpoint**: `POST /api/quizzes/:quizId/join`
- **Authentication**: Required
- **Response**:
  ```json
  {
    "success": true,
    "message": "Successfully joined quiz",
    "data": {
      "quiz": {
        "id": "uuid",
        "title": "Quiz Title",
        "timeLimitSeconds": 600,
        "pointsPerQuestion": 10,
        "totalMarks": 100
      },
      "questions": [
        {
          "id": "uuid",
          "text": "Question text",
          "type": "MULTIPLE_CHOICE",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "order": 1
        }
      ]
    }
  }
  ```

#### Submit Quiz Response

- **Endpoint**: `POST /api/quizzes/:quizId/submit`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "answers": [
      {
        "questionId": "question-uuid",
        "answer": "Option A",
        "timeTaken": 30
      }
    ]
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Quiz submitted successfully",
    "data": {
      "score": 80,
      "totalMarks": 100,
      "passed": true,
      "answers": [
        {
          "questionId": "question-uuid",
          "userAnswer": "Option A",
          "correctAnswer": "Option A",
          "isCorrect": true,
          "score": 10
        }
      ]
    }
  }
  ```

#### Update Quiz (Admin only)

- **Endpoint**: `PUT /api/quizzes/:quizId`
- **Authentication**: Required (Admin)
- **Request Body**:
  ```json
  {
    "title": "Updated Quiz Title",
    "timeLimitSeconds": 900,
    "pointsPerQuestion": 15,
    "passingScore": 75
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Quiz updated successfully",
    "data": {
      "id": "uuid",
      "title": "Updated Quiz Title",
      "timeLimitSeconds": 900,
      "pointsPerQuestion": 15,
      "passingScore": 75
    }
  }
  ```

#### Update Question (Admin only)

- **Endpoint**: `PUT /api/quizzes/:quizId/questions/:questionId`
- **Authentication**: Required (Admin)
- **Request Body**:
  ```json
  {
    "text": "Updated question text",
    "type": "MULTIPLE_CHOICE",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option B",
    "marks": 15
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Question updated successfully",
    "data": {
      "id": "uuid",
      "text": "Updated question text",
      "type": "MULTIPLE_CHOICE",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "order": 1
    }
  }
  ```

#### Delete Quiz (Admin only)

- **Endpoint**: `DELETE /api/quizzes/:quizId`
- **Authentication**: Required (Admin)
- **Response**:
  ```json
  {
    "success": true,
    "message": "Quiz deleted successfully"
  }
  ```

#### Delete Question (Admin only)

- **Endpoint**: `DELETE /api/quizzes/:quizId/questions/:questionId`
- **Authentication**: Required (Admin)
- **Response**:
  ```json
  {
    "success": true,
    "message": "Question deleted successfully"
  }
  ```

#### Get Quiz Leaderboard

- **Endpoint**: `GET /api/quizzes/:quizId/leaderboard`
- **Authentication**: Required
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "leaderboard": [
        {
          "userId": "user-uuid",
          "name": "User Name",
          "score": 95,
          "completedAt": "2023-06-01T11:30:00Z"
        }
      ]
    }
  }
  ```

#### Get Quiz Results (Admin only)

- **Endpoint**: `GET /api/quizzes/:quizId/results`
- **Authentication**: Required (Admin)
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "results": [
        {
          "userId": "user-uuid",
          "name": "User Name",
          "email": "user@example.com",
          "score": 85,
          "totalMarks": 100,
          "passed": true,
          "completedAt": "2023-06-01T11:30:00Z",
          "timeTaken": 450
        }
      ],
      "stats": {
        "averageScore": 82.5,
        "highestScore": 95,
        "lowestScore": 70,
        "passRate": 90
      }
    }
  }
  ```

## Dashboard

### Dashboard API

The Dashboard API provides authenticated users with personalized data including quiz scores, course progress, daily streaks, and upcoming sessions.

#### Get Dashboard Data

- **Endpoint**: `GET /api/dashboard`
- **Authentication**: Required
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "user-uuid",
        "name": "User Name",
        "email": "user@example.com",
        "belt": "GREEN",
        "xpPoints": 1250
      },
      "quizScores": [
        {
          "quizId": "quiz-uuid",
          "quizTitle": "Quiz Title",
          "score": 85,
          "totalMarks": 100,
          "completedAt": "2023-06-01T11:30:00Z"
        }
      ],
      "courseProgress": {
        "percentage": 65,
        "completedSessions": 13,
        "totalSessions": 20
      },
      "dailyStreak": 5,
      "highestQuizScore": {
        "score": 95,
        "quizTitle": "Advanced Quiz"
      },
      "topPerformers": [
        {
          "userId": "user-uuid",
          "name": "Top User",
          "score": 98,
          "belt": "BLACK"
        }
      ],
      "upcomingSessions": [
        {
          "id": "session-uuid",
          "title": "Upcoming Session",
          "description": "Session description",
          "startTime": "2023-06-05T10:00:00Z",
          "endTime": "2023-06-05T12:00:00Z",
          "joiningCode": "DEF456"
        }
      ]
    }
  }
  ```
