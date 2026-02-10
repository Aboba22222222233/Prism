import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

interface ScreenWrapperProps {
    children: ReactNode;
    padded?: boolean;
}

export const ScreenWrapper = ({ children, padded = true }: ScreenWrapperProps) => {
    const { colors } = useTheme();

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
            <View style={[styles.container, padded && styles.padded]}>
                {children}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    padded: {
        paddingHorizontal: 20,
    },
});
