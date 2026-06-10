import { PublicClientApplication } from '@azure/msal-browser';

const CLIENT_ID_KEY = 'dpdsbill_azure_client_id';
const REDIRECT_URI_KEY = 'dpdsbill_azure_redirect_uri';

// We'll store the MSAL instance dynamically since the client ID is configurable
let msalInstance = null;

// Determine default redirect URI based on current hostname
const getDefaultRedirectUri = () => {
  return window.location.origin + window.location.pathname;
};

// Check if a client ID is saved
export function getSavedClientId() {
  return localStorage.getItem(CLIENT_ID_KEY) || '';
}

export function saveSyncSettings(clientId, customRedirectUri = '') {
  if (clientId) {
    localStorage.setItem(CLIENT_ID_KEY, clientId.trim());
  } else {
    localStorage.removeItem(CLIENT_ID_KEY);
  }

  if (customRedirectUri) {
    localStorage.setItem(REDIRECT_URI_KEY, customRedirectUri.trim());
  } else {
    localStorage.removeItem(REDIRECT_URI_KEY);
  }

  // Reset instance to force re-initialization
  msalInstance = null;
}

export function getSavedRedirectUri() {
  return localStorage.getItem(REDIRECT_URI_KEY) || getDefaultRedirectUri();
}

// Get or initialize MSAL instance
async function getMsalInstance() {
  const clientId = getSavedClientId();
  if (!clientId) {
    throw new Error('Please configure your Azure Client ID in settings first.');
  }

  if (msalInstance) {
    return msalInstance;
  }

  const redirectUri = getSavedRedirectUri();

  const msalConfig = {
    auth: {
      clientId: clientId,
      authority: 'https://login.microsoftonline.com/common',
      redirectUri: redirectUri,
      postLogoutRedirectUri: redirectUri,
    },
    cache: {
      cacheLocation: 'localStorage',
      storeAuthStateInCookie: false,
    }
  };

  msalInstance = new PublicClientApplication(msalConfig);
  await msalInstance.initialize();
  return msalInstance;
}

// Retrieve active account
function getActiveAccount(msal) {
  const accounts = msal.getAllAccounts();
  if (accounts.length === 0) {
    return null;
  }
  return accounts[0];
}

// Authentication Service Exports
export async function login() {
  const msal = await getMsalInstance();
  try {
    const loginRequest = {
      scopes: ['user.read', 'Files.ReadWrite'],
      prompt: 'select_account'
    };
    const response = await msal.loginPopup(loginRequest);
    msal.setActiveAccount(response.account);
    return response.account;
  } catch (error) {
    console.error('MSAL Login Error:', error);
    throw error;
  }
}

export async function logout() {
  const msal = await getMsalInstance();
  const account = getActiveAccount(msal);
  if (account) {
    await msal.logoutPopup({
      account: account,
      postLogoutRedirectUri: getSavedRedirectUri()
    });
  }
  localStorage.removeItem('msalAccount');
  msalInstance = null;
}

export async function getCurrentUser() {
  try {
    const msal = await getMsalInstance();
    const account = getActiveAccount(msal);
    return account;
  } catch (e) {
    return null;
  }
}

// Get Token Silently (or via popup if needed)
async function getAccessToken() {
  const msal = await getMsalInstance();
  const account = getActiveAccount(msal);
  
  if (!account) {
    throw new Error('No active account found. Please sign in.');
  }

  const tokenRequest = {
    scopes: ['Files.ReadWrite'],
    account: account
  };

  try {
    const response = await msal.acquireTokenSilent(tokenRequest);
    return response.accessToken;
  } catch (error) {
    console.warn('Acquire token silent failed, trying popup', error);
    // If silent acquisition fails, try popup
    const response = await msal.acquireTokenPopup(tokenRequest);
    return response.accessToken;
  }
}

// Graph API Calls
const GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0';
const FILE_PATH = '/me/drive/root:/DpDsBill/db.json';

// Fetch file metadata or content
export async function downloadDatabase() {
  const token = await getAccessToken();
  
  // 1. Fetch file meta to see if it exists
  const metaUrl = `${GRAPH_BASE_URL}${FILE_PATH}`;
  
  try {
    const metaRes = await fetch(metaUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (metaRes.status === 404) {
      // File does not exist yet
      return null;
    }

    if (!metaRes.ok) {
      const errorText = await metaRes.text();
      throw new Error(`Graph API error: ${metaRes.status} - ${errorText}`);
    }

    // 2. File exists, download content
    const contentUrl = `${GRAPH_BASE_URL}${FILE_PATH}:/content`;
    const contentRes = await fetch(contentUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!contentRes.ok) {
      throw new Error(`Failed to download database content: ${contentRes.statusText}`);
    }

    const data = await contentRes.json();
    return data;
  } catch (e) {
    console.error('Error downloading database:', e);
    throw e;
  }
}

// Upload file to OneDrive
export async function uploadDatabase(dbObject) {
  const token = await getAccessToken();
  const uploadUrl = `${GRAPH_BASE_URL}${FILE_PATH}:/content`;

  // Make sure we format it nicely
  const body = JSON.stringify(dbObject, null, 2);

  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: body
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Upload failed: ${res.statusText} - ${errText}`);
  }

  const responseData = await res.json();
  return responseData;
}
