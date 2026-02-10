import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'accent' | 'danger';
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    icon?: React.ReactNode;
}

export const Button = ({
    title,
    onPress,
    variant = 'primary',
    loading = false,
    disabled = false,
    style,
    textStyle,
    icon,
}: ButtonProps) => {
    const { colors } = useTheme();

    const getStyles = () => {
        switch (variant) {
            case 'accent':
                return {
                    bg: colors.accent,
                    text: '#FFFFFF',
                };
            case 'secondary':
                return {
                    bg: colors.surface,
                    text: colors.text,
                };
            case 'danger':
                return {
                    bg: 'rgba(239, 68, 68, 0.1)',
                    text: 'rgb(239, 68, 68)',
                };
            default:
                return {
                    bg: colors.text,
                    text: colors.background,
                };
        }
    };

    const s = getStyles();

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
            style={[
                styles.button,
                { backgroundColor: s.bg, opacity: disabled ? 0.5 : 1 },
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={s.text} size="small" />
            ) : (
                <>
                    {icon}
                    <Text style={[styles.text, { color: s.text }, textStyle]}>
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 14,
        gap: 8,
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
    },
});
