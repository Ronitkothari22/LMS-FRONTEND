import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: pollId } = await params;

  try {
    // Forward the request to the backend server
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/poll/${pollId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          // Forward authorization header if present
          ...(request.headers.get('Authorization')
            ? { Authorization: request.headers.get('Authorization') as string }
            : {}),
        },
        credentials: 'include',
      }
    );

    // If the backend is not available, return a mock poll for development
    if (!response.ok) {
      console.log(
        'Backend not available for poll details, returning mock data'
      );

      // In development, return mock data for testing
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          id: pollId,
          title: 'Sample Poll',
          sessionId: 'sample-session-id',
          type: 'SINGLE_CHOICE',
          isLive: true,
          showResults: true,
          isPublic: true,
          joiningCode: 'ABC123',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          participants: 5,
          autoAdvance: true,
          questions: [
            {
              id: 'q1',
              question: 'What is your favorite color?',
              type: 'SINGLE_CHOICE',
              order: 0,
              options: [
                { id: 'o1', text: 'Red', order: 0 },
                { id: 'o2', text: 'Blue', order: 1 },
                { id: 'o3', text: 'Green', order: 2 },
                { id: 'o4', text: 'Yellow', order: 3 },
              ],
            },
            {
              id: 'q2',
              question: 'What is your favorite programming language?',
              type: 'SINGLE_CHOICE',
              order: 1,
              options: [
                { id: 'o5', text: 'JavaScript', order: 0 },
                { id: 'o6', text: 'Python', order: 1 },
                { id: 'o7', text: 'Java', order: 2 },
                { id: 'o8', text: 'C#', order: 3 },
              ],
            },
          ],
        });
      }

      // Get the error message from the response if available
      let errorMessage =
        'Unable to fetch poll details. Backend server is not available.';
      try {
        const errorData = await response.json();
        if (errorData && errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // If we can't parse the error response, use the default message
      }

      return NextResponse.json(
        {
          success: false,
          message: errorMessage,
        },
        { status: response.status || 503 }
      ); // Service Unavailable
    }

    // Return the response from the backend
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in poll details API route:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while trying to fetch poll details.',
      },
      { status: 500 }
    ); // Internal Server Error
  }
}
