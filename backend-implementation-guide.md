# Backend Implementation Guide for Sessions and Quizzes

This guide outlines the necessary backend API endpoints to support the sessions and quizzes functionality in the frontend.

## API Endpoints Overview

### Sessions Endpoints

1. **GET /api/sessions**

   - Returns active and past sessions for the authenticated user
   - Used on the sessions listing page

2. **GET /api/sessions/:id**

   - Returns detailed information about a specific session
   - Used on the session details page

3. **POST /api/sessions/join**

   - Allows a user to join a session using a code
   - Used when joining a session from the sessions page

4. **POST /api/sessions/:id/leave**
   - Allows a user to leave a session
   - Optional functionality for future use

### Quiz Endpoints

1. **GET /api/sessions/:id/quiz**

   - Returns quiz information for a specific session
   - Used on the quiz page

2. **POST /api/quizzes/:id/submit**

   - Submits a user's quiz answers for grading
   - Used when submitting a quiz

3. **GET /api/quizzes/:id/results**
   - Returns the results of a previously submitted quiz
   - Used to display quiz results

## Database Schema

### Session Model

```typescript
model Session {
  id            String    @id @default(uuid())
  code          String    @unique // For joining sessions
  title         String
  description   String
  instructorId  String
  instructor    User      @relation("SessionInstructor", fields: [instructorId], references: [id])
  date          DateTime
  startTime     DateTime
  endTime       DateTime
  status        String    // "active", "upcoming", "completed"
  hasQuiz       Boolean   @default(false)
  progress      Int       @default(0)
  materials     Material[]
  modules       Module[]
  participants  SessionParticipant[]
  quiz          Quiz?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model SessionParticipant {
  id          String    @id @default(uuid())
  sessionId   String
  session     Session   @relation(fields: [sessionId], references: [id])
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  joinedAt    DateTime  @default(now())
  progress    Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@unique([sessionId, userId])
}

model Material {
  id          String    @id @default(uuid())
  sessionId   String
  session     Session   @relation(fields: [sessionId], references: [id])
  title       String
  type        String    // "pdf", "zip", etc.
  size        String    // "2.4 MB"
  url         String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Module {
  id          String    @id @default(uuid())
  sessionId   String
  session     Session   @relation(fields: [sessionId], references: [id])
  title       String
  duration    String    // "30 minutes"
  type        String    // "video", "reading", etc.
  completed   Boolean   @default(false)
  current     Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

### Quiz Model

```typescript
model Quiz {
  id            String    @id @default(uuid())
  sessionId     String    @unique
  session       Session   @relation(fields: [sessionId], references: [id])
  title         String
  description   String
  timeLimit     Int       // in minutes
  questions     Question[]
  attempts      QuizAttempt[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Question {
  id            String    @id @default(uuid())
  quizId        String
  quiz          Quiz      @relation(fields: [quizId], references: [id])
  text          String
  options       Option[]
  correctOption String    // ID of the correct option
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Option {
  id            String    @id @default(uuid())
  questionId    String
  question      Question  @relation(fields: [questionId], references: [id])
  text          String
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model QuizAttempt {
  id            String    @id @default(uuid())
  quizId        String
  quiz          Quiz      @relation(fields: [quizId], references: [id])
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  answers       Json      // { "questionId": "optionId" }
  score         Int
  completed     Boolean   @default(false)
  startedAt     DateTime  @default(now())
  completedAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@unique([quizId, userId])
}
```

## API Implementation Details

### 1. GET /api/sessions

```typescript
// Controller
export const getSessions = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    // Get active sessions (user is a participant)
    const activeSessions = await prisma.session.findMany({
      where: {
        participants: {
          some: {
            userId,
          },
        },
        status: {
          in: ['active', 'upcoming'],
        },
      },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
          },
        },
        quiz: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Get past sessions
    const pastSessions = await prisma.session.findMany({
      where: {
        participants: {
          some: {
            userId,
          },
        },
        status: 'completed',
      },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
          },
        },
        quiz: {
          select: {
            id: true,
            attempts: {
              where: {
                userId,
              },
              select: {
                score: true,
                completed: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: 10, // Limit to 10 past sessions
    });

    // Format the response
    const formattedActive = activeSessions.map((session) => ({
      id: session.id,
      title: session.title,
      description: session.description,
      instructor: {
        name: session.instructor.name,
        avatar: session.instructor.profilePhoto,
      },
      date: formatDate(session.date),
      time: `${formatTime(session.startTime)} - ${formatTime(session.endTime)}`,
      participants: session.participants.length,
      status: session.status,
      hasQuiz: !!session.quiz,
    }));

    const formattedPast = pastSessions.map((session) => ({
      id: session.id,
      title: session.title,
      description: session.description,
      instructor: {
        name: session.instructor.name,
        avatar: session.instructor.profilePhoto,
      },
      date: formatDate(session.date),
      time: `${formatTime(session.startTime)} - ${formatTime(session.endTime)}`,
      participants: session.participants.length,
      status: session.status,
      hasQuiz: !!session.quiz,
      quizCompleted: session.quiz?.attempts[0]?.completed || false,
      score: session.quiz?.attempts[0]?.score || null,
    }));

    return res.status(200).json({
      active: formattedActive,
      past: formattedPast,
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return res.status(500).json({
      message: 'Failed to fetch sessions',
    });
  }
};

// Helper functions
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};
```

### 2. GET /api/sessions/:id

```typescript
export const getSessionDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if the session exists and the user is a participant
    const session = await prisma.session.findFirst({
      where: {
        id,
        participants: {
          some: {
            userId,
          },
        },
      },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
            bio: true,
          },
        },
        materials: true,
        modules: true,
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profilePhoto: true,
              },
            },
          },
        },
        quiz: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({
        message: 'Session not found or you do not have access to this session',
      });
    }

    // Get the user's progress in this session
    const userProgress = await prisma.sessionParticipant.findUnique({
      where: {
        sessionId_userId: {
          sessionId: id,
          userId,
        },
      },
      select: {
        progress: true,
      },
    });

    // Format the response
    const formattedSession = {
      id: session.id,
      title: session.title,
      description: session.description,
      instructor: {
        name: session.instructor.name,
        avatar: session.instructor.profilePhoto,
        bio: session.instructor.bio,
      },
      date: formatDate(session.date),
      time: `${formatTime(session.startTime)} - ${formatTime(session.endTime)}`,
      duration: formatDuration(session.startTime, session.endTime),
      participants: session.participants.length,
      status: session.status,
      hasQuiz: !!session.quiz,
      progress: userProgress?.progress || 0,
      materials: session.materials.map((material) => ({
        id: material.id,
        title: material.title,
        type: material.type,
        size: material.size,
        url: material.url,
      })),
      modules: session.modules.map((module) => ({
        id: module.id,
        title: module.title,
        duration: module.duration,
        completed: module.completed,
        type: module.type,
        current: module.current,
      })),
      participants: session.participants.map((participant) => ({
        id: participant.user.id,
        name: participant.user.name,
        avatar: participant.user.profilePhoto,
      })),
    };

    return res.status(200).json(formattedSession);
  } catch (error) {
    console.error('Error fetching session details:', error);
    return res.status(500).json({
      message: 'Failed to fetch session details',
    });
  }
};

