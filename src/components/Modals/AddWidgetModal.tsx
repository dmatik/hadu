import React, { useState } from 'react';
import { useHomeAssistant } from '../../contexts/HomeAssistantContext';
import {
    X,
    Lightbulb,
    Power,
    Thermometer,
    Activity,
    ArrowLeft,
    AppWindow
} from 'lucide-react';
import './AddWidgetModal.css';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (entityId: string, type: string) => void;
}

const DOMAINS = [
    { id: 'light', label: 'Lights', icon: Lightbulb },
    { id: 'switch', label: 'Switches', icon: Power },
    { id: 'sensor', label: 'Sensors', icon: Activity },
    { id: 'binary_sensor', label: 'Binary Sensors', icon: Activity },
    { id: 'climate', label: 'Climate', icon: Thermometer },
    { id: 'cover', label: 'Covers', icon: AppWindow },
];

export const AddWidgetModal: React.FC<Props> = ({ isOpen, onClose, onAdd }) => {
    const { entities } = useHomeAssistant();
    const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    if (!isOpen) return null;

    const filteredEntities = selectedDomain && entities
        ? Object.values(entities).filter(e => {
            const domain = e.entity_id.split('.')[0];
            const matchesDomain = domain === selectedDomain;
            const matchesSearch = e.entity_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (e.attributes.friendly_name?.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesDomain && matchesSearch;
        })
        : [];

    const handleBack = () => {
        setSelectedDomain(null);
        setSearchQuery('');
    };

    return (
        <div className={`modal-overlay ${isOpen ? 'open' : ''}`}>
            <div className="modal-content">
                <div className="modal-header">
                    <h2 className="modal-title">
                        {selectedDomain ? `Select ${selectedDomain} Entity` : 'Select Domain'}
                    </h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body">
                    {!selectedDomain ? (
                        <div className="domain-grid">
                            {DOMAINS.map(domain => {
                                const Icon = domain.icon;
                                return (
                                    <div
                                        key={domain.id}
                                        className="domain-card"
                                        onClick={() => setSelectedDomain(domain.id)}
                                    >
                                        <Icon size={32} className="domain-icon" />
                                        <span className="domain-name">{domain.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div>
                            <div className="entity-list-header">
                                <button className="back-btn" onClick={handleBack}>
                                    <ArrowLeft size={16} /> Back
                                </button>
                            </div>

                            <div className="relative mb-4">
                                <input
                                    type="text"
                                    placeholder="Search entities..."
                                    className="search-input"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="entity-list">
                                {filteredEntities.length === 0 ? (
                                    <div className="text-gray-400 text-center py-4">
                                        No entities found via search
                                    </div>
                                ) : (
                                    filteredEntities.map(entity => (
                                        <div
                                            key={entity.entity_id}
                                            className="entity-item"
                                            onClick={() => {
                                                onAdd(entity.entity_id, 'entity-card');
                                                onClose();
                                                setSelectedDomain(null); // Reset for next time
                                            }}
                                        >
                                            <div className="entity-item-info">
                                                <span className="entity-item-name">
                                                    {entity.attributes.friendly_name || entity.entity_id}
                                                </span>
                                                <span className="entity-item-id">
                                                    {entity.entity_id}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
