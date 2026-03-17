# Poll Functionality

## Overview

The poll system allows users to create and participate in various types of interactive polls within sessions. Polls can be created quickly or with detailed configuration, and support multiple question types.

## Poll Types

- `SINGLE_CHOICE`: Users select one option from multiple choices
- `MULTIPLE_CHOICE`: Users can select multiple options
- `WORD_CLOUD`: Users submit words/phrases that form a word cloud
- `RANKING`: Users rank options in order of preference
- `SCALE`: Users select a value on a numeric scale
- `OPEN_TEXT`: Users provide free-form text responses
- `Q_AND_A`: Question and answer format

## Key Features

- Quick poll creation with minimal configuration
- Detailed poll creation with multiple questions and options
- Unique joining codes for each poll
- Real-time updates via WebSocket
- Anonymous response option
- Time limits for questions
- Results visualization options

## User Roles

- **Admin**: Can create and manage all polls
- **Session Creator**: Can create and manage polls in their sessions
- **Participant**: Can join polls and submit responses

## API Endpoints

### Get All Polls

- **URL**: `/poll`
- **Method**: `GET`
- **Authentication**: Required
- **Query Parameters**:
  - `sessionId`: ID of the session to get polls from (optional)
  - `isLive`: Filter by live status (true/false, optional)
- **Response**: Array of poll objects with counts
- **Status Codes**:
  - `200 OK`: Success
  - `400 Bad Request`: Invalid request
  - `401 Unauthorized`: User not authenticated
  - `500 Internal Server Error`: Server error

### Get Poll By ID

- **URL**: `/poll/:pollId`
- **Method**: `GET`
- **Authentication**: Required (Admin only)
- **Path Parameters**:
  - `pollId`: ID of the poll to fetch
- **Response**: Detailed poll object with options and participant counts
- **Status Codes**:
  - `200 OK`: Success
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: Not authorized to access this poll
  - `404 Not Found`: Poll not found
  - `500 Internal Server Error`: Server error

### Quick Create Poll

- **URL**: `/poll/create`
- **Method**: `POST`
- **Authentication**: Required (Admin only)
- **Request Body**:
  ```typescript
  {
    title: string; // At least 1 character
    sessionId: string; // Valid UUID
    isPublic: boolean; // Default: false
  }
  ```
- **Response**: Created poll with joining code
- **Status Codes**:
  - `201 Created`: Poll created successfully
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: Not authorized to create polls in this session
  - `404 Not Found`: Session not found or inactive
  - `400 Bad Request`: Invalid request
  - `500 Internal Server Error`: Server error

### Create Detailed Poll

- **URL**: `/poll`
- **Method**: `POST`
- **Authentication**: Required (Admin only)
- **Request Body**:
  ```typescript
  {
    title: string;           // At least 1 character
    sessionId: string;       // Valid UUID
    type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'WORD_CLOUD' | 'RANKING' | 'SCALE' | 'OPEN_TEXT' | 'Q_AND_A';
    isLive: boolean;         // Default: false
    showResults: boolean;    // Default: false
    isPublic: boolean;       // Default: false
    maxVotes?: number;       // Optional
    timeLimit?: number;      // Optional, in seconds
    question?: string;       // Optional, for backward compatibility
    questions?: Array<{      // Optional, for multiple questions
      question: string;
      type: string;
      order: number;
      options?: Array<{
        text: string;
        imageUrl?: string;
        order: number;
      }>;
    }>;
    options?: Array<{        // Optional, for backward compatibility
      text: string;
      imageUrl?: string;
      order: number;
    }>;
  }
  ```
- **Response**: Created poll details
- **Status Codes**:
  - `201 Created`: Poll created successfully
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: Not authorized to create polls in this session
  - `404 Not Found`: Session not found
  - `400 Bad Request`: Invalid request
  - `500 Internal Server Error`: Server error

### Join Poll

- **URL**: `/poll/join`
- **Method**: `POST`
- **Authentication**: Required
- **Request Body**:
  ```typescript
  {
    joiningCode: string; // 6-character alphanumeric code
  }
  ```
- **Response**: Poll details with questions and options
- **Status Codes**:
  - `200 OK`: Successfully joined poll
  - `400 Bad Request`: Invalid joining code
  - `401 Unauthorized`: User not authenticated
  - `404 Not Found`: Poll not found
  - `500 Internal Server Error`: Server error

### Submit Poll Response

- **URL**: `/poll/:pollId/response`
- **Method**: `POST`
- **Authentication**: Required
- **Path Parameters**:
  - `pollId`: ID of the poll to respond to
- **Request Body**:
  ```typescript
  {
    pollId: string;             // Valid UUID
    questionId?: string;        // Optional, for specific question response
    optionId?: string;          // Optional, for option-based responses
    questionOptionId?: string;  // Optional, for question-option responses
    textResponse?: string;      // Optional, for text responses
    ranking?: number;           // Optional, for ranking responses
    scale?: number;             // Optional, for scale responses
    anonymous: boolean;         // Default: false
  }
  ```
