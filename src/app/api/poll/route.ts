import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get the session ID from the query parameters
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    const isLive = url.searchParams.get('isLive');

    // Build the API URL with query parameters
    let apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/poll`;
    const params = new URLSearchParams();

    if (sessionId) {
      params.append('sessionId', sessionId);
    }

    if (isLive) {
      params.append('isLive', isLive);
    }

    if (params.toString()) {
      apiUrl += `?${params.toString()}`;
    }

    // Forward the request to the backend server
    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        // Forward authorization header if present
        ...(request.headers.get('Authorization')
          ? { Authorization: request.headers.get('Authorization') as string }
          : {}),
      },
      credentials: 'include',
    });

    // If the backend is not available, return empty array
    if (!response.ok) {
      console.log('Backend not available for polls, returning empty array');
      return NextResponse.json([]);
    }

    // Return the response from the backend
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in poll API route:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Forward the request to the backend server
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/poll`,
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
      console.log('Backend not available for poll creation, returning error');
      return NextResponse.json(
        {
          success: false,
          message: 'Unable to create poll. Backend server is not available.',
        },
        { status: 503 }
      ); // Service Unavailable
    }

    // Return the response from the backend
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in poll creation API route:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while trying to create the poll.',
      },
      { status: 500 }
    ); // Internal Server Error
  }
}
