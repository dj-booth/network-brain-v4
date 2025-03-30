import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true // Since we're calling from the client component
});

export async function generateEmailContent(prompt: string): Promise<string> {
  if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",  // or "gpt-3.5-turbo" if you prefer
      messages: [
        {
          role: "system",
          content: "You are a professional networker writing thoughtful, concise email introductions. Keep the tone warm but professional."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error generating email content:', error);
    throw error;
  }
} 