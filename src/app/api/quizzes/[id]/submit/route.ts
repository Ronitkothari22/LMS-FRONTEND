import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const quizId = params.id;

  console.log('API Route - Quiz Submit - Quiz ID:', quizId);
  console.log(
    'API Route - Quiz Submit - API Base URL:',
    process.env.NEXT_PUBLIC_API_BASE_URL
  );

  try {
    // Parse the request body
    const body = await request.json();
    console.log('API Route - Quiz Submit - Request Body:', body);

    // Validate the request body
    if (!body.answers) {
      console.error('Missing answers field in request body:', body);
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request format. Expected an answers field.',
        },
        { status: 400 }
      );
    }

    // Log if sessionId is provided
    if (body.sessionId) {
      console.log(
        'API Route - Quiz Submit - Session ID provided:',
        body.sessionId
      );
    }

    // Determine if answers is an array or an object
    const isAnswersArray = Array.isArray(body.answers);
    const isAnswersObject = typeof body.answers === 'object' && !isAnswersArray;

    console.log('Answers format:', {
      isArray: isAnswersArray,
      isObject: isAnswersObject,
      rawType: typeof body.answers,
    });

    // Handle array format
    if (isAnswersArray) {
      console.log('Processing answers as array');

      if (body.answers.length === 0) {
        console.error('Answers array is empty:', body);
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid request format. Expected at least one answer.',
          },
          { status: 400 }
        );
      }

      // Ensure each answer has the required fields
      for (const answer of body.answers) {
        console.log('Validating array answer:', answer);

        if (!answer.questionId) {
          console.error('Missing questionId in answer:', answer);
          return NextResponse.json(
            {
              success: false,
              message:
                'Invalid answer format. Each answer must have a questionId field.',
            },
            { status: 400 }
          );
        }

        if (!answer.answer && answer.answer !== '') {
          console.error('Missing answer field in answer object:', answer);
          return NextResponse.json(
            {
              success: false,
              message:
                'Invalid answer format. Each answer must have an answer field.',
            },
            { status: 400 }
          );
        }
      }

      // Convert array to object format if needed
      const answersObject = {};
      body.answers.forEach((answer) => {
        answersObject[answer.questionId] = {
          answer: answer.answer,
          timeTaken: answer.timeTaken || 30,
        };
      });

      // Replace the array with the object
      body.answers = answersObject;
      console.log('Converted answers array to object format:', body.answers);
    }
    // Handle object format
    else if (isAnswersObject) {
      console.log('Processing answers as object');

      const questionIds = Object.keys(body.answers);

      if (questionIds.length === 0) {
        console.error('Answers object is empty:', body);
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid request format. Expected at least one answer.',
          },
          { status: 400 }
        );
      }

      // Ensure each answer has the required fields
      for (const questionId of questionIds) {
        const answer = body.answers[questionId];
        console.log('Validating object answer:', { questionId, answer });

        if (!answer) {
          console.error('Missing answer object for questionId:', questionId);
          return NextResponse.json(
            {
              success: false,
              message:
                'Invalid answer format. Each question ID must have an answer object.',
            },
            { status: 400 }
          );
        }

        if (!answer.answer && answer.answer !== '') {
          console.error('Missing answer field in answer object:', answer);
          return NextResponse.json(
            {
              success: false,
              message:
                'Invalid answer format. Each answer must have an answer field.',
            },
            { status: 400 }
          );
        }
      }
    }
    // Neither array nor object
    else {
      console.error(
        'Answers field is neither an array nor an object:',
        body.answers
      );
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid request format. Expected answers to be an array or an object.',
        },
        { status: 400 }
      );
    }

    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    console.log('API Route - Quiz Submit - Auth Header Present:', !!authHeader);

    // Construct the full URL
    const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/quizzes/${quizId}/submit`;
    console.log('API Route - Quiz Submit - Full URL:', apiUrl);

    // Create a payload that includes sessionId if provided
    const payload = { ...body };

    // Make sure sessionId is included in the payload if provided
    if (body.sessionId) {
      console.log(
        'Including sessionId in backend API request:',
        body.sessionId
      );

      // Ensure sessionId is properly formatted
      if (typeof payload.sessionId !== 'string') {
        payload.sessionId = String(payload.sessionId);
      }
    }

    // Add userId if not present but available in cookies
    if (!payload.userId) {
      const cookies = request.cookies;
      const userIdCookie = cookies.get('userId');
      if (userIdCookie) {
        payload.userId = userIdCookie.value;
        console.log('Added userId from cookies:', payload.userId);
      }
    }

    console.log(
      'Final payload being sent to backend:',
      JSON.stringify(payload, null, 2)
    );

    // The payload now comes in the correct format with question IDs as keys and answer text as values
    // We can pass it directly to the backend without conversion
    console.log('Payload is already in the correct format for the backend');

    // Ensure the payload has the required structure
    if (!payload.answers || typeof payload.answers !== 'object') {
      console.error('Invalid answers format in payload:', payload.answers);
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid answers format. Expected an object with question IDs as keys.',
        },
        { status: 400 }
      );
    }

    if (!payload.timeTaken || typeof payload.timeTaken !== 'object') {
      console.error('Invalid timeTaken format in payload:', payload.timeTaken);
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid timeTaken format. Expected an object with question IDs as keys.',
        },
        { status: 400 }
      );
    }

    if (!payload.attemptTime || typeof payload.attemptTime !== 'string') {
      console.error('Invalid attemptTime format in payload:', payload.attemptTime);
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid attemptTime format. Expected an ISO string.',
        },
        { status: 400 }
      );
    }

    console.log(
      'Reformatted payload for backend:',
      JSON.stringify(payload, null, 2)
    );

    // Forward the request to the backend server
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward authorization header if present
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(payload),
      credentials: 'include',
    });

    console.log('API Route - Quiz Submit - Response Status:', response.status);
    console.log('API Route - Quiz Submit - Response OK:', response.ok);

    // If the backend is not available, return an error
    if (!response.ok) {
      console.log('Backend not available for quiz submission, returning error');
      console.log('Response status:', response.status);
      console.log('Response status text:', response.statusText);

      // Get the error message from the response if available
      let errorMessage =
        'Unable to submit quiz. Backend server is not available.';
      let errorData = {};

      try {
        const responseText = await response.text();
        console.log(
          'API Route - Quiz Submit - Error Response Text:',
          responseText
        );

        // Try to parse as JSON if possible
        try {
          const responseData = JSON.parse(responseText);
          console.log(
            'API Route - Quiz Submit - Error Response Data:',
            responseData
          );

          if (responseData && responseData.message) {
            errorMessage = responseData.message;

            // Handle validation errors specifically
            if (
              responseData.message === 'Validation failed' &&
              Array.isArray(responseData.errors)
            ) {
              console.log('Validation errors detected:', responseData.errors);

              // Create a more detailed error message that includes validation errors
              const errorDetails = responseData.errors
                .map((err) => {
                  if (typeof err === 'string') return err;
                  if (err.msg) return err.msg;
                  if (err.message) return err.message;
                  return JSON.stringify(err);
                })
                .join('; ');

              if (errorDetails) {
                errorMessage = `Validation failed: ${errorDetails}`;
              }
            }
          }
          errorData = responseData;
        } catch (jsonError) {
          console.error('Error parsing JSON from response text:', jsonError);
          // Use the raw text as the error message if it's not empty
          if (responseText && responseText.trim()) {
            errorMessage = `Server error: ${responseText.substring(0, 100)}${responseText.length > 100 ? '...' : ''}`;
          }
        }
      } catch (e) {
        // If we can't get the response text, use the default message
        console.error('Error getting response text:', e);
      }

      // Provide more specific error messages based on status code
      if (response.status === 400) {
        errorMessage =
          errorMessage ||
          'Invalid quiz submission. Please check your answers and try again.';
      } else if (response.status === 401) {
        errorMessage =
          errorMessage ||
          'Your session has expired. Please log in again to submit the quiz.';
      } else if (response.status === 404) {
        errorMessage =
          errorMessage ||
          'Quiz not found. It may have been removed or is no longer available.';
      } else if (response.status >= 500) {
        errorMessage =
          errorMessage ||
          'Server error while processing your quiz. Please try again later.';
      }

      return NextResponse.json(
        {
          success: false,
          message: errorMessage,
          ...errorData,
          statusCode: response.status,
        },
        { status: response.status || 503 }
      ); // Service Unavailable
    }

    // Parse the response data
    const responseData = await response.json();
    console.log('API Route - Quiz Submit - Response Data:', responseData);

    // If the response doesn't include a responseId or attemptId, add one
    if (
      responseData.data &&
      !responseData.data.id &&
      !responseData.data.responseId &&
      !responseData.data.attemptId
    ) {
      console.log('Adding missing responseId to the response data');
      responseData.data.responseId = `generated-${Date.now()}`;
    }

    // Add session information to the response if it's not already included
    if (responseData.data && body.sessionId && !responseData.data.sessionId) {
      console.log('Adding sessionId to the response data');
      responseData.data.sessionId = body.sessionId;
    }

    // Log the final response data being sent back to the client
    console.log(
      'Final response data being sent to client:',
      JSON.stringify(responseData, null, 2)
    );

    // Return the response from the backend
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error in quiz submission API route:', error);
    console.error('Error details:', error.message);

    // Try to get more detailed error information
    let errorDetails = 'Unknown error';
    try {
      errorDetails = JSON.stringify(error);
    } catch {
      errorDetails = error.toString();
    }

    // Return a more detailed error response
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while submitting the quiz',
        error: error.message,
        details: errorDetails,
      },
      { status: 500 }
    );
  }
}
