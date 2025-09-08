export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done' | 'archived';
  priority: 'high' | 'medium' | 'low';
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Column {
  id: string;
  title: string;
  status: Task['status'];
  tasks: Task[];
}