// Helper function
const formatDuration = (startTime: Date, endTime: Date): string => {
  const durationMs = endTime.getTime() - startTime.getTime();
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}${minutes > 0 ? ` ${minutes} minutes` : ''}`;
  }

  return `${minutes} minutes`;
};
```

### 3. POST /api/sessions/join

```typescript
export const joinSession = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;

    if (!code) {
      return res.status(400).json({
        message: 'Session code is required',
      });
    }

    // Find the session by code
    const session = await prisma.session.findUnique({
      where: {
        code,
      },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
          },
        },
        participants: {
          where: {
            userId,
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({
        message: 'Session not found. Please check the code and try again.',
      });
    }

    // Check if the user is already a participant
    if (session.participants.length > 0) {
      // User is already a participant, return the session
      return res.status(200).json({
        message: 'You are already a participant in this session',
        session: {
          id: session.id,
          title: session.title,
          description: session.description,
          instructor: {
            name: session.instructor.name,
            avatar: session.instructor.profilePhoto,
          },
          date: formatDate(session.date),
          time: `${formatTime(session.startTime)} - ${formatTime(session.endTime)}`,
          status: session.status,
          hasQuiz: session.hasQuiz,
          code,
        },
      });
    }

    // Add the user as a participant
    await prisma.sessionParticipant.create({
      data: {
        sessionId: session.id,
        userId,
      },
    });

    // Return the session details
    return res.status(200).json({
      message: 'Successfully joined the session',
      session: {
        id: session.id,
        title: session.title,
        description: session.description,
        instructor: {
          name: session.instructor.name,
          avatar: session.instructor.profilePhoto,
        },
        date: formatDate(session.date),
        time: `${formatTime(session.startTime)} - ${formatTime(session.endTime)}`,
        status: session.status,
        hasQuiz: session.hasQuiz,
        code,
      },
    });
  } catch (error) {
    console.error('Error joining session:', error);
    return res.status(500).json({
      message: 'Failed to join session',
    });
  }
};
```

