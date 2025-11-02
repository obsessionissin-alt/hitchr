import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  Auth,
} from 'firebase/auth';
import { Platform } from 'react-native';
import { FIREBASE_CONFIG } from '../constants/config';
import api from './api';

class AuthService {
  private auth: Auth;
  private confirmationResult: ConfirmationResult | null = null;
  private recaptchaVerifier: RecaptchaVerifier | null = null;
  private recaptchaInitialized: boolean = false;

  constructor() {
    const app = initializeApp(FIREBASE_CONFIG);
    this.auth = getAuth(app);
  }

  // Initialize reCAPTCHA (web only)
  private async initRecaptcha(): Promise<RecaptchaVerifier | null> {
    if (Platform.OS !== 'web') {
      return null;
    }

    if (this.recaptchaVerifier && this.recaptchaInitialized) {
      return this.recaptchaVerifier;
    }

    try {
      // Wait for DOM to be ready
      await new Promise(resolve => {
        if (typeof document !== 'undefined') {
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', resolve);
          } else {
            resolve(true);
          }
        } else {
          resolve(true);
        }
      });

      // Create container if it doesn't exist
      if (typeof document !== 'undefined') {
        let container = document.getElementById('recaptcha-container');
        if (!container) {
          container = document.createElement('div');
          container.id = 'recaptcha-container';
          container.style.display = 'none';
          document.body.appendChild(container);
        }
      }

      // Create RecaptchaVerifier with correct parameter order for v9
      this.recaptchaVerifier = new RecaptchaVerifier(
        this.auth,
        'recaptcha-container',
        {
          size: 'invisible',
          callback: () => {
            console.log('reCAPTCHA solved');
          },
          'expired-callback': () => {
            console.log('reCAPTCHA expired');
            this.recaptchaInitialized = false;
          },
        }
      );

      this.recaptchaInitialized = true;
      console.log('reCAPTCHA initialized successfully');
      return this.recaptchaVerifier;
    } catch (error) {
      console.error('reCAPTCHA init error:', error);
      this.recaptchaInitialized = false;
      return null;
    }
  }

  // Send OTP to phone number
  async sendOTP(phoneNumber: string): Promise<string> {
    try {
      console.log('Sending OTP to:', phoneNumber);

      // Format phone number (ensure it has country code)
      const formattedPhone = phoneNumber.startsWith('+') 
        ? phoneNumber 
        : `+91${phoneNumber}`; // Default to India

      if (Platform.OS === 'web') {
        // Web: Use reCAPTCHA
        const recaptcha = await this.initRecaptcha();
        if (!recaptcha) {
          throw new Error('Failed to initialize reCAPTCHA');
        }

        this.confirmationResult = await signInWithPhoneNumber(
          this.auth,
          formattedPhone,
          recaptcha
        );
        
        console.log('OTP sent successfully (web)');
        return this.confirmationResult.verificationId;
      } else {
        // iOS/Android: Direct phone auth
        this.confirmationResult = await signInWithPhoneNumber(
          this.auth,
          formattedPhone,
          // @ts-ignore - React Native Firebase handles this differently
          true
        );

        console.log('OTP sent successfully (mobile)');
        return this.confirmationResult.verificationId;
      }
    } catch (error: any) {
      console.error('OTP send error:', error);
      
      // Provide helpful error messages
      if (error.code === 'auth/invalid-phone-number') {
        throw new Error('Invalid phone number format');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many requests. Please try again later.');
      } else if (error.code === 'auth/quota-exceeded') {
        throw new Error('SMS quota exceeded. Please try again later.');
      } else if (error.code === 'auth/captcha-check-failed') {
        throw new Error('Verification failed. Please refresh and try again.');
      }
      
      throw new Error(error.message || 'Failed to send OTP');
    }
  }

  // Verify OTP and exchange for backend JWT
  async verifyOTP(verificationId: string, code: string): Promise<{ token: string; user: any }> {
    try {
      console.log('Verifying OTP:', code);

      if (!this.confirmationResult) {
        throw new Error('No confirmation result. Please request OTP again.');
      }

      // Step 1: Verify OTP with Firebase
      const credential = await this.confirmationResult.confirm(code);
      console.log('Firebase verification successful');

      // Step 2: Get Firebase ID token
      const firebaseToken = await credential.user.getIdToken();
      console.log('Got Firebase token');

      // Step 3: Exchange Firebase token with backend for JWT
      const response = await api.verifyToken(firebaseToken);

      console.log('Backend verification successful');

      // Step 4: Store JWT token for future API calls
      const { token, user } = response;
      
      // The api.ts interceptor will handle storing the token
      api.setAuthToken(token);

      return { token, user };
    } catch (error: any) {
      console.error('OTP verification error:', error);

      if (error.code === 'auth/invalid-verification-code') {
        throw new Error('Invalid OTP code');
      } else if (error.code === 'auth/code-expired') {
        throw new Error('OTP code expired. Please request a new one.');
      } else if (error.response) {
        throw new Error(error.response.data?.message || 'Backend verification failed');
      }

      throw new Error(error.message || 'Failed to verify OTP');
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      await this.auth.signOut();
      this.confirmationResult = null;
      this.recaptchaVerifier = null;
      this.recaptchaInitialized = false;
      
      // Clear JWT from API client
      api.clearAuthToken();
      
      console.log('Signed out successfully');
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error(error.message || 'Failed to sign out');
    }
  }

  // Get current Firebase user
  getCurrentUser() {
    return this.auth.currentUser;
  }

  // Get current Firebase ID token
  async getFirebaseToken(): Promise<string | null> {
    try {
      const currentUser = this.auth.currentUser;
      if (currentUser) {
        return await currentUser.getIdToken();
      }
      return null;
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  }
}

export default new AuthService();