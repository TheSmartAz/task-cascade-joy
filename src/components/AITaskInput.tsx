import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Loader2 } from 'lucide-react';
import { taskGenerationService } from '@/services/taskGenerationService';
import { useToast } from '@/hooks/use-toast';

interface AITaskInputProps {
  onTasksGenerated: (tasks: Array<{
    title: string;
    description: string;
    status: 'todo' | 'in-progress' | 'done' | 'archived';
    priority: 'high' | 'medium' | 'low';
  }>) => void;
}

export const AITaskInput = ({ onTasksGenerated }: AITaskInputProps) => {
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!input.trim()) {
      toast({
        title: "输入不能为空",
        description: "请输入任务描述",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGenerating(true);
      const response = await taskGenerationService.generateTasks({ input });
      
      if (response.tasks && response.tasks.length > 0) {
        onTasksGenerated(response.tasks);
        setInput('');
        toast({
          title: "任务生成成功",
          description: `已生成 ${response.tasks.length} 个任务`,
        });
      } else {
        toast({
          title: "生成失败",
          description: "未能生成有效任务",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to generate tasks:', error);
      toast({
        title: "生成失败",
        description: "请检查AI配置或稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isGenerating) {
      handleGenerate();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex gap-3 items-center">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="输入任务描述，AI将自动生成任务..."
          disabled={isGenerating}
          className="flex-1"
        />
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !input.trim()}
          className="bg-gradient-primary text-primary-foreground shadow-card hover:shadow-card-hover transition-all duration-200"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
};