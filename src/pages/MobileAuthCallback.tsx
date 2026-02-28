import React, { useEffect } from 'react';

/**
 * Страница-посредник для OAuth.
 * Supabase перенаправляет сюда после Google-авторизации.
 * Эта страница берёт токены из URL и перенаправляет обратно в приложение.
 */
const MobileAuthCallback: React.FC = () => {
    useEffect(() => {
        const hash = window.location.hash;

        if (hash) {
            // Перенаправляем в мобильное приложение с токенами
            // Expo Go использует exp:// схему
            // Standalone приложение использует prism-mobile:// схему
            const deepLink = `prism-mobile://google-auth${hash}`;

            console.log('Redirecting to app:', deepLink);
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
            <h2 style={{ margin: 0, fontSize: 20 }}>Авторизация успешна</h2>
            <p style={{ color: '#888', marginTop: 8 }}>Возвращаем вас в приложение...</p>
        </div>
    );
};

export default MobileAuthCallback;