- **Response**: Confirmation message and response details
- **Status Codes**:
  - `200 OK`: Response submitted successfully
  - `400 Bad Request`: Invalid response data
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: Not authorized to respond to this poll
  - `404 Not Found`: Poll not found
  - `500 Internal Server Error`: Server error

### Add Question to Poll

- **URL**: `/poll/question`
- **Method**: `POST`
- **Authentication**: Required (Admin only)
- **Request Body**:
  ```typescript
  {
    pollId: string;           // Valid UUID
    question: string;         // At least 1 character
    type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'WORD_CLOUD' | 'RANKING' | 'SCALE' | 'OPEN_TEXT' | 'Q_AND_A';
    order: number;            // Default: 0
    timeLimit?: number;       // Optional, in seconds
    options?: Array<{
      text: string;           // At least 1 character
      imageUrl?: string;      // Optional
      order: number;
    }>;
  }
  ```
- **Response**: Created question details
- **Status Codes**:
  - `201 Created`: Question added successfully
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: Not authorized to modify this poll
  - `404 Not Found`: Poll not found
  - `400 Bad Request`: Invalid request
  - `500 Internal Server Error`: Server error

### End Poll Question

- **URL**: `/poll/:pollId/end-question`
- **Method**: `POST`
- **Authentication**: Required (Admin only)
- **Path Parameters**:
  - `pollId`: ID of the poll containing the question
- **Request Body**:
  ```typescript
  {
    questionId?: string;      // Optional, defaults to active question
  }
  ```
- **Response**: Question results data
- **Status Codes**:
  - `200 OK`: Question ended successfully
  - `401 Unauthorized`: User not authenticated
  - `403 Forbidden`: Not authorized to modify this poll
  - `404 Not Found`: Poll or question not found
  - `400 Bad Request`: No active question to end
  - `500 Internal Server Error`: Server error

## WebSocket Events

The poll system uses WebSockets for real-time updates, including:

- New questions becoming active
- Participant count updates
- New responses
- Question results

// Joined poll confirmation
{
"type": "joined-poll",
"pollId": "poll-123abc",
"count": 24,
"socketId": "socket-xyz789"
}

// Participant count update
{
"type": "participant-count-updated",
"pollId": "poll-123abc",
"count": 25
}

// New response notification
{
"type": "new-response",
"pollId": "poll-123abc",
"questionId": "question-456def",
"userId": "user-789ghi",
"userName": "John Doe",
"answer": "JavaScript",
"responseType": "SINGLE_CHOICE",
"timestamp": "2023-06-15T14:30:45Z"
}

{
"pollId": "poll-123abc",
"questionId": "question-456def",
"question": "What is your favorite programming language?",
"type": "SINGLE_CHOICE",
"startedAt": "2023-06-15T14:30:00Z",
"timeLimit": 60,
"options": [
{
"id": "option-111aaa",
"text": "JavaScript",
"imageUrl": null,
"order": 0
},
{
"id": "option-222bbb",
"text": "Python",
"imageUrl": null,
"order": 1
},
{
"id": "option-333ccc",
"text": "Java",
"imageUrl": null,
"order": 2
}
]
}

// Question results (multiple choice)
{
"action": "question-results",
"pollId": "poll-123abc",
"questionId": "question-456def",
"results": {
"totalResponses": 22,
"options": [
{
"id": "option-111aaa",
"text": "JavaScript",
"count": 10,
"percentage": 45.5
},
{
"id": "option-222bbb",
"text": "Python",
"count": 8,
"percentage": 36.4
},
{
"id": "option-333ccc",
"text": "Java",
"count": 4,
"percentage": 18.1
}
]
}
}

// Word cloud results
{
"action": "question-results",
"pollId": "poll-123abc",
"questionId": "question-456def",
"results": {
"totalResponses": 18,
"words": [
{ "text": "Innovation", "weight": 5 },
{ "text": "Collaboration", "weight": 4 },
{ "text": "Technology", "weight": 3 },
{ "text": "Future", "weight": 3 },
{ "text": "Growth", "weight": 2 },
{ "text": "Learning", "weight": 1 }
]
}
}

// Scale question results
{
"action": "question-results",
"pollId": "poll-123abc",
"questionId": "question-456def",
"results": {
"totalResponses": 20,
"average": 7.4,
"distribution": [
{ "value": 1, "count": 0 },
{ "value": 2, "count": 0 },
{ "value": 3, "count": 1 },
{ "value": 4, "count": 1 },
{ "value": 5, "count": 2 },
{ "value": 6, "count": 3 },
{ "value": 7, "count": 4 },
{ "value": 8, "count": 5 },
{ "value": 9, "count": 3 },
{ "value": 10, "count": 1 }
]
}
}

// Poll ended
{
"action": "poll-ended",
"pollId": "poll-123abc",
"endedAt": "2023-06-15T15:00:00Z",
"summary": {
"totalQuestions": 5,
"totalParticipants": 28,
"totalResponses": 112
}
}

{
"pollId": "poll-123abc",
"questionId": "question-456def",
"timestamp": "2023-06-15T14:32:00Z"
}
