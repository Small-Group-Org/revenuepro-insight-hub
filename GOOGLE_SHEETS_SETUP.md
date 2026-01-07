 # Google Sheets API Setup Guide

This guide will help you set up Google Sheets API integration for the export functionality.

## Prerequisites

1. A Google account
2. Access to Google Cloud Console

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable billing for the project (required for API usage)

## Step 2: Enable Google Sheets API

1. In your Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google Sheets API"
3. Click on it and press "Enable"

## Step 3: Create API Credentials

### Create API Key

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the API key (you'll need this later)
4. Click "Restrict Key" and add these restrictions:
   - Application restrictions: HTTP referrers
   - API restrictions: Restrict key to Google Sheets API

### Create OAuth 2.0 Client ID

1. In the same Credentials page, click "Create Credentials" > "OAuth 2.0 Client IDs"
2. Choose "Web application" as the application type
3. Add your domain to "Authorized JavaScript origins":
   - For development: `http://localhost:5173` (or your dev server port)
   - For production: `https://yourdomain.com`
4. Add your domain to "Authorized redirect URIs":
   - For development: `http://localhost:5173`
   - For production: `https://yourdomain.com`
5. Copy the Client ID (you'll need this later)

## Step 4: Configure Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# Google API Configuration for Google Sheets Export
REACT_APP_GOOGLE_CLIENT_ID=your_oauth_client_id_here
REACT_APP_GOOGLE_API_KEY=your_api_key_here
```

Replace the placeholder values with your actual credentials.

## Step 5: Test the Integration

1. Start your development server
2. Navigate to the Compare Results page
3. Click "Export to Google Sheets"
4. You should be prompted to sign in with your Google account
5. After authentication, a new Google Sheet should be created with your data

## Troubleshooting

### Common Issues

1. **"Authentication failed" error**
   - Make sure your OAuth Client ID is correct
   - Verify that your domain is added to authorized origins
   - Check that the Google Sheets API is enabled

2. **"API key not valid" error**
   - Verify your API key is correct
   - Make sure the API key has access to Google Sheets API
   - Check that billing is enabled for your project

3. **"CORS error" in development**
   - Make sure `http://localhost:5173` is in your authorized origins
   - Try using a different port if needed

### Security Notes

- Never commit your `.env` file to version control
- Use environment-specific credentials for development and production
- Regularly rotate your API keys
- Monitor your API usage in Google Cloud Console

## Production Deployment

For production deployment:

1. Update your OAuth Client ID with your production domain
2. Set up proper environment variables in your hosting platform
3. Ensure your domain is added to authorized origins
4. Test the integration thoroughly before going live

## API Quotas and Limits

Google Sheets API has the following limits:
- 300 requests per minute per user
- 300 requests per minute per project
- 10 requests per second per user

For most use cases, these limits should be sufficient. Monitor your usage in Google Cloud Console. 
