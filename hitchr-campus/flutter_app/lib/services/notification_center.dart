import 'dart:async';

class NotificationCenter {
  final StreamController<Map<String, dynamic>> _controller =
      StreamController<Map<String, dynamic>>.broadcast();

  Stream<Map<String, dynamic>> get stream => _controller.stream;

  void emit(Map<String, dynamic> message) {
    if (_controller.isClosed) return;
    _controller.add(message);
  }

  void dispose() {
    _controller.close();
  }
}
