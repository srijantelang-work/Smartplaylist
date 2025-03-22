declare module 'groq-sdk' {
  export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }

  export interface ChatCompletionChoice {
    message?: ChatMessage;
    index?: number;
    finish_reason?: string;
  }

  export interface ChatCompletion {
    id: string;
    choices: ChatCompletionChoice[];
    created: number;
    model: string;
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  }

  export interface GroqOptions {
    apiKey: string;
    dangerouslyAllowBrowser?: boolean;
  }

  export interface ChatCompletionParams {
    messages: ChatMessage[];
    model: string;
    temperature?: number;
    max_tokens?: number;
    stop?: string[];
  }

  export class Groq {
    constructor(options: GroqOptions);
    chat: {
      completions: {
        create(params: ChatCompletionParams): Promise<ChatCompletion>;
      };
    };
  }
} 