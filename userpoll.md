I need to implement the WebSocket functionality for users participating in polls based on our API documentation.

Please implement the client-side WebSocket integration for our poll application following the specifications in the userpoll.api.md file I've shared. This is for the USER SIDE only (participants responding to polls), not the admin side.

The implementation should:

1. Establish a WebSocket connection with proper authentication
2. Use the WebSocket URL from the .env file (using the ws protocol, not wss)
3. Handle joining and leaving polls
4. Submit poll responses for different question types (SINGLE_CHOICE, MULTIPLE_CHOICE, WORD_CLOUD, etc.)
5. Process all incoming WebSocket events (active-question, poll-updated, question-ended, etc.)
6. Implement proper error handling and reconnection logic
7. Include the REST API integration for joining polls with a joining code

Please structure the code in a modular way using TypeScript with proper type definitions. The implementation should focus on the user experience - joining polls with a code, receiving questions, submitting answers, and viewing results and also about the question ended thing and new question event please understand properlyif enabled.

# User Poll WebSocket API Documentation (TypeScript)

This document provides details for implementing the client-side WebSocket functionality for users participating in polls using TypeScript.

## Types

First, let's define some TypeScript interfaces for our data structures:

```typescript
// Poll and Question Types
interface Poll {
  id: string;
  title: string;
  joiningCode: string;
  isLive: boolean;
  showResults: boolean;
  questions: Question[];
  _count?: {
    participants: number;
    responses: number;
  };
}

interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options: QuestionOption[];
  isActive?: boolean;
  startedAt?: string;
  endedAt?: string;
}

interface QuestionOption {
  id: string;
  text: string;
  pollId: string;
  imageUrl: string | null;
  order: number;
}

// Question Types
type QuestionType =
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_CHOICE'
  | 'WORD_CLOUD'
  | 'RANKING'
  | 'SCALE'
  | 'OPEN_TEXT'
  | 'Q_AND_A';

// WebSocket Event Types
interface WebSocketMessage {
  event?: string;
  type?: string;
  data: any;
}

interface PollResponse {
  pollId: string;
  answer: string | string[] | number;
  type: QuestionType;
}

interface ActiveQuestionData {
  action: 'new-question';
  data: {
    pollId: string;
    question: Question;
  };
}

interface PollUpdateData {
  action: string;
  data: any;
}

interface QuestionEndedData {
  pollId: string;
  timestamp: string;
  questionId: string;
}

interface WordCloudUpdateData {
  pollId: string;
  word: string;
  userId: string;
  timestamp: string;
}

interface ParticipantCountData {
  pollId: string;
  count: number;
}
```

## WebSocket Connection

### Establishing Connection

```typescript
// Create WebSocket connection with authentication token
const token: string = 'your-jwt-token'; // Without "Bearer " prefix
const ws: WebSocket = new WebSocket(
  `${SOCKET_URL}?authorization=${encodeURIComponent(token)}`
);

// Or with "Bearer " prefix
const authToken: string = `Bearer ${token}`;
const ws: WebSocket = new WebSocket(
  `${SOCKET_URL}?authorization=${encodeURIComponent(authToken)}`
);
```

### Connection Events

```typescript
// Handle connection events
ws.onopen = (): void => {
  console.log('Connected to WebSocket server');
};

ws.onclose = (event: CloseEvent): void => {
  console.log('Disconnected from WebSocket server', event.code, event.reason);
};

ws.onerror = (error: Event): void => {
  console.error('WebSocket error:', error);
};
```

## Joining a Poll

When a user joins a poll (after using the `/poll/join` REST API endpoint), they should also join the WebSocket room:

```typescript
// Join a poll room
function joinPoll(pollId: string): void {
  ws.send(
    JSON.stringify({
      event: 'join-poll',
      data: pollId, // The poll ID received from the join API response
    })
  );
}
```

## Leaving a Poll

When a user leaves a poll:

