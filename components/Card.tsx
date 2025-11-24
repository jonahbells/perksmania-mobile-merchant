import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { useThemeStore } from '@/store/themeStore';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

interface CardProps {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  onPress?: () => void;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  disabled?: boolean;
  variant?: 'default' | 'elevated' | 'outlined';
}

export default function Card({
  children,
  title,
  subtitle,
  onPress,
  style,
  contentStyle,
  disabled = false,
  variant = 'default',
}: CardProps) {
  const { colors } = useThemeStore();

  const cardVariantStyle = {
    default: {
      backgroundColor: colors.surface,
      borderWidth: 0,
      elevation: 2,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    elevated: {
      backgroundColor: colors.surface,
      borderWidth: 0,
      elevation: 8,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    outlined: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      elevation: 0,
      shadowOpacity: 0,
    },
  };

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.card,
        cardVariantStyle[variant],
        disabled && styles.disabled,
        style,
      ]}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && (
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          )}
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      )}
      {children && (
        <View style={[styles.content, contentStyle]}>{children}</View>
      )}
    </Component>
  );
}

export function CardSection({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.section, style]}>{children}</View>;
}

export function CardDivider() {
  const { colors } = useThemeStore();
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: moderateScale(12),
    padding: scale(16),
    marginVertical: verticalScale(6),
  },
  disabled: {
    opacity: 0.6,
  },
  header: {
    marginBottom: verticalScale(12),
  },
  title: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    marginBottom: verticalScale(4),
  },
  subtitle: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
  },
  content: {
    flex: 1,
  },
  section: {
    marginVertical: verticalScale(8),
  },
  divider: {
    height: 1,
    marginVertical: verticalScale(12),
  },
});
