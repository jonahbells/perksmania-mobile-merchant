import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, ViewStyle, TextStyle, View, Image, ImageSourcePropType } from 'react-native';
import { useThemeStore } from '../store/themeStore';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { Platform } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  // New props for icon support
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  iconSource?: ImageSourcePropType;
  iconPosition?: 'left' | 'right';
  iconSize?: number;
  iconStyle?: ViewStyle;
  iconSpacing?: number;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
  // Icon props with defaults
  leftIcon,
  rightIcon,
  iconSource,
  iconPosition = 'left',
  iconSize,
  iconStyle,
  iconSpacing = 8,
}) => {
  const { colors } = useThemeStore();
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isOutline = variant === 'outline';
  const isDanger = variant === 'danger';
  
  const scale = useSharedValue(1);
  
  const buttonStyles = [
    styles.button,
    size === 'small' && styles.buttonSmall,
    size === 'large' && styles.buttonLarge,
    isOutline && [styles.buttonOutline, { borderColor: colors.primary }],
    fullWidth && styles.fullWidth,
    disabled && styles.buttonDisabled,
    style,
  ];

  const textStyles = [
    styles.text,
    { color: isOutline ? colors.primary : colors.buttonColor },
    size === 'small' && styles.textSmall,
    size === 'large' && styles.textLarge,
    disabled && styles.textDisabled,
    textStyle,
  ];

  // Determine icon size based on button size if not explicitly provided
  const getIconSize = () => {
    if (iconSize) return iconSize;
    if (size === 'small') return 16;
    if (size === 'large') return 24;
    return 20; // Default for medium
  };

  const iconStyles = [
    { 
      width: getIconSize(), 
      height: getIconSize() 
    },
    iconStyle,
  ];
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });
  
  const handlePressIn = () => {
    if (Platform.OS !== 'web') {
      scale.value = withTiming(0.95, {
        duration: 150,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }
  };
  
  const handlePressOut = () => {
    if (Platform.OS !== 'web') {
      scale.value = withTiming(1, {
        duration: 150,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }
  };
  
  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator color={isOutline ? colors.primary : colors.buttonColor} />;
    }
    
    // Create icon element based on provided props
    const iconElement = () => {
      if (leftIcon || rightIcon) {
        // Use the directly provided React Node (Lucide icon component)
        return iconPosition === 'left' ? leftIcon : rightIcon;
      } else if (iconSource) {
        // Use Image component for image source
        return (
          <Image 
            source={iconSource} 
            style={iconStyles} 
            resizeMode="contain"
          />
        );
      }
      return null;
    };

    const hasLeftIcon = (iconPosition === 'left' && (leftIcon || iconSource)) || leftIcon;
    const hasRightIcon = (iconPosition === 'right' && (rightIcon || iconSource)) || rightIcon;
    
    return (
      <View style={styles.contentContainer}>
        {hasLeftIcon && (
          <View style={{ marginRight: iconSpacing }}>
            {iconElement()}
          </View>
        )}
        
        <Text style={textStyles}>{title}</Text>
        
        {hasRightIcon && (
          <View style={{ marginLeft: iconSpacing }}>
            {iconElement()}
          </View>
        )}
      </View>
    );
  };
  
  if (isPrimary) {
    return (
      <AnimatedTouchable
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[animatedStyle, fullWidth ? styles.fullWidth : undefined]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
          <View style={[buttonStyles, {backgroundColor: colors.primary}]}>
          {renderContent()}
        </View>
      </AnimatedTouchable>
    );
  }
  
  if (isSecondary) {
    return (
      <AnimatedTouchable
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[animatedStyle, buttonStyles, { backgroundColor: colors.cardBackground }]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {renderContent()}
      </AnimatedTouchable>
    );
  }

  if (isDanger) {
    return (
      <AnimatedTouchable
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[animatedStyle, buttonStyles, { backgroundColor: colors.error }]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {renderContent()}
      </AnimatedTouchable>
    );
  }
  
  return (
    <AnimatedTouchable
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[animatedStyle, buttonStyles]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {renderContent()}
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSmall: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonLarge: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  fullWidth: {
    width: '100%',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  textSmall: {
    fontSize: 14,
  },
  textLarge: {
    fontSize: 18,
  },
  textDisabled: {
    opacity: 0.7,
  },
});

export default Button;
