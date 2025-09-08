import { llmService } from './llmService';
import { TaskGenerationRequest, TaskGenerationResponse } from '@/types/llm';

const DEFAULT_SYSTEM_PROMPT = `你是一个专业的任务管理助手。请根据用户的输入，生成相应的任务卡片。

规则：
1. 将用户输入转换为具体的、可执行的任务
2. 每个任务应该有清晰的标题和描述
3. 根据任务复杂度和紧急程度设置合适的状态
4. 返回JSON格式，包含tasks数组
5. 每个任务包含title、description、status字段
6. status只能是：todo、in-progress、done、archived

返回格式示例：
{
  "tasks": [
    {
      "title": "任务标题",
      "description": "任务详细描述",
      "status": "todo"
    }
  ]
}`;

export class TaskGenerationService {
  private systemPrompt: string = DEFAULT_SYSTEM_PROMPT;

  setSystemPrompt(prompt: string) {
    this.systemPrompt = prompt;
  }

  getSystemPrompt(): string {
    return this.systemPrompt;
  }

  getDefaultSystemPrompt(): string {
    return DEFAULT_SYSTEM_PROMPT;
  }

  async generateTasks(request: TaskGenerationRequest): Promise<TaskGenerationResponse> {
    const prompt = request.systemPrompt || this.systemPrompt;
    
    const response = await llmService.callLLM([
      { role: 'system', content: prompt },
      { role: 'user', content: request.input }
    ]);

    try {
      // 尝试解析JSON响应
      const parsed = JSON.parse(response.content);
      return parsed;
    } catch (error) {
      // 如果解析失败，尝试提取JSON部分
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return parsed;
        } catch (e) {
          console.error('Failed to parse JSON from LLM response:', e);
        }
      }
      
      // 如果都失败了，返回基于输入的简单任务
      return {
        tasks: [{
          title: request.input.slice(0, 50) + (request.input.length > 50 ? '...' : ''),
          description: request.input,
          status: 'todo' as const,
          dueDate: undefined
        }]
      };
    }
  }

  async testPrompt(input: string, systemPrompt?: string): Promise<{ response: string; usage?: any }> {
    const prompt = systemPrompt || this.systemPrompt;
    
    const response = await llmService.callLLM([
      { role: 'system', content: prompt },
      { role: 'user', content: input }
    ]);

    return {
      response: response.content,
      usage: response.usage
    };
  }
}

export const taskGenerationService = new TaskGenerationService();