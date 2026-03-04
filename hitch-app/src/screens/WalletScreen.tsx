// src/screens/WalletScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Contexts
import { useUser } from '../contexts/UserContext';

// Types
import { theme } from '../constants/theme';

// Mock transaction data
const mockTransactions = [
  {
    id: '1',
    type: 'earn',
    amount: 15,
    category: 'ride',
    source: 'Ride completed',
    destination: 'MG Road',
    time: '2h ago',
  },
  {
    id: '2',
    type: 'spend',
    amount: -100,
    category: 'redemption',
    source: 'Voucher redeemed',
    destination: 'Decathlon',
    time: '1d ago',
  },
  {
    id: '3',
    type: 'earn',
    amount: 10,
    category: 'streak',
    source: 'Streak bonus',
    destination: '5 rides',
    time: '2d ago',
  },
  {
    id: '4',
    type: 'earn',
    amount: 5,
    category: 'plate',
    source: 'New plate collected',
    destination: 'KA-01',
    time: '3d ago',
  },
];

export default function WalletScreen() {
  const { profile } = useUser();

  const renderTransaction = ({ item }: { item: any }) => {
    const isEarn = item.type === 'earn';
    
    return (
      <View style={styles.transaction}>
        <View style={[styles.transactionIcon, isEarn ? styles.earnIcon : styles.spendIcon]}>
          <Text style={styles.transactionIconText}>{isEarn ? '+' : '-'}</Text>
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionTitle}>{item.source}</Text>
          <Text style={styles.transactionMeta}>
            {item.destination} • {item.time}
          </Text>
        </View>
        <Text style={[styles.transactionAmount, isEarn ? styles.earnAmount : styles.spendAmount]}>
          {isEarn ? '+' : ''}{item.amount}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Token Wallet</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <View style={styles.balanceRow}>
            <View style={styles.tokenIcon}>
              <Text style={styles.tokenEmoji}>🪙</Text>
            </View>
            <Text style={styles.balanceValue}>{profile?.stats.tokenBalance || 0}</Text>
          </View>
          <TouchableOpacity style={styles.redeemButton}>
            <Text style={styles.redeemButtonText}>Redeem</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Earned</Text>
            <Text style={[styles.statValue, styles.earnValue]}>+350</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Spent</Text>
            <Text style={[styles.statValue, styles.spendValue]}>-230</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>This Week</Text>
            <Text style={styles.statValue}>+45</Text>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {mockTransactions.map((transaction) => (
            <View key={transaction.id}>
              {renderTransaction({ item: transaction })}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  balanceCard: {
    margin: 20,
    padding: 30,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    ...theme.shadows.lg,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 10,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 20,
  },
  tokenIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenEmoji: {
    fontSize: 28,
  },
  balanceValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#fff',
  },
  redeemButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  redeemButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    ...theme.shadows.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.border,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  earnValue: {
    color: theme.colors.success,
  },
  spendValue: {
    color: theme.colors.danger,
  },
  section: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 15,
  },
  transaction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  transactionIcon: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  earnIcon: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  spendIcon: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
  },
  transactionIconText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.success,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  transactionMeta: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  earnAmount: {
    color: theme.colors.success,
  },
  spendAmount: {
    color: theme.colors.danger,
  },
});