```typescript
// Leave a poll room
function leavePoll(pollId: string): void {
  ws.send(
    JSON.stringify({
      event: 'leave-poll',
      data: pollId,
    })
  );
}
```

## Submitting Poll Responses

To submit a response to an active poll question:

```typescript
// Submit a response
function submitResponse(
  pollId: string,
  answer: string | string[] | number,
  type: QuestionType
): void {
  ws.send(
    JSON.stringify({
      event: 'poll-response',
      data: {
        pollId,
        answer, // Text for open responses, option ID for choices, array for multiple choice
        type, // Match the question type
      } as PollResponse,
    })
  );
}
```

## Receiving Poll Events

### Message Handling

```typescript
ws.onmessage = (event: MessageEvent): void => {
  const data: WebSocketMessage = JSON.parse(event.data);

  // Handle different event types
  if (data.event) {
    switch (data.event) {
      case 'active-question':
        handleActiveQuestion(data.data as ActiveQuestionData);
        break;
      case 'poll-updated':
        handlePollUpdate(data.data as PollUpdateData);
        break;
      case 'question-ended':
        handleQuestionEnded(data.data as QuestionEndedData);
        break;
      case 'word-cloud-update':
        handleWordCloudUpdate(data.data as WordCloudUpdateData);
        break;
      default:
        console.log('Unknown event type:', data.event);
    }
  } else if (data.type) {
    // Handle generic message events
    handleMessageByType(data);
  }
};
```

### Event Types to Handle

#### Active Question

Sent when a new question becomes active:

```typescript
function handleActiveQuestion(data: ActiveQuestionData): void {
  // data contains:
  // {
  //   action: 'new-question',
  //   data: {
  //     pollId: 'poll-uuid',
  //     question: {
  //       id: 'question-uuid',
  //       text: 'Question text',
  //       type: 'SINGLE_CHOICE',
  //       options: [...],
  //       startedAt: '2023-05-20T14:30:00Z'
  //     }
  //   }
  // }

  // Display the question to the user
  displayQuestion(data.data.question);
}

function displayQuestion(question: Question): void {
  // Implementation depends on your UI framework
  console.log('Displaying question:', question);
}
```

#### Poll Updates

General poll update events:

```typescript
function handlePollUpdate(data: PollUpdateData): void {
  // data contains:
  // {
  //   action: 'action-type', // 'new-question', 'question-results', etc.
  //   data: { ... } // Varies based on action type
  // }

  switch (data.action) {
    case 'new-question':
      // Handle new question (similar to active-question)
      if (data.data.question) {
        displayQuestion(data.data.question);
      }
      break;
    case 'question-results':
      // Display results
      displayResults(data.data.results);
      break;
    case 'participant-count-updated':
      // Update participant count
      updateParticipantCount(data.data.count);
      break;
    case 'new-response':
      // Handle new response (for live updates)
      handleNewResponse(data.data.response);
      break;
    default:
      console.log('Unknown poll update action:', data.action);
  }
}

function displayResults(results: any): void {
  // Implementation depends on your UI framework
  console.log('Displaying results:', results);
}

function updateParticipantCount(count: number): void {
  // Implementation depends on your UI framework
  console.log('Participant count updated:', count);
}

function handleNewResponse(response: any): void {
  // Implementation depends on your UI framework
  console.log('New response received:', response);
}
```

#### Question Ended

Sent when an active question ends:

```typescript
function handleQuestionEnded(data: QuestionEndedData): void {
  // data contains:
  // {
  //   pollId: 'poll-uuid',
  //   timestamp: '2023-05-20T14:35:00Z',
  //   questionId: 'question-uuid'
  // }

  // Update UI to show question has ended
  markQuestionAsEnded(data.questionId);
}

function markQuestionAsEnded(questionId: string): void {
  // Implementation depends on your UI framework
  console.log('Question ended:', questionId);
}
```

#### Word Cloud Updates

Special event for word cloud responses:

