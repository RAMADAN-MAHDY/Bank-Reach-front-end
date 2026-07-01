'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ConnectionStatus,
  EmbeddedSignupMessage,
  FacebookLoginResponse,
  WhatsAppAssets,
} from '@/types/whatsapp';
import { loadFacebookSDK } from '@/lib/facebook-sdk';

interface WhatsAppEmbeddedSignupProps {
  onSuccess?: (assets: WhatsAppAssets & { access_token: string }) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

export default function WhatsAppEmbeddedSignup({
  onSuccess,
  onError,
  onCancel,
}: WhatsAppEmbeddedSignupProps) {
  // State management
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [error, setError] = useState<string>('');
  const [accessToken, setAccessToken] = useState<string>('');
  const [assets, setAssets] = useState<WhatsAppAssets | null>(null);
  
  // Refs for cleanup
  const messageListenerRef = useRef<((event: MessageEvent) => void) | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (messageListenerRef.current) {
      window.removeEventListener('message', messageListenerRef.current);
      messageListenerRef.current = null;
    }
  }, []);

  // Setup message listener for embedded signup events
  const setupMessageListener = useCallback(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate message origin (optional but recommended)
      // if (event.origin !== 'https://www.facebook.com') return;

      try {
        const message = event.data as EmbeddedSignupMessage;
        
        if (message.type === 'WA_EMBEDDED_SIGNUP') {
          console.log('WhatsApp Embedded Signup Event:', message);

          switch (message.event) {
            case 'FINISH':
              setAssets(message.data);
              setStatus('success');
              if (onSuccess && accessToken) {
                onSuccess({ ...message.data, access_token: accessToken });
              }
              break;

            case 'CANCEL':
              setStatus('cancelled');
              setError('User cancelled the WhatsApp signup flow');
              if (onCancel) onCancel();
              break;

            case 'ERROR':
              setStatus('failed');
              setError('WhatsApp signup encountered an error');
              if (onError) onError('WhatsApp signup encountered an error');
              break;
          }
        }
      } catch (err) {
        console.error('Error processing message event:', err);
      }
    };

    // Remove existing listener if any
    cleanup();

    // Add new listener
    window.addEventListener('message', handleMessage);
    messageListenerRef.current = handleMessage;

    return cleanup;
  }, [accessToken, cleanup, onSuccess, onError, onCancel]);

  // Initialize Facebook SDK and setup listeners
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        await loadFacebookSDK();
        if (mounted) {
          setupMessageListener();
        }
      } catch (err) {
        if (mounted) {
          setStatus('failed');
          setError('Failed to load Facebook SDK');
          if (onError) onError('Failed to load Facebook SDK');
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
      cleanup();
    };
  }, [setupMessageListener, cleanup, onError]);

  // Handle Facebook login callback
  const handleFacebookLogin = useCallback((response: FacebookLoginResponse) => {
    console.log('Facebook login response:', response);
    
    // Prevent duplicate processing
    if (status !== 'idle') {
      console.log('Already processing, ignoring duplicate callback');
      return;
    }

    if (response.status === 'connected' && response.authResponse?.code) {
      // Start the exchange process
      setStatus('connecting');
      setError('');

      console.log('Starting code exchange with code:', response.authResponse.code.substring(0, 20) + '...');

      // Determine the redirect URI based on the current environment
      // Important: This must match EXACTLY what's in Meta Dashboard
      const protocol = window.location.protocol;
      const host = window.location.host;
      const redirectUri = `${protocol}//${host}/auth/callback`;

      console.log('Using redirect_uri in API request:', redirectUri);

      // Exchange code for access token (non-async callback)
      fetch('/api/whatsapp/exchange-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: response.authResponse.code,
          redirect_uri: redirectUri,
        }),
      })
        .then(async (exchangeResponse) => {
          const data = await exchangeResponse.json();
          console.log('Exchange response:', data);

          if (!exchangeResponse.ok || !data.success) {
            throw new Error(data.message || 'Failed to exchange authorization code');
          }

          setAccessToken(data.access_token);
          console.log('Access token received:', data.access_token.substring(0, 20) + '...');
          // Status will be updated by message listener when embedded signup completes
        })
        .catch((err) => {
          console.error('Exchange error:', err);
          setStatus('failed');
          let errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
          
          // Try to get more details from the response data
          if (err instanceof Error && err.message.includes('authorization code')) {
            errorMessage = `Invalid authorization code. Possible reasons:
            1. Code expired (valid for 30 seconds only)
            2. Incorrect App ID or App Secret
            3. WhatsApp Business API not enabled
            4. Configuration ID incorrect
            5. redirect_uri not added to Meta Dashboard
            6. redirect_uri mismatch between frontend and backend
            7. Trailing slash difference in redirect_uri`;
          }
          
          setError(errorMessage);
          if (onError) onError(errorMessage);
        });
    } else {
      console.log('Facebook login failed:', response.status);
      setStatus('failed');
      const errorMessage = response.status === 'not_authorized' 
        ? 'User denied authorization'
        : 'Facebook login failed';
      setError(errorMessage);
      if (onError) onError(errorMessage);
    }
  }, [onError, status]);

  // Handle connect button click
  const handleConnect = useCallback(async () => {
    try {
      setStatus('connecting');
      setError('');

      const FB = window.FB;
      if (!FB) {
        throw new Error('Facebook SDK not loaded');
      }

      // Determine the redirect URI based on the current environment
      // Important: This must match EXACTLY what's in Meta Dashboard
      const protocol = window.location.protocol;
      const host = window.location.host;
      const redirectUri = `${protocol}//${host}/auth/callback`;
      
      console.log('Using redirect_uri in FB.login:', redirectUri);

      // Start WhatsApp Embedded Signup flow
      FB.login(
        handleFacebookLogin,
        {
          config_id: process.env.NEXT_PUBLIC_WHATSAPP_CONFIG_ID || '',
          response_type: 'code',
          override_default_response_type: true,
          redirect_uri: redirectUri,
          extras: {
            setup: {},
          },
        }
      );

    } catch (err) {
      setStatus('failed');
      const errorMessage = err instanceof Error ? err.message : 'Failed to start WhatsApp signup';
      setError(errorMessage);
      if (onError) onError(errorMessage);
    }
  }, [handleFacebookLogin, onError]);

  // Copy to clipboard utility
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    }
  }, []);

  // Reset state
  const handleReset = useCallback(() => {
    setStatus('idle');
    setError('');
    setAccessToken('');
    setAssets(null);
  }, []);

  // Render loading state
  if (status === 'connecting') {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-md">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
        <p className="text-gray-700 font-medium">Connecting to WhatsApp Business...</p>
        <p className="text-gray-500 text-sm mt-2">Please wait while we establish the connection</p>
      </div>
    );
  }

  // Render success state
  if (status === 'success' && assets && accessToken) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">WhatsApp Business Connected Successfully!</h2>
          </div>
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Connect Another
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Access Token Card */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-700">Access Token</h3>
              <button
                onClick={() => copyToClipboard(accessToken)}
                className="px-3 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors"
              >
                Copy
              </button>
            </div>
            <div className="bg-white p-3 rounded border border-gray-300 font-mono text-sm text-gray-800 break-all">
              {accessToken.substring(0, 30)}...
            </div>
            <p className="text-xs text-gray-500 mt-2">Keep this token secure. Do not share it publicly.</p>
          </div>

          {/* Phone Number ID Card */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-700">Phone Number ID</h3>
              <button
                onClick={() => copyToClipboard(assets.phone_number_id)}
                className="px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
              >
                Copy
              </button>
            </div>
            <div className="bg-white p-3 rounded border border-gray-300 font-mono text-sm text-gray-800">
              {assets.phone_number_id}
            </div>
          </div>

          {/* WABA ID Card */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-700 mb-3">WABA ID</h3>
            <div className="bg-white p-3 rounded border border-gray-300 font-mono text-sm text-gray-800">
              {assets.waba_id}
            </div>
          </div>

          {/* Business ID Card */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-700 mb-3">Business ID</h3>
            <div className="bg-white p-3 rounded border border-gray-300 font-mono text-sm text-gray-800">
              {assets.business_id}
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Connection Successful</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Your WhatsApp Business account is now connected. You can use these credentials to send and receive messages through the WhatsApp Business API.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (status === 'failed') {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
            <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800">Connection Failed</h2>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={handleConnect}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  // Render cancelled state
  if (status === 'cancelled') {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
            <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800">Signup Cancelled</h2>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-700">The WhatsApp signup flow was cancelled by the user.</p>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={handleConnect}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  // Render idle/initial state
  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.723.227 1.378.195 1.895.118.57-.086 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.76.982.998-3.675-.236-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.9 6.994c-.004 5.45-4.438 9.88-9.888 9.88m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.333.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.333 11.893-11.893 0-3.18-1.24-6.162-3.495-8.411" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Connect WhatsApp Business</h2>
        <p className="text-gray-600">
          Connect your WhatsApp Business account to start sending and receiving messages through the WhatsApp Business API.
        </p>
      </div>

      <div className="space-y-4 mb-8">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-sm font-bold">1</span>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-gray-700 font-medium">Facebook Login</p>
            <p className="text-gray-500 text-sm">You will be redirected to Facebook for authentication</p>
          </div>
        </div>

        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-sm font-bold">2</span>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-gray-700 font-medium">WhatsApp Business Setup</p>
            <p className="text-gray-500 text-sm">Complete the WhatsApp Business embedded signup flow</p>
          </div>
        </div>

        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-sm font-bold">3</span>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-gray-700 font-medium">Get Credentials</p>
            <p className="text-gray-500 text-sm">Receive your Access Token, Phone Number ID, WABA ID, and Business ID</p>
          </div>
        </div>
      </div>

      <button
        onClick={handleConnect}
        disabled={status !== 'idle'}
        className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center"
      >
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.723.227 1.378.195 1.895.118.57-.086 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.76.982.998-3.675-.236-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.9 6.994c-.004 5.45-4.438 9.88-9.888 9.88m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.333.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.333 11.893-11.893 0-3.18-1.24-6.162-3.495-8.411" />
        </svg>
        Connect WhatsApp Business
      </button>

      <p className="text-xs text-gray-500 text-center mt-4">
        By connecting, you agree to WhatsApp Business Terms of Service and Privacy Policy
      </p>
    </div>
  );
}