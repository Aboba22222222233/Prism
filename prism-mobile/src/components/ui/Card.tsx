import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface CardProps {
    children: ReactNode;
    style?: ViewStyle;
    padded?: boolean;
}

export const Card = ({ children, style, padded = true }: CardProps) => {
    const { colors } = useTheme();

    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                },
                padded && styles.padded,
                style,
            ]}
        >
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
    },
    padded: {
        padding: 20,
    },
});
