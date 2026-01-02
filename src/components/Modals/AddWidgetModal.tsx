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
    onAdd: (entityId: string, type: string, options?: any) => void;
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
    const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
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

    const filteredSensors = selectedEntityId && entities
        ? Object.values(entities).filter(e => {
            const isSensor = e.entity_id.startsWith('sensor.') || e.entity_id.startsWith('input_number.');
            const matchesSearch = e.entity_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (e.attributes.friendly_name?.toLowerCase().includes(searchQuery.toLowerCase()));
            return isSensor && matchesSearch;
        })
        : [];

    const handleBack = () => {
        if (selectedEntityId) {
            setSelectedEntityId(null);
            setSearchQuery(''); // Clear search when going back
        } else {
            setSelectedDomain(null);
            setSearchQuery('');
        }
    };

    const handleEntitySelect = (entityId: string) => {
        if (selectedDomain === 'climate') {
            setSelectedEntityId(entityId);
            setSearchQuery(''); // Reset search for sensor selection
        } else {
            onAdd(entityId, 'entity-card');
            closeModal();
        }
    };

    const handleConfigSelect = (sensorId?: string) => {
        if (selectedEntityId) {
            onAdd(selectedEntityId, 'entity-card', {
                temperatureSensor: sensorId
            });
            closeModal();
        }
    };

    const closeModal = () => {
        onClose();
        // Reset state after transition
        setTimeout(() => {
            setSelectedDomain(null);
            setSelectedEntityId(null);
            setSearchQuery('');
        }, 300);
    };

    return (
        <div className={`modal-overlay ${isOpen ? 'open' : ''}`}>
            <div className="modal-content">
                <div className="modal-header">
                    <h2 className="modal-title">
                        {selectedEntityId ? 'Select Temperature Sensor' :
                            selectedDomain ? `Select ${selectedDomain} Entity` : 'Select Domain'}
                    </h2>
                    <button className="modal-close" onClick={closeModal}>
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
                    ) : !selectedEntityId ? (
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
                                            onClick={() => handleEntitySelect(entity.entity_id)}
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
                                    placeholder="Search sensors..."
                                    className="search-input"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="entity-list">
                                {/* Default Option */}
                                <div
                                    className="entity-item"
                                    onClick={() => handleConfigSelect(undefined)}
                                    style={{ borderLeft: '3px solid var(--primary-color)' }}
                                >
                                    <div className="entity-item-info">
                                        <span className="entity-item-name">
                                            Default: Use Climate Attribute
                                        </span>
                                        <span className="entity-item-id">
                                            {selectedEntityId} (current_temperature)
                                        </span>
                                    </div>
                                </div>

                                {filteredSensors.map(sensor => (
                                    <div
                                        key={sensor.entity_id}
                                        className="entity-item"
                                        onClick={() => handleConfigSelect(sensor.entity_id)}
                                    >
                                        <div className="entity-item-info">
                                            <span className="entity-item-name">
                                                {sensor.attributes.friendly_name || sensor.entity_id}
                                            </span>
                                            <span className="entity-item-id">
                                                {sensor.entity_id}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-400">
                                            {sensor.state} {sensor.attributes.unit_of_measurement}
                                        </div>
                                    </div>
                                ))}

                                {filteredSensors.length === 0 && searchQuery && (
                                    <div className="text-gray-400 text-center py-4">
                                        No sensors found matching "{searchQuery}"
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
