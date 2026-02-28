import React, { useState } from 'react';
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
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '../src/lib/supabase';
import { useTheme } from '../src/context/ThemeContext';
import { ScreenWrapper } from '../src/components/ui/ScreenWrapper';
import { Button } from '../src/components/ui/Button';
import { Input } from '../src/components/ui/Input';
import { Card } from '../src/components/ui/Card';
import { Lock, Mail, ChevronRight, AlertCircle } from 'lucide-react-native';

export default function LoginScreen() {
    const { colors, mode } = useTheme();
    const router = useRouter();

    const [isTeacher, setIsTeacher] = useState(false);
    const [teacherVerified, setTeacherVerified] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [verificationSent, setVerificationSent] = useState(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [secretCode, setSecretCode] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
            // SECURITY FIX: User RPC instead of direct table select
            const { data, error: rpcError } = await supabase.rpc('verify_teacher_code', {
                input_code: secretCode
            });

            if (rpcError) {
                console.error("RPC Error:", rpcError); // Log detailed error for debugging
                setError('Ошибка проверки кода: ' + rpcError.message);
            } else if (data === true) {
                setTeacherVerified(true);
                setError(null);
            } else {
                setError('Неверный код доступа учителя');
            }
        } catch {
            setError('Ошибка проверки кода');
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
                console.log('Вход выполнен, user id:', data.user.id);
                console.log('User metadata:', data.user.user_metadata);

                // Пробуем получить роль из profiles
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .single();

                console.log('Профиль из БД:', profileData, 'Ошибка:', profileError?.message);

                // Определяем роль: сначала из profiles, потом из user_metadata
                let role = profileData?.role;
                if (!role) {
                    role = data.user.user_metadata?.role;
                    console.log('Роль из user_metadata:', role);
                }

                console.log('Итоговая роль:', role);

                if (role === 'teacher') {
                    router.replace('/(teacher)/classes');
                } else {
                    router.replace('/(student)/classes');
                }
            }
        } catch (err: any) {
            setError(err.message || 'Ошибка входа');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        setLoading(true);
        setError(null);
        try {
            if (!email || !password) throw new Error('Заполните все поля');
            if (password.length < 6) throw new Error('Пароль должен быть не менее 6 символов');

            console.log('Регистрация нового пользователя...');

            const { data, error: signUpError } = await supabase.auth.signUp({
                email: email.trim(),
                password,
                options: {
                    data: {
                        full_name: email.split('@')[0],
                        role: 'student', // Start as student strictly
                    },
                },
            });

            if (signUpError) throw signUpError;

            if (data.user && !data.session) {
                setVerificationSent(true);
            } else {
                if (isTeacher) {
                    // Just stay on screen so the user can enter the access code
                    // Removed undefined setRoleVerified
                } else {
                    router.replace('/(student)/classes');
                }
            }
        } catch (err: any) {
            setError(err.message || 'Ошибка регистрации');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            // Этап 1: Supabase перенаправляет на наш сайт (HTTPS — Supabase принимает)
            // Этап 2: Сайт перенаправляет в приложение через deep link
            const siteCallbackUrl = 'https://prism-psi-seven.vercel.app/auth/mobile-callback';

            const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: siteCallbackUrl,
                    skipBrowserRedirect: true,
                },
            });

            if (oauthError) throw oauthError;
            if (!data?.url) throw new Error('Не удалось получить URL авторизации');

            // Открываем браузер и ждём возврата через prism-mobile:// схему
            const result = await WebBrowser.openAuthSessionAsync(
                data.url,
                'prism-mobile://',
            );

            console.log('Auth result type:', result.type);

            if (result.type === 'success' && (result as any).url) {
                const resultUrl = (result as any).url;

                const url = new URL(resultUrl);
                const params = new URLSearchParams(url.hash.substring(1));
                const accessToken = params.get('access_token');
                const refreshToken = params.get('refresh_token');

                console.log('Access token found:', !!accessToken);
                console.log('Refresh token found:', !!refreshToken);
                console.log('Refresh token value:', refreshToken);

                if (accessToken && refreshToken) {
                    console.log('Refreshing session...');
                    const { data: sessionData, error: sessionError } = await supabase.auth.refreshSession({
                        refresh_token: refreshToken,
                    });
                    console.log('Session refresh:', sessionError ? sessionError.message : 'OK');
                    console.log('User:', sessionData?.user?.email);
                    if (sessionError) throw sessionError;
                    router.replace('/');
                } else {
                    console.log('Missing tokens, cannot set session');
                    setError('Не удалось получить токены авторизации');
                }
            }
        } catch (err: any) {
            console.log('Google auth error:', err.message);
            setError(err.message || 'Ошибка входа через Google');
        } finally {
            setLoading(false);
        }
    };

    // --- ЭКРАН ПОДТВЕРЖДЕНИЯ EMAIL ---
    if (verificationSent) {
        return (
            <ScreenWrapper>
                <View style={styles.centered}>
                    <Card style={{ alignItems: 'center' }}>
                        <View style={[styles.iconCircle, { backgroundColor: 'rgba(34,197,94,0.15)' }]}>
                            <Mail size={28} color="rgb(34,197,94)" />
                        </View>
                        <Text style={[styles.title, { color: colors.text }]}>Подтвердите Email</Text>
                        <Text style={[styles.subtitle, { color: colors.subtext, textAlign: 'center' }]}>
                            Ссылка для подтверждения отправлена на {email}. Проверьте почту.
                        </Text>
                        <Button
                            title="Вернуться ко входу"
                            onPress={() => { setVerificationSent(false); setAuthMode('login'); }}
                            style={{ marginTop: 24, width: '100%' }}
                        />
                    </Card>
                </View>
            </ScreenWrapper>
        );
    }

    // --- ЭКРАН КОДА УЧИТЕЛЯ ---
    if (isTeacher && !teacherVerified) {
        return (
            <ScreenWrapper>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.centered}
                >
                    <Card style={{ alignItems: 'center', width: '100%' }}>
                        <View style={[styles.iconCircle, { backgroundColor: 'rgba(245,158,11,0.15)' }]}>
                            <Lock size={24} color="rgb(245,158,11)" />
                        </View>
                        <Text style={[styles.title, { color: colors.text }]}>Доступ ограничен</Text>
                        <Text style={[styles.subtitle, { color: colors.subtext, textAlign: 'center' }]}>
                            Введите корпоративный код доступа для входа в учительскую панель.
                        </Text>

                        <Input
                            value={secretCode}
                            onChangeText={setSecretCode}
                            placeholder="КОД"
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
                            title="Подтвердить"
                            variant="accent"
                            onPress={verifyTeacherCode}
                            loading={loading}
                            style={{ marginTop: 16, width: '100%' }}
                        />

                        <TouchableOpacity onPress={() => handleRoleChange(false)} style={{ marginTop: 16 }}>
                            <Text style={{ color: colors.subtext, fontSize: 14 }}>Войти как ученик</Text>
                        </TouchableOpacity>
                    </Card>
                </KeyboardAvoidingView>
            </ScreenWrapper>
        );
    }

    // --- ГЛАВНЫЙ ЭКРАН ЛОГИНА ---
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
                    {/* Лого */}
                    <View style={styles.logoSection}>
                        <Image
                            source={require('../assets/logo.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                        <Text style={[styles.appName, { color: colors.text }]}>Prism</Text>
                    </View>

                    {/* Переключатель ролей */}
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
                                Учитель
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
                                Ученик
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Форма */}
                    <Card>
                        <Text style={[styles.title, { color: colors.text }]}>
                            {authMode === 'login' ? 'С возвращением!' : 'Создать аккаунт'}
                        </Text>
                        <Text style={[styles.subtitle, { color: colors.subtext }]}>
                            {isTeacher ? 'Вход в учительскую панель' : 'Вход в личный кабинет ученика'}
                        </Text>

                        {/* Google кнопка (только для учеников) */}
                        {!isTeacher && (
                            <View style={{ marginTop: 20 }}>
                                <Button
                                    title="Войти через Google"
                                    variant="secondary"
                                    onPress={handleGoogleLogin}
                                />
                                <View style={styles.divider}>
                                    <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                                    <Text style={[styles.dividerText, { color: colors.subtext }]}>ИЛИ</Text>
                                    <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                                </View>
                            </View>
                        )}

                        <View style={{ gap: 14, marginTop: isTeacher ? 20 : 0 }}>
                            <Input
                                label="Email"
                                value={email}
                                onChangeText={setEmail}
                                placeholder={isTeacher ? 'teacher@school.kz' : 'student@school.kz'}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            <Input
                                label="Пароль"
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
                            title={loading ? 'Загрузка...' : (authMode === 'login' ? 'Войти' : 'Создать аккаунт')}
                            onPress={authMode === 'login' ? handleLogin : handleRegister}
                            loading={loading}
                            style={{ marginTop: 20 }}
                            icon={<ChevronRight size={16} color={colors.background} />}
                        />

                        <TouchableOpacity
                            onPress={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                            style={{ marginTop: 16, alignItems: 'center' }}
                        >
                            <Text style={{ color: colors.subtext, fontSize: 14 }}>
                                {authMode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
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
