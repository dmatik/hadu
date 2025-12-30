import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface Widget {
    id: string;
    type: string;
    entityId: string;
    options?: any;
    layout?: {
        x: number;
        y: number;
        w: number;
        h: number;
    }
}

export interface Section {
    id: string;
    title: string;
    column?: number;
    widgets: Widget[];
}

export interface Dashboard {
    id: string;
    name: string;
    icon: string;
    sections: Section[];
    columns?: number;
    // Legacy support for migration
    widgets?: Widget[];
}

interface DashboardsContextType {
    dashboards: Dashboard[];
    activeDashboardId: string | null;
    isEditing: boolean;
    toggleEditing: () => void;
    setActiveDashboardId: (id: string) => void;
    addDashboard: (name: string, columns: number) => Promise<void>;
    deleteDashboard: (id: string) => Promise<void>;
    updateDashboard: (dashboard: Dashboard) => Promise<void>;
    addSection: (dashboardId: string, title: string, column?: number) => Promise<void>;
    deleteSection: (dashboardId: string, sectionId: string) => Promise<void>;
    addWidget: (dashboardId: string, sectionId: string, widget: Omit<Widget, 'id'>) => Promise<void>;
    removeWidget: (dashboardId: string, sectionId: string, widgetId: string) => Promise<void>;
    moveWidget: (dashboardId: string, sourceSectionId: string, destinationSectionId: string, widgetId: string, newIndex: number) => Promise<void>;
    refreshDashboards: () => Promise<void>;
}

const DashboardsContext = createContext<DashboardsContextType | undefined>(undefined);

