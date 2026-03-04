import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows } from '../../constants/theme';
import { useCampusStore } from '../../store/campusStore';
import { campusRideAPI, campusContributionAPI } from '../../utils/campusApi';
import { formatDistance, calculateSuggestedContribution } from '../../utils/helpers';
import haptics from '../../utils/haptics';

interface RideInstance {
  id: string;
  route_id: string;
  pilot_id: string;
  pilot_name: string;
  rider_id: string;
  rider_name: string;
  pickup: any;
  dropoff: any;
  pilot_destination: any;
  status: string;
  shared_distance_km: number;
  suggested_contribution: number;
  contribution_status: string;
  actual_contribution: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export default function CompleteRideScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useCampusStore();
  
  const [ride, setRide] = useState<RideInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [suggestedAmount, setSuggestedAmount] = useState(0);
  const [selectedAmount, setSelectedAmount] = useState(0);
  const [customAmount, setCustomAmount] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    loadRide();
  }, [id]);

  const loadRide = async () => {
    try {
      const response = await campusRideAPI.get(id as string);
      const rideData: RideInstance = response.data;
      setRide(rideData);
      
      // Use backend-calculated suggestion if available, otherwise calculate
      const suggested = rideData.suggested_contribution > 0 
        ? rideData.suggested_contribution 
        : calculateSuggestedContribution(rideData.shared_distance_km);
      
      setSuggestedAmount(suggested);
      setSelectedAmount(suggested);
    } catch (error) {
      console.error('Error loading ride:', error);
      Alert.alert('Error', 'Failed to load ride details');
    } finally {
      setLoading(false);
    }
  };

  const handleAmountSelection = (multiplier: number) => {
    const amount = Math.round(suggestedAmount * multiplier);
    setSelectedAmount(amount);
    setShowCustomInput(false);
    setCustomAmount('');
  };

  const handleCustomAmount = () => {
    setShowCustomInput(true);
  };

  const applyCustomAmount = () => {
    const amount = parseInt(customAmount);
    if (!isNaN(amount) && amount >= 0) {
      setSelectedAmount(amount);
      setShowCustomInput(false);
    }
  };

  const handleWaive = () => {
    setSelectedAmount(0);
    setShowCustomInput(false);
    setCustomAmount('');
  };

  const handleProceedToPayment = () => {
    if (selectedAmount === 0) {
      // Skip payment, submit waived contribution
      submitContribution(0, 'waived');
    } else {
      setShowPaymentModal(true);
    }
  };

  const handlePayment = async () => {
    if (!paymentMethod) {
      Alert.alert('Select Method', 'Please select a payment method');
      return;
    }

    setProcessing(true);
    try {
      await submitContribution(selectedAmount, paymentMethod);
    } finally {
      setProcessing(false);
    }
  };

  const submitContribution = async (amount: number, method: string) => {
    if (!ride || !user) return;

    setProcessing(true);
    try {
      const contributionData = {
        ride_id: ride.id,
        rider_id: user.id,
        amount: amount,
        payment_method: method,
      };

      const response = await campusContributionAPI.submit(contributionData);
      const result = response.data;
      
      setPaymentResult({
        success: result.success,
        amount: amount,
        transaction_id: result.transaction_id || (amount === 0 ? 'WAIVED' : 'UNKNOWN'),
        message: result.message,
      });
      
      setShowPaymentModal(false);
      
      if (result.success) {
        // Celebrate the contribution!
        haptics.celebrate();
        setShowReceiptModal(true);
      } else {
        haptics.error();
        Alert.alert('Didn\'t go through', result.message || 'Give it another shot?');
      }
    } catch (error: any) {
      haptics.error();
      console.error('Error submitting contribution:', error);
      Alert.alert(
        'Something went wrong',
        error.response?.data?.detail || 'Couldn\'t process your contribution. Try again?'
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleDone = () => {
    router.replace('/(tabs)/rides');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
        <Text style={styles.errorText}>Ride not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Already paid/waived
  if (ride.contribution_status !== 'pending') {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons 
          name={ride.contribution_status === 'paid' ? 'checkmark-circle' : 'heart'} 
          size={64} 
          color={Colors.success} 
        />
        <Text style={styles.alreadyPaidTitle}>
          {ride.contribution_status === 'paid' ? 'Already Contributed!' : 'Contribution Waived'}
        </Text>
        <Text style={styles.alreadyPaidSubtitle}>
          {ride.contribution_status === 'paid' 
            ? `You contributed ₹${ride.actual_contribution} to ${ride.pilot_name}`
            : `Thanks for riding with ${ride.pilot_name}!`}
        </Text>
        <TouchableOpacity style={styles.doneButtonSmall} onPress={handleDone}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const sharedDistance = ride.shared_distance_km;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Success Header */}
        <View style={styles.successHeader}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>Journey Complete!</Text>
          <Text style={styles.successSubtitle}>
            Thanks for traveling with {ride.pilot_name}
          </Text>
        </View>

        {/* Route Explanation (A→B→C) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Journey</Text>
          <View style={styles.journeyCard}>
            <Text style={styles.journeyExplanation}>
              You traveled {formatDistance(sharedDistance)} together. The pilot dropped you at your point, then continued to their destination.
            </Text>
            
            <View style={styles.routeVisualization}>
              {/* Point A - Pickup */}
              <View style={styles.pointContainer}>
                <View style={[styles.point, { backgroundColor: Colors.primary }]}>
                  <Text style={styles.pointLabel}>A</Text>
                </View>
                <Text style={styles.pointName} numberOfLines={1}>
                  {ride.pickup?.name || 'Pickup'}
                </Text>
                <Text style={styles.pointDescription}>Start</Text>
              </View>

              <View style={styles.routeArrow}>
                <View style={styles.arrowLine} />
                <Ionicons name="arrow-forward" size={20} color={Colors.success} />
                <View style={styles.arrowLine} />
              </View>

              {/* Point B - Dropoff */}
              <View style={styles.pointContainer}>
                <View style={[styles.point, { backgroundColor: Colors.accent }]}>
                  <Text style={styles.pointLabel}>B</Text>
                </View>
                <Text style={styles.pointName} numberOfLines={1}>
                  {ride.dropoff?.name || 'Dropoff'}
                </Text>
                <Text style={styles.pointDescription}>You here</Text>
              </View>

              {ride.pilot_destination && (
                <>
                  <View style={styles.routeArrow}>
                    <View style={[styles.arrowLine, { opacity: 0.3 }]} />
                    <Ionicons name="arrow-forward" size={20} color={Colors.textMuted} />
                    <View style={[styles.arrowLine, { opacity: 0.3 }]} />
                  </View>

                  {/* Point C - Pilot's final destination */}
                  <View style={styles.pointContainer}>
                    <View style={[styles.point, { backgroundColor: Colors.gray, opacity: 0.5 }]}>
                      <Text style={[styles.pointLabel, { opacity: 0.7 }]}>C</Text>
                    </View>
                    <Text style={[styles.pointName, { color: Colors.textMuted }]} numberOfLines={1}>
                      {ride.pilot_destination?.name || 'Pilot dest'}
                    </Text>
                    <Text style={[styles.pointDescription, { color: Colors.textMuted }]}>Pilot</Text>
                  </View>
                </>
              )}
            </View>

            <View style={styles.distanceInfo}>
              <View style={styles.distanceRow}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                <Text style={styles.distanceText}>
                  Shared distance: <Text style={styles.distanceValue}>{formatDistance(sharedDistance)}</Text>
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Contribution Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contribute to Pilot</Text>
          <View style={styles.contributionCard}>
            <View style={styles.suggestedAmount}>
              <Text style={styles.rupeeSymbol}>₹</Text>
              <Text style={styles.amountValue}>{selectedAmount}</Text>
            </View>
            <Text style={styles.calculationText}>
              Based on {formatDistance(sharedDistance)} @ ₹5/km
            </Text>

            {/* Amount Options */}
            <View style={styles.amountOptions}>
              <TouchableOpacity
                style={[styles.amountButton, selectedAmount === suggestedAmount && styles.amountButtonSelected]}
                onPress={() => handleAmountSelection(1)}
              >
                <Text style={[styles.amountButtonText, selectedAmount === suggestedAmount && styles.amountButtonTextSelected]}>
                  Suggested
                </Text>
                <Text style={[styles.amountButtonValue, selectedAmount === suggestedAmount && styles.amountButtonTextSelected]}>
                  ₹{suggestedAmount}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.amountButton, selectedAmount === Math.round(suggestedAmount * 0.7) && styles.amountButtonSelected]}
                onPress={() => handleAmountSelection(0.7)}
              >
                <Text style={[styles.amountButtonText, selectedAmount === Math.round(suggestedAmount * 0.7) && styles.amountButtonTextSelected]}>
                  Lower
                </Text>
                <Text style={[styles.amountButtonValue, selectedAmount === Math.round(suggestedAmount * 0.7) && styles.amountButtonTextSelected]}>
                  ₹{Math.round(suggestedAmount * 0.7)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.amountButton, selectedAmount === Math.round(suggestedAmount * 1.2) && styles.amountButtonSelected]}
                onPress={() => handleAmountSelection(1.2)}
              >
                <Text style={[styles.amountButtonText, selectedAmount === Math.round(suggestedAmount * 1.2) && styles.amountButtonTextSelected]}>
                  Higher
                </Text>
                <Text style={[styles.amountButtonValue, selectedAmount === Math.round(suggestedAmount * 1.2) && styles.amountButtonTextSelected]}>
                  ₹{Math.round(suggestedAmount * 1.2)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Custom and Waive Options */}
            <View style={styles.secondaryOptions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleCustomAmount}
              >
                <Ionicons name="create-outline" size={20} color={Colors.primary} />
                <Text style={styles.secondaryButtonText}>Custom</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, selectedAmount === 0 && styles.secondaryButtonSelected]}
                onPress={handleWaive}
              >
                <Ionicons name="heart" size={20} color={Colors.error} />
                <Text style={styles.secondaryButtonText}>Waive (₹0)</Text>
              </TouchableOpacity>
            </View>

            {/* Custom Amount Input */}
            {showCustomInput && (
              <View style={styles.customInputContainer}>
                <TextInput
                  style={styles.customInput}
                  placeholder="Enter amount"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  value={customAmount}
                  onChangeText={setCustomAmount}
                />
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={applyCustomAmount}
                >
                  <Text style={styles.applyButtonText}>Apply</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Community Message */}
          <View style={styles.communityMessage}>
            <Ionicons name="heart" size={20} color={Colors.primary} />
            <Text style={styles.communityMessageText}>
              Pay what feels right. Community first.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Proceed Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.proceedButton}
          onPress={handleProceedToPayment}
          activeOpacity={0.8}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Text style={styles.proceedButtonText}>
                {selectedAmount === 0 ? 'Complete (Skip Payment)' : `Pay ₹${selectedAmount}`}
              </Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.white} />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Payment Method Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Payment</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={28} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.paymentAmount}>Amount: ₹{selectedAmount}</Text>

            <TouchableOpacity
              style={[styles.paymentMethodButton, paymentMethod === 'upi' && styles.paymentMethodSelected]}
              onPress={() => setPaymentMethod('upi')}
            >
              <Ionicons name="wallet-outline" size={28} color={paymentMethod === 'upi' ? Colors.primary : Colors.text} />
              <View style={styles.paymentMethodInfo}>
                <Text style={[styles.paymentMethodText, paymentMethod === 'upi' && { color: Colors.primary }]}>
                  UPI
                </Text>
                <Text style={styles.paymentMethodSubtext}>PhonePe, GPay, Paytm</Text>
              </View>
              {paymentMethod === 'upi' && (
                <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.paymentMethodButton, paymentMethod === 'card' && styles.paymentMethodSelected]}
              onPress={() => setPaymentMethod('card')}
            >
              <Ionicons name="card-outline" size={28} color={paymentMethod === 'card' ? Colors.primary : Colors.text} />
              <View style={styles.paymentMethodInfo}>
                <Text style={[styles.paymentMethodText, paymentMethod === 'card' && { color: Colors.primary }]}>
                  Card
                </Text>
                <Text style={styles.paymentMethodSubtext}>Debit / Credit Card</Text>
              </View>
              {paymentMethod === 'card' && (
                <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, !paymentMethod && styles.modalButtonDisabled]}
              onPress={handlePayment}
              disabled={!paymentMethod || processing}
            >
              {processing ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.modalButtonText}>Confirm Payment</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Receipt Modal */}
      <Modal
        visible={showReceiptModal}
        animationType="fade"
        transparent
        onRequestClose={handleDone}
      >
        <View style={styles.receiptOverlay}>
          <View style={styles.receiptContent}>
            <View style={styles.receiptIcon}>
              <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
            </View>
            
            <Text style={styles.receiptTitle}>
              {paymentResult?.amount === 0 ? 'Journey Complete!' : 'Payment Successful!'}
            </Text>
            
            {paymentResult?.amount > 0 && (
              <>
                <View style={styles.receiptAmount}>
                  <Text style={styles.receiptAmountLabel}>Contributed to Pilot</Text>
                  <Text style={styles.receiptAmountValue}>₹{paymentResult?.amount}</Text>
                </View>

                <View style={styles.receiptDetails}>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Transaction ID</Text>
                    <Text style={styles.receiptValue}>{paymentResult?.transaction_id}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Pilot</Text>
                    <Text style={styles.receiptValue}>{ride.pilot_name}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Distance</Text>
                    <Text style={styles.receiptValue}>{formatDistance(sharedDistance)}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Payment</Text>
                    <Text style={styles.receiptValue}>{paymentMethod?.toUpperCase()}</Text>
                  </View>
                </View>
              </>
            )}

            {paymentResult?.amount === 0 && (
              <Text style={styles.waiveMessage}>
                Thanks for being part of the Hitchr community!
              </Text>
            )}

            <TouchableOpacity
              style={styles.doneButton}
              onPress={handleDone}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.xl,
  },
  errorText: {
    color: Colors.text,
    fontSize: FontSizes.lg,
    marginTop: Spacing.md,
  },
  backButton: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
  },
  backButtonText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  alreadyPaidTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  alreadyPaidSubtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  doneButtonSmall: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  scrollView: {
    flex: 1,
  },
  successHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingTop: Spacing.xl + 40,
    backgroundColor: Colors.gray100,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  successIcon: {
    marginBottom: Spacing.md,
  },
  successTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  successSubtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  section: {
    padding: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  journeyCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.medium,
  },
  journeyExplanation: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  routeVisualization: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    flexWrap: 'wrap',
  },
  pointContainer: {
    alignItems: 'center',
    minWidth: 60,
  },
  point: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    ...Shadows.small,
  },
  pointLabel: {
    color: Colors.white,
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  pointName: {
    color: Colors.text,
    fontSize: FontSizes.xs,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
    maxWidth: 70,
  },
  pointDescription: {
    color: Colors.textMuted,
    fontSize: 10,
    textAlign: 'center',
  },
  routeArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  arrowLine: {
    width: 12,
    height: 2,
    backgroundColor: Colors.success,
  },
  distanceInfo: {
    gap: Spacing.sm,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  distanceText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
  },
  distanceValue: {
    fontWeight: '700',
    color: Colors.success,
  },
  contributionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.sm,
  },
  suggestedAmount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.xs,
  },
  rupeeSymbol: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.primary,
    marginRight: 4,
  },
  amountValue: {
    fontSize: 48,
    fontWeight: '900',
    color: Colors.text,
  },
  calculationText: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
    marginBottom: Spacing.lg,
  },
  amountOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
    marginBottom: Spacing.md,
  },
  amountButton: {
    flex: 1,
    padding: Spacing.md,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  amountButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  amountButtonText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    marginBottom: 4,
    fontWeight: '600',
  },
  amountButtonTextSelected: {
    color: Colors.primary,
  },
  amountButtonValue: {
    color: Colors.text,
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  secondaryOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    padding: Spacing.sm,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  secondaryButtonSelected: {
    borderColor: Colors.error,
  },
  secondaryButtonText: {
    color: Colors.text,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  customInputContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
    marginTop: Spacing.md,
  },
  customInput: {
    flex: 1,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSizes.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  applyButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  applyButtonText: {
    color: Colors.white,
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  communityMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md,
  },
  communityMessageText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
  },
  footer: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  proceedButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadows.large,
  },
  proceedButtonText: {
    color: Colors.white,
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.text,
  },
  paymentAmount: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  paymentMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentMethodSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodText: {
    color: Colors.text,
    fontSize: FontSizes.lg,
    fontWeight: '700',
    marginBottom: 2,
  },
  paymentMethodSubtext: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
  },
  modalButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonText: {
    color: Colors.white,
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  receiptOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  receiptContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  receiptIcon: {
    marginBottom: Spacing.lg,
  },
  receiptTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  receiptAmount: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  receiptAmountLabel: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
    marginBottom: Spacing.xs,
  },
  receiptAmountValue: {
    fontSize: 48,
    fontWeight: '900',
    color: Colors.primary,
  },
  receiptDetails: {
    width: '100%',
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  receiptLabel: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
  },
  receiptValue: {
    color: Colors.text,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  waiveMessage: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    textAlign: 'center',
    marginVertical: Spacing.lg,
    lineHeight: 24,
  },
  doneButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    width: '100%',
  },
  doneButtonText: {
    color: Colors.white,
    fontSize: FontSizes.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
});