### 4. GET /api/sessions/:id/quiz

```typescript
export const getSessionQuiz = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if the session exists and the user is a participant
    const session = await prisma.session.findFirst({
      where: {
        id,
        participants: {
          some: {
            userId,
          },
        },
      },
      include: {
        quiz: {
          include: {
            questions: {
              include: {
                options: true,
              },
            },
            attempts: {
              where: {
                userId,
              },
            },
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({
        message: 'Session not found or you do not have access to this session',
      });
    }

    if (!session.quiz) {
      return res.status(404).json({
        message: 'This session does not have a quiz',
      });
    }

    // Check if the user has already completed the quiz
    const attempt = session.quiz.attempts[0];
    if (attempt && attempt.completed) {
      return res.status(400).json({
        message: 'You have already completed this quiz',
        quizId: session.quiz.id,
      });
    }

    // Format the response
    const formattedQuiz = {
      id: session.quiz.id,
      title: session.quiz.title,
      description: session.quiz.description,
      sessionId: session.id,
      sessionTitle: session.title,
      timeLimit: session.quiz.timeLimit,
      totalQuestions: session.quiz.questions.length,
      questions: session.quiz.questions.map((question) => ({
        id: question.id,
        text: question.text,
        options: question.options.map((option) => ({
          id: option.id,
          text: option.text,
        })),
      })),
    };

    return res.status(200).json(formattedQuiz);
  } catch (error) {
    console.error('Error fetching session quiz:', error);
    return res.status(500).json({
      message: 'Failed to fetch quiz',
    });
  }
};
```

### 5. POST /api/quizzes/:id/submit

```typescript
export const submitQuiz = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;
    const userId = req.user.id;

    if (!answers || Object.keys(answers).length === 0) {
      return res.status(400).json({
        message: 'No answers provided',
      });
    }

    // Get the quiz with questions and correct answers
    const quiz = await prisma.quiz.findUnique({
      where: {
        id,
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
        attempts: {
          where: {
            userId,
          },
        },
      },
    });

    if (!quiz) {
      return res.status(404).json({
        message: 'Quiz not found',
      });
    }

    // Check if the user has already completed the quiz
    if (quiz.attempts.length > 0 && quiz.attempts[0].completed) {
      return res.status(400).json({
        message: 'You have already completed this quiz',
      });
    }

    // Calculate the score
    let correctAnswers = 0;
    const totalQuestions = quiz.questions.length;

    // Convert answers from index-based to question ID-based
    const questionAnswers: Record<string, string> = {};
    Object.entries(answers).forEach(([index, optionId]) => {
      const question = quiz.questions[parseInt(index)];
      if (question) {
        questionAnswers[question.id] = optionId as string;
      }
    });

    // Check each answer
    quiz.questions.forEach((question) => {
      const userAnswer = questionAnswers[question.id];
      if (userAnswer === question.correctOption) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / totalQuestions) * 100);

    // Create or update the quiz attempt
    let attempt;
    if (quiz.attempts.length > 0) {
      // Update existing attempt
      attempt = await prisma.quizAttempt.update({
        where: {
          id: quiz.attempts[0].id,
        },
        data: {
          answers: questionAnswers,
          score,
          completed: true,
          completedAt: new Date(),
        },
      });
    } else {
      // Create new attempt
      attempt = await prisma.quizAttempt.create({
        data: {
          quizId: id,
          userId,
          answers: questionAnswers,
          score,
          completed: true,
          completedAt: new Date(),
        },
      });
    }

    // Return the results
    return res.status(200).json({
      score,
      correctAnswers,
      totalQuestions,
      answers: questionAnswers,
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    return res.status(500).json({
      message: 'Failed to submit quiz',
    });
  }
};
```