export const DashboardsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [dashboards, setDashboards] = useState<Dashboard[]>([]);
    const [activeDashboardId, setActiveDashboardId] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const toggleEditing = () => setIsEditing(prev => !prev);

    const fetchDashboards = async () => {
        try {
            const response = await fetch('/api/dashboards');
            if (response.ok) {
                let data: Dashboard[] = await response.json();

                // Migration logic for existing dashboards directly in fetch
                // If dashboard has widgets but no sections, creating a default section
                data = data.map(d => {
                    let updated = { ...d };

                    // Default columns if missing
                    if (!updated.columns) {
                        updated.columns = 3;
                    }

                    if (!d.sections && d.widgets && d.widgets.length > 0) {
                        updated = {
                            ...updated,
                            sections: [{
                                id: crypto.randomUUID(),
                                title: 'Main Section',
                                widgets: d.widgets
                            }],
                            widgets: undefined
                        };
                    } else if (!d.sections) {
                        // Ensure sections array exists
                        updated = { ...updated, sections: [] };
                    }
                    return updated;
                });

                setDashboards(data);
                if (data.length > 0 && !activeDashboardId) {
                    setActiveDashboardId(data[0].id);
                }
            } else {
                console.error('Failed to fetch dashboards');
            }
        } catch (error) {
            console.error('Error fetching dashboards:', error);
        }
    };

    useEffect(() => {
        fetchDashboards();
    }, []);

    const saveDashboards = async (newDashboards: Dashboard[]) => {
        try {
            await fetch('/api/dashboards', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newDashboards),
            });
            setDashboards(newDashboards);
        } catch (error) {
            console.error('Error saving dashboards:', error);
        }
    };

    const addDashboard = async (name: string, columns: number) => {
        const newDashboard: Dashboard = {
            id: crypto.randomUUID(),
            name,
            icon: 'layout-dashboard',
            columns: columns || 3,
            sections: [
                {
                    id: crypto.randomUUID(),
                    title: 'Default Section',
                    widgets: []
                }
            ]
        };
        const newDashboards = [...dashboards, newDashboard];
        await saveDashboards(newDashboards);
        setActiveDashboardId(newDashboard.id);
    };

    const deleteDashboard = async (id: string) => {
        const newDashboards = dashboards.filter(d => d.id !== id);
        await saveDashboards(newDashboards);
        if (activeDashboardId === id) {
            setActiveDashboardId(newDashboards.length > 0 ? newDashboards[0].id : null);
        }
    };

    const updateDashboard = async (updatedDashboard: Dashboard) => {
        const newDashboards = dashboards.map(d => d.id === updatedDashboard.id ? updatedDashboard : d);
        await saveDashboards(newDashboards);
    };

    const addSection = async (dashboardId: string, title: string, column: number = 0) => {
        const dashboard = dashboards.find(d => d.id === dashboardId);
        if (!dashboard) return;

        const newSection: Section = {
            id: crypto.randomUUID(),
            title,
            column,
            widgets: []
        };

        const updatedDashboard = {
            ...dashboard,
            sections: [...(dashboard.sections || []), newSection]
        };

        await updateDashboard(updatedDashboard);
    };

    const deleteSection = async (dashboardId: string, sectionId: string) => {
        const dashboard = dashboards.find(d => d.id === dashboardId);
        if (!dashboard) return;

        const updatedDashboard = {
            ...dashboard,
            sections: dashboard.sections.filter(s => s.id !== sectionId)
        };

        await updateDashboard(updatedDashboard);
    };

    const addWidget = async (dashboardId: string, sectionId: string, widget: Omit<Widget, 'id'>) => {
        const dashboard = dashboards.find(d => d.id === dashboardId);
        if (!dashboard) return;

        const newWidget: Widget = {
            ...widget,
            id: crypto.randomUUID()
        };

        const updatedDashboard = {
            ...dashboard,
            sections: dashboard.sections.map(section => {
                if (section.id === sectionId) {
                    return {
                        ...section,
                        widgets: [...section.widgets, newWidget]
                    };
                }
                return section;
            })
        };

        await updateDashboard(updatedDashboard);
    };

    const removeWidget = async (dashboardId: string, sectionId: string, widgetId: string) => {
        const dashboard = dashboards.find(d => d.id === dashboardId);
        if (!dashboard) return;

        const updatedDashboard = {
            ...dashboard,
            sections: dashboard.sections.map(section => {
                if (section.id === sectionId) {
                    return {
                        ...section,
                        widgets: section.widgets.filter(w => w.id !== widgetId)
                    };
                }
                return section;
            })
        };

        await updateDashboard(updatedDashboard);
    };

    const refreshDashboards = async () => {
        await fetchDashboards();
    };

    const moveWidget = async (dashboardId: string, sourceSectionId: string, destinationSectionId: string, widgetId: string, newIndex: number) => {
        const dashboard = dashboards.find(d => d.id === dashboardId);
        if (!dashboard) return;

        // Find the source section and widget
        const sourceSection = dashboard.sections.find(s => s.id === sourceSectionId);
        if (!sourceSection) return;

        const widgetIndex = sourceSection.widgets.findIndex(w => w.id === widgetId);
        if (widgetIndex === -1) return;

        const widget = sourceSection.widgets[widgetIndex];

        let updatedSections = [...dashboard.sections];

        // Case 1: Moving within the same section
        if (sourceSectionId === destinationSectionId) {
            const sectionIndex = updatedSections.findIndex(s => s.id === sourceSectionId);
            const newWidgets = [...sourceSection.widgets];

            // Remove from old position
            newWidgets.splice(widgetIndex, 1);
            // Insert at new position
            newWidgets.splice(newIndex, 0, widget);

            updatedSections[sectionIndex] = {
                ...sourceSection,
                widgets: newWidgets
            };
        }
        // Case 2: Moving to a different section
        else {
            const destSectionIndex = updatedSections.findIndex(s => s.id === destinationSectionId);
            const sourceSectionIndex = updatedSections.findIndex(s => s.id === sourceSectionId);

            if (destSectionIndex === -1) return;

            const sourceWidgets = [...updatedSections[sourceSectionIndex].widgets];
            const destWidgets = [...updatedSections[destSectionIndex].widgets];

            // Remove from source
            sourceWidgets.splice(widgetIndex, 1);

            // Add to destination
            destWidgets.splice(newIndex, 0, widget);

            updatedSections[sourceSectionIndex] = {
                ...updatedSections[sourceSectionIndex],
                widgets: sourceWidgets
            };

            updatedSections[destSectionIndex] = {
                ...updatedSections[destSectionIndex],
                widgets: destWidgets
            };
        }

        const updatedDashboard = {
            ...dashboard,
            sections: updatedSections
        };

        // Optimistic update
        setDashboards(prev => prev.map(d => d.id === dashboardId ? updatedDashboard : d));

        await saveDashboards(dashboards.map(d => d.id === dashboardId ? updatedDashboard : d));
    };

    return (
        <DashboardsContext.Provider value={{
            dashboards,
            activeDashboardId,
            isEditing,
            toggleEditing,
            setActiveDashboardId,
            addDashboard,
            deleteDashboard,
            updateDashboard,
            addSection,
            deleteSection,
            addWidget,
            removeWidget,
            moveWidget,
            refreshDashboards
        }}>
            {children}
        </DashboardsContext.Provider>
    );
};

export const useDashboards = () => {
    const context = useContext(DashboardsContext);
    if (context === undefined) {
        throw new Error('useDashboards must be used within a DashboardsProvider');
    }
    return context;
};
