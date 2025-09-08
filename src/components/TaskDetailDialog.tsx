import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Task } from '@/types/kanban';
import { Calendar, Clock, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TaskDetailDialogProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
}

export const TaskDetailDialog = ({ task, isOpen, onClose, onUpdate }: TaskDetailDialogProps) => {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setEditingTask({ ...task });
    }
  }, [task]);

  const handleSave = async () => {
    if (!editingTask || !task) return;

    setSaving(true);
    try {
      await onUpdate(task.id, {
        title: editingTask.title,
        description: editingTask.description,
        status: editingTask.status,
        priority: editingTask.priority,
        dueDate: editingTask.dueDate,
      });
      onClose();
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatDueDate = (date: Date | undefined) => {
    if (!date) return '未设置';
    return format(date, 'yyyy-MM-dd HH:mm');
  };

  const dueDateStatus = (dueDate: Date | undefined) => {
    if (!dueDate) return 'none';
    const now = new Date();
    const timeDiff = dueDate.getTime() - now.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    
    if (daysDiff < 0) return 'overdue';
    if (daysDiff < 1) return 'today';
    if (daysDiff < 7) return 'soon';
    return 'future';
  };

  if (!editingTask) return null;

  const statusOptions = [
    { value: 'todo', label: 'To Do' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'done', label: 'Done' },
    { value: 'archived', label: 'Archived' }
  ];

  const dueDateStatusConfig = {
    overdue: { color: 'text-red-500', bg: 'bg-red-50', label: '已逾期' },
    today: { color: 'text-orange-500', bg: 'bg-orange-50', label: '今日到期' },
    soon: { color: 'text-yellow-500', bg: 'bg-yellow-50', label: '即将到期' },
    future: { color: 'text-green-500', bg: 'bg-green-50', label: '充足时间' },
    none: { color: 'text-muted-foreground', bg: 'bg-muted/50', label: '未设置' }
  };

  const status = dueDateStatus(editingTask.dueDate);
  const statusConfig = dueDateStatusConfig[status];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            任务详情
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 标题 */}
          <div className="space-y-2">
            <Label htmlFor="title">标题 *</Label>
            <Input
              id="title"
              value={editingTask.title}
              onChange={(e) => setEditingTask(prev => prev ? { ...prev, title: e.target.value } : null)}
              className="text-lg font-medium"
            />
          </div>

          {/* 描述 */}
          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              value={editingTask.description}
              onChange={(e) => setEditingTask(prev => prev ? { ...prev, description: e.target.value } : null)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* 状态、优先级和截止时间 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">状态</Label>
              <Select
                value={editingTask.status}
                onValueChange={(value) => setEditingTask(prev => prev ? { ...prev, status: value as Task['status'] } : null)}
              >
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label htmlFor="priority">优先级</Label>
              <Select
                value={editingTask.priority}
                onValueChange={(value) => setEditingTask(prev => prev ? { ...prev, priority: value as Task['priority'] } : null)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">高</SelectItem>
                  <SelectItem value="medium">中</SelectItem>
                  <SelectItem value="low">低</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">截止时间</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={editingTask.dueDate ? format(editingTask.dueDate, "yyyy-MM-dd'T'HH:mm") : ''}
                onChange={(e) => setEditingTask(prev => prev ? {
                  ...prev,
                  dueDate: e.target.value ? new Date(e.target.value) : undefined
                } : null)}
              />
            </div>
          </div>

          {/* 截止时间状态指示 */}
          {editingTask.dueDate && (
            <div className={cn(
              "flex items-center gap-2 p-3 rounded-lg border",
              statusConfig.bg
            )}>
              <Clock className={cn("h-4 w-4", statusConfig.color)} />
              <div>
                <div className={cn("text-sm font-medium", statusConfig.color)}>
                  {statusConfig.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDueDate(editingTask.dueDate)}
                </div>
              </div>
            </div>
          )}

          {/* 任务元信息 */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t text-sm text-muted-foreground">
            <div>
              <strong>创建时间:</strong><br />
              {format(editingTask.createdAt, 'yyyy-MM-dd HH:mm')}
            </div>
            <div>
              <strong>更新时间:</strong><br />
              {format(editingTask.updatedAt, 'yyyy-MM-dd HH:mm')}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            取消
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !editingTask.title.trim()}
            className="bg-gradient-primary text-primary-foreground"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};