### 6. GET /api/quizzes/:id/results

```typescript
export const getQuizResults = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get the quiz with questions, correct answers, and the user's attempt
    const quiz = await prisma.quiz.findUnique({
      where: {
        id,
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
        attempts: {
          where: {
            userId,
            completed: true,
          },
        },
      },
    });

    if (!quiz) {
      return res.status(404).json({
        message: 'Quiz not found',
      });
    }

    // Check if the user has completed the quiz
    if (quiz.attempts.length === 0) {
      return res.status(404).json({
        message: 'You have not completed this quiz yet',
      });
    }

    const attempt = quiz.attempts[0];
    const answers = attempt.answers as Record<string, string>;

    // Format the results
    const results = {
      score: attempt.score,
      correctAnswers: 0,
      totalQuestions: quiz.questions.length,
      answers: {},
      questions: quiz.questions.map((question) => {
        const userAnswer = answers[question.id];
        const isCorrect = userAnswer === question.correctOption;

        if (isCorrect) {
          results.correctAnswers++;
        }

        return {
          id: question.id,
          text: question.text,
          options: question.options.map((option) => ({
            id: option.id,
            text: option.text,
          })),
          correctAnswer: question.correctOption,
          userAnswer,
          isCorrect,
        };
      }),
    };

    return res.status(200).json(results);
  } catch (error) {
    console.error('Error fetching quiz results:', error);
    return res.status(500).json({
      message: 'Failed to fetch quiz results',
    });
  }
};
```

## Routes Configuration

```typescript
// sessions.routes.ts
import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getSessions,
  getSessionDetails,
  joinSession,
  leaveSession,
  getSessionQuiz,
} from '../controllers/sessions.controller';

const router = express.Router();

// Apply authentication middleware to all session routes
router.use(authenticate);

// Session routes
router.get('/', getSessions);
router.get('/:id', getSessionDetails);
router.post('/join', joinSession);
router.post('/:id/leave', leaveSession);
router.get('/:id/quiz', getSessionQuiz);

export default router;

// quizzes.routes.ts
import express from 'express';
import { authenticate } from '../middleware/auth';
import { submitQuiz, getQuizResults } from '../controllers/quizzes.controller';

const router = express.Router();

// Apply authentication middleware to all quiz routes
router.use(authenticate);

// Quiz routes
router.post('/:id/submit', submitQuiz);
router.get('/:id/results', getQuizResults);

export default router;
```

## Register Routes in Main App

```typescript
// server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { logger } from './lib/logger';
import authRoutes from './routes/auth.routes';
import sessionRoutes from './routes/sessions.routes';
import quizRoutes from './routes/quizzes.routes';

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/quizzes', quizRoutes);

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  logger.info(
    `Server running on port ${PORT} in ${process.env.NODE_ENV} mode`,
    {
      service: 'joining-dots-backend',
    }
  );
  logger.info(
    `API Documentation available at http://localhost:${PORT}/api/docs`,
    {
      service: 'joining-dots-backend',
    }
  );
});
```

## Implementation Strategy

1. Start by implementing the database schema using Prisma
2. Create the controllers for each endpoint
3. Set up the routes and register them in the main app
4. Test each endpoint with Postman or similar tool
5. Implement error handling and validation
6. Add authentication middleware to protect the endpoints
7. Test the integration with the frontend

This implementation provides a solid foundation for the sessions and quizzes functionality, with proper error handling, validation, and authentication. The API endpoints are designed to match the frontend requirements, making integration seamless.
