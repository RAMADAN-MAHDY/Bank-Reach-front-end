import { NextRequest, NextResponse } from 'next/server';
import { ExchangeCodeRequest, ExchangeCodeResponse, MetaTokenResponse } from '@/types/whatsapp';

export async function POST(request: NextRequest): Promise<NextResponse<ExchangeCodeResponse>> {
  try {
    // Parse request body
    const body = await request.json();
    const { code, redirect_uri } = body as ExchangeCodeRequest;

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
    
    // For WhatsApp Embedded Signup, we need to use the same redirect_uri that Facebook SDK uses
    // Try the provided redirect_uri, or use the default one for embedded signup
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: code.trim(),
      grant_type: 'authorization_code',
    });

    // Add redirect_uri if provided (for embedded signup, this is required)
    if (redirect_uri && typeof redirect_uri === 'string' && redirect_uri.trim() !== '') {
      params.append('redirect_uri', redirect_uri.trim());
      console.log('Using provided redirect_uri:', redirect_uri);
    } else {
      console.log('No redirect_uri provided, using empty redirect_uri for embedded signup');
    }

    const fullUrl = `${tokenUrl}?${params.toString()}`;
    console.log('Meta API Request (without secret):', 
      `${tokenUrl}?client_id=${clientId}&code=${code.trim().substring(0, 20)}...&grant_type=authorization_code`);
    console.log('Code length:', code.trim().length);
    console.log('API Version:', apiVersion);

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Handle Meta API response
    if (!response.ok) {
      let errorData = {};
      try {
        errorData = await response.json();
      } catch (e) {
        console.error('Failed to parse Meta API error response:', e);
      }
      
      console.error('Meta API error details:', {
        status: response.status,
        statusText: response.statusText,
        url: fullUrl.replace(clientSecret, '***'),
        error: errorData,
        clientId: clientId,
        apiVersion: apiVersion,
        codeLength: code.trim().length,
      });

      let errorMessage = 'Failed to exchange authorization code';
      let detailedMessage = '';
      
      if (response.status === 400) {
        errorMessage = 'Invalid or expired authorization code';
        const metaError = errorData as { error?: { message?: string }; message?: string };
        detailedMessage = metaError.error?.message || metaError.message || '';
      } else if (response.status === 401) {
        errorMessage = 'Invalid Facebook app credentials';
        detailedMessage = 'Check FACEBOOK_APP_SECRET and NEXT_PUBLIC_FACEBOOK_APP_ID';
      } else if (response.status === 403) {
        errorMessage = 'Access denied by Meta API';
        const metaError = errorData as { error?: { message?: string }; message?: string };
        detailedMessage = metaError.error?.message || '';
      }

      return NextResponse.json(
        {
          success: false,
          message: errorMessage,
          details: detailedMessage,
          debug: {
            clientId: clientId,
            apiVersion: apiVersion,
            codeLength: code.trim().length,
          }
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