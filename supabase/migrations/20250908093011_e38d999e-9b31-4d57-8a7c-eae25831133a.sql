-- Add priority column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium' 
CHECK (priority IN ('high', 'medium', 'low'));