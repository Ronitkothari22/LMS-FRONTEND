import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Forward the request to the backend server
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/sessions`,
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

    // If the backend is not available, return empty arrays
    if (!response.ok) {
      console.log('Backend not available, returning empty arrays');

      // Return empty arrays instead of dummy data
      return NextResponse.json({
        active: [],
        past: [],
      });
    }

    // Return the response from the backend
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in sessions API route:', error);

    // Return empty arrays in case of error
    return NextResponse.json({
      active: [],
      past: [],
    });
  }
}

// Handle POST requests for joining sessions
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

    // If the backend is not available, return error
    if (!response.ok) {
      console.log('Backend not available for session join, returning error');

      return NextResponse.json(
        {
          success: false,
          message: 'Unable to join session. Backend server is not available.',
        },
        { status: 503 }
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
