import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const sessionId = params.id;

  console.log('API Route - Session Details - Session ID:', sessionId);
  console.log(
    'API Route - Session Details - API Base URL:',
    process.env.NEXT_PUBLIC_API_BASE_URL
  );

  // Get the authorization header
  const authHeader = request.headers.get('Authorization');
  console.log(
    'API Route - Session Details - Auth Header Present:',
    !!authHeader
  );

  // Construct the full URL
  const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/sessions/${sessionId}`;
  console.log('API Route - Session Details - Full URL:', apiUrl);

  try {
    // Forward the request to the backend server
    console.log('API Route - Making fetch request to backend...');
    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        // Forward authorization header if present
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      credentials: 'include',
    });

    console.log('API Route - Response Status:', response.status);
    console.log('API Route - Response OK:', response.ok);

    // If the backend is not available, return an error
    if (!response.ok) {
      console.log('Backend not available for session details, returning error');

      // Get the error message from the response if available
      let errorMessage =
        'Unable to fetch session details. Backend server is not available.';
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
    console.log('API Route - Response Data:', JSON.stringify(data, null, 2));

    // Check if the data has the expected structure
    if (!data || (!data.data && !data.success)) {
      console.log(
        'API Route - Warning: Response data does not have expected structure'
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(
      `Error in session details API route for ID ${sessionId}:`,
      error
    );

    // Return error in case of exception
    return NextResponse.json(
      {
        success: false,
        message: `An error occurred while fetching session details for ID ${sessionId}.`,
      },
      { status: 500 }
    ); // Internal Server Error
  }
}

// Handle POST requests for leaving a session
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const sessionId = params.id;
  const url = new URL(request.url);
  const path = url.pathname.split('/').pop();

  // Check if this is a "leave" request
  if (path === 'leave') {
    try {
      // Forward the request to the backend server
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/sessions/${sessionId}/leave`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Forward authorization header if present
            ...(request.headers.get('Authorization')
              ? {
                  Authorization: request.headers.get('Authorization') as string,
                }
              : {}),
          },
          credentials: 'include',
        }
      );

      // If the backend is not available, return the error
      if (!response.ok) {
        console.log('Backend not available for session leave, returning error');

        // Get the error message from the response if available
        let errorMessage =
          'Unable to leave session. Backend server is not available.';
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
      console.error(
        `Error in session leave API route for ID ${sessionId}:`,
        error
      );

      // Return error in case of exception
      return NextResponse.json(
        {
          success: false,
          message: `An error occurred while trying to leave session ${sessionId}.`,
        },
        { status: 500 }
      ); // Internal Server Error
    }
  }

  // For other POST requests to this endpoint
  return NextResponse.json(
    {
      success: false,
      message: 'Unsupported operation',
    },
    { status: 400 }
  );
}
