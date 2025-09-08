import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Task } from '@/types/kanban';
import { X, Plus, Wand2 } from 'lucide-react';
import { VoiceInput } from '@/components/VoiceInput';
import { taskGenerationService } from '@/services/taskGenerationService';
import { useToast } from '@/hooks/use-toast';

interface AddTaskFormProps {
  onSubmit: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export const AddTaskForm = ({ onSubmit, onCancel }: AddTaskFormProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo' as Task['status']
  });
  const [aiGenerating, setAiGenerating] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) return;

    onSubmit({
      title: formData.title.trim(),
      description: formData.description.trim(),
      status: formData.status
    });

    setFormData({ title: '', description: '', status: 'todo' });
  };

  const statusOptions = [
    { value: 'todo', label: 'To Do' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'done', label: 'Done' },
    { value: 'archived', label: 'Archived' }
  ];

  const handleVoiceInput = async (text: string) => {
    setAiGenerating(true);
    try {
      const result = await taskGenerationService.generateTasks({ input: text });
      if (result.tasks && result.tasks.length > 0) {
        const firstTask = result.tasks[0];
        setFormData({
          title: firstTask.title,
          description: firstTask.description,
          status: firstTask.status
        });
        toast({
          title: "AI生成成功",
          description: `已生成任务信息${result.tasks.length > 1 ? `，共${result.tasks.length}个任务，已填入第一个` : ''}`,
        });
      }
    } catch (error) {
      console.error('AI generation failed:', error);
      toast({
        title: "AI生成失败",
        description: "请检查LLM配置或手动输入",
        variant: "destructive",
      });
    } finally {
      setAiGenerating(false);
    }
  };

  const generateWithAI = async () => {
    const input = formData.title + (formData.description ? ` ${formData.description}` : '');
    if (!input.trim()) {
      toast({
        title: "请输入内容",
        description: "请先输入标题或描述，然后使用AI优化",
        variant: "destructive",
      });
      return;
    }

    setAiGenerating(true);
    try {
      const result = await taskGenerationService.generateTasks({ input });
      if (result.tasks && result.tasks.length > 0) {
        const firstTask = result.tasks[0];
        setFormData(prev => ({
          ...prev,
          title: firstTask.title,
          description: firstTask.description,
        }));
        toast({
          title: "AI优化成功",
          description: "任务内容已优化",
        });
      }
    } catch (error) {
      console.error('AI generation failed:', error);
      toast({
        title: "AI优化失败",
        description: "请检查LLM配置",
        variant: "destructive",
      });
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <Card className="shadow-card border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">添加新任务</CardTitle>
          <div className="flex items-center gap-2">
            <VoiceInput onVoiceInput={handleVoiceInput} />
            <Button
              variant="outline"
              size="icon"
              onClick={generateWithAI}
              disabled={aiGenerating}
              className="text-muted-foreground hover:text-foreground"
            >
              <Wand2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              任务标题 *
            </label>
            <Input
              placeholder="输入任务标题..."
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="transition-smooth focus:ring-2 focus:ring-primary/20"
              autoFocus
            />
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              任务描述
            </label>
            <Textarea
              placeholder="输入任务描述..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="transition-smooth focus:ring-2 focus:ring-primary/20 resize-none"
              rows={3}
            />
          </div>

          {/* Status Select */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              初始状态
            </label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as Task['status'] }))}
            >
              <SelectTrigger className="transition-smooth focus:ring-2 focus:ring-primary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              disabled={!formData.title.trim()}
              className="bg-gradient-primary text-primary-foreground shadow-card hover:shadow-card-hover transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              添加任务
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="transition-smooth"
            >
              取消
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};