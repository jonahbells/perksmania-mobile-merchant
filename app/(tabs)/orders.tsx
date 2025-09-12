import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/themeStore';
import { usePerksStore, Order } from '../../store/perksStore';
import Card from '../../components/Card';
import { Button } from '../../components/Button';
import { Ionicons } from '@expo/vector-icons';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

interface OrderCardProps {
  order: Order;
  onUpdateStatus: (status: Order['status']) => void;
}

function OrderCard({ order, onUpdateStatus }: OrderCardProps) {
  const { colors } = useThemeStore();

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return colors.warning;
      case 'completed':
        return colors.success;
      case 'cancelled':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'time';
      case 'completed':
        return 'checkmark-circle';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const handleStatusUpdate = (newStatus: Order['status']) => {
    if (newStatus === order.status) return;

    const statusText = newStatus === 'completed' ? 'complete' : 'cancel';
    Alert.alert(
      `${statusText.charAt(0).toUpperCase() + statusText.slice(1)} Order`,
      `Are you sure you want to ${statusText} this order?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: () => onUpdateStatus(newStatus),
        },
      ]
    );
  };

  return (
    <Card style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={[styles.orderId, { color: colors.text }]}>#{order.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(order.status)}15` }]}>
            <Ionicons
              name={getStatusIcon(order.status)}
              size={14}
              color={getStatusColor(order.status)}
            />
            <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
              {order.status.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={[styles.orderDate, { color: colors.textSecondary }]}>
          {new Date(order.createdAt).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.orderDetails}>
        <Text style={[styles.perkTitle, { color: colors.text }]}>{order.perkTitle}</Text>
        <View style={styles.customerInfo}>
          <View style={styles.customerRow}>
            <Ionicons name="person" size={16} color={colors.textSecondary} />
            <Text style={[styles.customerText, { color: colors.text }]}>
              {order.customerName}
            </Text>
          </View>
          <View style={styles.customerRow}>
            <Ionicons name="mail" size={16} color={colors.textSecondary} />
            <Text style={[styles.customerText, { color: colors.text }]}>
              {order.customerEmail}
            </Text>
          </View>
          {order.customerPhone && (
            <View style={styles.customerRow}>
              <Ionicons name="call" size={16} color={colors.textSecondary} />
              <Text style={[styles.customerText, { color: colors.text }]}>
                {order.customerPhone}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.codeContainer}>
        <Text style={[styles.codeLabel, { color: colors.textSecondary }]}>
          Redemption Code:
        </Text>
        <Text style={[styles.codeValue, { color: colors.primary }]}>
          {order.redemptionCode}
        </Text>
      </View>

      {order.status === 'pending' && (
        <View style={styles.actions}>
          <Button
            title="Complete"
            onPress={() => handleStatusUpdate('completed')}
            variant="primary"
            size="small"
            style={styles.actionButton}
            leftIcon={<Ionicons name="checkmark" size={16} color={colors.onPrimary} />}
          />
          <Button
            title="Cancel"
            onPress={() => handleStatusUpdate('cancelled')}
            variant="outline"
            size="small"
            style={styles.actionButton}
            leftIcon={<Ionicons name="close" size={16} color={colors.primary} />}
          />
        </View>
      )}

      {order.status === 'completed' && order.redeemedAt && (
        <View style={styles.completedInfo}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text style={[styles.completedText, { color: colors.success }]}>
            Completed on {new Date(order.redeemedAt).toLocaleString()}
          </Text>
        </View>
      )}
    </Card>
  );
}

