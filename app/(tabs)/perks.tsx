import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useThemeStore } from '../../store/themeStore';
import { usePerksStore, Perk } from '../../store/perksStore';
import Card from '../../components/Card';
import { Button } from '../../components/Button';
import { Ionicons } from '@expo/vector-icons';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

interface PerkCardProps {
  perk: Perk;
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}

function PerkCard({ perk, onEdit, onToggleStatus, onDelete }: PerkCardProps) {
  const { colors } = useThemeStore();

  const formatDiscount = () => {
    if (perk.discountType === 'percentage') {
      return `${perk.discountValue}% OFF`;
    } else {
      return `₱${perk.discountValue} OFF`;
    }
  };

  const getUsagePercentage = () => {
    return (perk.currentRedemptions / perk.totalLimit) * 100;
  };

  return (
    <Card style={styles.perkCard}>
      <View style={styles.perkHeader}>
        <View style={styles.perkInfo}>
          <Text style={[styles.perkTitle, { color: colors.text }]}>{perk.title}</Text>
          <Text style={[styles.perkDiscount, { color: colors.primary }]}>
            {formatDiscount()}
          </Text>
        </View>
        <View style={styles.perkActions}>
          <Switch
            value={perk.isActive}
            onValueChange={onToggleStatus}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={perk.isActive ? colors.onPrimary : colors.textSecondary}
          />
        </View>
      </View>

      <Text style={[styles.perkDescription, { color: colors.textSecondary }]}>
        {perk.description}
      </Text>

      <View style={styles.perkStats}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {perk.currentRedemptions}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Used
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {perk.totalLimit - perk.currentRedemptions}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Remaining
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {new Date(perk.expiryDate).toLocaleDateString()}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Expires
          </Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.primary,
                width: `${getUsagePercentage()}%`,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: colors.textSecondary }]}>
          {Math.round(getUsagePercentage())}% used
        </Text>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: `${colors.info}15` }]}
          onPress={onEdit}
        >
          <Ionicons name="pencil" size={16} color={colors.info} />
          <Text style={[styles.actionButtonText, { color: colors.info }]}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: `${colors.error}15` }]}
          onPress={onDelete}
        >
          <Ionicons name="trash" size={16} color={colors.error} />
          <Text style={[styles.actionButtonText, { color: colors.error }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

export default function PerksScreen() {
  const { colors } = useThemeStore();
  const {
    perks,
    isLoading,
    fetchPerks,
    togglePerkStatus,
    deletePerk,
  } = usePerksStore();
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    loadPerks();
  }, [loadPerks]);

  const loadPerks = useCallback(async () => {
    await fetchPerks();
  }, [fetchPerks]);

  const handleToggleStatus = async (perkId: string) => {
    await togglePerkStatus(perkId);
  };

  const handleDeletePerk = (perk: Perk) => {
    Alert.alert(
      'Delete Perk',
      `Are you sure you want to delete "${perk.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deletePerk(perk.id);
          },
        },
      ]
    );
  };

  const filteredPerks = perks.filter(perk => {
    if (filter === 'active') return perk.isActive;
    if (filter === 'inactive') return !perk.isActive;
    return true;
  });

  const activePerks = perks.filter(p => p.isActive).length;
  const totalRedemptions = perks.reduce((sum, p) => sum + p.currentRedemptions, 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Perks</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {activePerks} active • {totalRedemptions} total redemptions
          </Text>
        </View>
        <Button
          title="Create Perk"
          onPress={() => router.push('/perks/create')}
          size="small"
          leftIcon={<Ionicons name="add" size={16} color={colors.onPrimary} />}
        />
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
            All ({perks.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'active' && { backgroundColor: colors.primary },
          ]}
          onPress={() => setFilter('active')}
        >
          <Text
            style={[
              styles.filterText,
              {
                color: filter === 'active' ? colors.onPrimary : colors.textSecondary,
              },
            ]}
          >
            Active ({activePerks})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'inactive' && { backgroundColor: colors.primary },
          ]}
          onPress={() => setFilter('inactive')}
        >
          <Text
            style={[
              styles.filterText,
              {
                color: filter === 'inactive' ? colors.onPrimary : colors.textSecondary,
              },
            ]}
          >
            Inactive ({perks.length - activePerks})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Perks List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadPerks}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {filteredPerks.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="gift-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {filter === 'all' ? 'No perks yet' : `No ${filter} perks`}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {filter === 'all'
                ? 'Create your first perk to start attracting customers'
                : `You don't have any ${filter} perks at the moment`}
            </Text>
            {filter === 'all' && (
              <Button
                title="Create Your First Perk"
                onPress={() => router.push('/perks/create')}
                style={styles.emptyButton}
                leftIcon={<Ionicons name="add" size={18} color={colors.onPrimary} />}
              />
            )}
          </View>
        ) : (
          filteredPerks.map(perk => (
            <PerkCard
              key={perk.id}
              perk={perk}
              onEdit={() => router.push(`/perks/${perk.id}/edit`)}
              onToggleStatus={() => handleToggleStatus(perk.id)}
              onDelete={() => handleDeletePerk(perk)}
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: scale(16),
    marginBottom: verticalScale(16),
    gap: scale(8),
  },
  filterTab: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(20),
    backgroundColor: 'transparent',
  },
  filterText: {
    fontSize: moderateScale(14),
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: scale(16),
  },
  perkCard: {
    marginBottom: verticalScale(16),
  },
  perkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: verticalScale(8),
  },
  perkInfo: {
    flex: 1,
  },
  perkTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    marginBottom: verticalScale(4),
  },
  perkDiscount: {
    fontSize: moderateScale(14),
    fontWeight: '500',
  },
  perkActions: {
    marginLeft: scale(16),
  },
  perkDescription: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
    marginBottom: verticalScale(16),
  },
  perkStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(16),
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginBottom: verticalScale(2),
  },
  statLabel: {
    fontSize: moderateScale(12),
  },
  progressContainer: {
    marginBottom: verticalScale(16),
  },
  progressBar: {
    height: verticalScale(4),
    borderRadius: moderateScale(2),
    overflow: 'hidden',
    marginBottom: verticalScale(4),
  },
  progressFill: {
    height: '100%',
    borderRadius: moderateScale(2),
  },
  progressText: {
    fontSize: moderateScale(12),
    textAlign: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    gap: scale(12),
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(6),
    gap: scale(6),
  },
  actionButtonText: {
    fontSize: moderateScale(14),
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
    marginBottom: verticalScale(24),
  },
  emptyButton: {
    paddingHorizontal: scale(24),
  },
});
