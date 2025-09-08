import { useState, useMemo } from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { Column } from './Column';
import { AddTaskForm } from './AddTaskForm';
import { Task, Column as ColumnType } from '@/types/kanban';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';

const initialColumns: ColumnType[] = [
  { id: 'todo', title: 'To Do', status: 'todo', tasks: [] },
  { id: 'in-progress', title: 'In Progress', status: 'in-progress', tasks: [] },
  { id: 'done', title: 'Done', status: 'done', tasks: [] },
  { id: 'archived', title: 'Archived', status: 'archived', tasks: [] },
];

export const KanbanBoard = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const { tasks, loading, createTask, updateTask, deleteTask } = useTasks();

  const columns = useMemo(() => {
    return initialColumns.map(column => ({
      ...column,
      tasks: tasks.filter(task => task.status === column.status)
    }));
  }, [tasks]);

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
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
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-primary text-primary-foreground shadow-card hover:shadow-card-hover transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            添加任务
          </Button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {columns.map((column) => (
              <Column
                key={column.id}
                column={column}
                onDeleteTask={handleDeleteTask}
              />
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
};