export default function OrdersScreen() {
  const { colors } = useThemeStore();
  const { orders, isLoading, fetchOrders, updateOrderStatus } = usePerksStore();
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const loadOrders = useCallback(async () => {
    await fetchOrders();
  }, [fetchOrders]);

  const handleStatusUpdate = async (orderId: string, status: Order['status']) => {
    await updateOrderStatus(orderId, status);
  };

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'all' || order.status === filter;
    const matchesSearch = searchQuery === '' || 
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.perkTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.redemptionCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const completedCount = orders.filter(o => o.status === 'completed').length;
  const cancelledCount = orders.filter(o => o.status === 'cancelled').length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Orders</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {pendingCount} pending • {completedCount} completed
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search orders, customers, or codes..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'all' && { backgroundColor: colors.primary },
          ]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[
              styles.filterText,
              {
                color: filter === 'all' ? colors.onPrimary : colors.textSecondary,
              },
            ]}
          >
            All ({orders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'pending' && { backgroundColor: colors.primary },
          ]}
          onPress={() => setFilter('pending')}
        >
          <Text
            style={[
              styles.filterText,
              {
                color: filter === 'pending' ? colors.onPrimary : colors.textSecondary,
              },
            ]}
          >
            Pending ({pendingCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'completed' && { backgroundColor: colors.primary },
          ]}
          onPress={() => setFilter('completed')}
        >
          <Text
            style={[
              styles.filterText,
              {
                color: filter === 'completed' ? colors.onPrimary : colors.textSecondary,
              },
            ]}
          >
            Completed ({completedCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'cancelled' && { backgroundColor: colors.primary },
          ]}
          onPress={() => setFilter('cancelled')}
        >
          <Text
            style={[
              styles.filterText,
              {
                color: filter === 'cancelled' ? colors.onPrimary : colors.textSecondary,
              },
            ]}
          >
            Cancelled ({cancelledCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadOrders}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons 
              name={searchQuery ? "search" : "receipt-outline"} 
              size={64} 
              color={colors.textSecondary} 
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {searchQuery ? 'No matching orders' : 'No orders yet'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {searchQuery 
                ? 'Try adjusting your search terms'
                : 'Orders will appear here when customers redeem your perks'
              }
            </Text>
          </View>
        ) : (
          filteredOrders
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onUpdateStatus={(status) => handleStatusUpdate(order.id, status)}
              />
            ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(16),
  },
  title: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    marginBottom: verticalScale(4),
  },
  subtitle: {
    fontSize: moderateScale(14),
  },
  searchContainer: {
    paddingHorizontal: scale(16),
    marginBottom: verticalScale(16),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    gap: scale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(14),
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: scale(16),
    marginBottom: verticalScale(16),
    gap: scale(8),
  },
  filterTab: {
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(20),
    backgroundColor: 'transparent',
  },
  filterText: {
    fontSize: moderateScale(12),
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: scale(16),
  },
  orderCard: {
    marginBottom: verticalScale(16),
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: verticalScale(12),
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginBottom: verticalScale(6),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
    alignSelf: 'flex-start',
    gap: scale(4),
  },
  statusText: {
    fontSize: moderateScale(10),
    fontWeight: '600',
  },
  orderDate: {
    fontSize: moderateScale(12),
  },
  orderDetails: {
    marginBottom: verticalScale(12),
  },
  perkTitle: {
    fontSize: moderateScale(16),
    fontWeight: '500',
    marginBottom: verticalScale(8),
  },
  customerInfo: {
    gap: verticalScale(4),
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  customerText: {
    fontSize: moderateScale(14),
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(12),
    gap: scale(8),
  },
  codeLabel: {
    fontSize: moderateScale(12),
  },
  codeValue: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  actions: {
    flexDirection: 'row',
    gap: scale(8),
  },
  actionButton: {
    flex: 1,
  },
  completedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  completedText: {
    fontSize: moderateScale(12),
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(64),
    paddingHorizontal: scale(32),
  },
  emptyTitle: {
    fontSize: moderateScale(20),
    fontWeight: '600',
    marginTop: verticalScale(16),
    marginBottom: verticalScale(8),
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: moderateScale(14),
    textAlign: 'center',
    lineHeight: moderateScale(20),
  },
});
