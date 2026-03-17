import { io, Socket } from 'socket.io-client';

export interface SocketIOEventHandlers {
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error | Event) => void;
  onMessage?: (event: { event: string; data: unknown[] }) => void;
  onJoinedPoll?: (event: {
    data?: { count?: number; pollId?: string; poll?: unknown };
    count?: number;
    poll?: unknown;
  }) => void;
  onActiveQuestion?: (event: { data?: { question?: unknown } }) => void;
  onQuestionEnded?: (event: {
    data?: { questionId?: string; pollId?: string };
  }) => void;
  onPollUpdated?: (event: {
    action: string;
    data: {
      question?: unknown;
      count?: number;
      results?: unknown;
      questionId?: string;
      pollId?: string;
    };
  }) => void;
  onParticipantCountUpdated?: (event: {
    data?: { count?: number };
    count?: number;
  }) => void;
  onNewResponse?: (event: {
    anonymous?: boolean;
    userName?: string;
  }) => void;
  onQuestionResults?: (event: {
    questionId: string;
    results: {
      options?: Array<{
        id?: string;
        optionId?: string;
        [key: string]: unknown;
      }>;
      [key: string]: unknown;
    };
  }) => void;
  onPollEnded?: (event: unknown) => void;
  onNewQuestion?: (event: {
    questionId: string;
  }) => void;
  onQuestionUpdated?: (event: unknown) => void;
}

class SocketIOService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private currentPollId: string | null = null;
  private eventHandlers: SocketIOEventHandlers = {};
  private isInitializing: boolean = false;

  // Set event handlers
  setEventHandlers(handlers: SocketIOEventHandlers): void {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  // Initialize Socket.IO connection
  initialize(token: string): void {
    // Prevent multiple initialization attempts
    if (this.isInitializing || (this.socket && this.socket.connected)) {
      console.log('Socket already initialized or initializing');
      return;
    }

    this.isInitializing = true;
    this.token = token;

    const socketUrl = this.getSocketUrl();

    console.log('🔧 Initializing Socket.IO with:');
    console.log('   Base URL:', socketUrl);
    console.log('   Token length:', token.length);
    console.log('   ✅ Using Socket.IO client for backend compatibility');

    // Create Socket.IO connection with authentication
    this.socket = io(socketUrl, {
      auth: {
        authorization: token,
      },
      query: {
        authorization: token,
      },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      forceNew: false, // Prevent creating new connections
    });

    this.setupEventListeners();
    this.isInitializing = false;
  }

  // Setup Socket.IO event listeners
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket.IO connected successfully');
      console.log('   Socket ID:', this.socket?.id);

      if (this.eventHandlers.onConnected) {
        this.eventHandlers.onConnected();
      }

      // Auto-join poll if we have a poll ID
      if (this.currentPollId) {
        console.log(`🔄 Auto-joining poll: ${this.currentPollId}`);
        this.joinPoll(this.currentPollId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket.IO disconnected:', reason);

      if (this.eventHandlers.onDisconnected) {
        this.eventHandlers.onDisconnected();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
      console.error('❌ Error details:', error.message);

      if (this.eventHandlers.onError) {
        this.eventHandlers.onError(error);
      }
    });

    // Poll-specific events
    this.socket.on('joined-poll', (data) => {
      console.log('🎉 Successfully joined poll:', data);

      if (this.eventHandlers.onJoinedPoll) {
        this.eventHandlers.onJoinedPoll(data);
      }
    });

    this.socket.on('active-question', (data) => {
      console.log('📋 Active question received:', data);

      if (this.eventHandlers.onActiveQuestion) {
        this.eventHandlers.onActiveQuestion(data);
      }
    });

    this.socket.on('question-ended', (data) => {
      console.log('⏰ Question ended:', data);

      if (this.eventHandlers.onQuestionEnded) {
        this.eventHandlers.onQuestionEnded(data);
      }
    });

    this.socket.on('poll-updated', (data) => {
      console.log('🔄 Poll updated:', data);

      if (this.eventHandlers.onPollUpdated) {
        this.eventHandlers.onPollUpdated(data);
      }
    });

    this.socket.on('participant-count-updated', (data) => {
      console.log('👥 Participant count updated:', data);

      if (this.eventHandlers.onParticipantCountUpdated) {
        this.eventHandlers.onParticipantCountUpdated(data);
      }
    });

    // Generic message handler
    this.socket.onAny((eventName, ...args) => {
      console.log('📨 Socket.IO event received:', eventName, args);

      if (this.eventHandlers.onMessage) {
        this.eventHandlers.onMessage({ event: eventName, data: args });
      }
    });
  }

  // Join a poll
  joinPoll(pollId: string): void {
    this.currentPollId = pollId;

    if (!this.socket || !this.socket.connected) {
      console.warn('⚠️ Socket.IO not connected, cannot join poll');
      return;
    }

    const joinMessage = {
      event: 'join-poll',
      data: pollId,
    };

    console.log('📤 Sending join-poll event:', joinMessage);
    this.socket.emit('join-poll', pollId);
  }

  // Leave a poll
  leavePoll(pollId: string): void {
    if (!this.socket || !this.socket.connected) {
      console.warn('⚠️ Socket.IO not connected, cannot leave poll');
      return;
    }

    console.log('📤 Leaving poll:', pollId);
    this.socket.emit('leave-poll', pollId);
    this.currentPollId = null;
  }

  // Send poll response
  sendPollResponse(
    pollId: string,
    questionId: string,
    response: string | string[] | number
  ): void {
    if (!this.socket || !this.socket.connected) {
      console.warn('⚠️ Socket.IO not connected, cannot send response');
      return;
    }

    const responseData = {
      pollId,
      questionId,
      response,
    };

    console.log('📤 Sending poll response:', responseData);
    this.socket.emit('poll-response', responseData);
  }

  // Disconnect
  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting Socket.IO');
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentPollId = null;
  }

  // Get Socket.IO URL from environment
  private getSocketUrl(): string {
    const baseUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8080';

    // Remove any WebSocket protocol and use HTTP/HTTPS for Socket.IO
    const httpUrl = baseUrl
      .replace(/^ws:\/\//, 'http://')
      .replace(/^wss:\/\//, 'https://');

    console.log('🔧 Socket.IO base URL:', httpUrl);
    return httpUrl;
  }

  // Check if connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Get current poll ID
  getCurrentPollId(): string | null {
    return this.currentPollId;
  }
}

// Export singleton instance
export const socketIOService = new SocketIOService();
export default socketIOService;
