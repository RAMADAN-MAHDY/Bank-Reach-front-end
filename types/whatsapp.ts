/**
 * WhatsApp Embedded Signup Types
 */

export interface MetaTokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
}

export interface ExchangeCodeRequest {
  code: string;
  redirect_uri?: string;
}

export interface ExchangeCodeResponse {
  success: boolean;
  access_token?: string;
  message?: string;
}

export type EmbeddedSignupEvent = 'FINISH' | 'CANCEL' | 'ERROR';

export interface WhatsAppAssets {
  phone_number_id: string;
  waba_id: string;
  business_id: string;
}

export interface EmbeddedSignupMessage {
  data: WhatsAppAssets;
  type: 'WA_EMBEDDED_SIGNUP';
  event: EmbeddedSignupEvent;
}

export interface FacebookLoginResponse {
  authResponse?: {
    accessToken?: string;
    expiresIn?: number;
    signedRequest?: string;
    userID?: string;
    code?: string;
  };
  status?: string;
}

export interface FacebookSDK {
  init: (params: {
    appId: string;
    autoLogAppEvents: boolean;
    xfbml: boolean;
    version: string;
  }) => void;
  login: (
    callback: (response: FacebookLoginResponse) => void,
    options: {
      config_id: string;
      response_type: string;
      override_default_response_type: boolean;
      extras: {
        setup: Record<string, unknown>;
      };
    }
  ) => void;
  getLoginStatus?: (callback: (response: FacebookLoginResponse) => void) => void;
}

declare global {
  interface Window {
    FB?: FacebookSDK;
    fbAsyncInit?: () => void;
  }
}

export type ConnectionStatus = 
  | 'idle'
  | 'connecting'
  | 'success'
  | 'failed'
  | 'cancelled';