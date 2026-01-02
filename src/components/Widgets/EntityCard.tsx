import React from 'react';
import type { HassEntity } from 'home-assistant-js-websocket';
import { useHomeAssistant } from '../../contexts/HomeAssistantContext';
import {
    Lightbulb,
    Power,
    Thermometer,
    Activity,
    Droplet,
    Snowflake,
    Flame
} from 'lucide-react';
import './Widgets.css';

interface Props {
    entity: HassEntity;
    options?: any;
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

export const EntityCard: React.FC<Props> = ({ entity, options }) => {
    const { callService, entities } = useHomeAssistant();
    const domain = entity.entity_id.split('.')[0];
    const isActive = domain === 'climate'
        ? entity.state !== 'off' && entity.state !== 'unavailable'
        : entity.state === 'on' || entity.state === 'home' || entity.state === 'open';

    // Toggle handler
    const handleToggle = () => {
        if (domain === 'light' || domain === 'switch') {
            callService(domain, 'toggle', { entity_id: entity.entity_id });
        }
    };

    const isToggleable = ['light', 'switch', 'input_boolean'].includes(domain);

    const renderIconOrContent = () => {
        if (domain === 'climate') {
            let tempValue: string | number | null = null;
            let unit = entity.attributes.unit_of_measurement || '°C'; // Default to C if missing

            if (options?.temperatureSensor && entities && entities[options.temperatureSensor]) {
                const sensor = entities[options.temperatureSensor];
                tempValue = sensor.state;
                unit = sensor.attributes.unit_of_measurement || unit;
            } else if (entity.attributes.current_temperature !== undefined) {
                tempValue = entity.attributes.current_temperature;
            }

            if (tempValue !== null && tempValue !== undefined && tempValue !== 'unavailable' && tempValue !== 'unknown') {
                return (
                    <div className="temp-display">
                        <span className="temp-value">
                            {tempValue}<span className="temp-unit">°</span>
                        </span>
                    </div>
                );
            }
            // Fallback to icon if no temperature available
            return <Thermometer />;
        }
        return getIcon(domain, entity.state, entity.attributes);
    };

    const handleClimateMode = (mode: string) => {
        callService('climate', 'set_hvac_mode', {
            entity_id: entity.entity_id,
            hvac_mode: mode
        });
    };

    if (domain === 'climate') {
        const currentMode = entity.state; // 'off', 'cool', 'heat', 'auto', etc.

        return (
            <div className={`entity-card glass climate ${isActive ? 'active' : ''} mode-${currentMode}`}>
                <div className="climate-main-row">
                    <div className="icon-wrapper">
                        {renderIconOrContent()}
                    </div>

                    <div className="entity-info">
                        <div className="entity-name" title={entity.attributes.friendly_name || entity.entity_id}>
                            {entity.attributes.friendly_name || entity.entity_id}
                        </div>
                        <div className="entity-state">
                            {entity.state}
                            {(() => {
                                const attr = entity.attributes;
                                const targetTemp = attr.temperature || attr.target_temp_low || attr.target_temp_high;
                                if (targetTemp !== undefined && targetTemp !== null) {
                                    return ` • ${targetTemp}°`;
                                }
                                return '';
                            })()}
                        </div>
                    </div>
                </div>

                <div className="climate-controls">
                    <button
                        className={`climate-btn mode-heat ${currentMode === 'heat' ? 'active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); handleClimateMode('heat'); }}
                    >
                        <Flame size={20} />
                    </button>
                    <button
                        className={`climate-btn mode-cool ${currentMode === 'cool' ? 'active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); handleClimateMode('cool'); }}
                    >
                        <Snowflake size={20} />
                    </button>
                    <button
                        className={`climate-btn mode-off ${currentMode === 'off' ? 'active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); handleClimateMode('off'); }}
                    >
                        <Power size={20} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`entity-card glass ${isActive ? 'active' : ''} ${isToggleable ? 'clickable' : ''}`}
            onClick={isToggleable ? handleToggle : undefined}
        >
            <div className="icon-wrapper">
                {renderIconOrContent()}
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