```typescript
function handleWordCloudUpdate(data: WordCloudUpdateData): void {
  // data contains:
  // {
  //   pollId: 'poll-uuid',
  //   word: 'example',
  //   userId: 'user-uuid',
  //   timestamp: '2023-05-20T14:32:00Z'
  // }

  // Add word to word cloud visualization
  addWordToCloud(data.word);
}

function addWordToCloud(word: string): void {
  // Implementation depends on your UI framework
  console.log('Adding word to cloud:', word);
}
```

#### Message Events by Type

Handle generic message events:

```typescript
function handleMessageByType(data: WebSocketMessage): void {
  if (!data.type) return;

  switch (data.type) {
    case 'participant-count-updated':
      updateParticipantCount(data.data.count);
      break;
    case 'joined-poll':
      // Handle successful join confirmation
      console.log(
        `Joined poll ${data.data.pollId} with ${data.data.count} participants`
      );
      break;
    case 'left-poll':
      // Handle successful leave confirmation
      console.log(`Left poll ${data.data.pollId}`);
      break;
    case 'new-response':
      // Handle new response notification
      handleNewResponse(data.data);
      break;
    default:
      console.log('Unknown message type:', data.type);
  }
}
```

## Complete Implementation Example

```typescript
// Define state variables
let currentPollId: string | null = null;
let socket: WebSocket | null = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectDelay = 2000; // 2 seconds

// Connect to WebSocket server
function connectWebSocket(token: string): WebSocket {
  const ws = new WebSocket(
    `${process.env.SOCKET_URL}?authorization=${encodeURIComponent(token)}`
  );

  ws.onopen = (): void => {
    console.log('Connected to WebSocket server');
    reconnectAttempts = 0;

    // If we already have a poll ID (e.g., from URL or state)
    if (currentPollId) {
      joinPoll(currentPollId);
    }
  };

  ws.onclose = (event: CloseEvent): void => {
    console.log(`WebSocket closed with code ${event.code}`);

    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      console.log(
        `Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`
      );
      setTimeout(() => {
        socket = connectWebSocket(token);
      }, reconnectDelay);
    } else {
      console.error('Max reconnection attempts reached');
      // Show user-friendly error message
    }
  };

  ws.onerror = (error: Event): void => {
    console.error('WebSocket error:', error);
  };

  ws.onmessage = (event: MessageEvent): void => {
    const data: WebSocketMessage = JSON.parse(event.data);
    console.log('Received message:', data);

    // Handle by event name
    if (data.event) {
      switch (data.event) {
        case 'active-question':
          handleActiveQuestion(data.data as ActiveQuestionData);
          break;
        case 'poll-updated':
          handlePollUpdate(data.data as PollUpdateData);
          break;
        case 'question-ended':
          handleQuestionEnded(data.data as QuestionEndedData);
          break;
        case 'word-cloud-update':
          handleWordCloudUpdate(data.data as WordCloudUpdateData);
          break;
      }
    }
    // Handle by message type
    else if (data.type) {
      handleMessageByType(data);
    }
  };

  return ws;
}

// Join a poll
function joinPoll(pollId: string): void {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.error('WebSocket not connected');
    return;
  }

  currentPollId = pollId;
  socket.send(
    JSON.stringify({
      event: 'join-poll',
      data: pollId,
    })
  );
}

// Leave a poll
function leavePoll(pollId: string): void {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.error('WebSocket not connected');
    return;
  }

  socket.send(
    JSON.stringify({
      event: 'leave-poll',
      data: pollId,
    })
  );
  currentPollId = null;
}

// Submit a response
function submitResponse(
  pollId: string,
  answer: string | string[] | number,
  type: QuestionType
): void {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.error('WebSocket not connected');
    return;
  }

  socket.send(
    JSON.stringify({
      event: 'poll-response',
      data: {
        pollId,
        answer,
        type,
      } as PollResponse,
    })
  );
}

// Join a poll via REST API then WebSocket
async function joinPollWithCode(
  joiningCode: string,
  token: string
): Promise<Poll | null> {
  try {
    const response = await fetch('/api/poll/join', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ joiningCode }),
    });

    const data = await response.json();

    if (data.success) {
      // Then connect via WebSocket
      joinPoll(data.data.poll.id);
      return data.data.poll;
    } else {
      throw new Error(data.message || 'Failed to join poll');
    }
  } catch (error) {
    console.error('Error joining poll:', error);
    return null;
  }
}

// Submit response via REST API
async function submitPollResponse(
  pollId: string,
  responseData: any,
  token: string
): Promise<any> {
  try {
    const response = await fetch(`/api/poll/${pollId}/response`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(responseData),
    });

    return await response.json();
  } catch (error) {
    console.error('Error submitting response:', error);
    throw error;
  }
}

// Initialize WebSocket connection
function initializeWebSocket(token: string): void {
  socket = connectWebSocket(token);

  // Handle app going to background
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      // App is in background
      console.log('App in background, connection may be interrupted');
    } else {
      // App is in foreground again
      console.log('App in foreground, checking connection');
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.log('Connection lost, reconnecting...');
        socket = connectWebSocket(token);
      }
    }
  });

  // Handle network changes (for mobile)
  window.addEventListener('online', () => {
    console.log('Network connection restored');
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      socket = connectWebSocket(token);
    }
  });

  window.addEventListener('offline', () => {
    console.log('Network connection lost');
  });
}

// Export the API
export const PollSocketAPI = {
  initialize: initializeWebSocket,
  joinPollWithCode,
  joinPoll,
  leavePoll,
  submitResponse,
  submitPollResponse,
};
```

