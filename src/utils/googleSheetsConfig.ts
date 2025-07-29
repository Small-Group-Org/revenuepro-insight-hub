// Google Sheets API Configuration
export const GOOGLE_SHEETS_CONFIG = {
  // Google OAuth 2.0 Client ID
  // You'll need to create this in Google Cloud Console
  CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID || '',
  
  // Google Sheets API Key
  API_KEY: process.env.REACT_APP_GOOGLE_API_KEY || '',
  
  // Scopes required for Google Sheets
  SCOPES: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file'
  ].join(' '),
  
  // Discovery document for Google Sheets API
  DISCOVERY_DOC: 'https://sheets.googleapis.com/$discovery/rest?version=v4',
};

// Google OAuth 2.0 configuration
export const GOOGLE_OAUTH_CONFIG = {
  client_id: GOOGLE_SHEETS_CONFIG.CLIENT_ID,
  scope: GOOGLE_SHEETS_CONFIG.SCOPES,
  response_type: 'token',
  redirect_uri: window.location.origin,
};

// Function to initialize Google API
export const initializeGoogleAPI = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Load Google API script
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      window.gapi.load('client:auth2', async () => {
        try {
          await window.gapi.client.init({
            apiKey: GOOGLE_SHEETS_CONFIG.API_KEY,
            clientId: GOOGLE_SHEETS_CONFIG.CLIENT_ID,
            discoveryDocs: [GOOGLE_SHEETS_CONFIG.DISCOVERY_DOC],
            scope: GOOGLE_SHEETS_CONFIG.SCOPES,
          });
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

// Function to authenticate user
export const authenticateUser = async (): Promise<boolean> => {
  try {
    const authInstance = window.gapi.auth2.getAuthInstance();
    if (!authInstance.isSignedIn.get()) {
      await authInstance.signIn();
    }
    return authInstance.isSignedIn.get();
  } catch (error) {
    console.error('Authentication failed:', error);
    return false;
  }
};

// Function to create a new Google Sheet
export const createNewGoogleSheet = async (title: string): Promise<string> => {
  try {
    const response = await window.gapi.client.sheets.spreadsheets.create({
      properties: {
        title: title,
      },
    });
    
    return response.result.spreadsheetId || '';
  } catch (error) {
    console.error('Failed to create Google Sheet:', error);
    throw error;
  }
};

// Function to update Google Sheet with data
export const updateGoogleSheet = async (
  spreadsheetId: string,
  range: string,
  values: any[][]
): Promise<void> => {
  try {
    await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: range,
      valueInputOption: 'RAW',
      resource: {
        values: values,
      },
    });
  } catch (error) {
    console.error('Failed to update Google Sheet:', error);
    throw error;
  }
};

// Function to format Google Sheet
export const formatGoogleSheet = async (spreadsheetId: string): Promise<void> => {
  try {
    // Format header row
    await window.gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetId,
      resource: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: {
                    red: 0.8,
                    green: 0.8,
                    blue: 0.8,
                  },
                  textFormat: {
                    bold: true,
                  },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
          // Auto-resize columns
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId: 0,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: 6,
              },
            },
          },
        ],
      },
    });
  } catch (error) {
    console.error('Failed to format Google Sheet:', error);
    // Don't throw error for formatting failures
  }
};

// Type definitions for Google API
declare global {
  interface Window {
    gapi: any;
  }
} 