import React, { useEffect, useState, useCallback, CSSProperties } from 'react';
import ForgeViewer from './components/ForgeViewer';
import ModelUpload from './components/ModelUpload';
import DragDropUpload from './components/DragDropUpload';
//  import BoundingBoxUtils from './components/BoundingBoxUtils';

interface Model {
    urn: string;
    name: string;
}

// --- Style Definitions ---
const appStyle: CSSProperties = {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden'
};

const headerStyle: CSSProperties = {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    padding: '0.5em 1em',
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #dee2e6',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    zIndex: 10
};

const selectStyle: CSSProperties = {
    fontSize: '1em',
    padding: '0.5em',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    backgroundColor: '#fff',
    marginRight: '1em'
};

const notificationStyle: CSSProperties = {
    position: 'absolute',
    top: '3.5em', // Positioned just below the header
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'fit-content',
    maxWidth: '80%',
    padding: '0.8em 1.5em',
    backgroundColor: 'rgba(33, 37, 41, 0.9)', // Dark, slightly transparent
    color: 'white',
    borderRadius: '6px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 20,
    textAlign: 'center'
};

const mainContentStyle: CSSProperties = {
    flex: 1,
    position: 'relative',
    overflow: 'hidden'
};

function App() {
    const [models, setModels] = useState<Model[]>([]);
    const [selectedUrn, setSelectedUrn] = useState<string | null>(null);
    const [notification, setNotification] = useState<string | null>(null);
    const [showViewer, setShowViewer] = useState<boolean>(false);

    // Access token fetching logic - only defined when needed
    const getAccessToken = useCallback((callback: (token: string, expiresIn: number) => void) => {
        fetch('/api/auth/token')
            .then(res => {
                if (!res.ok) throw new Error('Failed to get access token');
                return res.json();
            })
            .then(({ access_token, expires_in }) => {
                callback(access_token, expires_in);
            })
            .catch(err => {
                setNotification('Could not obtain access token');
                console.error(err);
            });
    }, []);

    // Fetch models from backend - only called when viewer is active
    const fetchModels = useCallback(() => {
        if (!showViewer) return; // Don't fetch if viewer isn't shown
        
        fetch('/api/models')
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch models');
                return res.json();
            })
            .then((data: Model[]) => {
                setModels(data);
                // Select the first model if none selected
                if (data.length > 0 && !selectedUrn) {
                    setSelectedUrn(data[0].urn);
                }
            })
            .catch(err => {
                setNotification('Failed to load models');
                console.error(err);
            });
    }, [showViewer, selectedUrn]);

    // Only fetch models when viewer is shown
    useEffect(() => {
        if (showViewer) {
            fetchModels();
        }
    }, [showViewer, fetchModels]);

    // Handle model selection change
    const onModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const urn = e.target.value;
        setSelectedUrn(urn);
        window.location.hash = urn;
    };

    // Handle model upload
    const onFileChange = (file: File, entrypoint?: string) => {
        const data = new FormData();
        data.append('model-file', file);
        if (file.name.endsWith('.zip') && entrypoint) {
            data.append('model-zip-entrypoint', entrypoint);
        }
        setNotification(`Uploading model ${file.name}. Please wait...`);

        fetch('/api/models', { method: 'POST', body: data })
            .then(res => {
                if (!res.ok) throw new Error('Upload failed');
                return res.json();
            })
            .then((model: Model) => {
                setNotification(null);
                setSelectedUrn(model.urn);
                setShowViewer(true); // This will trigger fetchModels via useEffect
                window.location.hash = model.urn;
            })
            .catch(err => {
                setNotification(`Could not upload model ${file.name}`);
                console.error(err);
            });
    };

    return (
        <div style={appStyle}>
            {showViewer && (
                <header style={headerStyle}>
                    <select value={selectedUrn || ''} onChange={onModelChange} style={selectStyle}>
                        {models.map(model => (
                            <option key={model.urn} value={model.urn}>
                                {model.name}
                            </option>
                        ))}
                    </select>
                    <ModelUpload onUpload={onFileChange} />
                </header>
            )}
            {notification && (
                <div style={notificationStyle}>
                    {notification}
                </div>
            )}
            <div style={mainContentStyle}>
                {showViewer ? (
                    <ForgeViewer urn={selectedUrn} getAccessToken={getAccessToken} />
                ) : (
                    <DragDropUpload onUpload={onFileChange} />
                )}
            </div>
        </div>
    );
}

export default App;