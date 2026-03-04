import 'dart:async';
import 'package:flutter/foundation.dart' show debugPrint;
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import '../api/campus_api.dart';

class PushNotificationsService {
  PushNotificationsService._();
  static final PushNotificationsService instance = PushNotificationsService._();

  StreamSubscription<String>? _tokenRefreshSub;
  bool _initialized = false;
  bool _enabled = false;
  CampusApi? _api;
  String? _currentUserId;

  Future<void> initialize() async {
    if (_initialized) return;
    _initialized = true;
    try {
      await Firebase.initializeApp();
      final messaging = FirebaseMessaging.instance;
      await messaging.requestPermission();
      _enabled = true;
      _tokenRefreshSub = messaging.onTokenRefresh.listen((token) async {
        final api = _api;
        final userId = _currentUserId;
        if (api != null && userId != null) {
          await _sendTokenToBackend(api, userId, token);
        }
      });
      debugPrint('[PushNotifications] Initialized');
    } catch (e) {
      _enabled = false;
      debugPrint('[PushNotifications] Firebase not configured yet: $e');
    }
  }

  Future<void> registerCurrentUser(CampusApi api, String userId) async {
    _api = api;
    _currentUserId = userId;
    if (!_enabled) return;
    final token = await FirebaseMessaging.instance.getToken();
    if (token != null && token.isNotEmpty) {
      await _sendTokenToBackend(api, userId, token);
    }
  }

  Future<void> clearUser() async {
    _currentUserId = null;
  }

  Future<void> dispose() async {
    await _tokenRefreshSub?.cancel();
  }

  Future<void> _sendTokenToBackend(CampusApi api, String userId, String token) async {
    try {
      await api.updateFcmToken(userId, token);
      debugPrint('[PushNotifications] FCM token registered for user=$userId');
    } catch (e) {
      debugPrint('[PushNotifications] Failed to register FCM token: $e');
    }
  }
}
