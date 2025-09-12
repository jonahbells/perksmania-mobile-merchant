import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { usePerksStore } from '../../store/perksStore';
import Card, { CardDivider } from '../../components/Card';
import { Ionicons } from '@expo/vector-icons';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import { VictoryChart, VictoryArea, VictoryAxis, VictoryTheme } from 'victory-native';

const { width } = Dimensions.get('window');

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  onPress?: () => void;
}

function MetricCard({ title, value, subtitle, icon, color, onPress }: MetricCardProps) {
  const { colors } = useThemeStore();
  const cardColor = color || colors.primary;

  return (
    <Card onPress={onPress} style={styles.metricCard}>
      <View style={styles.metricContent}>
        <View style={[styles.iconContainer, { backgroundColor: `${cardColor}15` }]}>
          <Ionicons name={icon} size={24} color={cardColor} />
        </View>
        <View style={styles.metricText}>
          <Text style={[styles.metricValue, { color: colors.text }]}>{value}</Text>
          <Text style={[styles.metricTitle, { color: colors.textSecondary }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.metricSubtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
    </Card>
  );
}

interface QuickActionProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color?: string;
}

function QuickAction({ title, icon, onPress, color }: QuickActionProps) {
  const { colors } = useThemeStore();
  const actionColor = color || colors.primary;

  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: `${actionColor}15` }]}>
        <Ionicons name={icon} size={24} color={actionColor} />
      </View>
      <Text style={[styles.quickActionText, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const {
    analytics,
    orders,
    isLoading,
    fetchAnalytics,
    fetchPerks,
    fetchOrders,
  } = usePerksStore();
  const router = useRouter();

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const loadDashboardData = useCallback(async () => {
    await Promise.all([
      fetchAnalytics(),
      fetchPerks(),
      fetchOrders(),
    ]);
  }, [fetchAnalytics, fetchPerks, fetchOrders]);

  const handleRefresh = () => {
    loadDashboardData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString()}`;
  };


  const pendingOrders = orders.filter(order => order.status === 'pending');
  const completedOrdersToday = orders.filter(order => {
    const today = new Date().toDateString();
    const orderDate = new Date(order.redeemedAt || order.createdAt).toDateString();
    return order.status === 'completed' && orderDate === today;
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              {getGreeting()},
            </Text>
            <Text style={[styles.businessName, { color: colors.text }]}>
              {user?.businessName || 'Merchant'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.notificationButton, { backgroundColor: colors.surface }]}
            onPress={() => {/* Handle notifications */}}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
            {pendingOrders.length > 0 && (
              <View style={[styles.notificationBadge, { backgroundColor: colors.error }]}>
                <Text style={styles.notificationBadgeText}>
                  {pendingOrders.length > 9 ? '9+' : pendingOrders.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <Card title="Quick Actions" style={styles.card}>
          <View style={styles.quickActions}>
            <QuickAction
              title="Create Perk"
              icon="add-circle"
              onPress={() => router.push('/perks/create')}
              color={colors.success}
            />
            <QuickAction
              title="Scan QR"
              icon="qr-code"
              onPress={() => router.push('/scanner')}
              color={colors.warning}
            />
            <QuickAction
              title="View Orders"
              icon="receipt"
              onPress={() => router.push('/orders')}
              color={colors.info}
            />
            <QuickAction
              title="Analytics"
              icon="analytics"
              onPress={() => {/* Scroll to analytics section */}}
              color={colors.primary}
            />
          </View>
        </Card>

        {/* Key Metrics */}
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Total Revenue"
            value={formatCurrency(analytics?.totalRevenue || 0)}
            subtitle="All time"
            icon="cash"
            color={colors.success}
            onPress={() => router.push('/analytics/revenue')}
          />
          <MetricCard
            title="Today's Sales"
            value={formatCurrency(analytics?.todayRevenue || 0)}
            subtitle={`${completedOrdersToday.length} orders`}
            icon="trending-up"
            color={colors.info}
          />
          <MetricCard
            title="Active Perks"
            value={analytics?.activePerks || 0}
            subtitle={`of ${analytics?.totalPerks || 0} total`}
            icon="gift"
            color={colors.warning}
            onPress={() => router.push('/perks')}
          />
          <MetricCard
            title="Pending Orders"
            value={pendingOrders.length}
            subtitle="Awaiting redemption"
            icon="time"
            color={colors.error}
            onPress={() => router.push('/orders')}
          />
        </View>

        {/* Performance Chart */}
        {analytics && (
          <Card title="Performance Overview" subtitle="Last 7 days">
            <View style={styles.chartContainer}>
              <VictoryChart
                theme={VictoryTheme.material}
                width={width - scale(64)}
                height={200}
                padding={{ left: 50, top: 20, right: 20, bottom: 50 }}
              >
                <VictoryAxis
                  dependentAxis
                  tickFormat={(t) => `₱${t}`}
                  style={{
                    tickLabels: { fill: colors.textSecondary, fontSize: 12 },
                    grid: { stroke: colors.border, strokeWidth: 0.5 },
                  }}
                />
                <VictoryAxis
                  tickFormat={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
                  style={{
                    tickLabels: { fill: colors.textSecondary, fontSize: 12 },
                    grid: { stroke: 'transparent' },
                  }}
                />
                <VictoryArea
                  data={[
                    { x: 1, y: 1200 },
                    { x: 2, y: 1800 },
                    { x: 3, y: 1500 },
                    { x: 4, y: 2200 },
                    { x: 5, y: 2800 },
                    { x: 6, y: 3200 },
                    { x: 7, y: 2400 },
                  ]}
                  style={{
                    data: {
                      fill: colors.primary,
                      fillOpacity: 0.2,
                      stroke: colors.primary,
                      strokeWidth: 2,
                    },
                  }}
                  animate={{
                    duration: 1000,
                    onLoad: { duration: 500 },
                  }}
                />
              </VictoryChart>
            </View>
          </Card>
        )}

        {/* Top Performing Perks */}
        {analytics?.topPerformingPerks && (
          <Card title="Top Performing Perks" subtitle="This month">
            {analytics.topPerformingPerks.slice(0, 3).map((perk, index) => (
              <View key={perk.perkId}>
                <View style={styles.topPerk}>
                  <View style={styles.topPerkRank}>
                    <Text style={[styles.rankText, { color: colors.primary }]}>
                      #{index + 1}
                    </Text>
                  </View>
                  <View style={styles.topPerkInfo}>
                    <Text style={[styles.topPerkTitle, { color: colors.text }]}>
                      {perk.title}
                    </Text>
                    <Text style={[styles.topPerkStats, { color: colors.textSecondary }]}>
                      {perk.redemptions} redemptions • {formatCurrency(perk.revenue)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => router.push(`/perks/${perk.perkId}`)}
                  >
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                {index < 2 && <CardDivider />}
              </View>
            ))}
          </Card>
        )}

        {/* Recent Activity */}
        {analytics?.recentActivity && (
          <Card title="Recent Activity" style={styles.lastCard}>
            {analytics.recentActivity.slice(0, 5).map((activity, index) => (
              <View key={activity.id}>
                <View style={styles.activityItem}>
                  <View style={[styles.activityDot, { backgroundColor: colors.primary }]} />
                  <View style={styles.activityContent}>
                    <Text style={[styles.activityText, { color: colors.text }]}>
                      {activity.action}
                    </Text>
                    <Text style={[styles.activityTime, { color: colors.textSecondary }]}>
                      {activity.timestamp}
                    </Text>
                  </View>
                </View>
                {index < 4 && <CardDivider />}
              </View>
            ))}
          </Card>
        )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: verticalScale(16),
  },
  greeting: {
    fontSize: moderateScale(14),
    marginBottom: verticalScale(4),
  },
  businessName: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
  },
  notificationButton: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: scale(18),
    height: scale(18),
    borderRadius: scale(9),
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: moderateScale(10),
    fontWeight: 'bold',
  },
  card: {
    marginBottom: verticalScale(16),
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  quickActionText: {
    fontSize: moderateScale(12),
    textAlign: 'center',
    fontWeight: '500',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: verticalScale(16),
  },
  metricCard: {
    width: (width - scale(48)) / 2,
    marginBottom: verticalScale(16),
  },
  metricContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
  },
  metricText: {
    flex: 1,
  },
  metricValue: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    marginBottom: verticalScale(2),
  },
  metricTitle: {
    fontSize: moderateScale(12),
    marginBottom: verticalScale(2),
  },
  metricSubtitle: {
    fontSize: moderateScale(10),
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: verticalScale(8),
  },
  topPerk: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(8),
  },
  topPerkRank: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
  },
  rankText: {
    fontSize: moderateScale(14),
    fontWeight: 'bold',
  },
  topPerkInfo: {
    flex: 1,
  },
  topPerkTitle: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    marginBottom: verticalScale(2),
  },
  topPerkStats: {
    fontSize: moderateScale(12),
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(8),
  },
  activityDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    marginRight: scale(12),
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: moderateScale(14),
    marginBottom: verticalScale(2),
  },
  activityTime: {
    fontSize: moderateScale(12),
  },
  lastCard: {
    marginBottom: verticalScale(32),
  },
});