## WebSocket Event Summary

| Event (Client to Server) | Description       | Data Format                                                                    |
| ------------------------ | ----------------- | ------------------------------------------------------------------------------ |
| `join-poll`              | Join a poll room  | `pollId: string`                                                               |
| `leave-poll`             | Leave a poll room | `pollId: string`                                                               |
| `poll-response`          | Submit a response | `{ pollId: string, answer: string \| string[] \| number, type: QuestionType }` |

| Event (Server to Client) | Description         | Data Format                                                           |
| ------------------------ | ------------------- | --------------------------------------------------------------------- |
| `active-question`        | New active question | `{ action: string, data: { pollId: string, question: Question } }`    |
| `poll-updated`           | Poll update event   | `{ action: string, data: any }`                                       |
| `question-ended`         | Question ended      | `{ pollId: string, timestamp: string, questionId: string }`           |
| `word-cloud-update`      | Word cloud update   | `{ pollId: string, word: string, userId: string, timestamp: string }` |

| Message Type                | Description               | Data Format                                                                                     |
| --------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------- |
| `joined-poll`               | Join confirmation         | `{ pollId: string, count: number, socketId: string }`                                           |
| `left-poll`                 | Leave confirmation        | `{ pollId: string, count: number }`                                                             |
| `participant-count-updated` | Participant count         | `{ pollId: string, count: number }`                                                             |
| `new-response`              | New response notification | `{ pollId: string, userId: string, userName: string, responseType: string, timestamp: string }` |
| `response-received`         | Response confirmation     | `{ pollId: string, questionId: string, success: boolean, message: string }`                     |

## Poll Question Types

The system supports various question types that determine how users can respond:

| Type              | Description               | Response Format                     |
| ----------------- | ------------------------- | ----------------------------------- |
| `SINGLE_CHOICE`   | Select one option         | Option ID (string)                  |
| `MULTIPLE_CHOICE` | Select multiple options   | Array of Option IDs                 |
| `WORD_CLOUD`      | Submit a word or phrase   | Text (string)                       |
| `RANKING`         | Rank options in order     | Array of Option IDs in ranked order |
| `SCALE`           | Select a value on a scale | Number (integer)                    |
| `OPEN_TEXT`       | Submit free text          | Text (string)                       |
| `Q_AND_A`         | Submit a question         | Text (string)                       |

## React Integration Example

