import React, { useState } from 'react';
import { useHomeAssistant } from '../../contexts/HomeAssistantContext';
import { Header } from '../Header/Header';
import { EntityCard } from '../Widgets/EntityCard';
import { useDashboards } from '../../contexts/DashboardsContext';
import { AddWidgetModal } from '../Modals/AddWidgetModal';
import { Plus, X, Trash2 } from 'lucide-react';
import './Dashboard.css';

export const DashboardLayout: React.FC = () => {
    const { entities } = useHomeAssistant();
    const {
        dashboards,
        activeDashboardId,
        isEditing,
        removeWidget,
        addWidget,
        addSection,
        deleteSection
    } = useDashboards();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [targetSectionId, setTargetSectionId] = useState<string | null>(null);

    const activeDashboard = dashboards.find(d => d.id === activeDashboardId);
    // Fallback for sections if undefined (during migration)
    const sections = activeDashboard?.sections || [];
    const numColumns = activeDashboard?.columns || 3;

    if (!entities) {
        return (
            <div className="flex justify-center items-center h-screen text-white">
                Loading entities...
            </div>
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
                    <div
                        className="sections-grid"
                        style={
                            { '--section-columns': `repeat(${numColumns}, 1fr)` } as React.CSSProperties
                        }
                    >
                        {Array.from({ length: numColumns }).map((_, colIndex) => {
                            // Filter sections for this column
                            const columnSections = sections.filter((s, i) => {
                                const sCol = s.column !== undefined ? s.column : (i % numColumns);
                                return sCol === colIndex;
                            });

                            return (
                                <div key={colIndex} className="dashboard-column" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                    {columnSections.map(section => (
                                        <div key={section.id} className="dashboard-section">
                                            <div className="section-header">
                                                <h3 className="section-title">{section.title}</h3>
                                                {isEditing && (
                                                    <button
                                                        className="delete-section-btn"
                                                        onClick={() => activeDashboardId && deleteSection(activeDashboardId, section.id)}
                                                        title="Delete Section"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>

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
                                                        <div key={widget.id} className="widget-wrapper">
                                                            {isEditing && (
                                                                <button
                                                                    className="remove-widget-btn"
                                                                    onClick={() => activeDashboardId && removeWidget(activeDashboardId, section.id, widget.id)}
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            )}
                                                            <EntityCard entity={entity} />
                                                        </div>
                                                    );
                                                })}

                                                {isEditing && (
                                                    <button
                                                        className="add-widget-btn glass"
                                                        onClick={() => handleAddWidgetClick(section.id)}
                                                    >
                                                        <Plus size={32} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
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
