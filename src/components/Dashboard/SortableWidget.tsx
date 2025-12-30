import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { EntityCard } from '../Widgets/EntityCard';
import { X } from 'lucide-react';

interface SortableWidgetProps {
    id: string;
    entity: any;
    isEditing: boolean;
    onRemove: () => void;
}

export const SortableWidget: React.FC<SortableWidgetProps> = ({ id, entity, isEditing, onRemove }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        touchAction: 'none'
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="widget-wrapper"
            {...attributes}
        >
            {isEditing && (
                <>
                    <button
                        className="remove-widget-btn"
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent drag start when clicking remove
                            onRemove();
                        }}
                    >
                        <X size={14} />
                    </button>
                    {/* Drag Handle - slightly overlays the card or we can make the whole card draggable. 
                        For now, let's make the whole card draggable but usually it's better to have a handle or ensure interactions work. 
                        Since EntityCard might have interactions, we might need a handle if the card is interactive.
                        However, usually in edit mode, card interactions are disabled or we use a handle.
                        Let's use the whole card as handle for now, but we can refine later.
                    */}
                    <div
                        className="drag-handle-overlay"
                        {...listeners}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 9, // Below the remove button (z-index 10)
                            cursor: 'grab'
                        }}
                    />
                </>
            )}

            <EntityCard entity={entity} />
        </div>
    );
};
