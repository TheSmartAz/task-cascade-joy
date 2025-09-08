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
import { Trash2, Calendar, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface TaskCardProps {
  task: Task;
  index: number;
  onDelete: (taskId: string) => void;
  onArchive?: (taskId: string) => void;
  showArchiveButton?: boolean;
}

export const TaskCard = ({ 
  task, 
  index, 
  onDelete, 
  onArchive,
  showArchiveButton = true 
}: TaskCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "bg-card rounded-lg p-4 shadow-card transition-all duration-200 cursor-grab active:cursor-grabbing",
            "border border-border/50",
            "hover:shadow-card-hover hover:-translate-y-1",
            snapshot.isDragging && "rotate-3 shadow-card-hover"
          )}
        >
          {/* Task Content */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium text-card-foreground leading-tight flex-1">
                {task.title}
              </h3>
              <div className="flex gap-1 shrink-0">
                {showArchiveButton && onArchive && task.status !== 'archived' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onArchive(task.id);
                    }}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-orange-600 hover:bg-orange-100 transition-colors"
                  >
                    <Archive className="w-3 h-3" />
                  </Button>
                )}
                
                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => e.stopPropagation()}
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
              <p className="text-sm text-muted-foreground leading-relaxed">
                {task.description}
              </p>
            )}

            {/* Task Meta */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/30">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(task.createdAt)}</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-primary/40" />
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};