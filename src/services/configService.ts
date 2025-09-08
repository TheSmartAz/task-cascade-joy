import { LLMConfig } from '@/types/llm';
import { llmService } from './llmService';
import { taskGenerationService } from './taskGenerationService';

export class ConfigService {
  private static readonly LLM_CONFIG_KEY = 'llm_config';
  private static readonly SYSTEM_PROMPT_KEY = 'system_prompt';

  /**
   * Initialize all configurations from localStorage
   */
  initializeConfigs() {
    this.loadLLMConfig();
    this.loadSystemPrompt();
  }

  /**
   * Load LLM configuration from localStorage and set it to llmService
   */
  loadLLMConfig(): LLMConfig | null {
    try {
      const configStr = localStorage.getItem(ConfigService.LLM_CONFIG_KEY);
      if (configStr) {
        const config: LLMConfig = JSON.parse(configStr);
        llmService.setConfig(config);
        return config;
      }
    } catch (error) {
      console.error('Failed to load LLM config from localStorage:', error);
    }
    return null;
  }

  /**
   * Save LLM configuration to localStorage and llmService
   */
  saveLLMConfig(config: LLMConfig) {
    try {
      localStorage.setItem(ConfigService.LLM_CONFIG_KEY, JSON.stringify(config));
      llmService.setConfig(config);
    } catch (error) {
      console.error('Failed to save LLM config to localStorage:', error);
    }
  }

  /**
   * Load system prompt from localStorage and set it to taskGenerationService
   */
  loadSystemPrompt(): string | null {
    try {
      const prompt = localStorage.getItem(ConfigService.SYSTEM_PROMPT_KEY);
      if (prompt) {
        taskGenerationService.setSystemPrompt(prompt);
        return prompt;
      }
    } catch (error) {
      console.error('Failed to load system prompt from localStorage:', error);
    }
    return null;
  }

  /**
   * Save system prompt to localStorage and taskGenerationService
   */
  saveSystemPrompt(prompt: string) {
    try {
      localStorage.setItem(ConfigService.SYSTEM_PROMPT_KEY, prompt);
      taskGenerationService.setSystemPrompt(prompt);
    } catch (error) {
      console.error('Failed to save system prompt to localStorage:', error);
    }
  }

  /**
   * Check if LLM is configured and ready to use
   */
  isLLMConfigured(): boolean {
    const config = llmService.getConfig();
    return !!(config && config.apiKey && config.model && config.provider);
  }

  /**
   * Get current LLM configuration
   */
  getLLMConfig(): LLMConfig | null {
    return llmService.getConfig();
  }

  /**
   * Clear all configurations
   */
  clearConfigs() {
    localStorage.removeItem(ConfigService.LLM_CONFIG_KEY);
    localStorage.removeItem(ConfigService.SYSTEM_PROMPT_KEY);
  }
}

export const configService = new ConfigService();