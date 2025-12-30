import React, { useState, useEffect } from 'react';
import { useHomeAssistant } from '../../contexts/HomeAssistantContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { useDashboards } from '../../contexts/DashboardsContext';
import { Cloud, Sun, Lightbulb, Menu, MoreVertical, Edit2, Trash2, Settings, Check } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { DashboardModal } from '../Modals/DashboardModal';
import './Header.css';

export const Header: React.FC = () => {
    const { entities } = useHomeAssistant();
    const { toggleSidebar } = useSidebar();
    const {
        activeDashboardId,
        dashboards,
        isEditing,
        toggleEditing,
        deleteDashboard,
        updateDashboard
    } = useDashboards();
    const [time, setTime] = useState(new Date());
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    const activeDashboard = dashboards.find(d => d.id === activeDashboardId);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const getGreeting = () => {
        const hours = time.getHours();
        if (hours < 12) return 'Good Morning';
        if (hours < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        }).format(date);
    };

    // Summaries
    const activeLights = Object.values(entities || {}).filter(
        e => e.entity_id.startsWith('light.') && e.state === 'on'
    ).length;

    // Basic Weather logic (finding first weather entity)
    const weatherEntity = Object.values(entities || {}).find(e => e.entity_id.startsWith('weather.'));
    const weatherState = weatherEntity?.state || 'Unknown';
    const temperature = weatherEntity?.attributes?.temperature;

    return (
        <header className="header-container">
            <div className="header-left">
                <button className="menu-btn" onClick={toggleSidebar}>
                    <Menu size={24} />
                </button>
                <div className="title-group">
                    <h1 className="greeting">{getGreeting()}</h1>
                    <div className="date-display">
                        {formatDate(time)} • {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </div>

            <div className="header-right">
                {weatherEntity && (
                    <div className="status-chip weather-chip">
                        {weatherState.includes('rain') ? <Cloud /> : <Sun />}
                        <span>
                            {temperature ? `${temperature}°C` : ''} {weatherState}
                        </span>
                    </div>
                )}

                <div className="status-chip">
                    <Lightbulb size={18} color={activeLights > 0 ? '#fbbf24' : 'currentColor'} />
                    <span>{activeLights} Lights On</span>
                </div>

                <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                        <button className="menu-btn" aria-label="Menu">
                            <MoreVertical size={20} />
                        </button>
                    </DropdownMenu.Trigger>

                    <DropdownMenu.Portal>
                        <DropdownMenu.Content className="dropdown-content" sideOffset={5} align="end">
                            <DropdownMenu.Item className="dropdown-item" onClick={toggleEditing}>
                                {isEditing ? <Check size={16} /> : <Edit2 size={16} />}
                                {isEditing ? 'Done Editing' : 'Edit Widgets'}
                            </DropdownMenu.Item>

                            {activeDashboardId && (
                                <>
                                    <DropdownMenu.Item
                                        className="dropdown-item"
                                        onClick={() => setIsSettingsModalOpen(true)}
                                    >
                                        <Settings size={16} />
                                        Dashboard Settings
                                    </DropdownMenu.Item>

                                    <DropdownMenu.Item
                                        className="dropdown-item danger"
                                        onClick={() => {
                                            if (confirm('Are you sure you want to delete this dashboard?')) {
                                                deleteDashboard(activeDashboardId);
                                            }
                                        }}
                                    >
                                        <Trash2 size={16} />
                                        Delete Dashboard
                                    </DropdownMenu.Item>
                                </>
                            )}
                        </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                </DropdownMenu.Root>
            </div>

            {activeDashboard && (
                <DashboardModal
                    isOpen={isSettingsModalOpen}
                    onClose={() => setIsSettingsModalOpen(false)}
                    initialName={activeDashboard.name}
                    initialColumns={activeDashboard.columns}
                    title="Dashboard Settings"
                    onSave={(name, columns) => {
                        updateDashboard({
                            ...activeDashboard,
                            name,
                            columns
                        });
                    }}
                />
            )}
        </header>
    );
};
