import React from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
}

export const Input = ({ label, error, style, ...props }: InputProps) => {
    const { colors } = useTheme();

    return (
        <View style={styles.container}>
            {label && (
                <Text style={[styles.label, { color: colors.subtext }]}>{label}</Text>
            )}
            <TextInput
                placeholderTextColor={colors.subtext + '80'}
                style={[
                    styles.input,
                    {
                        backgroundColor: colors.inputBg,
                        color: colors.text,
                        borderColor: error ? 'rgb(239, 68, 68)' : colors.border,
                    },
                    style,
                ]}
                {...props}
            />
            {error && <Text style={styles.error}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: 6,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginLeft: 2,
    },
    input: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 14,
        fontSize: 16,
        borderWidth: 1,
    },
    error: {
        color: 'rgb(239, 68, 68)',
        fontSize: 12,
        marginLeft: 2,
    },
});
