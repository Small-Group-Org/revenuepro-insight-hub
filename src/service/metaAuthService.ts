/**
 * Meta (Facebook) OAuth Service
 * Handles the OAuth flow for Meta/Facebook authentication
 */

// Meta OAuth Configuration from environment variables
export const META_OAUTH_CONFIG = {
  CLIENT_ID: import.meta.env.VITE_META_CLIENT_ID ,
  CONFIG_ID: import.meta.env.VITE_META_CONFIG_ID,  
  APP_SECRET: import.meta.env.VITE_META_APP_SECRET || "", // Note: This should ideally be stored securely on backend
  REDIRECT_URI: import.meta.env.VITE_META_REDIRECT_URI , 
  OAUTH_BASE_URL: import.meta.env.VITE_META_OAUTH_BASE_URL,  
  RESPONSE_TYPE: import.meta.env.VITE_META_RESPONSE_TYPE || "code",
};

/**
 * Generate a random nonce for OAuth state verification
 */
export const generateNonce = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

/**
 * Build the Meta OAuth authorization URL
 */
export const buildMetaOAuthUrl = (): string => {
  const nonce = generateNonce();
  
  // Store nonce in sessionStorage for verification (optional, for security)
  sessionStorage.setItem("meta_oauth_nonce", nonce);

  const params = new URLSearchParams({
    client_id: META_OAUTH_CONFIG.CLIENT_ID,
    redirect_uri: META_OAUTH_CONFIG.REDIRECT_URI,
    config_id: META_OAUTH_CONFIG.CONFIG_ID,
    response_type: META_OAUTH_CONFIG.RESPONSE_TYPE,
    nonce: nonce,
  });

  return `${META_OAUTH_CONFIG.OAUTH_BASE_URL}?${params.toString()}`;
};

/**
 * Initiate Meta OAuth flow by redirecting to Facebook
 */
export const initiateMetaOAuth = (): void => {
  const oauthUrl = buildMetaOAuthUrl();
  window.location.href = oauthUrl;
};

