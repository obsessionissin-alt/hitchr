import React, { useRef, useState, useEffect } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';

interface OTPInputProps {
  value: string;
  onChangeText: (text: string) => void;
  length?: number;
  editable?: boolean;
}

export default function OTPInput({ value, onChangeText, length = 6, editable = true }: OTPInputProps) {
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [otp, setOtp] = useState<string[]>(Array(length).fill(''));

  useEffect(() => {
    const digits = value.split('').concat(Array(length).fill('')).slice(0, length);
    setOtp(digits);
  }, [value, length]);

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    const otpString = newOtp.join('');
    onChangeText(otpString);

    // Auto-focus next input
    if (text && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  useEffect(() => {
    // Auto-focus first input on mount
    if (editable) {
      inputRefs.current[0]?.focus();
    }
  }, [editable]);

  return (
    <View style={styles.container}>
      {Array(length)
        .fill(0)
        .map((_, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputRefs.current[index] = ref)}
            style={[
              styles.input,
              otp[index] && styles.inputFilled,
            ]}
            value={otp[index]}
            onChangeText={(text) => handleChange(text.replace(/[^0-9]/g, '').slice(0, 1), index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={1}
            editable={editable}
            selectTextOnFocus
            accessibilityLabel={`OTP digit ${index + 1}`}
          />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginVertical: 24,
  },
  input: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: '#0F172A',
  },
  inputFilled: {
    borderColor: '#F59E0B',
    backgroundColor: '#FEF3C7',
  },
});

