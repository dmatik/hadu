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

export interface Dashboard {
    id: string;
    name: string;
    icon: string;
    widgets: Widget[];
}

interface DashboardsContextType {
    dashboards: Dashboard[];
    activeDashboardId: string | null;
    isEditing: boolean;
    toggleEditing: () => void;
    setActiveDashboardId: (id: string) => void;
    addDashboard: (name: string) => Promise<void>;
    deleteDashboard: (id: string) => Promise<void>;
    updateDashboard: (dashboard: Dashboard) => Promise<void>;
    addWidget: (dashboardId: string, widget: Omit<Widget, 'id'>) => Promise<void>;
    removeWidget: (dashboardId: string, widgetId: string) => Promise<void>;
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
                const data = await response.json();
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

    const addDashboard = async (name: string) => {
        const newDashboard: Dashboard = {
            id: crypto.randomUUID(),
            name,
            icon: 'layout-dashboard',
            widgets: []
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

    const addWidget = async (dashboardId: string, widget: Omit<Widget, 'id'>) => {
        const dashboard = dashboards.find(d => d.id === dashboardId);
        if (!dashboard) return;

        const newWidget: Widget = {
            ...widget,
            id: crypto.randomUUID()
        };

        const updatedDashboard = {
            ...dashboard,
            widgets: [...dashboard.widgets, newWidget]
        };

        await updateDashboard(updatedDashboard);
    };

    const removeWidget = async (dashboardId: string, widgetId: string) => {
        const dashboard = dashboards.find(d => d.id === dashboardId);
        if (!dashboard) return;

        const updatedDashboard = {
            ...dashboard,
            widgets: dashboard.widgets.filter(w => w.id !== widgetId)
        };

        await updateDashboard(updatedDashboard);
    };

    const refreshDashboards = async () => {
        await fetchDashboards();
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
            addWidget,
            removeWidget,
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
