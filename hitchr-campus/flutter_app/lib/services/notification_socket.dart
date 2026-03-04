import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart' show debugPrint, kIsWeb;

typedef NotificationEventHandler = void Function(Map<String, dynamic> message);

class NotificationSocket {
  WebSocket? _socket;
  Timer? _reconnectTimer;
  Timer? _pingTimer;
  bool _manuallyClosed = false;
  String? _baseApiUrl;
  String? _userId;
  NotificationEventHandler? _onMessage;

  Future<void> connect({
    required String baseApiUrl,
    required String userId,
    required NotificationEventHandler onMessage,
  }) async {
    if (kIsWeb) {
      debugPrint('[NotificationSocket] Web not supported yet');
      return;
    }
    _baseApiUrl = baseApiUrl;
    _userId = userId;
    _onMessage = onMessage;
    _manuallyClosed = false;
    await _open();
  }

  Future<void> _open() async {
    final baseApiUrl = _baseApiUrl;
    final userId = _userId;
    if (baseApiUrl == null || userId == null) return;

    try {
      var wsUri = _buildWsUri(baseApiUrl, userId, stripApi: true);
      try {
        _socket = await WebSocket.connect(wsUri.toString());
      } catch (_) {
        // Some deployments expose websocket under /api/ws/notifications.
        wsUri = _buildWsUri(baseApiUrl, userId, stripApi: false);
        _socket = await WebSocket.connect(wsUri.toString());
      }
      debugPrint('[NotificationSocket] Connected: $wsUri');
      _socket!.listen(
        _handleMessage,
        onDone: _scheduleReconnect,
        onError: (_) => _scheduleReconnect(),
        cancelOnError: true,
      );
      _pingTimer?.cancel();
      _pingTimer = Timer.periodic(const Duration(seconds: 20), (_) {
        _socket?.add('ping');
      });
    } catch (e) {
      debugPrint('[NotificationSocket] Connect failed: $e');
      _scheduleReconnect();
    }
  }

  Uri _buildWsUri(String apiUrl, String userId, {required bool stripApi}) {
    final apiUri = Uri.parse(apiUrl);
    final wsScheme = apiUri.scheme == 'https' ? 'wss' : 'ws';
    final segments = List<String>.from(apiUri.pathSegments);
    if (stripApi && segments.isNotEmpty && segments.last == 'api') {
      segments.removeLast();
    }
    final basePath = segments.join('/');
    final wsPath = basePath.isEmpty ? '/ws/notifications' : '/$basePath/ws/notifications';
    return Uri(
      scheme: wsScheme,
      host: apiUri.host,
      port: apiUri.hasPort ? apiUri.port : null,
      path: wsPath,
      queryParameters: {'user_id': userId},
    );
  }

  void _handleMessage(dynamic raw) {
    try {
      final decoded = jsonDecode(raw.toString());
      if (decoded is Map<String, dynamic>) {
        _onMessage?.call(decoded);
      } else if (decoded is Map) {
        _onMessage?.call(decoded.cast<String, dynamic>());
      }
    } catch (_) {
      // Ignore non-JSON payloads (e.g. pongs).
    }
  }

  void _scheduleReconnect() {
    if (_manuallyClosed) return;
    _pingTimer?.cancel();
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(const Duration(seconds: 3), () {
      _open();
    });
  }

  Future<void> disconnect() async {
    _manuallyClosed = true;
    _reconnectTimer?.cancel();
    _pingTimer?.cancel();
    await _socket?.close();
    _socket = null;
  }

  Future<void> dispose() async {
    await disconnect();
  }
}
