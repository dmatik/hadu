import React, { useState } from 'react';
import { useHomeAssistant } from '../../contexts/HomeAssistantContext';
import { Header } from '../Header/Header';
import { EntityCard } from '../Widgets/EntityCard';
import { useDashboards } from '../../contexts/DashboardsContext';
import { AddWidgetModal } from '../Modals/AddWidgetModal';
import { Plus, X } from 'lucide-react';
import './Dashboard.css';

export const DashboardLayout: React.FC = () => {
    const { entities } = useHomeAssistant();
    const { dashboards, activeDashboardId, isEditing, removeWidget, addWidget } = useDashboards();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const activeDashboard = dashboards.find(d => d.id === activeDashboardId);
    const widgets = activeDashboard?.widgets || [];

    if (!entities) {
        return (
            <div className="flex justify-center items-center h-screen text-white">
                Loading entities...
            </div>
        );
    }

    return (
        <>
            <Header />
            <div className="dashboard-container">
                <div className="widgets-grid">
                    {widgets.length === 0 ? (
                        <div className="empty-state">
                            <p className="title">No widgets added</p>
                            <p>
                                {isEditing
                                    ? "Click the + button to add your first widget"
                                    : "Enter edit mode to add widgets"}
                            </p>
                        </div>
                    ) : (
                        widgets.map(widget => {
                            const entity = entities[widget.entityId];
                            if (!entity) return null;

                            return (
                                <div key={widget.id} className="widget-wrapper">
                                    {isEditing && (
                                        <button
                                            className="remove-widget-btn"
                                            onClick={() => activeDashboardId && removeWidget(activeDashboardId, widget.id)}
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                    <EntityCard entity={entity} />
                                </div>
                            );
                        })
                    )}

                    {isEditing && (
                        <button
                            className="add-widget-btn glass"
                            onClick={() => setIsAddModalOpen(true)}
                        >
                            <Plus size={32} />
                        </button>
                    )}
                </div>
            </div>

            <AddWidgetModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={(entityId, type) => {
                    if (activeDashboardId) {
                        addWidget(activeDashboardId, {
                            entityId,
                            type,
                            layout: { x: 0, y: 0, w: 1, h: 1 } // Default placeholder
                        });
                    }
                }}
            />
        </>
    );
};
