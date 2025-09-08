import React, { useState, useMemo } from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { Column } from './Column';
import { AddTaskForm } from './AddTaskForm';
import { ArchiveDialog } from './ArchiveDialog';
import { ArchiveDropZone } from './ArchiveDropZone';
import { TaskDetailDialog } from './TaskDetailDialog';
import { Task, Column as ColumnType } from '@/types/kanban';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, Settings } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useToast } from '@/hooks/use-toast';

const initialColumns: ColumnType[] = [
  { id: 'todo', title: 'To Do', status: 'todo', tasks: [] },
  { id: 'in-progress', title: 'In Progress', status: 'in-progress', tasks: [] },
  { id: 'done', title: 'Done', status: 'done', tasks: [] },
  { id: 'archived', title: 'Archived', status: 'archived', tasks: [] },
];

export const KanbanBoard = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const { tasks, loading, createTask, updateTask, deleteTask } = useTasks();
  const { toast } = useToast();

  const columns = useMemo(() => {
    // 只显示前三列，隐藏archived，按截止时间排序
    return initialColumns.filter(col => col.status !== 'archived').map(column => ({
      ...column,
      tasks: tasks.filter(task => task.status === column.status)
        .sort((a, b) => {
          // 按截止时间排序，无截止时间的排在最后
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.getTime() - b.dueDate.getTime();
        })
    }));
  }, [tasks]);

  const archivedTasks = useMemo(() => {
    return tasks.filter(task => task.status === 'archived');
  }, [tasks]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  };

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    await updateTask(taskId, updates);
    setShowTaskDetail(false);
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    // 检查是否拖拽到归档按钮
    if (destination.droppableId === 'archive-drop-zone') {
      const sourceColumn = columns.find(col => col.id === source.droppableId);
      if (!sourceColumn) return;
      
      const task = sourceColumn.tasks[source.index];
      if (task && task.status !== 'archived') {
        await updateTask(task.id, { status: 'archived' });
        toast({
          title: "任务已归档",
          description: `任务 "${task.title}" 已移动到归档`,
        });
      }
      return;
    }
    
    // Find the task being moved
    const sourceColumn = columns.find(col => col.id === source.droppableId);
    if (!sourceColumn) return;

    const task = sourceColumn.tasks[source.index];
    if (!task) return;

    // If moving to different column, update status
    if (source.droppableId !== destination.droppableId) {
      const newStatus = destination.droppableId as Task['status'];
      await updateTask(task.id, { status: newStatus });
    }
  };

  const handleAddTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    await createTask(taskData);
    setShowAddForm(false);
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
  };

  const handleArchiveTask = async (taskId: string) => {
    await updateTask(taskId, { status: 'archived' });
  };

  const handleTasksGenerated = async (generatedTasks: Array<{ title: string; description: string; status: 'todo' | 'in-progress' | 'done' | 'archived' }>) => {
    try {
      for (const task of generatedTasks) {
        await createTask(task);
      }
    } catch (error) {
      console.error('Failed to create generated tasks:', error);
      toast({
        title: "创建任务失败",
        description: "部分任务可能未能成功创建",
        variant: "destructive",
      });
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-bg p-6 flex items-center justify-center">
        <div className="flex items-center gap-2 text-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>加载任务中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-bg p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">项目看板</h1>
            <p className="text-muted-foreground">拖拽任务卡片来管理项目进度</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => window.open('/debug', '_blank')}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-primary text-primary-foreground shadow-card hover:shadow-card-hover transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              添加任务
            </Button>
          </div>
        </div>

        {/* Add Task Form */}
        {showAddForm && (
          <div className="mb-6">
            <AddTaskForm 
              onSubmit={handleAddTask}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        )}

        {/* Kanban Board */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {columns.map((column) => (
                <Column
                  key={column.id}
                  column={column}
                  onDeleteTask={handleDeleteTask}
                  onTaskClick={handleTaskClick}
                />
              ))}
            </div>

            {/* Archive Drop Zone */}
            <div className="mt-8">
              <ArchiveDropZone 
                onArchiveClick={() => setShowArchiveDialog(true)}
                archivedCount={archivedTasks.length}
              />
            </div>
          </div>
        </DragDropContext>

        {/* Task Detail Dialog */}
        <TaskDetailDialog
          task={selectedTask}
          isOpen={showTaskDetail}
          onClose={() => {
            setShowTaskDetail(false);
            setSelectedTask(null);
          }}
          onUpdate={handleTaskUpdate}
        />

        {/* Archive Dialog */}
        {showArchiveDialog && (
          <ArchiveDialog
            archivedTasks={archivedTasks}
            onMoveTask={async (taskId, updates) => {
              await updateTask(taskId, updates);
            }}
            onDeleteTask={handleDeleteTask}
            onClose={() => setShowArchiveDialog(false)}
          />
        )}
      </div>
    </div>
  );
};