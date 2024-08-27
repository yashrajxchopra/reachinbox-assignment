import { processEmail as processGmailEmail } from './emailService';
import { processEmail as processOutlookEmail } from './outlookEmailService';
import { CronJob } from 'cron';

async function processAllEmails() {
  console.log('Starting automated email processing...');
  
  try {
    // Process Gmail
    await processGmailEmail();
    console.log('Gmail processing completed');
    
    // Process Outlook
    await processOutlookEmail();
    console.log('Outlook processing completed');
  } catch (error) {
    console.error('Error in automated email processing:', error);
  }
}

export function startAutomatedProcessing() {
  // Set up a cron job to run every 5 minutes
  const job = new CronJob('*/5 * * * *', processAllEmails);

  job.start(); //start karo

  console.log('Automated email processing scheduled. Will run every 5 minutes.');
}