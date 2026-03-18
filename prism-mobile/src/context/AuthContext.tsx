import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

interface UserProfile {
    id: string;
    email: string;
    full_name: string | null;
    role: 'teacher' | 'student';
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
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error) {
                setSession(null);
                setUser(null);
                setLoading(false);
                return;
            }

            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user);
            } else {
                setLoading(false);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                if (session?.user) {
                    fetchProfile(session.user);
                } else {
                    setProfile(null);
                    setLoading(false);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const createMissingProfile = async (currentUser: User) => {
        const fullName =
            currentUser.user_metadata?.full_name ||
            currentUser.user_metadata?.name ||
            currentUser.email?.split('@')[0] ||
            null;

        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: currentUser.id,
                email: currentUser.email,
                full_name: fullName,
                role: 'student',
                avatar_url: currentUser.user_metadata?.avatar_url ?? null,
            }, {
                onConflict: 'id',
            });

        if (error) {
            throw error;
        }

        const { data, error: selectError } = await supabase
            .from('profiles')
            .select('id, email, full_name, role, bio')
            .eq('id', currentUser.id)
            .single();

        if (selectError) {
            throw selectError;
        }

        return data as UserProfile;
    };

    const fetchProfile = async (currentUser: User) => {
        setLoading(true);
        try {
            for (let attempt = 0; attempt < 3; attempt += 1) {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, email, full_name, role, bio')
                    .eq('id', currentUser.id)
                    .maybeSingle();

                if (data && !error) {
                    setProfile(data as UserProfile);
                    return;
                }

                if (attempt < 2) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            const createdProfile = await createMissingProfile(currentUser);
            setProfile(createdProfile);
        } catch (e) {
            console.error('Failed to load profile:', e);
            setProfile(null);
        } finally {
            setLoading(false);
        }
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user);
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
