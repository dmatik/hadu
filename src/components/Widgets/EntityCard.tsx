import React from 'react';
import type { HassEntity } from 'home-assistant-js-websocket';
import { useHomeAssistant } from '../../contexts/HomeAssistantContext';
import {
    Lightbulb,
    Power,
    Thermometer,
    Activity,
    Droplet
} from 'lucide-react';
import './Widgets.css';

interface Props {
    entity: HassEntity;
}

const getIcon = (domain: string, _state: string, attributes: any) => {
    switch (domain) {
        case 'light': return <Lightbulb />;
        case 'switch': return <Power />;
        case 'climate': return <Thermometer />;
        case 'sensor':
            if (attributes.device_class === 'temperature') return <Thermometer />;
            if (attributes.device_class === 'humidity') return <Droplet />;
            return <Activity />;
        default: return <Activity />;
    }
};

export const EntityCard: React.FC<Props> = ({ entity }) => {
    const { callService } = useHomeAssistant();
    const domain = entity.entity_id.split('.')[0];
    const isActive = entity.state === 'on' || entity.state === 'home' || entity.state === 'open';

    // Toggle handler
    const handleToggle = () => {
        if (domain === 'light' || domain === 'switch') {
            callService(domain, 'toggle', { entity_id: entity.entity_id });
        }
    };

    const isToggleable = ['light', 'switch', 'input_boolean'].includes(domain);

    return (
        <div
            className={`entity-card glass ${isActive ? 'active' : ''} ${isToggleable ? 'clickable' : ''}`}
            onClick={isToggleable ? handleToggle : undefined}
        >
            <div className="icon-wrapper">
                {getIcon(domain, entity.state, entity.attributes)}
            </div>

            <div className="entity-info">
                <div className="entity-name" title={entity.attributes.friendly_name || entity.entity_id}>
                    {entity.attributes.friendly_name || entity.entity_id}
                </div>
                <div className="entity-state">
                    {entity.state}
                    {entity.attributes.unit_of_measurement ? ` ${entity.attributes.unit_of_measurement}` : ''}
                </div>
            </div>
        </div>
    );
};
