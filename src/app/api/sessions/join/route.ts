import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Forward the request to the backend server
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/sessions/join`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Forward authorization header if present
          ...(request.headers.get('Authorization')
            ? { Authorization: request.headers.get('Authorization') as string }
            : {}),
        },
        body: JSON.stringify(body),
        credentials: 'include',
      }
    );

    // If the backend is not available, return an error
    if (!response.ok) {
      console.log('Backend not available for session join, returning error');

      // Get the error message from the response if available
      let errorMessage =
        'Unable to join session. Backend server is not available.';
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
    console.error('Error in sessions join API route:', error);

    // Return error in case of exception
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while trying to join the session.',
      },
      { status: 500 }
    ); // Internal Server Error
  }
}