```tsx
import React, { useState, useEffect, useRef } from 'react';
import { PollSocketAPI } from './pollSocketApi';

interface PollComponentProps {
  userToken: string;
  joiningCode?: string;
}

const PollComponent: React.FC<PollComponentProps> = ({
  userToken,
  joiningCode,
}) => {
  const [connected, setConnected] = useState<boolean>(false);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [participants, setParticipants] = useState<number>(0);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Initialize WebSocket connection
    PollSocketAPI.initialize(userToken);

    // Join poll if we have a joining code
    if (joiningCode) {
      joinPollWithCode(joiningCode);
    }

    // Cleanup on unmount
    return () => {
      if (poll) {
        PollSocketAPI.leavePoll(poll.id);
      }
    };
  }, [userToken, joiningCode]);

  const joinPollWithCode = async (code: string) => {
    const joinedPoll = await PollSocketAPI.joinPollWithCode(code, userToken);
    if (joinedPoll) {
      setPoll(joinedPoll);
    }
  };

  const submitResponse = (
    answer: string | string[] | number,
    type: QuestionType
  ) => {
    if (!poll || !activeQuestion) return;

    PollSocketAPI.submitResponse(poll.id, answer, type);
  };

  const leavePoll = (pollId: string) => {
    PollSocketAPI.leavePoll(pollId);
    setPoll(null);
    setActiveQuestion(null);
  };

  // Custom event handlers
  const handleActiveQuestion = (data: ActiveQuestionData) => {
    setActiveQuestion(data.data.question);

    // Reset form inputs when a new question arrives
    setWordCloudInput('');
    setSelectedOptions([]);
    setScaleValue(5);
    setOpenTextInput('');
  };

  const handlePollUpdate = (data: PollUpdateData) => {
    if (data.action === 'participant-count-updated') {
      setParticipants(data.data.count);
    }
  };

  return (
    <div className="poll-container">
      {!connected && <div className="connection-status">Connecting...</div>}

      {poll ? (
        <>
          <h1>{poll.title}</h1>
          <div className="participants">Participants: {participants}</div>

          {activeQuestion ? (
            <div className="question">
              <h2>{activeQuestion.text}</h2>

              {activeQuestion.type === 'SINGLE_CHOICE' && (
                <div className="options">
                  {activeQuestion.options.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => submitResponse(option.id, 'SINGLE_CHOICE')}
                    >
                      {option.text}
                    </button>
                  ))}
                </div>
              )}

              {activeQuestion.type === 'MULTIPLE_CHOICE' && (
                <div className="options">
                  {activeQuestion.options.map((option) => (
                    <div key={option.id} className="checkbox-option">
                      <input
                        type="checkbox"
                        id={option.id}
                        name={option.id}
                        onChange={(e) => {
                          // In a real implementation, you'd collect all selected options
                          // This is simplified for the example
                          const selectedOptions = [option.id];
                          submitResponse(selectedOptions, 'MULTIPLE_CHOICE');
                        }}
                      />
                      <label htmlFor={option.id}>{option.text}</label>
                    </div>
                  ))}
                </div>
              )}

              {activeQuestion.type === 'WORD_CLOUD' && (
                <div className="word-cloud-input">
                  <input
                    type="text"
                    placeholder="Enter a word or phrase"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        submitResponse(e.currentTarget.value, 'WORD_CLOUD');
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                </div>
              )}

              {activeQuestion.type === 'SCALE' && (
                <div className="scale-input">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    onChange={(e) =>
                      submitResponse(parseInt(e.target.value), 'SCALE')
                    }
                  />
                </div>
              )}

              {activeQuestion.type === 'OPEN_TEXT' && (
                <div className="open-text-input">
                  <textarea
                    placeholder="Enter your response"
                    onBlur={(e) => submitResponse(e.target.value, 'OPEN_TEXT')}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="waiting">Waiting for a question...</div>
          )}

          <button onClick={() => leavePoll(poll.id)}>Leave Poll</button>
        </>
      ) : (
        <div className="join-form">
          <h2>Join a Poll</h2>
          <input
            type="text"
            placeholder="Enter joining code"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                joinPollWithCode(e.currentTarget.value);
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

export default PollComponent;
```

