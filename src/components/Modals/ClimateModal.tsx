import React, { useState, useEffect, useRef } from 'react';
import type { HassEntity } from 'home-assistant-js-websocket';
import { useHomeAssistant } from '../../contexts/HomeAssistantContext';
import {
    X,
    Plus,
    Minus,
    Power,
    Fan,
} from 'lucide-react';
import './ClimateModal.css';

interface Props {
    entity: HassEntity;
    isOpen: boolean;
    onClose: () => void;
}

export const ClimateModal: React.FC<Props> = ({ entity, isOpen, onClose }) => {
    const { callService } = useHomeAssistant();
    const [isDragging, setIsDragging] = useState(false);
    const sliderRef = useRef<HTMLDivElement>(null);

    // Get attributes
    const {
        min_temp = 7,
        max_temp = 35,
        current_temperature,
        temperature,
        hvac_modes,
        fan_modes,
        fan_mode
    } = entity.attributes;

    const currentMode = entity.state;
    // Handle different temperature attribute names (target_temp_low/high) if needed, but 'temperature' is standard for single setpoint
    const currentTargetTemp = temperature || entity.attributes.target_temp_low || min_temp;
    const currentFanMode = fan_mode || 'auto';

    const [localTemp, setLocalTemp] = useState(currentTargetTemp);
    const [openDropdown, setOpenDropdown] = useState<'mode' | 'fan' | null>(null);

    useEffect(() => {
        if (!isDragging) {
            setLocalTemp(currentTargetTemp);
        }
    }, [currentTargetTemp, isDragging]);

    const toggleDropdown = (name: 'mode' | 'fan') => {
        if (openDropdown === name) {
            setOpenDropdown(null);
        } else {
            setOpenDropdown(name);
        }
    };

    const handleContentClick = () => {
        if (openDropdown) setOpenDropdown(null);
    };

    if (!isOpen) return null;

    // Slider Constants
    // Slider Constants
    const RADIUS = 100;
    const CENTER = 125;
    // With 0 at 3 o'clock (Right), going Clockwise (positive degrees in SVG trig? No, SVG Y is down):
    // Standard trig: 0 is Right, 90 is Down (Y+), 180 is Left, 270 is Up (Y-).
    // We want Gap at Bottom (90 deg).
    // So Start: 90 + 45 = 135 (Bottom Left).
    // End: 90 - 45 (or 360 + 45) = 405 (Bottom Right).
    const START_ANGLE_DEG = 135;
    const ANGLE_RANGE = 270;

    const valueToAngle = (val: number) => {
        const fraction = (val - min_temp) / (max_temp - min_temp);
        return START_ANGLE_DEG + (fraction * ANGLE_RANGE);
    };

    const angleToValue = (angleDeg: number) => {
        let relativeAngle = angleDeg - START_ANGLE_DEG;
        while (relativeAngle < 0) relativeAngle += 360;

        if (relativeAngle > ANGLE_RANGE) {
            if (relativeAngle > ANGLE_RANGE + (360 - ANGLE_RANGE) / 2) {
                return min_temp;
            } else {
                return max_temp;
            }
        }

        const fraction = relativeAngle / ANGLE_RANGE;
        const rawVal = min_temp + fraction * (max_temp - min_temp);
        return Math.round(rawVal * 2) / 2;
    };

    const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
        const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    };

    const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
        const start = polarToCartesian(x, y, radius, endAngle);
        const end = polarToCartesian(x, y, radius, startAngle);
        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
        const d = [
            "M", start.x, start.y,
            "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
        ].join(" ");
        return d;
    };

    const handlePointerMove = (e: React.PointerEvent | PointerEvent) => {
        if (!sliderRef.current) return;
        const rect = sliderRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const x = e.clientX - centerX;
        const y = e.clientY - centerY;

        let angleDeg = Math.atan2(y, x) * 180 / Math.PI;
        if (angleDeg < 0) angleDeg += 360;

        const newValue = angleToValue(angleDeg);
        const clamped = Math.max(min_temp, Math.min(max_temp, newValue));
        setLocalTemp(clamped);
    };

    const handlePointerUp = () => {
        setIsDragging(false);
        if (localTemp !== currentTargetTemp) {
            callService('climate', 'set_temperature', {
                entity_id: entity.entity_id,
                temperature: localTemp
            });
        }
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        setIsDragging(true);
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        handlePointerMove(e);
    };

    const adjustTemp = (delta: number) => {
        const newVal = Math.max(min_temp, Math.min(max_temp, localTemp + delta));
        setLocalTemp(newVal);
        const payload = {
            entity_id: entity.entity_id,
            temperature: newVal
        };
        callService('climate', 'set_temperature', payload);
    };

    const setMode = (mode: string) => {
        callService('climate', 'set_hvac_mode', {
            entity_id: entity.entity_id,
            hvac_mode: mode
        });
    };

    const setFan = (speed: string) => {
        callService('climate', 'set_fan_mode', {
            entity_id: entity.entity_id,
            fan_mode: speed
        });
    };

    const currentAngle = valueToAngle(localTemp);
    const trackPath = describeArc(CENTER, CENTER, RADIUS, START_ANGLE_DEG, START_ANGLE_DEG + ANGLE_RANGE);
    const progressPath = describeArc(CENTER, CENTER, RADIUS, START_ANGLE_DEG, currentAngle);
    const thumbPos = polarToCartesian(CENTER, CENTER, RADIUS, currentAngle);

    const getModeColor = () => {
        if (currentMode === 'heat') return '#f97316';
        if (currentMode === 'cool') return '#4facfe';
        if (currentMode === 'off') return '#6c757d';
        return '#4facfe';
    };



    return (
        <div className={`climate-modal-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
            <div className="climate-modal-content glass" onClick={(e) => { e.stopPropagation(); handleContentClick(); }}>
                {/* ... Header and Slider ... */}

                {/* ... Adjust Buttons ... */}

                <div className="climate-modal-header">
                    <div className="climate-modal-title-group">
                        <div className="climate-modal-title">
                            {entity.attributes.friendly_name || 'Climate'}
                        </div>
                        <div className="climate-modal-area">
                            {entity.attributes.area_name || ''}
                        </div>
                    </div>
                    <button className="climate-modal-close" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="climate-modal-body">
                    <div className="current-temp-label">Current Temperature</div>
                    <div className="current-temp-value">
                        {current_temperature}°
                    </div>

                    <div
                        className="circular-slider-container"
                        ref={sliderRef}
                        onPointerDown={handlePointerDown}
                    >
                        <svg className="circular-slider-svg" viewBox="0 0 250 250">
                            <defs>
                                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.3" />
                                </filter>
                            </defs>
                            <path d={trackPath} className="slider-track" />
                            <path
                                d={progressPath}
                                className="slider-progress"
                                style={{ stroke: getModeColor() }}
                            />
                            <circle
                                cx={thumbPos.x}
                                cy={thumbPos.y}
                                r={12}
                                className="slider-thumb"
                            />
                        </svg>

                        <div className="slider-center-text">
                            <div className="target-mode-label">{currentMode}</div>
                            <div className="target-temp-val">
                                {localTemp}
                                <span style={{ fontSize: '1.5rem', fontWeight: 300, verticalAlign: 'top' }}>°</span>
                            </div>
                        </div>
                    </div>

                    <div className="temp-adjust-buttons">
                        <button className="adjust-btn" onClick={(e) => { e.stopPropagation(); adjustTemp(-1); }}>
                            <Minus size={36} />
                        </button>
                        <button className="adjust-btn" onClick={(e) => { e.stopPropagation(); adjustTemp(1); }}>
                            <Plus size={36} />
                        </button>
                    </div>

                    <div className="modal-controls-grid">
                        <div className="mode-selector-container">
                            <div
                                className={`control-tile ${currentMode !== 'off' ? 'active' : ''}`}
                                onClick={(e) => { e.stopPropagation(); toggleDropdown('mode'); }}
                            >
                                <div className="control-info">
                                    <span className="control-label">Mode</span>
                                    <span className="control-value">{currentMode}</span>
                                </div>
                                <Power size={24} className="control-icon" />
                            </div>
                            <div className={`mode-dropdown ${openDropdown === 'mode' ? 'open' : ''}`}>
                                {hvac_modes?.map((mode: string) => (
                                    <button
                                        key={mode}
                                        className={`mode-option ${currentMode === mode ? 'active' : ''}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setMode(mode);
                                            setOpenDropdown(null);
                                        }}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {fan_modes && (
                            <div className="mode-selector-container">
                                <div
                                    className="control-tile"
                                    onClick={(e) => { e.stopPropagation(); toggleDropdown('fan'); }}
                                >
                                    <div className="control-info">
                                        <span className="control-label">Fan Speed</span>
                                        <span className="control-value">{currentFanMode}</span>
                                    </div>
                                    <Fan size={24} className="control-icon" />
                                </div>
                                <div className={`mode-dropdown ${openDropdown === 'fan' ? 'open' : ''}`}>
                                    {fan_modes.map((mode: string) => (
                                        <button
                                            key={mode}
                                            className={`mode-option ${currentFanMode === mode ? 'active' : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFan(mode);
                                                setOpenDropdown(null);
                                            }}
                                        >
                                            {mode}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
