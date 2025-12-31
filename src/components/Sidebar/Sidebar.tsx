import React, { useRef, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSidebar } from '../../contexts/SidebarContext';
import { useDashboards } from '../../contexts/DashboardsContext';
import { DashboardModal } from '../Modals/DashboardModal';
import { X, Plus, LayoutDashboard } from 'lucide-react';
import './Sidebar.css';

export const Sidebar: React.FC = () => {
    const { isOpen, closeSidebar } = useSidebar();
    const { dashboards, activeDashboardId, addDashboard } = useDashboards();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const location = useLocation();

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
                                className={`dashboard-item ${activeDashboardId === dashboard.id || location.pathname === dashboard.path ? 'active' : ''}`}
                                onClick={() => {
                                    navigate(dashboard.path || '/');
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
                        onClick={() => setIsCreateModalOpen(true)}
                    >
                        <Plus size={18} />
                        <span>Create New</span>
                    </button>
                </div>
            </div>

            <DashboardModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSave={React.useCallback((name, columns, path) => {
                    addDashboard(name, columns, path);
                }, [addDashboard])}
                title="Create New Dashboard"
            />
        </>
    );
};
