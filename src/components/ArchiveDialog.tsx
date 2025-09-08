import React from 'react';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TaskCard } from './TaskCard';
import { Task } from '@/types/kanban';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ArchiveDialogProps {
  archivedTasks: Task[];
  onMoveTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onClose: () => void;
}

const targetColumns = [
  { id: 'todo', title: 'To Do', status: 'todo' as const },
  { id: 'in-progress', title: 'In Progress', status: 'in-progress' as const },
  { id: 'done', title: 'Done', status: 'done' as const },
];

export const ArchiveDialog = ({ 
  archivedTasks, 
  onMoveTask, 
  onDeleteTask, 
  onClose 
}: ArchiveDialogProps) => {
  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    // 只处理从archived到其他列的移动
    if (source.droppableId === 'archived' && destination.droppableId !== 'archived') {
      const taskId = result.draggableId;
      const newStatus = destination.droppableId as Task['status'];
      await onMoveTask(taskId, { status: newStatus });
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>归档任务管理</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-4 gap-6 h-[500px] overflow-y-auto">
            {/* Archived Tasks Column */}
            <div className="bg-kanban-archived rounded-xl p-4 border border-kanban-archived-accent/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full bg-kanban-archived-accent" />
                <h2 className="font-semibold text-foreground">已归档</h2>
                <span className="text-sm text-muted-foreground bg-background/50 px-2 py-1 rounded-full">
                  {archivedTasks.length}
                </span>
              </div>

              <Droppable droppableId="archived">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="min-h-[400px] space-y-3 transition-colors duration-200 rounded-lg p-2"
                  >
                    {archivedTasks.map((task, index) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        index={index}
                        onDelete={onDeleteTask}
                        showArchiveButton={false}
                      />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>

            {/* Target Columns */}
            {targetColumns.map((column) => (
              <div 
                key={column.id}
                className="bg-card rounded-xl p-4 border border-border/50"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 rounded-full bg-primary/60" />
                  <h2 className="font-semibold text-foreground">{column.title}</h2>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[400px] rounded-lg p-2 transition-colors duration-200 ${
                        snapshot.isDraggingOver ? 'bg-primary/10' : 'bg-muted/20'
                      }`}
                    >
                      <div className="text-sm text-muted-foreground text-center py-8">
                        拖拽归档任务到这里恢复
                      </div>
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
        
        <div className="text-sm text-muted-foreground mt-4">
          拖拽左侧的归档任务到右侧的列中来恢复任务
        </div>
      </DialogContent>
    </Dialog>
  );
};