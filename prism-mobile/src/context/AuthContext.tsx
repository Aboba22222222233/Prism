import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

interface UserProfile {
    id: string;
    email: string;
    full_name: string | null;
    role: 'teacher' | 'student';
    avatar_url: string | null;
    bio: string | null;
}

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    profile: null,
    loading: true,
    signOut: async () => { },
    refreshProfile: async () => { },
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Получаем текущую сессию
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error) {
                console.log('Session Error:', error.message);
                // Если ошибка с токеном — сбрасываем состояние
                setSession(null);
                setUser(null);
                setLoading(false);
                return;
            }

            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Слушаем изменения авторизации
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                if (session?.user) {
                    // НЕ блокируем — запускаем в фоне
                    fetchProfile(session.user.id);
                } else {
                    setProfile(null);
                    setLoading(false);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string, retryCount = 0) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, email, full_name, role, avatar_url, bio')
                .eq('id', userId)
                .maybeSingle();

            if (data && !error) {
                console.log('Профиль загружен:', data.role);
                setProfile(data as UserProfile);
            } else if (retryCount < 2) {
                // Профиль ещё не создан триггером — ждём и пробуем снова
                console.log('Профиль не найден, повтор через 1.5с...');
                await new Promise(resolve => setTimeout(resolve, 1500));
                return fetchProfile(userId, retryCount + 1);
            }
        } catch (e) {
            console.error('Ошибка загрузки профиля:', e);
        } finally {
            setLoading(false);
        }
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setProfile(null);
    };

    return (
        <AuthContext.Provider value={{ session, user, profile, loading, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