## Vue.js Integration Example

```typescript
<template>
  <div class="poll-container">
    <div v-if="!connected" class="connection-status">Connecting...</div>

    <div v-if="poll">
      <h1>{{ poll.title }}</h1>
      <div class="participants">Participants: {{ participants }}</div>

      <div v-if="activeQuestion" class="question">
        <h2>{{ activeQuestion.text }}</h2>

        <div v-if="activeQuestion.type === 'SINGLE_CHOICE'" class="options">
          <button
            v-for="option in activeQuestion.options"
            :key="option.id"
            @click="submitResponse(option.id, 'SINGLE_CHOICE')"
          >
            {{ option.text }}
          </button>
        </div>

        <div v-if="activeQuestion.type === 'MULTIPLE_CHOICE'" class="options">
          <div v-for="option in activeQuestion.options" :key="option.id" class="checkbox-option">
            <input
              type="checkbox"
              :id="option.id"
              :name="option.id"
              v-model="selectedOptions"
              :value="option.id"
              @change="submitMultipleChoiceResponse"
            />
            <label :for="option.id">{{ option.text }}</label>
          </div>
        </div>

        <div v-if="activeQuestion.type === 'WORD_CLOUD'" class="word-cloud-input">
          <input
            type="text"
            placeholder="Enter a word or phrase"
            v-model="wordCloudInput"
            @keyup.enter="submitWordCloudResponse"
          />
        </div>

        <div v-if="activeQuestion.type === 'SCALE'" class="scale-input">
          <input
            type="range"
            min="1"
            max="10"
            v-model.number="scaleValue"
            @change="submitScaleResponse"
          />
        </div>

        <div v-if="activeQuestion.type === 'OPEN_TEXT'" class="open-text-input">
          <textarea
            placeholder="Enter your response"
            v-model="openTextInput"
            @blur="submitOpenTextResponse"
          />
        </div>
      </div>

      <div v-else class="waiting">Waiting for a question...</div>

      <button @click="leavePoll(poll.id)">Leave Poll</button>
    </div>

    <div v-else class="join-form">
      <h2>Join a Poll</h2>
      <input
        type="text"
        placeholder="Enter joining code"
        v-model="joiningCode"
        @keyup.enter="joinPollWithCode(joiningCode)"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { PollSocketAPI } from './pollSocketApi';

export default defineComponent({
  name: 'PollComponent',

  props: {
    userToken: {
      type: String,
      required: true
    },
    initialJoiningCode: {
      type: String,
      default: ''
    }
  },

  setup(props) {
    const connected = ref(false);
    const poll = ref<Poll | null>(null);
    const activeQuestion = ref<Question | null>(null);
    const participants = ref(0);
    const joiningCode = ref(props.initialJoiningCode);

    // Form inputs for different question types
    const wordCloudInput = ref('');
    const selectedOptions = ref<string[]>([]);
    const scaleValue = ref(5);
    const openTextInput = ref('');

    onMounted(() => {
      // Initialize WebSocket connection
      PollSocketAPI.initialize(props.userToken);

      // Join poll if we have a joining code
      if (props.initialJoiningCode) {
        joinPollWithCode(props.initialJoiningCode);
      }
    });

    onBeforeUnmount(() => {
      if (poll.value) {
        PollSocketAPI.leavePoll(poll.value.id);
      }
    });

    // Methods
    const joinPollWithCode = async (code: string) => {
      const joinedPoll = await PollSocketAPI.joinPollWithCode(code, props.userToken);
      if (joinedPoll) {
        poll.value = joinedPoll;
      }
    };

    const submitResponse = (answer: string | string[] | number, type: QuestionType) => {
      if (!poll.value || !activeQuestion.value) return;

      PollSocketAPI.submitResponse(poll.value.id, answer, type);
    };

    const submitMultipleChoiceResponse = () => {
      submitResponse(selectedOptions.value, 'MULTIPLE_CHOICE');
    };

    const submitWordCloudResponse = () => {
      submitResponse(wordCloudInput.value, 'WORD_CLOUD');
      wordCloudInput.value = '';
    };

    const submitScaleResponse = () => {
      submitResponse(scaleValue.value, 'SCALE');
    };

    const submitOpenTextResponse = () => {
      submitResponse(openTextInput.value, 'OPEN_TEXT');
    };

    const leavePoll = (pollId: string) => {
      PollSocketAPI.leavePoll(pollId);
      poll.value = null;
      activeQuestion.value = null;
    };

    // Custom event handlers
    const handleActiveQuestion = (data: ActiveQuestionData) => {
      activeQuestion.value = data.data.question;

      // Reset form inputs when a new question arrives
      wordCloudInput.value = '';
      selectedOptions.value = [];
      scaleValue.value = 5;
      openTextInput.value = '';
    };

    const handlePollUpdate = (data: PollUpdateData) => {
      if (data.action === 'participant-count-updated') {
        participants.value = data.data.count;
      }
    };

    return {
      connected,
      poll,
      activeQuestion,
      participants,
      joiningCode,
      wordCloudInput,
      selectedOptions,
      scaleValue,
      openTextInput,
      joinPollWithCode,
      submitResponse,
      submitMultipleChoiceResponse,
      submitWordCloudResponse,
      submitScaleResponse,
      submitOpenTextResponse,
      leavePoll
    };
  }
});
</script>
```

