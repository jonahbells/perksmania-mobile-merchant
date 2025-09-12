import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import Card, { CardDivider } from '../../components/Card';
import { Button } from '../../components/Button';
import { Ionicons } from '@expo/vector-icons';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

interface ProfileOptionProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showArrow?: boolean;
}

function ProfileOption({
  icon,
  title,
  subtitle,
  value,
  onPress,
  rightElement,
  showArrow = true,
}: ProfileOptionProps) {
  const { colors } = useThemeStore();

  return (
    <TouchableOpacity
      style={styles.profileOption}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.optionContent}>
        <Text style={[styles.optionTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
        {value && (
          <Text style={[styles.optionValue, { color: colors.textSecondary }]}>
            {value}
          </Text>
        )}
      </View>
      {rightElement || (showArrow && onPress && (
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      ))}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { colors, theme, toggleTheme } = useThemeStore();
  const { user, logout } = useAuthStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const getSubscriptionBadgeColor = (subscription: string) => {
    switch (subscription) {
      case 'basic':
        return colors.textSecondary;
      case 'premium':
        return colors.warning;
      case 'enterprise':
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
        </View>

        {/* Business Info Card */}
        <Card style={styles.businessCard}>
          <View style={styles.businessHeader}>
            <View style={[styles.businessIcon, { backgroundColor: colors.primary }]}>
              <Ionicons name="business" size={24} color={colors.onPrimary} />
            </View>
            <View style={styles.businessInfo}>
              <Text style={[styles.businessName, { color: colors.text }]}>
                {user?.businessName}
              </Text>
              <View style={styles.businessMeta}>
                <View 
                  style={[
                    styles.subscriptionBadge, 
                    { backgroundColor: `${getSubscriptionBadgeColor(user?.subscription || 'basic')}15` }
                  ]}
                >
                  <Text style={[
                    styles.subscriptionText,
                    { color: getSubscriptionBadgeColor(user?.subscription || 'basic') }
                  ]}>
                    {user?.subscription?.toUpperCase()}
                  </Text>
                </View>
                {user?.verified && (
                  <View style={[styles.verifiedBadge, { backgroundColor: `${colors.success}15` }]}>
                    <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                    <Text style={[styles.verifiedText, { color: colors.success }]}>
                      Verified
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          <CardDivider />
          <ProfileOption
            icon="mail"
            title="Email"
            value={user?.email}
            showArrow={false}
          />
          <ProfileOption
            icon="call"
            title="Phone"
            value={user?.phone}
            showArrow={false}
          />
          <ProfileOption
            icon="location"
            title="Address"
            value={user?.businessAddress}
            showArrow={false}
          />
        </Card>

        {/* Business Management */}
        <Card title="Business Management">
          <ProfileOption
            icon="pencil"
            title="Edit Profile"
            subtitle="Update your business information"
            onPress={() => {
              // Navigate to edit profile
              Alert.alert('Edit Profile', 'Feature coming soon!');
            }}
          />
          <CardDivider />
          <ProfileOption
            icon="card"
            title="Subscription"
            subtitle={`Manage your ${user?.subscription} plan`}
            onPress={() => {
              Alert.alert('Subscription', 'Feature coming soon!');
            }}
          />
          <CardDivider />
          <ProfileOption
            icon="shield-checkmark"
            title="Verification"
            subtitle={user?.verified ? 'Your business is verified' : 'Verify your business'}
            onPress={() => {
              Alert.alert('Verification', 'Feature coming soon!');
            }}
          />
        </Card>

        {/* Settings */}
        <Card title="Settings">
          <ProfileOption
            icon="notifications"
            title="Push Notifications"
            subtitle="Receive alerts for new orders"
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={notificationsEnabled ? colors.onPrimary : colors.textSecondary}
              />
            }
            showArrow={false}
          />
          <CardDivider />
          <ProfileOption
            icon="mail"
            title="Email Notifications"
            subtitle="Get updates via email"
            rightElement={
              <Switch
                value={emailNotifications}
                onValueChange={setEmailNotifications}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={emailNotifications ? colors.onPrimary : colors.textSecondary}
              />
            }
            showArrow={false}
          />
          <CardDivider />
          <ProfileOption
            icon="moon"
            title="Dark Mode"
            subtitle="Switch between light and dark themes"
            rightElement={
              <Switch
                value={theme === 'dark'}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={theme === 'dark' ? colors.onPrimary : colors.textSecondary}
              />
            }
            showArrow={false}
          />
        </Card>

        {/* Support */}
        <Card title="Support">
          <ProfileOption
            icon="help-circle"
            title="Help & Support"
            subtitle="Get help with your account"
            onPress={() => {
              Alert.alert('Help & Support', 'Feature coming soon!');
            }}
          />
          <CardDivider />
          <ProfileOption
            icon="document-text"
            title="Terms & Conditions"
            subtitle="Read our terms of service"
            onPress={() => {
              Alert.alert('Terms & Conditions', 'Feature coming soon!');
            }}
          />
          <CardDivider />
          <ProfileOption
            icon="shield"
            title="Privacy Policy"
            subtitle="Learn how we protect your data"
            onPress={() => {
              Alert.alert('Privacy Policy', 'Feature coming soon!');
            }}
          />
        </Card>

        {/* Account Actions */}
        <Card style={styles.lastCard}>
          <Button
            title="Sign Out"
            onPress={handleLogout}
            variant="outline"
            leftIcon={<Ionicons name="log-out" size={18} color={colors.primary} />}
            style={styles.signOutButton}
          />
        </Card>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>
            Perksmania Merchant v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: scale(16),
  },
  header: {
    paddingVertical: verticalScale(16),
  },
  title: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
  },
  businessCard: {
    marginBottom: verticalScale(16),
  },
  businessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  businessIcon: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(16),
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: moderateScale(20),
    fontWeight: '600',
    marginBottom: verticalScale(6),
  },
  businessMeta: {
    flexDirection: 'row',
    gap: scale(8),
  },
  subscriptionBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
  },
  subscriptionText: {
    fontSize: moderateScale(10),
    fontWeight: '600',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
    gap: scale(4),
  },
  verifiedText: {
    fontSize: moderateScale(10),
    fontWeight: '500',
  },
  profileOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(12),
  },
  iconContainer: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: moderateScale(16),
    fontWeight: '500',
    marginBottom: verticalScale(2),
  },
  optionSubtitle: {
    fontSize: moderateScale(12),
    lineHeight: moderateScale(16),
  },
  optionValue: {
    fontSize: moderateScale(14),
    marginTop: verticalScale(2),
  },
  signOutButton: {
    borderColor: 'transparent',
  },
  lastCard: {
    marginBottom: verticalScale(16),
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: verticalScale(24),
  },
  versionText: {
    fontSize: moderateScale(12),
  },
});
