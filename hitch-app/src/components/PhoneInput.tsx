import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  editable?: boolean;
}

export default function PhoneInput({ value, onChangeText, error, editable = true }: PhoneInputProps) {
  const [countryCode] = useState('+91');

  const handleChange = (text: string) => {
    // Only allow numbers, max 10 digits
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 10);
    onChangeText(cleaned);
  };

  const isValid = value.length === 10 && /^[6-9]/.test(value);

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <View style={styles.countryCodeBox}>
          <Text style={styles.countryCode}>{countryCode}</Text>
        </View>
        <TextInput
          style={[
            styles.input,
            error && styles.inputError,
            isValid && styles.inputValid,
          ]}
          placeholder="Phone Number"
          placeholderTextColor="#94A3B8"
          value={value}
          onChangeText={handleChange}
          keyboardType="phone-pad"
          maxLength={10}
          editable={editable}
          autoFocus
          returnKeyType="done"
          accessibilityLabel="Phone number input"
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {value.length > 0 && value.length < 10 && (
        <Text style={styles.hintText}>Enter 10 digit mobile number</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  countryCodeBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  input: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0F172A',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEE2E2',
  },
  inputValid: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 8,
    fontWeight: '500',
  },
  hintText: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 8,
  },
});

