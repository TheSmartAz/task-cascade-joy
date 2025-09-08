import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Wand2 } from 'lucide-react';
import { taskGenerationService } from '@/services/taskGenerationService';
import { useToast } from '@/hooks/use-toast';

interface AITaskGeneratorProps {
  onTasksGenerated: (tasks: Array<{ title: string; description: string; status: 'todo' | 'in-progress' | 'done' | 'archived' }>) => void;
}

export function AITaskGenerator({ onTasksGenerated }: AITaskGeneratorProps) {
  const [input, setInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const { toast } = useToast();

  // 初始化语音识别
  React.useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'zh-CN';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
        setRecording(false);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setRecording(false);
        toast({
          title: "语音识别失败",
          description: "请检查麦克风权限或手动输入",
          variant: "destructive",
        });
      };

      recognition.onend = () => {
        setRecording(false);
      };

      setRecognition(recognition);
    }
  }, [toast]);

  const toggleRecording = () => {
    if (!recognition) {
      toast({
        title: "不支持语音识别",
        description: "您的浏览器不支持语音识别功能",
        variant: "destructive",
      });
      return;
    }

    if (recording) {
      recognition.stop();
      setRecording(false);
    } else {
      recognition.start();
      setRecording(true);
      toast({
        title: "开始录音",
        description: "请说话，完成后会自动停止",
      });
    }
  };

  const generateTasks = async () => {
    if (!input.trim()) {
      toast({
        title: "请输入内容",
        description: "请输入要转换为任务的描述",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const result = await taskGenerationService.generateTasks({ input });
      onTasksGenerated(result.tasks);
      setInput('');
      toast({
        title: "任务生成成功",
        description: `已生成 ${result.tasks.length} 个任务`,
      });
    } catch (error) {
      console.error('Task generation failed:', error);
      toast({
        title: "生成失败",
        description: error instanceof Error ? error.message : "请检查LLM配置",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              AI任务生成器
            </CardTitle>
            <CardDescription>
              使用AI将文本或语音转换为任务卡片
            </CardDescription>
          </div>
          <Badge variant="secondary">第二阶段</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入要转换为任务的描述，例如：'准备下周的项目演示，包括制作PPT、准备演讲稿、测试演示环境'"
              rows={4}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={toggleRecording}
              className={recording ? "text-red-500" : ""}
            >
              {recording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          </div>
          
          {recording && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              正在录音，请说话...
            </div>
          )}
        </div>

        <Button 
          onClick={generateTasks} 
          disabled={generating || !input.trim()}
          className="w-full"
        >
          {generating ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              生成中...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              生成任务
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground">
          💡 提示：描述越详细，生成的任务越准确。支持语音输入和文本输入。
        </div>
      </CardContent>
    </Card>
  );
}