## Environment Configuration

For development environments, you may need to configure the WebSocket URL:

```typescript
// Environment-based configuration in a .env file
SOCKET_URL=ws://localhost:3000/socket

// Access in your code
const SOCKET_URL = process.env.SOCKET_URL || 'ws://localhost:3000/socket';

// Then use this in your connection
const socket = new WebSocket(`${SOCKET_URL}?authorization=${encodeURIComponent(token)}`);
```

## User-Side Poll Participation Flow

1. **Join a Poll**:

   - User enters a joining code
   - System makes REST API call to join the poll
   - Upon successful join, WebSocket connection joins the poll room

2. **Participate in Active Questions**:

   - User receives active question via WebSocket
   - UI displays the question based on its type
   - User submits response via WebSocket

3. **View Results (if enabled)**:

   - When a question ends, results may be displayed
   - Results are received via WebSocket

4. **Leave Poll**:
   - User can leave the poll at any time
   - WebSocket connection leaves the poll room

## Error Handling

```typescript
// Reconnection logic
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectDelay = 2000; // 2 seconds

function connectWebSocket(token: string): WebSocket {
  const ws = new WebSocket(
    `${process.env.SOCKET_URL}?authorization=${encodeURIComponent(token)}`
  );

  ws.onopen = () => {
    console.log('Connected to WebSocket server');
    reconnectAttempts = 0;

    // If we already have a poll ID (e.g., from URL or state)
    if (currentPollId) {
      joinPoll(currentPollId);
    }
  };

  ws.onclose = (event) => {
    console.log(`WebSocket closed with code ${event.code}`);

    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      console.log(
        `Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`
      );
      setTimeout(() => {
        socket = connectWebSocket(token);
      }, reconnectDelay);
    } else {
      console.error('Max reconnection attempts reached');
      // Show user-friendly error message
    }
  };

  return ws;
}
```

## Mobile Considerations

```typescript
// Handle app going to background
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    // App is in background
    console.log('App in background, connection may be interrupted');
  } else {
    // App is in foreground again
    console.log('App in foreground, checking connection');
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.log('Connection lost, reconnecting...');
      socket = connectWebSocket(token);
    }
  }
});

// Handle network changes (for mobile)
window.addEventListener('online', () => {
  console.log('Network connection restored');
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    socket = connectWebSocket(token);
  }
});

window.addEventListener('offline', () => {
  console.log('Network connection lost');
});
```
