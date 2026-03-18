import React, { useEffect } from 'react';

const MobileAuthCallback: React.FC = () => {
    useEffect(() => {
        const search = window.location.search;
        const hash = window.location.hash;

        if (hash || search) {
            const deepLink = `prism-mobile://google-auth${search}${hash}`;
            window.location.href = deepLink;
        }
    }, []);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            backgroundColor: '#000',
            color: '#fff',
            fontFamily: 'Inter, sans-serif',
        }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
            <h2 style={{ margin: 0, fontSize: 20 }}>Authorization successful</h2>
            <p style={{ color: '#888', marginTop: 8 }}>Returning you to the app...</p>
        </div>
    );
};

export default MobileAuthCallback;
