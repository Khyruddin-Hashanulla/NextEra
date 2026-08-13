import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { isFeatureEnabled } from './featureToggle.service';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function callOpenAI(messages: OpenAIMessage[], temperature = 0.7, maxTokens = 2000): Promise<string> {
  if (!env.openaiApiKey) {
    throw ApiError.badRequest('AI features are not configured. Please set OPENAI_API_KEY.');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: env.openaiModel,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw ApiError.internal(`AI service error: ${error}`);
  }

  const data: any = await response.json();
  return data.choices[0]?.message?.content || '';
}

export async function generateCourseDescription(
  title: string,
  category: string,
  level: string,
  keywords: string[]
): Promise<string> {
  const aiEnabled = await isFeatureEnabled('ai_features');
  if (!aiEnabled) throw ApiError.badRequest('AI features are disabled');

  const prompt = `Generate a compelling course description for an online course with the following details:
- Title: "${title}"
- Category: ${category}
- Level: ${level}
- Keywords: ${keywords.join(', ')}

Include:
1. A short tagline (1 sentence)
2. A detailed description (2-3 paragraphs covering what students will learn, prerequisites, and outcomes)
3. A list of 5 key learning objectives

Format the response with markdown headers.`;

  return callOpenAI(
    [
      { role: 'system', content: 'You are an expert course content creator for an EdTech platform.' },
      { role: 'user', content: prompt },
    ],
    0.7,
    1500
  );
}

export async function generateQuizQuestions(topic: string, count: number, difficulty: string): Promise<string> {
  const aiEnabled = await isFeatureEnabled('ai_features');
  if (!aiEnabled) throw ApiError.badRequest('AI features are disabled');

  const prompt = `Generate ${count} multiple-choice quiz questions about "${topic}" at ${difficulty} difficulty level.

For each question, provide:
- Question text
- 4 options (A, B, C, D)
- The correct answer letter
- A brief explanation of why the answer is correct

Format each question as:
## Question 1
[Question text]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
**Correct Answer:** [Letter]
**Explanation:** [Explanation]`;

  return callOpenAI(
    [
      { role: 'system', content: 'You are an expert quiz generator for educational content.' },
      { role: 'user', content: prompt },
    ],
    0.5,
    2500
  );
}

export async function generateAssignment(topic: string, duration: string, skills: string[]): Promise<string> {
  const aiEnabled = await isFeatureEnabled('ai_features');
  if (!aiEnabled) throw ApiError.badRequest('AI features are disabled');

  const prompt = `Create a practical programming assignment on "${topic}" with:
- Estimated duration: ${duration}
- Skills tested: ${skills.join(', ')}

Include:
1. Assignment title
2. Problem description / scenario
3. Requirements (bullet points)
4. Expected deliverables
5. Grading rubric (5 criteria)
6. Hints for getting started

Make it practical and hands-on.`;

  return callOpenAI(
    [
      { role: 'system', content: 'You are an expert technical instructor creating hands-on assignments.' },
      { role: 'user', content: prompt },
    ],
    0.6,
    2000
  );
}

export async function chatWithAI(message: string, history: { role: string; content: string }[]): Promise<string> {
  const aiEnabled = await isFeatureEnabled('ai_features');
  if (!aiEnabled) throw ApiError.badRequest('AI features are disabled');

  const messages: OpenAIMessage[] = [
    {
      role: 'system',
      content:
        'You are an AI learning assistant for the NextEra EdTech platform. You help students with course-related questions, explain concepts, provide coding help, and suggest learning resources. Be concise, accurate, and encouraging.',
    },
    ...history.map((h) => ({
      role: h.role as 'user' | 'assistant',
      content: h.content,
    })),
    { role: 'user', content: message },
  ];

  return callOpenAI(messages, 0.7, 1000);
}
