import express from 'express';
import { getAuthUrl, getToken } from './authService';
import { getOutlookAuthUrl, getOutlookToken, verifyOutlookToken } from './outlookAuthService';
import { processEmail as processGmailEmail } from './emailService';
import { processEmail as processOutlookEmail } from './outlookEmailService';
import { config } from './config';
import './auto'; 

const app = express();
const port = 3000;

console.log('Outlook Redirect URI:', config.outlook.redirectUri);

app.get('/auth/gmail', (req, res) => {
  const authUrl = getAuthUrl();
  res.redirect(authUrl);
});

app.get('/auth/gmail/callback', async (req, res) => {
  const code = req.query.code as string;
  try {
    const tokens = await getToken(code);
    // Here you should save the tokens securely for future use
    res.send('Gmail authentication successful!');
  } catch (error) {
    console.error('Gmail authentication failed:', error);
    res.status(500).send('Gmail authentication failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
});

app.get('/auth/outlook', async (req, res) => {
  try {
    const authUrl = await getOutlookAuthUrl();
    console.log('Redirecting to Outlook auth URL:', authUrl);
    res.redirect(authUrl);
  } catch (error) {
    console.error('Error generating Outlook auth URL:', error);
    res.status(500).send('Error generating Outlook auth URL: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
});

app.get('/auth/outlook/callback', async (req, res) => {
  const code = req.query.code as string;
  try {
    console.log('Received auth code:', code);
    const token = await getOutlookToken(code);
    console.log('Token acquired successfully');
    res.send('Outlook authentication successful!');
  } catch (error) {
    console.error('Outlook authentication failed:', error);
    res.status(500).send('Outlook authentication failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
});

app.get('/verify-outlook-auth', async (req, res) => {
  try {
    const isAuthenticated = await verifyOutlookToken();
    if (isAuthenticated) {
      res.send('Outlook authentication is valid');
    } else {
      res.status(401).send('Outlook authentication is invalid or expired');
    }
  } catch (error) {
    console.error('Error verifying Outlook authentication:', error);
    res.status(500).send('Error verifying Outlook authentication: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
});

app.get('/process-email/:provider', async (req, res) => {
  const provider = req.params.provider;

  try {
    let result;
    if (provider === 'gmail') {
      result = await processGmailEmail();
    } else if (provider === 'outlook') {
      const isAuthenticated = await verifyOutlookToken();
      if (!isAuthenticated) {
        throw new Error('Outlook authentication is invalid or expired');
      }
      result = await processOutlookEmail();
    } else {
      throw new Error('Invalid email provider');
    }
    res.send(result);
  } catch (error) {
    console.error('Error processing email:', error);
    res.status(500).send('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('Automated email processing is active.');
});