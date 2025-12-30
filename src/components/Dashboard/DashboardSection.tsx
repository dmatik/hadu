import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
    SortableContext,
    rectSortingStrategy
} from '@dnd-kit/sortable';
import { SortableWidget } from './SortableWidget';
import { Plus, Trash2 } from 'lucide-react';
import './Dashboard.css';

// We need a partial definition or import if we can. 
// Since we don't want to import full types if not needed, we can define inline or import.
// Better to import from context if exported, but let's define interface for props.
interface Widget {
    id: string;
    entityId: string;
    // ... other props if needed, but we mostly just need id and entityId for display
}

interface Section {
    id: string;
    title: string;
    widgets: Widget[];
}

interface DashboardSectionProps {
    section: Section;
    entities: any;
    isEditing: boolean;
    onDeleteSection: () => void;
    onRemoveWidget: (widgetId: string) => void;
    onAddWidget: () => void;
    numColumns: number;
    activeOverId: string | null;
}

export const DashboardSection: React.FC<DashboardSectionProps> = ({
    section,
    entities,
    isEditing,
    onDeleteSection,
    onRemoveWidget,
    onAddWidget,
    numColumns,
    activeOverId
}) => {
    const { setNodeRef, isOver } = useDroppable({
        id: section.id,
    });

    const isOverSectionOrChild = isOver || (activeOverId && section.widgets.some(w => w.id === activeOverId));

    const sectionStyle: React.CSSProperties = {
        minHeight: isEditing ? '150px' : 'auto',
        transition: 'all 0.2s ease',
        borderRadius: '12px',
        boxSizing: 'border-box',
        ...(isOverSectionOrChild ? {
            backgroundColor: 'rgba(79, 172, 254, 0.1)', // Match primary color tone
            border: '2px dashed #4facfe',
            boxShadow: '0 0 10px rgba(79, 172, 254, 0.2)'
        } : {
            border: '2px dashed transparent'
        })
    };

    return (
        <div ref={setNodeRef} className="dashboard-section" style={sectionStyle}>
            <div className="section-header">
                <h3 className="section-title">{section.title}</h3>
                {isEditing && (
                    <button
                        className="delete-section-btn"
                        onClick={onDeleteSection}
                        title="Delete Section"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>

            <SortableContext
                id={section.id}
                items={section.widgets.map(w => w.id)}
                strategy={rectSortingStrategy}
                disabled={!isEditing}
            >
                <div
                    className="widgets-grid"
                    style={
                        { '--grid-columns': `repeat(${Math.floor(6 / numColumns) || 1}, 1fr)` } as React.CSSProperties
                    }
                >
                    {section.widgets.map(widget => {
                        const entity = entities[widget.entityId];
                        if (!entity) return null;

                        return (
                            <SortableWidget
                                key={widget.id}
                                id={widget.id}
                                entity={entity}
                                isEditing={isEditing}
                                onRemove={() => onRemoveWidget(widget.id)}
                            />
                        );
                    })}
                    {isEditing && (
                        <button
                            className="add-widget-btn glass"
                            onClick={onAddWidget}
                        >
                            <Plus size={32} />
                        </button>
                    )}
                </div>
            </SortableContext>
        </div>
    );
};
