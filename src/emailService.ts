
import { google } from 'googleapis';
import { oauth2Client } from './authService';
import { categorizeEmail, generateResponse } from './aiService';

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

export const getLatestEmail = async () => {
  const response = await gmail.users.messages.list({
    userId: 'me',
    q: 'is:unread',
    maxResults: 1,
  });

  const messageId = response.data.messages?.[0]?.id;

  if (!messageId) {
    throw new Error('No unread messages found');
  }

  const message = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
  });

  return message.data;
};

export async function sendEmail(to: string, subject: string, body: string) {
  const encodedMessage = Buffer.from(
    `To: ${to}\r\n` +
    `Subject: ${subject}\r\n\r\n` +
    `${body}`
  ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage,
    },
  });
}

export async function applyLabelToEmail(emailId: string, labelName: string) {
  try {
    const res = await gmail.users.labels.list({ userId: 'me' });
    let label = res.data.labels?.find(l => l.name === labelName);

    if (!label) {
      const createRes = await gmail.users.labels.create({
        userId: 'me',
        requestBody: {
          name: labelName,
          labelListVisibility: 'labelShow',
          messageListVisibility: 'show'
        }
      });
      label = createRes.data;
    }

    await gmail.users.messages.modify({
      userId: 'me',
      id: emailId,
      requestBody: {
        addLabelIds: [label.id!],
        removeLabelIds: ['UNREAD']
      }
    });

    console.log(`Applied label ${labelName} to email ${emailId}`);
  } catch (error) {
    console.error('Error applying label:', error);
  }
}

export async function processEmail() {
  try {
    const email = await getLatestEmail();
    const subject = email.payload?.headers?.find(h => h.name?.toLowerCase() === 'subject')?.value || 'No Subject';
    const content = email.snippet || '';
    const sender = email.payload?.headers?.find(h => h.name?.toLowerCase() === 'from')?.value || '';

    const category = await categorizeEmail(subject, content);
    const response = await generateResponse(category, subject, content);

    await sendEmail(sender, `Re: ${subject}`, response);
    await applyLabelToEmail(email.id!, category);

    return `Email processed. Category: ${category}, Response sent to: ${sender}`;
  } catch (error) {
    console.error('Error processing email:', error);
    return 'Error processing email';
  }
}