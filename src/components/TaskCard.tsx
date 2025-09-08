import { Draggable } from 'react-beautiful-dnd';
import { Task } from '@/types/kanban';
import { Button } from '@/components/ui/button';
import { Trash2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  index: number;
  onDelete: (taskId: string) => void;
}

export const TaskCard = ({ task, index, onDelete }: TaskCardProps) => {
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
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task.id);
                }}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
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