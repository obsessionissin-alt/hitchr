import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart' show debugPrint, kIsWeb;
import '../models/live_pilot.dart';

class CampusApi {
  /// Web uses localhost; Android emulator uses 10.0.2.2; real device needs LAN IP.
  static String get _defaultBaseUrl {
    if (kIsWeb) return 'http://localhost:8001/api';
    return 'http://10.0.2.2:8001/api'; // Android emulator
  }

  late final Dio _dio;

  /// Current base URL (for display in UI / debug settings)
  String get baseUrl => _dio.options.baseUrl;

  CampusApi({String? baseUrl}) {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl ?? _defaultBaseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json'},
    ));

    // Debug interceptor — logs every request/response for easy troubleshooting
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        final body = options.data != null ? ' body=${_truncate(options.data.toString(), 200)}' : '';
        final query = options.queryParameters.isNotEmpty ? ' query=${options.queryParameters}' : '';
        debugPrint('[HTTP →] ${options.method} ${options.uri}$query$body');
        handler.next(options);
      },
      onResponse: (response, handler) {
        final summary = _truncate(response.data.toString(), 300);
        debugPrint('[HTTP ←] ${response.statusCode} ${response.requestOptions.method} '
            '${response.requestOptions.uri} → $summary');
        handler.next(response);
      },
      onError: (error, handler) {
        debugPrint('[HTTP ✗] ${error.type} ${error.requestOptions.method} '
            '${error.requestOptions.uri} → ${error.message}');
        if (error.response != null) {
          debugPrint('[HTTP ✗] Response ${error.response?.statusCode}: ${error.response?.data}');
        }
        handler.next(error);
      },
    ));
  }

  /// Truncate long strings for readable log output.
  static String _truncate(String s, int maxLen) {
    if (s.length <= maxLen) return s;
    return '${s.substring(0, maxLen)}…';
  }

  /// Dynamically set base URL (e.g. for LAN IP on real device)
  void setBaseUrl(String url) {
    debugPrint('[CampusApi] setBaseUrl → $url');
    _dio.options.baseUrl = url;
  }

  // ---- Users ----
  Future<Map<String, dynamic>> createUser(Map<String, dynamic> data) async {
    final r = await _dio.post('/users', data: data);
    return Map<String, dynamic>.from(r.data);
  }

  Future<Map<String, dynamic>> getUser(String id) async {
    final r = await _dio.get('/users/$id');
    return Map<String, dynamic>.from(r.data);
  }

  Future<Map<String, dynamic>> toggleRole(String userId, String role) async {
    final r = await _dio.patch('/users/$userId/role', queryParameters: {'role': role});
    return Map<String, dynamic>.from(r.data);
  }

  Future<void> updateFcmToken(String userId, String token) async {
    await _dio.post('/users/$userId/fcm-token', data: {'token': token});
  }

  // ---- Routes ----
  Future<List<dynamic>> getRoutes({String? status}) async {
    final r = await _dio.get('/routes', queryParameters: status != null ? {'status': status} : null);
    return r.data is List ? r.data : [];
  }

  Future<Map<String, dynamic>> getRoute(String id) async {
    final r = await _dio.get('/routes/$id');
    return Map<String, dynamic>.from(r.data);
  }

  Future<List<dynamic>> getRoutesByPilot(String pilotId) async {
    final r = await _dio.get('/routes/pilot/$pilotId');
    return r.data is List ? r.data : [];
  }

  Future<Map<String, dynamic>> createRoute(Map<String, dynamic> data) async {
    final r = await _dio.post('/routes', data: data);
    return Map<String, dynamic>.from(r.data);
  }

  // ---- Join Requests ----
  Future<Map<String, dynamic>> createJoinRequest(Map<String, dynamic> data) async {
    final r = await _dio.post('/join-requests', data: data);
    return Map<String, dynamic>.from(r.data);
  }

  Future<List<dynamic>> getJoinRequestsByRoute(String routeId, {String? status}) async {
    final r = await _dio.get('/join-requests/route/$routeId',
        queryParameters: status != null ? {'status': status} : null);
    return r.data is List ? r.data : [];
  }

  Future<List<dynamic>> getJoinRequestsByRider(String riderId) async {
    final r = await _dio.get('/join-requests/rider/$riderId');
    return r.data is List ? r.data : [];
  }

  /// Respond to a join request. Returns the response body which includes
  /// `ride_id` when action is 'accept'.
  Future<Map<String, dynamic>> respondJoinRequest(String requestId, String action) async {
    final r = await _dio.patch('/join-requests/$requestId/respond', queryParameters: {'action': action});
    return Map<String, dynamic>.from(r.data);
  }

  // ---- Rides ----
  Future<Map<String, dynamic>> getRide(String id) async {
    final r = await _dio.get('/rides/$id');
    return Map<String, dynamic>.from(r.data);
  }

  Future<List<dynamic>> getRidesByRider(String riderId) async {
    final r = await _dio.get('/rides/rider/$riderId');
    return r.data is List ? r.data : [];
  }

  Future<List<dynamic>> getRidesByPilot(String pilotId) async {
    final r = await _dio.get('/rides/pilot/$pilotId');
    return r.data is List ? r.data : [];
  }

  Future<void> startRide(String rideId) async {
    await _dio.patch('/rides/$rideId/start');
  }

  Future<void> completeRide(String rideId) async {
    await _dio.patch('/rides/$rideId/complete');
  }

  // ---- Contributions ----
  Future<Map<String, dynamic>> submitContribution(Map<String, dynamic> data) async {
    final r = await _dio.post('/contributions', data: data);
    return Map<String, dynamic>.from(r.data);
  }

  // ---- Planned Trips ----
  Future<List<dynamic>> getPlannedTrips() async {
    final r = await _dio.get('/planned-trips');
    return r.data is List ? r.data : [];
  }

  Future<Map<String, dynamic>> createPlannedTrip(Map<String, dynamic> data) async {
    final r = await _dio.post('/planned-trips', data: data);
    return Map<String, dynamic>.from(r.data);
  }

  // ---- Memories ----
  Future<List<dynamic>> getMemories() async {
    final r = await _dio.get('/memories');
    return r.data is List ? r.data : [];
  }

  Future<Map<String, dynamic>> createMemory(Map<String, dynamic> data) async {
    final r = await _dio.post('/memories', data: data);
    return Map<String, dynamic>.from(r.data);
  }

  // ---- Communities ----
  Future<List<dynamic>> getCommunities() async {
    final r = await _dio.get('/communities');
    return r.data is List ? r.data : [];
  }

  // ---- Seed ----
  Future<void> seedCampus() async {
    await _dio.post('/seed-campus');
  }

  // ---- Live Interception ----
  Future<void> liveStart(String pilotId, int seats) async {
    await _dio.post('/live/start', data: {
      'pilot_id': pilotId,
      'seats_available': seats,
    });
  }

  Future<void> liveStop(String pilotId) async {
    await _dio.post('/live/stop', data: {
      'pilot_id': pilotId,
    });
  }

  Future<void> liveLocationUpdate(String pilotId, double lat, double lng) async {
    await _dio.post('/live/location-update', data: {
      'pilot_id': pilotId,
      'lat': lat,
      'lng': lng,
    });
  }

  Future<List<LivePilot>> getLiveRadar(double lat, double lng) async {
    final r = await _dio.get('/live/radar', queryParameters: {
      'lat': lat,
      'lng': lng,
    });
    if (r.data is! List) return const [];
    return (r.data as List)
        .whereType<Map>()
        .map((item) => LivePilot.fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }

  Future<void> requestIntercept(String riderId, String pilotId) async {
    await _dio.post('/live/request', data: {
      'rider_id': riderId,
      'pilot_id': pilotId,
    });
  }

  Future<void> acceptIntercept(String pilotId, String riderId) async {
    await _dio.post('/live/accept', data: {
      'pilot_id': pilotId,
      'rider_id': riderId,
    });
  }
}
