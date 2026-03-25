import React, { useEffect } from 'react';

const MobileAuthCallback: React.FC = () => {
    useEffect(() => {
        const currentUrl = new URL(window.location.href);
        const hash = currentUrl.hash;
        const passthroughParams = new URLSearchParams(currentUrl.search);
        const returnTo = passthroughParams.get('returnTo') || 'prism-mobile://google-auth';

        passthroughParams.delete('returnTo');
        const passthroughSearch = passthroughParams.toString();

        if (hash || passthroughSearch) {
            const separator = returnTo.includes('?') ? '&' : '?';
            const searchSuffix = passthroughSearch ? `${separator}${passthroughSearch}` : '';
            const deepLink = `${returnTo}${searchSuffix}${hash}`;
            window.location.replace(deepLink);
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
