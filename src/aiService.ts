
import OpenAI from 'openai';
import { config } from './config';

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

export const categorizeEmail = async (subject: string,content: string): Promise<string> => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-0125",
      messages: [
        {role: "system", content: "You are an AI assistant that categorizes emails. Categorize the email as either 'Action Required', 'Information', or 'Follow-up Needed'. Respond with only the category."},
        {role: "user", content: `Subject: ${subject}\n\nContent: ${content}`}
      ],
      max_tokens: 60,
    });
    const category = completion.choices[0].message.content?.trim() || 'Uncategorized';
    console.log('Categorized as:', category);
    return category;
  // return completion.choices[0].message.content?.trim()|| 'Uncategorized';
  // return completion.choices[0].text?.trim();
} catch (error) {
  console.error('Error in categorizeEmail:', error);
  return 'Uncategorized';
}
};

export const generateResponse = async (category: string,subject: string, content: string): Promise<string> => {
  // const prompt = `Generate a response to the following email, which has been categorized as "${category}":\n\n${content}`;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-0125",
      messages: [
        // {role: "system", content: "You are a helpful assistant that generates email responses."},
        {role: "system", content: "You are a helpful assistant responding to emails. Provide a concise, professional response that addresses the content of the email. Your response should be in the tone of a human assistant."},
        {role: "user", content: `Category: ${category}\nSubject: ${subject}\n\nContent: ${content}\n\nGenerate a response:`}
        // {role: "user", content: `Generate a response to the following email, which has been categorized as "${category}":\n\n${content}`}
      ],
      max_tokens: 150,
    });

    // return completion.choices[0].message.content?.trim() || 'No response generated';
    const response = completion.choices[0].message.content?.trim() || 'No response generated';
    console.log('Generated response:', response);
    return response;
  } catch (error) {
    console.error('Error in generateResponse:', error);
    return 'No response generated';
  }
};