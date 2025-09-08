import { LLMConfig, LLMMessage, LLMResponse } from '@/types/llm';

class LLMService {
  private config: LLMConfig | null = null;

  setConfig(config: LLMConfig) {
    this.config = config;
  }

  getConfig(): LLMConfig | null {
    return this.config;
  }

  async callLLM(messages: LLMMessage[]): Promise<LLMResponse> {
    if (!this.config) {
      throw new Error('LLM configuration not set');
    }

    switch (this.config.provider) {
      case 'openai':
        return this.callOpenAI(messages);
      case 'claude':
        return this.callClaude(messages);
      case 'gemini':
        return this.callGemini(messages);
      case 'custom':
        return this.callCustom(messages);
      default:
        throw new Error(`Unsupported LLM provider: ${this.config.provider}`);
    }
  }

  private async callOpenAI(messages: LLMMessage[]): Promise<LLMResponse> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config!.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config!.model,
        messages,
        temperature: this.config!.temperature || 0.7,
        max_tokens: this.config!.maxTokens || 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
    };
  }

  private async callClaude(messages: LLMMessage[]): Promise<LLMResponse> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.config!.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config!.model,
        max_tokens: this.config!.maxTokens || 1000,
        messages: messages.filter(m => m.role !== 'system'),
        system: messages.find(m => m.role === 'system')?.content,
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.content[0].text,
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      },
    };
  }

  private async callGemini(messages: LLMMessage[]): Promise<LLMResponse> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.config!.model}:generateContent?key=${this.config!.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: messages
            .filter(m => m.role !== 'system')
            .map(m => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: m.content }],
            })),
          systemInstruction: messages.find(m => m.role === 'system')?.content
            ? { parts: [{ text: messages.find(m => m.role === 'system')!.content }] }
            : undefined,
          generationConfig: {
            temperature: this.config!.temperature || 0.7,
            maxOutputTokens: this.config!.maxTokens || 1000,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.candidates[0].content.parts[0].text,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0,
      },
    };
  }

  private async callCustom(messages: LLMMessage[]): Promise<LLMResponse> {
    const response = await fetch(this.config!.baseUrl!, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config!.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config!.model,
        messages,
        temperature: this.config!.temperature || 0.7,
        max_tokens: this.config!.maxTokens || 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Custom API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content || data.content || '',
      usage: data.usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    };
  }
}

export const llmService = new LLMService();