import { Droppable } from 'react-beautiful-dnd';
import { TaskCard } from './TaskCard';
import { Column as ColumnType } from '@/types/kanban';
import { cn } from '@/lib/utils';

interface ColumnProps {
  column: ColumnType;
  onDeleteTask: (taskId: string) => void;
  onArchiveTask: (taskId: string) => void;
}

const columnStyles = {
  todo: {
    bg: 'bg-kanban-todo',
    accent: 'bg-kanban-todo-accent',
    border: 'border-kanban-todo-accent/20'
  },
  'in-progress': {
    bg: 'bg-kanban-progress',
    accent: 'bg-kanban-progress-accent',
    border: 'border-kanban-progress-accent/20'
  },
  done: {
    bg: 'bg-kanban-done',
    accent: 'bg-kanban-done-accent',
    border: 'border-kanban-done-accent/20'
  },
  archived: {
    bg: 'bg-kanban-archived',
    accent: 'bg-kanban-archived-accent',
    border: 'border-kanban-archived-accent/20'
  }
};

export const Column = ({ column, onDeleteTask, onArchiveTask }: ColumnProps) => {
  const styles = columnStyles[column.status];

  return (
    <div className={cn(
      "rounded-xl p-4 shadow-column transition-all duration-200",
      styles.bg,
      styles.border,
      "border"
    )}>
      {/* Column Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={cn("w-3 h-3 rounded-full", styles.accent)} />
        <h2 className="font-semibold text-foreground">{column.title}</h2>
        <span className="text-sm text-muted-foreground bg-background/50 px-2 py-1 rounded-full">
          {column.tasks.length}
        </span>
      </div>

      {/* Tasks Container */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "min-h-[200px] space-y-3 transition-colors duration-200 rounded-lg p-2",
              snapshot.isDraggingOver && "bg-background/30"
            )}
          >
            {column.tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onDelete={onDeleteTask}
                onArchive={onArchiveTask}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};