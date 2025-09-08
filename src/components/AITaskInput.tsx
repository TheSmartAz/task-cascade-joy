import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Loader2, Mic, MicOff, Settings } from 'lucide-react';
import { taskGenerationService } from '@/services/taskGenerationService';
import { configService } from '@/services/configService';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

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
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'zh-CN';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        toast({
          title: "语音识别失败",
          description: "请检查麦克风权限或稍后重试",
          variant: "destructive",
        });
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, [toast]);

  const handleGenerate = async () => {
    if (!input.trim()) {
      toast({
        title: "输入不能为空",
        description: "请输入任务描述",
        variant: "destructive",
      });
      return;
    }

    // Check if LLM is configured
    if (!configService.isLLMConfigured()) {
      toast({
        title: "AI 配置未完成",
        description: "请先在调试页面配置 AI 服务",
        variant: "destructive",
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/debug')}
          >
            去配置
          </Button>
        ),
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await taskGenerationService.generateTasks({
        input: input.trim(),
      });
      
      if (response.tasks && response.tasks.length > 0) {
        onTasksGenerated(response.tasks);
        setInput('');
        toast({
          title: "任务生成成功",
          description: `已生成 ${response.tasks.length} 个任务`,
        });
      } else {
        toast({
          title: "任务生成失败",
          description: "未能生成有效任务，请重试",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Task generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : "请检查网络连接或稍后重试";
      
      // If it's a configuration error, guide user to debug page
      if (errorMessage.includes('configuration') || errorMessage.includes('API')) {
        toast({
          title: "AI 服务配置错误",
          description: errorMessage,
          variant: "destructive",
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/debug')}
            >
              检查配置
            </Button>
          ),
        });
      } else {
        toast({
          title: "任务生成失败",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isGenerating) {
      handleGenerate();
    }
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast({
        title: "不支持语音识别",
        description: "您的浏览器不支持语音识别功能",
        variant: "destructive",
      });
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex gap-3 items-center">
        <Button
          onClick={toggleRecording}
          disabled={isGenerating}
          variant="outline"
          size="icon"
          className={`shrink-0 ${isRecording ? 'bg-red-500 text-white hover:bg-red-600' : ''}`}
        >
          {isRecording ? (
            <MicOff className="w-4 h-4" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </Button>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="输入任务描述，AI将自动生成任务..."
          disabled={isGenerating || isRecording}
          className="flex-1"
        />
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !input.trim() || isRecording}
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