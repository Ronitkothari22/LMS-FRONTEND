import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching user sessions from backend API');
    console.log(
      'API URL:',
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/sessions/user`
    );

    // Get the authorization header for logging
    const authHeader = request.headers.get('Authorization');
    console.log('Authorization header present:', !!authHeader);

    // Forward the request to the backend server
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/sessions/user`,
      {
        headers: {
          'Content-Type': 'application/json',
          // Forward authorization header if present
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        credentials: 'include',
      }
    );

    // If the backend is not available, return empty arrays
    if (!response.ok) {
      console.log(
        'Backend not available for user sessions, returning empty arrays'
      );
      console.log('Response status:', response.status);
      console.log('Response status text:', response.statusText);

      try {
        const errorData = await response.text();
        console.log('Error response:', errorData);
      } catch {
        console.log('Could not parse error response');
      }

      // Return empty arrays instead of dummy data
      return NextResponse.json({
        active: [],
        past: [],
      });
    }

    // Return the response from the backend
    const data = await response.json();
    console.log('User sessions API response:', data);

    // The backend API should already be filtering sessions where the user is a participant
    // Just pass through the response as-is
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in user sessions API route:', error);

    // Return empty arrays in case of error
    return NextResponse.json({
      active: [],
      past: [],
    });
  }
}
