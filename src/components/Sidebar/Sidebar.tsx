import React, { useRef, useEffect } from 'react';
import { useSidebar } from '../../contexts/SidebarContext';
import { useDashboards } from '../../contexts/DashboardsContext';
import { X, Plus, LayoutDashboard } from 'lucide-react';
import './Sidebar.css';

export const Sidebar: React.FC = () => {
    const { isOpen, closeSidebar } = useSidebar();
    const { dashboards, activeDashboardId, setActiveDashboardId, addDashboard } = useDashboards();
    const sidebarRef = useRef<HTMLDivElement>(null);

    // Close sidebar when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node) && isOpen) {
                closeSidebar();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, closeSidebar]);

    return (
        <>
            <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} aria-hidden="true" />
            <div ref={sidebarRef} className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h2 className="sidebar-title">Dashboards</h2>
                    <button className="close-btn" onClick={closeSidebar} aria-label="Close Sidebar">
                        <X size={24} />
                    </button>
                </div>

                <div className="sidebar-content">
                    <ul className="dashboard-list">
                        {dashboards.map(dashboard => (
                            <li
                                key={dashboard.id}
                                className={`dashboard-item ${activeDashboardId === dashboard.id ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveDashboardId(dashboard.id);
                                    if (window.innerWidth < 768) closeSidebar();
                                }}
                            >
                                <LayoutDashboard size={18} />
                                <span>{dashboard.name}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="sidebar-footer">
                    <button
                        className="dashboard-item"
                        style={{ width: '100%', justifyContent: 'center', marginTop: 'auto', cursor: 'pointer', color: '#cdd6f4' }}
                        onClick={() => {
                            const name = prompt('Enter dashboard name:');
                            if (name) addDashboard(name);
                        }}
                    >
                        <Plus size={18} />
                        <span>Create New</span>
                    </button>
                </div>
            </div>
        </>
    );
};
