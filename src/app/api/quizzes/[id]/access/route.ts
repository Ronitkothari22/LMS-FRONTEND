import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const quizId = params.id;

  console.log('API Route - Quiz Access Check - Quiz ID:', quizId);
  console.log(
    'API Route - Quiz Access Check - API Base URL:',
    process.env.NEXT_PUBLIC_API_BASE_URL
  );

  try {
    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    console.log(
      'API Route - Quiz Access Check - Auth Header Present:',
      !!authHeader
    );

    // Construct the full URL for checking quiz access
    const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/quiz/${quizId}/access`;
    console.log('API Route - Quiz Access Check - Full URL:', apiUrl);

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
      'API Route - Quiz Access Check - Response Status:',
      response.status
    );
    console.log('API Route - Quiz Access Check - Response OK:', response.ok);

    // Handle 403 Forbidden (user cannot access quiz)
    if (response.status === 403) {
      const errorData = await response.json();
      
      // Check if this quiz allows retries
      const retryQuiz = errorData.retryQuiz || errorData.data?.retryQuiz;
      console.log('API Route - Quiz Access Check - Error Data:', errorData);
      console.log('API Route - Quiz Access Check - Retry Quiz Flag:', retryQuiz);
      
      if (retryQuiz) {
        // If retries are allowed, return CAN_RETRY status with access granted
        const retryResponse = {
          canAccess: true,
          userStatus: 'CAN_RETRY',
          message: errorData.message || 'You can retake this quiz',
          lastAttemptScore: errorData.lastAttemptScore || errorData.data?.lastAttemptScore,
          lastAttemptDate: errorData.lastAttemptDate || errorData.data?.lastAttemptDate,
        };
        console.log('API Route - Quiz Access Check - Returning retry response:', retryResponse);
        return NextResponse.json(retryResponse, { status: 200 });
      }
      
      // If no retries allowed, deny access
      return NextResponse.json(
        {
          canAccess: false,
          userStatus: 'COMPLETED',
          message: errorData.message || 'You have already completed this quiz',
          lastAttemptScore: errorData.lastAttemptScore,
          lastAttemptDate: errorData.lastAttemptDate,
        },
        { status: 200 } // Return 200 with access denied info instead of 403
      );
    }

    if (!response.ok) {
      // For other errors, try to get the error message
      let errorMessage = 'Failed to check quiz access';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // If we can't parse the error response, use the default message
      }

      console.error('API Route - Quiz Access Check - Error:', errorMessage);
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
      'API Route - Quiz Access Check - Response Data:',
      responseData
    );

    // Return the access status data
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error in quiz access check API route:', error);
    console.error('Error details:', error.message);

    // Return a more detailed error response
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while checking quiz access',
        error: error.message,
      },
      { status: 500 }
    );
  }
}