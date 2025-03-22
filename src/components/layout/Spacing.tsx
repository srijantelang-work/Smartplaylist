import { ReactNode, useState } from 'react';
import { DndProvider, useDrag, useDrop, DragSourceMonitor } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

interface SpacingProps {
  children: ReactNode;
  size?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20;
  direction?: 'horizontal' | 'vertical';
  className?: string;
  responsive?: boolean;
  draggable?: boolean;
  onReorder?: (fromIndex: number, toIndex: number) => void;
}

interface DraggableItemProps {
  id: number;
  index: number;
  children: ReactNode;
  onMove: (fromIndex: number, toIndex: number) => void;
}

const DraggableItem = ({ id, index, children, onMove }: DraggableItemProps) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'SPACING_ITEM',
    item: { id, index },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'SPACING_ITEM',
    hover: (item: { id: number; index: number }) => {
      if (item.index !== index) {
        onMove(item.index, index);
        item.index = index;
      }
    },
  });

  return (
    <div
      ref={node => {
        drag(node);
        drop(node);
      }}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="transition-opacity duration-200"
    >
      {children}
    </div>
  );
};

/**
 * A component that adds consistent spacing between child elements
 * using Tailwind's space utilities. Supports responsive design and
 * optional drag-and-drop functionality.
 */
export function Spacing({ 
  children, 
  size = 4, 
  direction = 'vertical', 
  className = '',
  responsive = false,
  draggable = false,
  onReorder
}: SpacingProps) {
  const [items, setItems] = useState(
    Array.isArray(children) ? children : [children]
  );

  // Validate size is within allowed values
  if (![0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20].includes(size)) {
    console.warn(`Invalid size value: ${size}. Using default size: 4`);
    size = 4;
  }

  const handleMove = (fromIndex: number, toIndex: number) => {
    const newItems = [...items];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    setItems(newItems);
    onReorder?.(fromIndex, toIndex);
  };

  // Base spacing classes
  const baseSpacingClass = direction === 'vertical' ? 'space-y-' : 'space-x-';
  
  // Responsive classes
  const responsiveClasses = responsive
    ? {
        sm: direction === 'vertical' ? 'sm:space-y-' : 'sm:space-x-',
        md: direction === 'vertical' ? 'md:space-y-' : 'md:space-x-',
        lg: direction === 'vertical' ? 'lg:space-y-' : 'lg:space-x-',
      }
    : {};

  // Combine all classes
  const spacingClasses = [
    `${baseSpacingClass}${size}`,
    responsive && `${responsiveClasses.sm}${Math.max(2, size - 2)}`,
    responsive && `${responsiveClasses.md}${size}`,
    responsive && `${responsiveClasses.lg}${Math.min(20, size + 2)}`,
    className
  ].filter(Boolean).join(' ');

  const content = draggable ? (
    <DndProvider backend={HTML5Backend}>
      <div className={spacingClasses}>
        {items.map((child, index) => (
          <DraggableItem
            key={index}
            id={index}
            index={index}
            onMove={handleMove}
          >
            {child}
          </DraggableItem>
        ))}
      </div>
    </DndProvider>
  ) : (
    <div className={spacingClasses}>{children}</div>
  );

  return content;
}

interface DividerProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export function Divider({ className = '', orientation = 'horizontal' }: DividerProps) {
  if (orientation === 'vertical') {
    return <div className={`h-full w-px bg-[#323232] ${className}`} />;
  }

  return <div className={`w-full h-px bg-[#323232] ${className}`} />;
} 