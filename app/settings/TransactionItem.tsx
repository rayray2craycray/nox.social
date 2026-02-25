/**
 * TransactionItem Component
 * Displays transaction history item
 *
 * Performance: Memoized to prevent unnecessary re-renders in lists
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MapPin, Award } from 'lucide-react-native';
import { Transaction, COLORS } from './types';

interface TransactionItemProps {
  transaction: Transaction;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
}

const TransactionItemComponent = ({
  transaction,
  formatCurrency,
  formatDate,
}: TransactionItemProps) => {
  return (
    <View style={styles.transaction}>
      <View style={styles.transactionLeft}>
        <View style={styles.venueIconContainer}>
          <MapPin size={20} color={COLORS.accent} />
        </View>
        <View>
          <Text style={styles.venueName}>{transaction.venueName}</Text>
          <Text style={styles.transactionDate}>{formatDate(transaction.date)}</Text>
        </View>
      </View>
      <View style={styles.transactionRight}>
        <Text style={styles.transactionAmount}>{formatCurrency(transaction.amount)}</Text>
        <View style={styles.pointsBadge}>
          <Award size={12} color={COLORS.warning} />
          <Text style={styles.pointsText}>+{transaction.pointsEarned}</Text>
        </View>
      </View>
    </View>
  );
};
TransactionItemComponent.displayName = 'TransactionItem';
const transactionItemCompare = (prevProps: TransactionItemProps, nextProps: TransactionItemProps) =>
  prevProps.transaction.id === nextProps.transaction.id &&
  prevProps.transaction.status === nextProps.transaction.status;
export const TransactionItem = memo(TransactionItemComponent, transactionItemCompare);

const styles = StyleSheet.create({
  transaction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 16,
    marginBottom: 1,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  venueIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  venueName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  transactionDate: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.cardSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.warning,
  },
});
