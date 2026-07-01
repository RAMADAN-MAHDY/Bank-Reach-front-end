import { NextRequest, NextResponse } from 'next/server';
import { ExchangeCodeRequest, ExchangeCodeResponse, MetaTokenResponse } from '@/types/whatsapp';

export async function POST(request: NextRequest): Promise<NextResponse<ExchangeCodeResponse>> {
  try {
    // Parse request body
    const body = await request.json();
    const { code } = body as ExchangeCodeRequest;

    // Validate code
    if (!code || typeof code !== 'string' || code.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing or invalid authorization code',
        },
        { status: 400 }
      );
    }

    // Get environment variables
    const clientId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    const clientSecret = process.env.FACEBOOK_APP_SECRET;
    const apiVersion = process.env.NEXT_PUBLIC_FACEBOOK_API_VERSION || 'v25.0';

    // Validate environment variables
    if (!clientId) {
      console.error('Missing NEXT_PUBLIC_FACEBOOK_APP_ID');
      return NextResponse.json(
        {
          success: false,
          message: 'Server configuration error',
        },
        { status: 500 }
      );
    }

    if (!clientSecret) {
      console.error('Missing FACEBOOK_APP_SECRET');
      return NextResponse.json(
        {
          success: false,
          message: 'Server configuration error',
        },
        { status: 500 }
      );
    }

    // Prepare request to Meta Graph API
    const tokenUrl = `https://graph.facebook.com/${apiVersion}/oauth/access_token`;
    
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: code.trim(),
    });

    const response = await fetch(`${tokenUrl}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Handle Meta API response
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Meta API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });

      let errorMessage = 'Failed to exchange authorization code';
      
      if (response.status === 400) {
        errorMessage = 'Invalid or expired authorization code';
      } else if (response.status === 401) {
        errorMessage = 'Invalid Facebook app credentials';
      } else if (response.status === 403) {
        errorMessage = 'Access denied by Meta API';
      }

      return NextResponse.json(
        {
          success: false,
          message: errorMessage,
        },
        { status: response.status }
      );
    }

    // Parse successful response
    const tokenData = (await response.json()) as MetaTokenResponse;

    if (!tokenData.access_token) {
      return NextResponse.json(
        {
          success: false,
          message: 'No access token received from Meta API',
        },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      access_token: tokenData.access_token,
    });

  } catch (error) {
    console.error('Exchange code error:', error);

    // Handle specific error types
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request format',
        },
        { status: 400 }
      );
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Network error while connecting to Meta API',
        },
        { status: 503 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// Add OPTIONS method for CORS preflight
export async function OPTIONS(): Promise<NextResponse> {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}