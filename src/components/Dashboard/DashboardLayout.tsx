import React, { useState } from 'react';
import { useHomeAssistant } from '../../contexts/HomeAssistantContext';
import { Header } from '../Header/Header';
import { useDashboards } from '../../contexts/DashboardsContext';
import { AddWidgetModal } from '../Modals/AddWidgetModal';
import { Plus } from 'lucide-react'; // removed X because it is used in SortableWidget
import './Dashboard.css';
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    type DragStartEvent,
    type DragOverEvent,
    type DragEndEvent
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { DashboardSection } from './DashboardSection';
import { EntityCard } from '../Widgets/EntityCard'; // Keep for drag overlay

export const DashboardLayout: React.FC = () => {
    const { entities } = useHomeAssistant();
    const {
        dashboards,
        activeDashboardId,
        isEditing,
        removeWidget,
        addWidget,
        addSection,
        deleteSection,
        moveWidget
    } = useDashboards();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [targetSectionId, setTargetSectionId] = useState<string | null>(null);
    const [activeDragId, setActiveDragId] = useState<string | null>(null);
    const [activeOverId, setActiveOverId] = useState<string | null>(null);

    const activeDashboard = dashboards.find(d => d.id === activeDashboardId);
    // Fallback for sections if undefined (during migration)
    const sections = activeDashboard?.sections || [];
    const numColumns = activeDashboard?.columns || 3;

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Import DashboardModal here if we want to allow creating new one directly, 
    // BUT Sidebar already has it. Let's just tell user to use sidebar.

    if (!entities) {
        return (
            <div className="flex justify-center items-center h-screen text-white">
                Loading entities...
            </div>
        );
    }

    if (!activeDashboard) {
        return (
            <>
                <Header />
                <div className="dashboard-container">
                    <div className="empty-state">
                        <p className="title">Dashboard not found</p>
                        <p className="mb-4">Please select an existing dashboard from the sidebar or create a new one.</p>
                    </div>
                </div>
            </>
        );
    }

    const handleAddSection = (colIndex: number = 0) => {
        const title = prompt("Enter section title:", "New Section");
        if (title && activeDashboardId) {
            addSection(activeDashboardId, title, colIndex);
        }
    };

    const handleAddWidgetClick = (sectionId: string) => {
        setTargetSectionId(sectionId);
        setIsAddModalOpen(true);
    };

    const findSectionContainer = (id: string) => {
        if (sections.find(s => s.id === id)) {
            return id;
        }
        return sections.find(section => section.widgets.some(w => w.id === id))?.id;
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveDragId(event.active.id as string);
        setActiveOverId(null);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { over } = event;
        setActiveOverId(over?.id as string || null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        const overId = over?.id;

        if (!overId || !activeDashboardId) {
            setActiveDragId(null);
            setActiveOverId(null);
            return;
        }

        const activeContainer = findSectionContainer(active.id as string);
        const overContainer = findSectionContainer(overId as string);

        if (activeContainer && overContainer) {
            const activeSection = sections.find(s => s.id === activeContainer);
            const overSection = sections.find(s => s.id === overContainer);

            if (activeSection && overSection) {
                const activeIndex = activeSection.widgets.findIndex(w => w.id === active.id);
                const overIndex = overSection.widgets.findIndex(w => w.id === overId);

                let newIndex: number;
                if (overId === overContainer) {
                    // We dropped on the container itself (empty section or at the end)
                    newIndex = overSection.widgets.length + 1;
                } else {
                    // We dropped on another widget
                    newIndex = overIndex >= 0 ? overIndex : overSection.widgets.length + 1;
                }

                // Adjust index if moving down in same container
                if (activeContainer === overContainer && activeIndex < newIndex && newIndex > 0) {
                    // logic handled in context usually
                }

                if (activeIndex !== -1) {
                    moveWidget(activeDashboardId, activeContainer, overContainer, active.id as string, newIndex);
                }
            }
        }

        setActiveDragId(null);
        setActiveOverId(null);
    };

    // Find the widget object for the active drag item to render in overlay
    const activeDragWidget = activeDragId ?
        sections.flatMap(s => s.widgets).find(w => w.id === activeDragId)
        : null;
    const activeDragEntity = activeDragWidget ? entities[activeDragWidget.entityId] : null;

    return (
        <>
            <Header />
            <div className="dashboard-container">
                {sections.length === 0 && !isEditing ? (
                    <div className="empty-state">
                        <p className="title">No sections found</p>
                        <p className="mb-4">Empty dashboard</p>
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCorners}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                    >
                        <div
                            className="sections-grid"
                            style={
                                { '--section-columns': `repeat(${numColumns}, 1fr)` } as React.CSSProperties
                            }
                        >
                            {Array.from({ length: numColumns }).map((_, colIndex) => {
                                // Filter sections for this column
                                const columnSections = sections.filter((s, i) => {
                                    const assignedCol = s.column !== undefined ? s.column : (i % numColumns);
                                    const effectiveCol = assignedCol % numColumns;
                                    return effectiveCol === colIndex;
                                });

                                return (
                                    <div key={colIndex} className="dashboard-column" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                        {columnSections.map(section => (
                                            <DashboardSection
                                                key={section.id}
                                                section={section}
                                                entities={entities}
                                                isEditing={isEditing}
                                                onDeleteSection={() => activeDashboardId && deleteSection(activeDashboardId, section.id)}
                                                onRemoveWidget={(widgetId) => activeDashboardId && removeWidget(activeDashboardId, section.id, widgetId)}
                                                onAddWidget={() => handleAddWidgetClick(section.id)}
                                                numColumns={numColumns}
                                                activeOverId={activeOverId}
                                            />
                                        ))}

                                        {isEditing && (
                                            <button
                                                className="add-section-btn glass"
                                                onClick={() => handleAddSection(colIndex)}
                                                style={{ width: '100%', justifyContent: 'center', height: '100px', borderStyle: 'dashed' }}
                                            >
                                                <Plus size={20} className="mr-2" />
                                                Add Section
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <DragOverlay>
                            {activeDragEntity ? (
                                <div className="widget-wrapper" style={{ opacity: 0.8, transform: 'scale(1.05)' }}>
                                    <EntityCard entity={activeDragEntity} />
                                </div>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                )}
            </div>

            <AddWidgetModal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    setTargetSectionId(null);
                }}
                onAdd={(entityId, type) => {
                    if (activeDashboardId && targetSectionId) {
                        addWidget(activeDashboardId, targetSectionId, {
                            entityId,
                            type,
                            layout: { x: 0, y: 0, w: 1, h: 1 }
                        });
                    }
                }}
            />
        </>
    );
};
