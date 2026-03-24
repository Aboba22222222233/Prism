import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '../src/lib/supabase';
import { completeMobileOAuthSession } from '../src/lib/oauth';
import { useTheme } from '../src/context/ThemeContext';
import { useAuth } from '../src/context/AuthContext';
import { ScreenWrapper } from '../src/components/ui/ScreenWrapper';
import { Button } from '../src/components/ui/Button';
import { Input } from '../src/components/ui/Input';
import { Card } from '../src/components/ui/Card';
import { Lock, Envelope as Mail, CaretRight as ChevronRight, WarningCircle as AlertCircle } from 'phosphor-react-native';

export default function LoginScreen() {
    const { colors, mode } = useTheme();
    const router = useRouter();
    const { session, profile, loading: authLoading } = useAuth();
    const handledAuthUrlRef = useRef<string | null>(null);

    const [isTeacher, setIsTeacher] = useState(false);
    const [teacherVerified, setTeacherVerified] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [verificationSent, setVerificationSent] = useState(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [secretCode, setSecretCode] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const redirectAuthenticatedUser = useCallback(() => {
        if (!profile) return;

        if (profile.role === 'teacher') {
            router.replace('/(teacher)/classes');
        } else {
            router.replace('/(student)/classes');
        }
    }, [profile, router]);

    const completeOAuthSignIn = useCallback(async (callbackUrl: string) => {
        if (!callbackUrl || handledAuthUrlRef.current === callbackUrl) {
            return;
        }

        const containsAuthPayload =
            callbackUrl.includes('access_token=') ||
            callbackUrl.includes('refresh_token=') ||
            callbackUrl.includes('error=');

        if (!containsAuthPayload) {
            return;
        }

        handledAuthUrlRef.current = callbackUrl;
        setLoading(true);
        setError(null);

        try {
            await completeMobileOAuthSession(callbackUrl);
            router.replace('/');
        } catch (err: any) {
            handledAuthUrlRef.current = null;
            setError(err.message || 'Google sign-in failed');
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        if (authLoading) return;

        if (session && profile) {
            redirectAuthenticatedUser();
        }
    }, [authLoading, session, profile, redirectAuthenticatedUser]);

    useEffect(() => {
        Linking.getInitialURL().then((initialUrl) => {
            if (initialUrl) {
                completeOAuthSignIn(initialUrl);
            }
        });

        const subscription = Linking.addEventListener('url', ({ url }) => {
            completeOAuthSignIn(url);
        });

        return () => subscription.remove();
    }, [completeOAuthSignIn]);

    const handleRoleChange = (role: boolean) => {
        setIsTeacher(role);
        setError(null);
        setVerificationSent(false);
        setTeacherVerified(false);
        setSecretCode('');
    };

    const verifyTeacherCode = async () => {
        setLoading(true);
        try {
            const { data, error: rpcError } = await supabase.rpc('verify_teacher_code', {
                input_code: secretCode
            });

            if (rpcError) {
                setError('Failed to verify access code: ' + rpcError.message);
            } else if (data === true) {
                setTeacherVerified(true);
                setError(null);
            } else {
                setError('Invalid counselor access code');
            }
        } catch {
            setError('Failed to verify access code');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });
            if (signInError) throw signInError;

            if (data.user) {
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .maybeSingle();

                if (profileError) throw profileError;

                const role = profileData?.role || 'student';

                if (role === 'teacher') {
                    router.replace('/(teacher)/classes');
                } else {
                    router.replace('/(student)/classes');
                }
            }
        } catch (err: any) {
            setError(err.message || 'Sign-in failed');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        setLoading(true);
        setError(null);
        try {
            if (!email || !password) throw new Error('Please fill in all fields');
            if (password.length < 6) throw new Error('Password must be at least 6 characters long');



            const { data, error: signUpError } = await supabase.auth.signUp({
                email: email.trim(),
                password,
                options: {
                    data: {
                        full_name: email.split('@')[0],
                        role: 'student',
                    },
                },
            });

            if (signUpError) throw signUpError;

            if (data.user && !data.session) {
                setVerificationSent(true);
            } else {
                if (isTeacher) {
                    // Stay on screen for access code entry
                } else {
                    router.replace('/(student)/classes');
                }
            }
        } catch (err: any) {
            setError(err.message || 'Sign-up failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            const siteCallbackUrl = 'https://prism-psi-seven.vercel.app/auth/mobile-callback';
            const returnUrl = makeRedirectUri({
                scheme: 'prism-mobile',
                path: 'google-auth',
            });

            const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: siteCallbackUrl,
                    skipBrowserRedirect: true,
                },
            });

            if (oauthError) throw oauthError;
            if (!data?.url) throw new Error('Failed to get the authorization URL');

            const result = await WebBrowser.openAuthSessionAsync(
                data.url,
                returnUrl,
            );

            if (result.type === 'success' && (result as any).url) {
                await completeOAuthSignIn((result as any).url);
            } else if (result.type !== 'cancel') {
                setError('Google sign-in was interrupted');
            }
        } catch (err: any) {
            setError(err.message || 'Google sign-in failed');
        } finally {
            setLoading(false);
        }
    };

    // --- EMAIL VERIFICATION SCREEN ---
    if (verificationSent) {
        return (
            <ScreenWrapper>
                <View style={styles.centered}>
                    <Card style={{ alignItems: 'center' }}>
                        <View style={[styles.iconCircle, { backgroundColor: 'rgba(34,197,94,0.15)' }]}>
                            <Mail size={28} color="rgb(34,197,94)" weight="regular" />
                        </View>
                        <Text style={[styles.title, { color: colors.text }]}>Verify Your Email</Text>
                        <Text style={[styles.subtitle, { color: colors.subtext, textAlign: 'center' }]}>
                            A verification link has been sent to {email}. Please check your inbox.
                        </Text>
                        <Button
                            title="Back to Sign In"
                            onPress={() => { setVerificationSent(false); setAuthMode('login'); }}
                            style={{ marginTop: 24, width: '100%' }}
                        />
                    </Card>
                </View>
            </ScreenWrapper>
        );
    }

    // --- COUNSELOR ACCESS CODE SCREEN ---
    if (isTeacher && !teacherVerified) {
        return (
            <ScreenWrapper>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.centered}
                >
                    <Card style={{ alignItems: 'center', width: '100%' }}>
                        <View style={[styles.iconCircle, { backgroundColor: 'rgba(245,158,11,0.15)' }]}>
                            <Lock size={24} color="rgb(245,158,11)" weight="regular" />
                        </View>
                        <Text style={[styles.title, { color: colors.text }]}>Restricted Access</Text>
                        <Text style={[styles.subtitle, { color: colors.subtext, textAlign: 'center' }]}>
                            Enter your organization access code to open the counselor panel.
                        </Text>

                        <Input
                            value={secretCode}
                            onChangeText={setSecretCode}
                            placeholder="CODE"
                            secureTextEntry
                            autoFocus
                            style={{ textAlign: 'center', letterSpacing: 6, fontSize: 18, marginTop: 20, width: '100%' }}
                        />

                        {error && (
                            <View style={styles.errorRow}>
                                <AlertCircle size={14} color="rgb(239,68,68)" />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        <Button
                            title="Confirm"
                            variant="accent"
                            onPress={verifyTeacherCode}
                            loading={loading}
                            style={{ marginTop: 16, width: '100%' }}
                        />

                        <TouchableOpacity onPress={() => handleRoleChange(false)} style={{ marginTop: 16 }}>
                            <Text style={{ color: colors.subtext, fontSize: 14 }}>Continue as Student</Text>
                        </TouchableOpacity>
                    </Card>
                </KeyboardAvoidingView>
            </ScreenWrapper>
        );
    }

    // --- MAIN LOGIN SCREEN ---
    return (
        <ScreenWrapper>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Logo */}
                    <View style={styles.logoSection}>
                        <Image
                            source={require('../assets/logo.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                        <Text style={[styles.appName, { color: colors.text }]}>Prism</Text>
                    </View>

                    {/* Role toggle */}
                    <View style={[styles.roleToggle, { backgroundColor: colors.surface }]}>
                        <TouchableOpacity
                            onPress={() => handleRoleChange(true)}
                            style={[
                                styles.roleButton,
                                isTeacher && { backgroundColor: colors.text },
                            ]}
                        >
                            <Text style={[
                                styles.roleText,
                                { color: isTeacher ? colors.background : colors.subtext },
                            ]}>
                                Counselor
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => handleRoleChange(false)}
                            style={[
                                styles.roleButton,
                                !isTeacher && { backgroundColor: colors.text },
                            ]}
                        >
                            <Text style={[
                                styles.roleText,
                                { color: !isTeacher ? colors.background : colors.subtext },
                            ]}>
                                Student
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Form */}
                    <Card>
                        <Text style={[styles.title, { color: colors.text }]}>
                            {authMode === 'login' ? 'Welcome Back' : 'Create an Account'}
                        </Text>
                        <Text style={[styles.subtitle, { color: colors.subtext }]}>
                            {isTeacher ? 'Sign in to the counselor panel' : 'Sign in to the student account'}
                        </Text>

                        {/* Google button (students only) */}
                        {!isTeacher && (
                            <View style={{ marginTop: 20 }}>
                                <Button
                                    title="Continue with Google"
                                    variant="secondary"
                                    onPress={handleGoogleLogin}
                                />
                                <View style={styles.divider}>
                                    <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                                    <Text style={[styles.dividerText, { color: colors.subtext }]}>OR</Text>
                                    <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                                </View>
                            </View>
                        )}

                        <View style={{ gap: 14, marginTop: isTeacher ? 20 : 0 }}>
                            <Input
                                label="Email"
                                value={email}
                                onChangeText={setEmail}
                                placeholder={isTeacher ? 'psychologist@school.kz' : 'student@school.kz'}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            <Input
                                label="Password"
                                value={password}
                                onChangeText={setPassword}
                                placeholder="••••••••"
                                secureTextEntry
                            />
                        </View>

                        {error && (
                            <View style={styles.errorRow}>
                                <AlertCircle size={14} color="rgb(239,68,68)" />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        <Button
                            title={loading ? 'Loading...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
                            onPress={authMode === 'login' ? handleLogin : handleRegister}
                            loading={loading}
                            style={{ marginTop: 20 }}
                            icon={<ChevronRight size={16} color={colors.background} weight="bold" />}
                        />

                        <TouchableOpacity
                            onPress={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                            style={{ marginTop: 16, alignItems: 'center' }}
                        >
                            <Text style={{ color: colors.subtext, fontSize: 14 }}>
                                {authMode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                            </Text>
                        </TouchableOpacity>
                    </Card>
                </ScrollView>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 40,
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoImage: {
        width: 80,
        height: 80,
        borderRadius: 20,
        marginBottom: 12,
    },
    appName: {
        fontSize: 28,
        fontWeight: '700',
    },
    roleToggle: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 4,
        marginBottom: 24,
    },
    roleButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    roleText: {
        fontSize: 14,
        fontWeight: '600',
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
    },
    subtitle: {
        fontSize: 14,
        marginTop: 4,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        marginHorizontal: 12,
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 2,
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    errorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 12,
        padding: 10,
        borderRadius: 10,
        backgroundColor: 'rgba(239,68,68,0.08)',
    },
    errorText: {
        color: 'rgb(239,68,68)',
        fontSize: 13,
        flex: 1,
    },
});
