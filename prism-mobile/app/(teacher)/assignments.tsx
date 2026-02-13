
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useTheme } from '../../src/context/ThemeContext';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import { Card } from '../../src/components/ui/Card';
import { FileText, Clock, ChevronRight } from 'lucide-react-native';

export default function AssignmentsScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch tasks with class info
            const { data } = await supabase
                .from('tasks')
                .select(`
                    *,
                    classes:class_id (name, code)
                `)
                .order('created_at', { ascending: false });

            // Filter for teacher's tasks (though RLS should handle this, good to be safe)
            // Actually, RLS policy "Teachers can manage tasks for their classes" ensures this.
            // But we need to ensure we join correctly.

            setTasks(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
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
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Все задания</Text>
            </View>

            <FlatList
                data={tasks}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 20, gap: 12 }}
                ListEmptyComponent={
                    <View style={styles.centered}>
                        <FileText size={48} color={colors.subtext} />
                        <Text style={{ color: colors.subtext, marginTop: 16 }}>Нет активных заданий</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => router.push({ pathname: '/(teacher)/class/[id]', params: { id: item.class_id } })}>
                        <Card>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 12, color: colors.accent, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 }}>
                                        {item.classes?.name}
                                    </Text>
                                    <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                                        {item.title}
                                    </Text>
                                    {item.description && (
                                        <Text numberOfLines={1} style={{ fontSize: 13, color: colors.subtext, marginTop: 4 }}>
                                            {item.description}
                                        </Text>
                                    )}
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 }}>
                                        <Clock size={12} color={colors.subtext} />
                                        <Text style={{ fontSize: 12, color: colors.subtext }}>
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </Text>
                                    </View>
                                </View>
                                <ChevronRight size={20} color={colors.subtext} />
                            </View>
                        </Card>
                    </TouchableOpacity>
                )}
            />
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 200 },
    header: { padding: 20, paddingBottom: 10 },
    title: { fontSize: 28, fontWeight: '700' },
});
