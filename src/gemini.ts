import { GoogleGenAI } from '@google/genai';

export interface PRGenResult {
  title: string;
  description: string;
}

/**
 * Calls Gemini to analyze the PR diff and generate title + description.
 */
export async function generatePRContent(
  apiKey: string,
  diffText: string,
  systemPrompt: string,
  modelName: string = 'gemini-2.5-flash'
): Promise<PRGenResult> {
  const ai = new GoogleGenAI({ apiKey });

  try {
    const contents = `Here is the git diff of the PR:\n\n${diffText}`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            title: {
              type: 'STRING',
              description: 'A clean and descriptive title for the PR, ideally following Conventional Commits format'
            },
            description: {
              type: 'STRING',
              description: 'A detailed, structured PR description in Markdown'
            }
          },
          required: ['title', 'description']
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error('Gemini returned an empty response');
    }

    try {
      const parsed = JSON.parse(text) as PRGenResult;
      if (!parsed.title || !parsed.description) {
        throw new Error('JSON response does not contain the required fields "title" and "description".');
      }
      return parsed;
    } catch (parseErr: any) {
      throw new Error(`Failed to parse Gemini JSON output: ${parseErr.message}\nRaw Output: ${text}`);
    }
  } catch (err: any) {
    throw new Error(`Gemini API Error: ${err.message}`);
  }
}
