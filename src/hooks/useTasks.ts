import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task } from '@/types/kanban';
import { useToast } from '@/components/ui/use-toast';

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedTasks: Task[] = data.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description || '',
        status: task.status as Task['status'],
        createdAt: new Date(task.created_at),
        updatedAt: new Date(task.updated_at)
      }));

      setTasks(formattedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "错误",
        description: "加载任务失败",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          title: taskData.title,
          description: taskData.description,
          status: taskData.status
        }])
        .select()
        .single();

      if (error) throw error;

      const newTask: Task = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        status: data.status as Task['status'],
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      setTasks(prev => [...prev, newTask]);
      
      toast({
        title: "成功",
        description: "任务创建成功",
      });

      return newTask;
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "错误",
        description: "创建任务失败",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          title: updates.title,
          description: updates.description,
          status: updates.status
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedTask: Task = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        status: data.status as Task['status'],
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      setTasks(prev => prev.map(task => 
        task.id === id ? updatedTask : task
      ));

      return updatedTask;
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "错误",
        description: "更新任务失败",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTasks(prev => prev.filter(task => task.id !== id));
      
      toast({
        title: "成功",
        description: "任务删除成功",
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "错误",
        description: "删除任务失败",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return {
    tasks,
    loading,
    createTask,
    updateTask,
    deleteTask,
    refetch: fetchTasks
  };
};