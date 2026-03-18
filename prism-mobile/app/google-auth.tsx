import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/context/ThemeContext';
import { completeMobileOAuthSession } from '../src/lib/oauth';

export default function GoogleAuthScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const [error, setError] = useState<string | null>(null);
    const handledUrlRef = useRef<string | null>(null);

    useEffect(() => {
        const handleUrl = async (url: string | null) => {
            if (!url || handledUrlRef.current === url) {
                return;
            }

            handledUrlRef.current = url;

            try {
                await completeMobileOAuthSession(url);
                router.replace('/');
            } catch (err: any) {
                handledUrlRef.current = null;
                setError(err.message || 'Google sign-in failed');
                router.replace('/login');
            }
        };

        Linking.getInitialURL().then(handleUrl);

        const subscription = Linking.addEventListener('url', ({ url }) => {
            handleUrl(url);
        });

        return () => subscription.remove();
    }, [router]);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, paddingHorizontal: 24 }}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={{ color: colors.text, marginTop: 16, fontSize: 18, fontWeight: '600' }}>
                Completing sign-in...
            </Text>
            <Text style={{ color: colors.subtext, marginTop: 8, fontSize: 14, textAlign: 'center' }}>
                {error ? error : 'Returning you to your account.'}
            </Text>
        </View>
    );
}
