export interface LLMConfig {
  provider: 'openai' | 'claude' | 'gemini' | 'DMXAPI' |'custom';
  apiKey: string;
  baseUrl?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface TaskGenerationRequest {
  input: string;
  systemPrompt?: string;
}

export interface TaskGenerationResponse {
  tasks: Array<{
    title: string;
    description: string;
    status: 'todo' | 'in-progress' | 'done' | 'archived';
  }>;
}