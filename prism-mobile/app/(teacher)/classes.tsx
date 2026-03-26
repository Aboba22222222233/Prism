import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, FlatList, TextInput,
    StyleSheet, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Plus, Users, Copy, CaretRight as ChevronRight } from 'phosphor-react-native';

export default function TeacherClassesScreen() {
    const { colors } = useTheme();
    const { profile, user } = useAuth();
    const router = useRouter();

    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [showJoin, setShowJoin] = useState(false);
    const [newClassName, setNewClassName] = useState('');
    const [joinClassCode, setJoinClassCode] = useState('');
    const [creating, setCreating] = useState(false);
    const [joining, setJoining] = useState(false);

    const fetchClasses = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('classes')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) throw error;
            setClasses(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchClasses();
    }, [fetchClasses]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchClasses();
    };

    const createClass = async () => {
        if (!newClassName.trim()) return;
        setCreating(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const code = Math.random().toString(36).substring(2, 8).toUpperCase();

            const { data, error } = await supabase
                .from('classes')
                .insert({ name: newClassName.trim(), teacher_id: user.id, code })
                .select()
                .single();

            if (error) throw error;

            await fetchClasses();
            setNewClassName('');
            setShowCreate(false);
            Alert.alert('Done', `Class "${data.name}" created.\nCode: ${code}`);
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to create class');
        } finally {
            setCreating(false);
        }
    };

    const joinClass = async () => {
        if (!joinClassCode.trim()) return;

        setJoining(true);
        try {
            const { error } = await supabase.rpc('join_teacher_class_by_code', {
                input_code: joinClassCode.trim().toUpperCase(),
            });

            if (error) throw error;

            await fetchClasses();
            setJoinClassCode('');
            setShowJoin(false);
            Alert.alert('Done', 'You joined the existing class.');
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to join the class');
        } finally {
            setJoining(false);
        }
    };

    const copyCode = (code: string) => {
        Alert.alert('Class code', code, [{ text: 'OK' }]);
    };

    if (loading) {
        return (
            <ScreenWrapper>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.accent} />
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={[styles.greeting, { color: colors.subtext }]}>Hello,</Text>
                    <Text style={[styles.name, { color: colors.text }]}>
                        {(!profile?.full_name || profile.full_name === 'Teacher') ? 'Psychologist' : profile.full_name} {"\u{1F44B}"}
                    </Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        onPress={() => {
                            setShowJoin(prev => !prev);
                            setShowCreate(false);
                        }}
                        style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
                    >
                        <Users size={18} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => {
                            setShowCreate(prev => !prev);
                            setShowJoin(false);
                        }}
                        style={[styles.addBtn, { backgroundColor: colors.accent }]}
                    >
                        <Plus size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Create class form */}
            {showCreate && (
                <Card style={{ marginHorizontal: 20, marginBottom: 16 }}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>New Class</Text>
                    <Input
                        placeholder="Name (for example, 9B)"
                        value={newClassName}
                        onChangeText={setNewClassName}
                    />
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                        <Button
                            title="Cancel"
                            variant="secondary"
                            onPress={() => setShowCreate(false)}
                            style={{ flex: 1 }}
                        />
                        <Button
                            title="Create"
                            variant="accent"
                            onPress={createClass}
                            loading={creating}
                            style={{ flex: 1 }}
                        />
                    </View>
                </Card>
            )}

            {showJoin && (
                <Card style={{ marginHorizontal: 20, marginBottom: 16 }}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Join an Existing Class</Text>
                    <Input
                        placeholder="Class code"
                        value={joinClassCode}
                        onChangeText={setJoinClassCode}
                        autoCapitalize="characters"
                    />
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                        <Button
                            title="Cancel"
                            variant="secondary"
                            onPress={() => setShowJoin(false)}
                            style={{ flex: 1 }}
                        />
                        <Button
                            title="Join"
                            variant="accent"
                            onPress={joinClass}
                            loading={joining}
                            style={{ flex: 1 }}
                        />
                    </View>
                </Card>
            )}

            {/* Class list */}
            {classes.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>No classes yet</Text>
                    <Text style={[styles.emptySubtitle, { color: colors.subtext }]}>
                        Create your first class{'\n'}or join an existing one.
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 24 }}>
                        <Button
                            title="Create Class"
                            variant="accent"
                            onPress={() => {
                                setShowCreate(true);
                                setShowJoin(false);
                            }}
                            style={{ flex: 1 }}
                        />
                        <Button
                            title="Join by Code"
                            variant="secondary"
                            onPress={() => {
                                setShowJoin(true);
                                setShowCreate(false);
                            }}
                            style={{ flex: 1 }}
                        />
                    </View>
                </View>
            ) : (
                <FlatList
                    data={classes}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 20, gap: 12 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
                    }
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => router.push(`/(teacher)/class/${item.id}`)}
                            activeOpacity={0.7}
                        >
                            <Card>
                                <View style={styles.classRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.className, { color: colors.text }]}>{item.name}</Text>
                                        <TouchableOpacity
                                            style={styles.codeRow}
                                            onPress={() => copyCode(item.code)}
                                        >
                                            <Text style={[styles.codeText, { color: colors.subtext }]}>
                                                Code: {item.code}
                                            </Text>
                                            <Copy size={12} color={colors.subtext} />
                                        </TouchableOpacity>
                                        <Text style={[styles.classMeta, { color: colors.subtext }]}>
                                            {item.teacher_id === user?.id ? 'Created by you' : 'Joined class'}
                                        </Text>
                                    </View>
                                    <ChevronRight size={20} color={colors.subtext} />
                                </View>
                            </Card>
                        </TouchableOpacity>
                    )}
                />
            )}
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
    },
    headerActions: { flexDirection: 'row', gap: 10 },
    greeting: { fontSize: 14 },
    name: { fontSize: 26, fontWeight: '700' },
    addBtn: {
        width: 44, height: 44, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center',
    },
    secondaryBtn: {
        width: 44, height: 44, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1,
    },
    cardTitle: { fontSize: 18, fontWeight: '600', marginBottom: 14 },
    classRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    className: { fontSize: 18, fontWeight: '600' },
    codeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    codeText: { fontSize: 13 },
    classMeta: { fontSize: 12, marginTop: 6 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyTitle: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
    emptySubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});


