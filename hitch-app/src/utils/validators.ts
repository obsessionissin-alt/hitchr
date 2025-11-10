export const validatePhoneNumber = (phone: string): boolean => {
  // Basic validation for Indian phone numbers
  const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const validateOTP = (otp: string): boolean => {
  return /^\d{4,6}$/.test(otp);
};

export const validateName = (name: string): boolean => {
  return name.trim().length >= 2;
};

export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('91')) {
    return `+${cleaned}`;
  }
  
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  
  return phone;
};