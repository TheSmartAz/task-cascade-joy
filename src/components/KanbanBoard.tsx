import { useState, useEffect } from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { Column } from './Column';
import { AddTaskForm } from './AddTaskForm';
import { Task, Column as ColumnType } from '@/types/kanban';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const STORAGE_KEY = 'kanban-tasks';

const initialColumns: ColumnType[] = [
  { id: 'todo', title: 'To Do', status: 'todo', tasks: [] },
  { id: 'in-progress', title: 'In Progress', status: 'in-progress', tasks: [] },
  { id: 'done', title: 'Done', status: 'done', tasks: [] },
  { id: 'archived', title: 'Archived', status: 'archived', tasks: [] },
];

export const KanbanBoard = () => {
  const [columns, setColumns] = useState<ColumnType[]>(initialColumns);
  const [showAddForm, setShowAddForm] = useState(false);

  // Load tasks from localStorage on mount
  useEffect(() => {
    const storedTasks = localStorage.getItem(STORAGE_KEY);
    if (storedTasks) {
      try {
        const tasks: Task[] = JSON.parse(storedTasks);
        const updatedColumns = initialColumns.map(column => ({
          ...column,
          tasks: tasks.filter(task => task.status === column.status)
        }));
        setColumns(updatedColumns);
      } catch (error) {
        console.error('Error loading tasks from localStorage:', error);
      }
    }
  }, []);

  // Save tasks to localStorage whenever columns change
  useEffect(() => {
    const allTasks = columns.flatMap(column => column.tasks);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allTasks));
  }, [columns]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const sourceColumnIndex = columns.findIndex(col => col.id === source.droppableId);
    const destColumnIndex = columns.findIndex(col => col.id === destination.droppableId);

    if (sourceColumnIndex === -1 || destColumnIndex === -1) return;

    const newColumns = [...columns];
    const sourceColumn = { ...newColumns[sourceColumnIndex] };
    const destColumn = { ...newColumns[destColumnIndex] };

    // Remove task from source
    const [removedTask] = sourceColumn.tasks.splice(source.index, 1);

    // Add to destination with updated status
    const updatedTask = { 
      ...removedTask, 
      status: destColumn.status,
      updatedAt: new Date()
    };
    
    destColumn.tasks.splice(destination.index, 0, updatedTask);

    newColumns[sourceColumnIndex] = sourceColumn;
    newColumns[destColumnIndex] = destColumn;

    setColumns(newColumns);
  };

  const addTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedColumns = columns.map(column =>
      column.status === newTask.status
        ? { ...column, tasks: [...column.tasks, newTask] }
        : column
    );

    setColumns(updatedColumns);
    setShowAddForm(false);
  };

  const deleteTask = (taskId: string) => {
    const updatedColumns = columns.map(column => ({
      ...column,
      tasks: column.tasks.filter(task => task.id !== taskId)
    }));

    setColumns(updatedColumns);
  };

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
              onSubmit={addTask}
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
                onDeleteTask={deleteTask}
              />
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
};