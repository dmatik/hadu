import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import './DashboardModal.css';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, columns: number) => void;
    initialName?: string;
    initialColumns?: number;
    title?: string;
}

export const DashboardModal: React.FC<Props> = ({
    isOpen,
    onClose,
    onSave,
    initialName = '',
    initialColumns = 3,
    title = 'Create Dashboard'
}) => {
    const [name, setName] = useState(initialName);
    const [columns, setColumns] = useState(initialColumns);

    useEffect(() => {
        if (isOpen) {
            setName(initialName);
            setColumns(initialColumns);
        }
    }, [isOpen, initialName, initialColumns]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSave(name, columns);
            onClose();
        }
    };

    return (
        <div className={`modal-overlay ${isOpen ? 'open' : ''}`}>
            <div className="modal-content">
                <div className="modal-header">
                    <h2 className="modal-title">{title}</h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">Dashboard Name</label>
                            <input
                                type="text"
                                className="form-input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Living Room"
                                autoFocus
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Grid Layout (Columns)</label>
                            <div className="column-options">
                                {[1, 2, 3].map(num => (
                                    <div
                                        key={num}
                                        className={`column-option ${columns === num ? 'selected' : ''}`}
                                        onClick={() => setColumns(num)}
                                    >
                                        <div className="font-bold text-lg mb-1">{num}</div>
                                        <div className="text-xs opacity-70">Column{num > 1 ? 's' : ''}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Save Dashboard
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
