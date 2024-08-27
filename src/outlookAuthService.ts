import { ConfidentialClientApplication, Configuration, AuthorizationUrlRequest, AuthorizationCodeRequest } from "@azure/msal-node";
import { Client } from "@microsoft/microsoft-graph-client";
import { config } from './config';

if (!config.outlook.clientId || !config.outlook.clientSecret || !config.outlook.tenantId || !config.outlook.redirectUri) {
  throw new Error('Outlook configuration is incomplete. Please check your .env file.');
}

let accessToken: string | null = null;

const msalConfig: Configuration = {
  auth: {
    clientId: config.outlook.clientId,
    clientSecret: config.outlook.clientSecret,
    authority: `https://login.microsoftonline.com/${config.outlook.tenantId}`,
  }
};

const pca = new ConfidentialClientApplication(msalConfig);
const redirectUri = config.outlook.redirectUri;

export const getOutlookAuthUrl = async () => {
  const authCodeUrlParameters: AuthorizationUrlRequest = {
    scopes: ["https://graph.microsoft.com/.default"],
    redirectUri: redirectUri,
  };

  return await pca.getAuthCodeUrl(authCodeUrlParameters);
};

export const getOutlookToken = async (code: string) => {
  const tokenRequest: AuthorizationCodeRequest = {
    code: code,
    scopes: ["https://graph.microsoft.com/.default"],
    redirectUri: redirectUri,
  };
  
  try {
    const response = await pca.acquireTokenByCode(tokenRequest);
    accessToken = response.accessToken;
    console.log('Token acquired successfully');
    return accessToken;
  } catch (error) {
    console.error('Error acquiring token:', error);
    throw error;
  }
};

export const getOutlookClient = () => {
  if (!accessToken) {
    console.error('Access token not available. Please authenticate first.');
    throw new Error('Access token not available. Please authenticate first.');
  }
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    }
  });
};

export const verifyOutlookToken = async () => {
  try {
    const client = getOutlookClient();
    const result = await client.api('/me').get();
    console.log('Token verification successful:', result);
    return true;
  } catch (error) {
    console.error('Token verification failed:', error);
    return false;
  }
};