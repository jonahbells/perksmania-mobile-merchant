import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { ActivityIndicator, View } from 'react-native';
import { useThemeStore } from '@/store/themeStore';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { colors } = useThemeStore();

  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: colors.background 
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}

