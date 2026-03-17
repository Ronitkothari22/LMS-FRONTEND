import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const quizId = params.id;

  console.log('API Route - Quiz Attempt Status - Quiz ID:', quizId);
  console.log(
    'API Route - Quiz Attempt Status - API Base URL:',
    process.env.NEXT_PUBLIC_API_BASE_URL
  );

  try {
    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    console.log(
      'API Route - Quiz Attempt Status - Auth Header Present:',
      !!authHeader
    );

    // Construct the full URL for checking attempt status
    // This endpoint should be implemented in the backend according to the backend-implementation-guide.md
    const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/quizzes/${quizId}/attempt-status`;
    console.log('API Route - Quiz Attempt Status - Full URL:', apiUrl);

    // Forward the request to the backend server
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Forward authorization header if present
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      credentials: 'include',
    });

    console.log(
      'API Route - Quiz Attempt Status - Response Status:',
      response.status
    );
    console.log('API Route - Quiz Attempt Status - Response OK:', response.ok);

    if (!response.ok) {
      // If 404, user hasn't attempted the quiz yet
      if (response.status === 404) {
        return NextResponse.json({
          hasAttempted: false,
          isCompleted: false,
          canRetake: false,
        });
      }

      // For other errors, try to get the error message
      let errorMessage = 'Failed to check quiz attempt status';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // If we can't parse the error response, use the default message
      }

      console.error('API Route - Quiz Attempt Status - Error:', errorMessage);
      return NextResponse.json(
        {
          success: false,
          message: errorMessage,
        },
        { status: response.status }
      );
    }

    // Parse the response
    const responseData = await response.json();
    console.log(
      'API Route - Quiz Attempt Status - Response Data:',
      responseData
    );

    // Return the attempt status data
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error in quiz attempt status API route:', error);
    console.error('Error details:', error.message);

    // Return a more detailed error response
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while checking quiz attempt status',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
