import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('Poll join request:', {
      joiningCode: body.joiningCode,
      pollId: body.pollId,
      autoRejoin: body.autoRejoin,
    });

    // Handle auto-rejoin requests (when user has previously joined)
    if (body.autoRejoin && body.pollId) {
      console.log('Processing auto-rejoin request for poll:', body.pollId);

      // For auto-rejoin, we don't need a joining code
      // The backend should recognize the user and allow access
      const autoRejoinPayload = {
        pollId: body.pollId,
        autoRejoin: true,
      };

      // Forward the auto-rejoin request to the backend
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/poll/join`,
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
          body: JSON.stringify(autoRejoinPayload),
          credentials: 'include',
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Auto-rejoin successful');
        return NextResponse.json(data);
      } else {
        console.log(
          '❌ Auto-rejoin failed, backend response:',
          response.status
        );
        // If auto-rejoin fails, fall through to normal error handling
      }
    }

    // Validate the joining code for normal join requests
    if (
      !body.autoRejoin &&
      (!body.joiningCode ||
        typeof body.joiningCode !== 'string' ||
        body.joiningCode.trim() === '')
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid joining code. Please provide a valid code.',
        },
        { status: 400 }
      );
    }

    // Forward the request to the backend server
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/poll/join`,
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

    // If the backend is not available or returns an error
    if (!response.ok) {
      console.log(`Backend returned error for poll join: ${response.status}`);

      // Handle specific error codes
      if (response.status === 404) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Poll not found. Please check the joining code and try again.',
          },
          { status: 404 }
        );
      }

      if (response.status === 403) {
        return NextResponse.json(
          {
            success: false,
            message: 'You need a valid joining code to access this poll.',
          },
          { status: 403 }
        );
      }

      // Handle admin privileges required error
      if (response.status === 401) {
        return NextResponse.json(
          {
            success: false,
            message:
              'This poll requires admin privileges or a valid joining code.',
          },
          { status: 401 }
        );
      }

      // Get the error message from the response if available
      let errorMessage = 'Unable to join poll. Please try again later.';
      try {
        const errorData = await response.json();
        if (errorData && errorData.message) {
          errorMessage = errorData.message;

          // Handle "already joined" case specially
          if (
            errorMessage.toLowerCase().includes('already joined') ||
            errorMessage.toLowerCase().includes('already a participant') ||
            errorMessage.toLowerCase().includes('user already exists')
          ) {
            // For already joined users, try to get poll data and return success
            console.log('User already joined poll, treating as success');

            // Try to get poll data from the error response or make a separate request
            if (errorData.poll) {
              return NextResponse.json({
                success: true,
                message: 'You have already joined this poll. Welcome back!',
                poll: errorData.poll,
              });
            }

            // For already joined users, include the joining code so frontend can handle it
            return NextResponse.json({
              success: true,
              message: 'You have already joined this poll. Welcome back!',
              alreadyJoined: true,
              joiningCode: body.joiningCode, // Include the joining code for frontend mapping
            });
          }
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
    console.error('Error in poll join API route:', error);

    // Return error in case of exception
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while trying to join the poll.',
      },
      { status: 500 }
    ); // Internal Server Error
  }
}
