import { Draggable } from 'react-beautiful-dnd';
import { Task } from '@/types/kanban';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2, Calendar, Clock, AlertTriangle, Minus, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { format } from 'date-fns';

interface TaskCardProps {
  task: Task;
  index: number;
  onDelete: (taskId: string) => void;
  onClick?: (task: Task) => void;
}

export const TaskCard = ({ 
  task, 
  index, 
  onDelete,
  onClick
}: TaskCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const formatDate = (date: Date) => {
    return format(date, 'MM-dd');
  };

  const formatDueDate = (date: Date) => {
    return format(date, 'MM-dd HH:mm');
  };

  const getDueDateStatus = (dueDate: Date | undefined) => {
    if (!dueDate) return 'none';
    const now = new Date();
    const timeDiff = dueDate.getTime() - now.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    
    if (daysDiff < 0) return 'overdue';
    if (daysDiff < 1) return 'today';
    if (daysDiff < 7) return 'soon';
    return 'future';
  };

  const dueDateStatus = getDueDateStatus(task.dueDate);
  const dueDateConfig = {
    overdue: { color: 'text-red-500', bg: 'bg-red-50 border-red-200', label: '已逾期' },
    today: { color: 'text-orange-500', bg: 'bg-orange-50 border-orange-200', label: '今日' },
    soon: { color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', label: '即将到期' },
    future: { color: 'text-green-600', bg: 'bg-green-50 border-green-200', label: '' },
    none: { color: 'text-muted-foreground', bg: '', label: '' }
  };

  const config = dueDateConfig[dueDateStatus];

  const priorityConfig = {
    high: { 
      icon: AlertTriangle, 
      color: 'text-red-500', 
      bg: 'bg-red-50 dark:bg-red-950/20', 
      label: '高' 
    },
    medium: { 
      icon: Minus, 
      color: 'text-yellow-500', 
      bg: 'bg-yellow-50 dark:bg-yellow-950/20', 
      label: '中' 
    },
    low: { 
      icon: ArrowDown, 
      color: 'text-green-500', 
      bg: 'bg-green-50 dark:bg-green-950/20', 
      label: '低' 
    }
  };

  const priorityConf = priorityConfig[task.priority];
  const PriorityIcon = priorityConf.icon;

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick?.(task)}
          className={cn(
            "bg-card rounded-lg p-4 shadow-card transition-all duration-200 cursor-pointer hover:cursor-pointer",
            "border border-border/50",
            "hover:shadow-card-hover hover:-translate-y-1",
            snapshot.isDragging && "rotate-3 shadow-card-hover",
            task.dueDate && dueDateStatus !== 'none' && dueDateStatus !== 'future' && config.bg
          )}
        >
          {/* Task Content */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium text-card-foreground leading-tight flex-1">
                {task.title}
              </h3>
              <div className="flex items-center gap-1 shrink-0">
                <div className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                  priorityConf.bg,
                  priorityConf.color
                )}>
                  <PriorityIcon className="w-3 h-3" />
                  <span>{priorityConf.label}</span>
                </div>
                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>确认删除任务</AlertDialogTitle>
                      <AlertDialogDescription>
                        您确定要删除任务 "{task.title}" 吗？此操作无法撤销。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(task.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        删除
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {task.description && (
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                {task.description}
              </p>
            )}

            {/* Due Date */}
            {task.dueDate && (
              <div className={cn(
                "flex items-center gap-1 text-xs px-2 py-1 rounded-md",
                config.color,
                dueDateStatus !== 'none' && dueDateStatus !== 'future' ? "bg-transparent" : "bg-muted/50"
              )}>
                <Clock className="w-3 h-3" />
                <span>{formatDueDate(task.dueDate)}</span>
                {config.label && <span className="ml-1 font-medium">({config.label})</span>}
              </div>
            )}

            {/* Task Meta */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/30">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>创建于 {formatDate(task.createdAt)}</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-primary/40" />
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};