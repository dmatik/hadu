import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import './DashboardModal.css';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, columns: number, path: string) => void;
    initialName?: string;
    initialColumns?: number;
    initialPath?: string;
    title?: string;
}

export const DashboardModal = React.memo<Props>(({
    isOpen,
    onClose,
    onSave,
    initialName = '',
    initialColumns = 3,
    initialPath = '',
    title = 'Create Dashboard'
}) => {
    // Initialize state lazily
    const [name, setName] = useState(initialName);
    const [columns, setColumns] = useState(initialColumns);
    const [path, setPath] = useState(() => initialPath.startsWith('/') ? initialPath.slice(1) : initialPath);
    const [isPathManuallyEdited, setIsPathManuallyEdited] = useState(!!initialPath);

    // Track previous open state to detect opening transition
    const prevIsOpen = React.useRef(isOpen);

    useEffect(() => {
        // Only reset form when opening (transition from closed to open)
        if (isOpen && !prevIsOpen.current) {
            setName(initialName);
            setColumns(initialColumns);
            // Remove leading slash for display
            setPath(initialPath.startsWith('/') ? initialPath.slice(1) : initialPath);
            setIsPathManuallyEdited(!!initialPath);
        }
        prevIsOpen.current = isOpen;
    }, [isOpen, initialName, initialColumns, initialPath]);

    const slugify = (text: string) => {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')     // Replace spaces with -
            .replace(/[^\w-]+/g, '')  // Remove all non-word chars
            .replace(/--+/g, '-');    // Replace multiple - with single -
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setName(newName);
        if (!isPathManuallyEdited && !initialPath) {
            setPath(slugify(newName));
        }
    };

    const handlePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPath(e.target.value);
        setIsPathManuallyEdited(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            // Ensure path starts with /
            const finalPath = path.startsWith('/') ? path : '/' + path;
            onSave(name, columns, finalPath);
            onClose();
        }
    };

    // Removed the early return null to allow CSS transitions and maintain DOM presence (hidden)

    return ReactDOM.createPortal(
        <div className={`modal-overlay ${isOpen ? 'open' : ''}`} aria-hidden={!isOpen}>
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
                                onChange={handleNameChange}
                                placeholder="e.g. Living Room"
                                autoFocus={isOpen}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">URL Path</label>
                            <div className="input-prefix-wrapper">
                                <span className="input-prefix">/</span>
                                <input
                                    type="text"
                                    className="form-input with-prefix"
                                    value={path}
                                    onChange={handlePathChange}
                                    placeholder="living-room"
                                    required
                                />
                            </div>
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
        </div>,
        document.body
    );
});
