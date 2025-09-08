import { Droppable } from 'react-beautiful-dnd';
import { Button } from '@/components/ui/button';
import { Archive } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ArchiveDropZoneProps {
  onArchiveClick: () => void;
  archivedCount: number;
}

export const ArchiveDropZone = ({ onArchiveClick, archivedCount }: ArchiveDropZoneProps) => {
  return (
    <div className="flex justify-center">
      <Droppable droppableId="archive-drop-zone">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "relative transition-all duration-200",
              snapshot.isDraggingOver && "scale-105"
            )}
          >
            <Button
              variant="outline"
              onClick={onArchiveClick}
              className={cn(
                "bg-muted/50 hover:bg-muted transition-all duration-200",
                snapshot.isDraggingOver && "border-orange-300 bg-orange-50 text-orange-700 shadow-lg"
              )}
            >
              <Archive className="h-4 w-4 mr-2" />
              {snapshot.isDraggingOver ? "拖拽到此处归档" : `查看归档 (${archivedCount})`}
            </Button>
            
            {snapshot.isDraggingOver && (
              <div className="absolute inset-0 -m-2 border-2 border-dashed border-orange-300 rounded-lg bg-orange-50/30 animate-pulse" />
            )}
            
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};