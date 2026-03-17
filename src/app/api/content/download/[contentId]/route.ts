import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { contentId: string } }
) {
  const contentId = params.contentId;

  console.log('API Route - Content Download - Content ID:', contentId);
  console.log(
    'API Route - Content Download - API Base URL:',
    process.env.NEXT_PUBLIC_API_BASE_URL
  );

  try {
    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    console.log(
      'API Route - Content Download - Auth Header Present:',
      !!authHeader
    );

    if (!authHeader) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authorization header is required',
        },
        { status: 401 }
      );
    }

    // Construct the full URL for the download endpoint
    // Note: NEXT_PUBLIC_API_BASE_URL already includes /api at the end
    const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/content/download/${contentId}`;
    console.log('API Route - Content Download - Full URL:', apiUrl);

    // Forward the request to the backend server
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      credentials: 'include',
    });

    console.log(
      'API Route - Content Download - Response Status:',
      response.status
    );
    console.log('API Route - Content Download - Response OK:', response.ok);

    if (!response.ok) {
      // Handle different error status codes
      let errorMessage = 'Failed to download content';
      
      switch (response.status) {
        case 401:
          errorMessage = 'You are not authorized to download this content';
          break;
        case 404:
          errorMessage = 'Content not found or you do not have access to it';
          break;
        case 403:
          errorMessage = 'You do not have permission to download this content';
          break;
        case 500:
          errorMessage = 'Server error while processing the download';
          break;
        default:
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch {
            // If we can't parse the error response, use the default message
          }
      }

      console.error('API Route - Content Download - Error:', errorMessage);
      return NextResponse.json(
        {
          success: false,
          message: errorMessage,
        },
        { status: response.status }
      );
    }

    // Get the file stream from the backend
    const fileBuffer = await response.arrayBuffer();
    
    // Get the content type and filename from backend response headers
    const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
    const contentDisposition = response.headers.get('Content-Disposition');
    
    console.log('API Route - Content Download - Content Type:', contentType);
    console.log('API Route - Content Download - Content Disposition:', contentDisposition);

    // Create the response with proper headers
    const downloadResponse = new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition || 'attachment',
        'Content-Length': fileBuffer.byteLength.toString(),
        // Add cache control headers
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

    console.log('API Route - Content Download - File downloaded successfully');
    return downloadResponse;

  } catch (error) {
    console.error('Error in content download API route:', error);
    console.error('Error details:', error.message);

    // Return a more detailed error response
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while downloading the content',
        error: error.message,
      },
      { status: 500 }
    );
  }
} 