import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: pollId } = await params;

  try {
    const body = await request.json();

    // Forward the request to the backend server
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/poll/${pollId}/response`,
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
      console.log('Backend returned error for poll response:', response.status);

      // Get the error message from the response if available
      let errorMessage = 'Unable to submit poll response.';
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
    console.error('Error in poll response API route:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while trying to submit poll response.',
      },
      { status: 500 }
    ); // Internal Server Error
  }
}
