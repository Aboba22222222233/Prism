import { supabase } from './supabase';

export async function completeMobileOAuthSession(callbackUrl: string) {
    const parsedUrl = new URL(callbackUrl);
    const params = new URLSearchParams(
        parsedUrl.hash ? parsedUrl.hash.substring(1) : parsedUrl.search.substring(1)
    );

    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const providerError = params.get('error_description') || params.get('error');

    if (providerError) {
        throw new Error(providerError);
    }

    if (!accessToken || !refreshToken) {
        throw new Error('Failed to get authorization tokens');
    }

    const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
    });

    if (sessionError) {
        throw sessionError;
    }
}
