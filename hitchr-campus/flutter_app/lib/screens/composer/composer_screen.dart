import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart' as geo;
import 'package:flutter_map/flutter_map.dart' as fm;
import 'package:latlong2/latlong.dart' as latlng;
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';
import '../../theme/hitchr_theme.dart';
import '../../map/hitchr_map_widget.dart';
import '../../map/map_controller.dart';
import '../../providers/app_provider.dart';
import '../../widgets/hitchr_widgets.dart';

enum ComposerMode { live, plan, memory }

class ComposerScreen extends ConsumerStatefulWidget {
  const ComposerScreen({super.key});
  @override
  ConsumerState<ComposerScreen> createState() => _ComposerScreenState();
}

class _ComposerScreenState extends ConsumerState<ComposerScreen> {
  ComposerMode _mode = ComposerMode.live;
  final _fromNameController = TextEditingController();
  final _toNameController = TextEditingController();
  final _noteController = TextEditingController();
  final _storyController = TextEditingController();
  int _seats = 3;
  double _distanceKm = 5.0;
  int _durationMins = 15;
  bool _loading = false;
  geo.Position? _currentPosition;
  Timer? _autocompleteDebounce;
  Map<String, dynamic>? _fromSelectedWaypoint;
  Map<String, dynamic>? _toSelectedWaypoint;

  static const _kMapboxToken = String.fromEnvironment(
    'MAPBOX_ACCESS_TOKEN',
    defaultValue: '',
  );

  @override
  void dispose() {
    _fromNameController.dispose();
    _toNameController.dispose();
    _noteController.dispose();
    _storyController.dispose();
    _autocompleteDebounce?.cancel();
    super.dispose();
  }

  Future<List<_PlaceSuggestion>> _fetchAutocomplete(String query) async {
    if (query.trim().length < 3) return [];

    if (_kMapboxToken.isEmpty) {
      try {
        final response = await Dio().get(
          'https://nominatim.openstreetmap.org/search',
          queryParameters: {
            'q': query.trim(),
            'format': 'jsonv2',
            'addressdetails': 1,
            'limit': 8,
            'countrycodes': 'in',
            'viewbox': '77.90,30.47,78.30,30.20',
            'bounded': 0,
          },
          options: Options(
            headers: const {
              'User-Agent': 'hitchr-campus/1.0 (mobile-app)',
              'Accept-Language': 'en',
            },
          ),
        );
        final rows = response.data is List ? response.data as List : const [];
        return rows
            .whereType<Map>()
            .map((row) => Map<String, dynamic>.from(row))
            .take(8)
            .map(
              (row) => _PlaceSuggestion(
                name: (row['name']?.toString().trim().isNotEmpty == true
                    ? row['name'].toString().trim()
                    : (row['display_name']
                              ?.toString()
                              .split(',')
                              .first
                              .trim() ??
                          query.trim())),
                address: row['display_name']?.toString() ?? query.trim(),
                lat: double.tryParse(row['lat']?.toString() ?? '') ?? 0,
                lng: double.tryParse(row['lon']?.toString() ?? '') ?? 0,
              ),
            )
            .where((s) => s.lat != 0 && s.lng != 0)
            .toList();
      } catch (e) {
        debugPrint('[Autocomplete nominatim] error=$e');
        return [];
      }
    }

    const dehradunBbox = '77.90,30.20,78.30,30.47';
    final proximity = await _ensureCurrentPosition();
    final baseParams = <String, dynamic>{
      'access_token': _kMapboxToken,
      'autocomplete': 'true',
      'country': 'IN',
      'bbox': dehradunBbox,
      'limit': 8,
      'language': 'en',
    };
    if (proximity != null) {
      baseParams['proximity'] = '${proximity.longitude},${proximity.latitude}';
    }

    try {
      final response = await Dio().get(
        'https://api.mapbox.com/search/geocode/v6/forward',
        queryParameters: {
          ...baseParams,
          // Requested set (can return 422 on some v6 configs/accounts due "poi").
          'types': 'poi,place,locality,neighborhood,address',
          'q': query.trim(),
        },
      );
      debugPrint('[Autocomplete v6] response(primary)=${response.data}');
      final features = response.data['features'] as List<dynamic>? ?? [];
      return _mapAutocompleteFeatures(features, query);
    } on DioException catch (e) {
      // Fallback for v6 422 due unsupported type filters; keep local ranking params.
      if (e.response?.statusCode == 422) {
        debugPrint(
          '[Autocomplete v6] 422 on primary request, retrying fallback. error=$e',
        );
        try {
          final fallback = await Dio().get(
            'https://api.mapbox.com/search/geocode/v6/forward',
            queryParameters: {
              ...baseParams,
              // v6-safe fallback types.
              'types': 'place,locality,neighborhood,address,street',
              // Bias toward education POIs via query semantics.
              'q': query.trim(),
            },
          );
          debugPrint('[Autocomplete v6] response(fallback)=${fallback.data}');
          final features = fallback.data['features'] as List<dynamic>? ?? [];
          return _mapAutocompleteFeatures(features, query);
        } catch (e2) {
          debugPrint('[Autocomplete v6] fallback error=$e2');
          return [];
        }
      }
      debugPrint('[Autocomplete v6] error=$e');
      return [];
    } catch (e) {
      debugPrint('[Autocomplete v6] unknown error=$e');
      return [];
    }
  }

  List<_PlaceSuggestion> _mapAutocompleteFeatures(
    List<dynamic> features,
    String query,
  ) {
    return features.map((feature) {
      final properties =
          feature['properties'] as Map<String, dynamic>? ?? const {};
      final geometry = feature['geometry'] as Map<String, dynamic>? ?? const {};
      final coordinates =
          geometry['coordinates'] as List<dynamic>? ??
          feature['center'] as List<dynamic>? ??
          [0, 0];
      return _PlaceSuggestion(
        name:
            properties['name_preferred']?.toString() ??
            properties['name']?.toString() ??
            feature['name']?.toString() ??
            feature['text']?.toString() ??
            query,
        address:
            properties['full_address']?.toString() ??
            feature['place_name']?.toString() ??
            feature['place_formatted']?.toString() ??
            query,
        lat: coordinates.length > 1 ? (coordinates[1] as num).toDouble() : 0,
        lng: coordinates.isNotEmpty ? (coordinates[0] as num).toDouble() : 0,
      );
    }).toList();
  }

  Future<_PlaceSuggestion?> _openAutocompletePicker({
    required bool isFrom,
  }) async {
    final initialQuery = isFrom
        ? _fromNameController.text.trim()
        : _toNameController.text.trim();

    final queryController = TextEditingController(text: initialQuery);
    final suggestions = <_PlaceSuggestion>[];
    bool loading = false;
    bool seededSearch = false;

    final selected = await showModalBottomSheet<_PlaceSuggestion>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            Future<void> search(String value) async {
              _autocompleteDebounce?.cancel();
              _autocompleteDebounce = Timer(
                const Duration(milliseconds: 300),
                () async {
                  if (!sheetContext.mounted || !context.mounted) return;
                  setModalState(() => loading = true);
                  final results = await _fetchAutocomplete(value);
                  if (!sheetContext.mounted || !context.mounted) return;
                  setModalState(() {
                    suggestions
                      ..clear()
                      ..addAll(results);
                    loading = false;
                  });
                },
              );
            }

            if (!seededSearch &&
                suggestions.isEmpty &&
                initialQuery.length >= 3 &&
                !loading) {
              seededSearch = true;
              WidgetsBinding.instance.addPostFrameCallback((_) {
                if (!sheetContext.mounted || !context.mounted) return;
                search(initialQuery);
              });
            }

            return Padding(
              padding: EdgeInsets.only(
                left: HSpacing.md,
                right: HSpacing.md,
                top: HSpacing.md,
                bottom: MediaQuery.of(context).viewInsets.bottom + HSpacing.md,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: queryController,
                    autofocus: true,
                    decoration: InputDecoration(
                      hintText: isFrom
                          ? 'Search pickup/origin'
                          : 'Search dropoff/destination',
                      prefixIcon: const Icon(Icons.search_rounded),
                    ),
                    onChanged: search,
                  ),
                  const SizedBox(height: HSpacing.sm),
                  if (loading)
                    const Padding(
                      padding: EdgeInsets.all(HSpacing.md),
                      child: CircularProgressIndicator(color: HColors.coral500),
                    )
                  else
                    ConstrainedBox(
                      constraints: const BoxConstraints(maxHeight: 320),
                      child: ListView.separated(
                        shrinkWrap: true,
                        itemCount: suggestions.length,
                        separatorBuilder: (context, index) =>
                            const Divider(height: 1, color: HColors.gray200),
                        itemBuilder: (context, index) {
                          final item = suggestions[index];
                          return ListTile(
                            leading: const Icon(
                              Icons.location_on_rounded,
                              color: HColors.coral500,
                            ),
                            title: Text(item.name),
                            subtitle: Text(
                              item.address,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            onTap: () {
                              _autocompleteDebounce?.cancel();
                              Navigator.pop(sheetContext, item);
                            },
                          );
                        },
                      ),
                    ),
                  if (!loading && suggestions.isEmpty)
                    const Padding(
                      padding: EdgeInsets.all(HSpacing.md),
                      child: Text(
                        'Type at least 3 characters to get suggestions.',
                        style: TextStyle(color: HColors.gray500),
                      ),
                    ),
                ],
              ),
            );
          },
        );
      },
    );

    _autocompleteDebounce?.cancel();
    // Avoid disposing immediately here; the bottom sheet transition can still
    // reference the controller during teardown on some devices.
    return selected;
  }

  Future<_PlaceSuggestion?> _openMapPinPicker({required bool isFrom}) async {
    final current = await _ensureCurrentPosition();
    if (!mounted) return null;
    if (current == null) {
      _showSnack(
        'Location is required to pin on map. Enable GPS and try again.',
      );
      return null;
    }
    final fallbackCenter = Position(current.longitude, current.latitude);
    final fallbackLatLng = latlng.LatLng(current.latitude, current.longitude);

    MapController? mapController;
    final fallbackMapController = fm.MapController();
    latlng.LatLng selectedFallbackCenter = fallbackLatLng;
    Timer? reverseGeocodeDebounce;
    String label = 'Move map and confirm this pin';
    bool resolvingLabel = false;

    Future<void> updateLabelFromLatLng(
      double lat,
      double lng,
      void Function(void Function()) setModalState,
    ) async {
      setModalState(() => resolvingLabel = true);
      try {
        final marks = await placemarkFromCoordinates(lat, lng);
        if (marks.isNotEmpty && mounted) {
          final p = marks.first;
          final text = [
            if ((p.street ?? '').isNotEmpty) p.street,
            if ((p.locality ?? '').isNotEmpty) p.locality,
            if ((p.administrativeArea ?? '').isNotEmpty) p.administrativeArea,
          ].join(', ');
          setModalState(() {
            label = text.isNotEmpty ? text : label;
            resolvingLabel = false;
          });
          return;
        }
      } catch (_) {}
      setModalState(() => resolvingLabel = false);
    }

    final picked = await showModalBottomSheet<_PlaceSuggestion>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            Future<void> updateLabelFromCenter() async {
              final state = await mapController?.getCameraState();
              if (state == null) return;
              final center = state.center.coordinates;
              await updateLabelFromLatLng(
                center.lat.toDouble(),
                center.lng.toDouble(),
                setModalState,
              );
            }

            return SizedBox(
              height: MediaQuery.of(context).size.height * 0.82,
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.all(HSpacing.md),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            isFrom
                                ? 'Pick origin on map'
                                : 'Pick destination on map',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        IconButton(
                          onPressed: () => Navigator.pop(sheetContext),
                          icon: const Icon(Icons.close_rounded),
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        _kMapboxToken.isNotEmpty
                            ? HitchrMapWidget(
                                baseStyle: MapBaseStyle.streets,
                                cameraOptions: CameraOptions(
                                  center: Point(coordinates: fallbackCenter),
                                  zoom: 15.5,
                                ),
                                onControllerReady: (c) => mapController = c,
                                onMapIdleListener: (_) =>
                                    updateLabelFromCenter(),
                              )
                            : fm.FlutterMap(
                                mapController: fallbackMapController,
                                options: fm.MapOptions(
                                  initialCenter: fallbackLatLng,
                                  initialZoom: 15.5,
                                  interactionOptions:
                                      const fm.InteractionOptions(
                                        flags: fm.InteractiveFlag.all,
                                      ),
                                  onPositionChanged: (camera, hasGesture) {
                                    selectedFallbackCenter = camera.center;
                                    if (!hasGesture) return;
                                    reverseGeocodeDebounce?.cancel();
                                    reverseGeocodeDebounce = Timer(
                                      const Duration(milliseconds: 350),
                                      () {
                                        updateLabelFromLatLng(
                                          selectedFallbackCenter.latitude,
                                          selectedFallbackCenter.longitude,
                                          setModalState,
                                        );
                                      },
                                    );
                                  },
                                ),
                                children: [
                                  fm.TileLayer(
                                    urlTemplate:
                                        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
                                    subdomains: const ['a', 'b', 'c', 'd'],
                                    userAgentPackageName: 'com.hitchr.campus',
                                    retinaMode: true,
                                  ),
                                ],
                              ),
                        const Icon(
                          Icons.location_on_rounded,
                          color: HColors.coral500,
                          size: 50,
                        ),
                        if (_kMapboxToken.isEmpty)
                          Positioned(
                            right: 12,
                            bottom: 12,
                            child: Column(
                              children: [
                                FloatingActionButton.small(
                                  heroTag: 'picker-zoom-in',
                                  backgroundColor: HColors.white,
                                  foregroundColor: HColors.gray800,
                                  onPressed: () {
                                    final currentZoom =
                                        fallbackMapController.camera.zoom;
                                    fallbackMapController.move(
                                      selectedFallbackCenter,
                                      (currentZoom + 1).clamp(3, 19),
                                    );
                                  },
                                  child: const Icon(Icons.add_rounded),
                                ),
                                const SizedBox(height: 8),
                                FloatingActionButton.small(
                                  heroTag: 'picker-zoom-out',
                                  backgroundColor: HColors.white,
                                  foregroundColor: HColors.gray800,
                                  onPressed: () {
                                    final currentZoom =
                                        fallbackMapController.camera.zoom;
                                    fallbackMapController.move(
                                      selectedFallbackCenter,
                                      (currentZoom - 1).clamp(3, 19),
                                    );
                                  },
                                  child: const Icon(Icons.remove_rounded),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(HSpacing.md),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const Text(
                          'Drag map to refine your exact pin',
                          style: TextStyle(
                            color: HColors.gray500,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          resolvingLabel ? 'Searching nearby...' : label,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(color: HColors.gray600),
                        ),
                        const SizedBox(height: HSpacing.sm),
                        HButton(
                          label: 'Confirm Pin',
                          width: double.infinity,
                          onPressed: () async {
                            if (!sheetContext.mounted) return;
                            double lat;
                            double lng;
                            if (_kMapboxToken.isNotEmpty) {
                              final state = await mapController
                                  ?.getCameraState();
                              if (!sheetContext.mounted) return;
                              if (state == null) return;
                              lat = state.center.coordinates.lat.toDouble();
                              lng = state.center.coordinates.lng.toDouble();
                            } else {
                              lat = selectedFallbackCenter.latitude;
                              lng = selectedFallbackCenter.longitude;
                            }
                            Navigator.pop(
                              sheetContext,
                              _PlaceSuggestion(
                                name: _extractPrimaryName(label),
                                address: label,
                                lat: lat,
                                lng: lng,
                              ),
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
    reverseGeocodeDebounce?.cancel();
    return picked;
  }

  String _extractPrimaryName(String label) {
    final cleaned = label.trim();
    if (cleaned.isEmpty) return 'Pinned Location';
    final first = cleaned.split(',').first.trim();
    return first.isNotEmpty ? first : cleaned;
  }

  Future<_PlaceSuggestion?> _reverseGeocodePoint(double lat, double lng) async {
    try {
      final marks = await placemarkFromCoordinates(lat, lng);
      if (marks.isEmpty) return null;
      final p = marks.first;
      final parts = <String>[
        if ((p.street ?? '').trim().isNotEmpty) p.street!.trim(),
        if ((p.subLocality ?? '').trim().isNotEmpty) p.subLocality!.trim(),
        if ((p.locality ?? '').trim().isNotEmpty) p.locality!.trim(),
        if ((p.administrativeArea ?? '').trim().isNotEmpty)
          p.administrativeArea!.trim(),
      ];
      final address = parts.join(', ');
      return _PlaceSuggestion(
        name: _extractPrimaryName(address),
        address: address.isNotEmpty ? address : 'Current Location',
        lat: lat,
        lng: lng,
      );
    } catch (_) {
      return null;
    }
  }

  Future<geo.Position?> _ensureCurrentPosition() async {
    if (_currentPosition != null) return _currentPosition;

    final enabled = await geo.Geolocator.isLocationServiceEnabled();
    if (!enabled) {
      _showSnack('Location is off. Turn it on to use real route points.');
      return null;
    }

    var permission = await geo.Geolocator.checkPermission();
    if (permission == geo.LocationPermission.denied) {
      permission = await geo.Geolocator.requestPermission();
    }
    if (permission == geo.LocationPermission.denied ||
        permission == geo.LocationPermission.deniedForever) {
      _showSnack('Location permission is required for real routes.');
      return null;
    }

    try {
      _currentPosition = await geo.Geolocator.getCurrentPosition(
        locationSettings: const geo.LocationSettings(
          accuracy: geo.LocationAccuracy.high,
        ),
      );
      return _currentPosition;
    } catch (_) {
      _showSnack('Could not fetch your location right now.');
      return null;
    }
  }

  Future<Map<String, dynamic>?> _resolveWaypoint({
    required String query,
    required bool isFrom,
  }) async {
    final normalized = query.trim();

    // For origin: if user wants "Current Location", use device GPS directly.
    if (isFrom && normalized.toLowerCase() == 'current location') {
      final pos = await _ensureCurrentPosition();
      if (pos == null) return null;
      final resolved = await _reverseGeocodePoint(pos.latitude, pos.longitude);
      return {
        'lat': pos.latitude,
        'lng': pos.longitude,
        'name': resolved?.name ?? 'Current Location',
        'address': resolved?.address ?? 'Current Location',
      };
    }

    // Try geocoding typed place/address.
    try {
      final results = await locationFromAddress(normalized);
      if (results.isNotEmpty) {
        final first = results.first;
        return {
          'lat': first.latitude,
          'lng': first.longitude,
          'name': normalized,
          'address': normalized,
        };
      }
    } catch (_) {
      // Continue to GPS fallback for origin only.
    }

    // Fallback: allow origin to use current GPS if geocoding failed.
    if (isFrom) {
      final pos = await _ensureCurrentPosition();
      if (pos != null) {
        final resolved = await _reverseGeocodePoint(pos.latitude, pos.longitude);
        return {
          'lat': pos.latitude,
          'lng': pos.longitude,
          'name': normalized.isNotEmpty
              ? normalized
              : (resolved?.name ?? 'Current Location'),
          'address': normalized.isNotEmpty
              ? normalized
              : (resolved?.address ?? 'Current Location'),
        };
      }
    }

    _showSnack('Could not resolve "$normalized". Try a clearer place.');
    return null;
  }

  Future<Map<String, dynamic>?> _fetchRoadRouteMetrics(
    Map<String, dynamic> fromPoint,
    Map<String, dynamic> toPoint,
  ) async {
    Map<String, dynamic>? mapRoute(dynamic data) {
      final routes = data is Map<String, dynamic>
          ? (data['routes'] as List<dynamic>? ?? [])
          : const <dynamic>[];
      if (routes.isEmpty) return null;
      final route = routes.first as Map<String, dynamic>;
      final distanceMeters = (route['distance'] as num?)?.toDouble();
      final durationSecs = (route['duration'] as num?)?.toDouble();
      if (distanceMeters == null || durationSecs == null) return null;
      return {
        'distance_km': (distanceMeters / 1000.0).clamp(0.1, 1000).toDouble(),
        'duration_mins': (durationSecs / 60.0).clamp(3, 240).round(),
      };
    }

    if (_kMapboxToken.isNotEmpty) {
      final url =
          'https://api.mapbox.com/directions/v5/mapbox/driving/${fromPoint['lng']},${fromPoint['lat']};${toPoint['lng']},${toPoint['lat']}';
      try {
        final response = await Dio().get(
          url,
          queryParameters: {
            'geometries': 'geojson',
            'overview': 'full',
            'steps': false,
            'access_token': _kMapboxToken,
          },
        );
        final mapped = mapRoute(response.data);
        if (mapped != null) return mapped;
      } catch (e) {
        debugPrint('[Directions mapbox] error=$e');
      }
    }

    try {
      final osrmUrl =
          'https://router.project-osrm.org/route/v1/driving/${fromPoint['lng']},${fromPoint['lat']};${toPoint['lng']},${toPoint['lat']}';
      final response = await Dio().get(
        osrmUrl,
        queryParameters: {
          'overview': 'full',
          'geometries': 'geojson',
          'alternatives': false,
          'steps': false,
        },
      );
      final mapped = mapRoute(response.data);
      if (mapped != null) return mapped;
    } catch (e) {
      debugPrint('[Directions osrm] error=$e');
    }

    return null;
  }

  Future<void> _updateDistanceAndDuration(
    Map<String, dynamic> fromPoint,
    Map<String, dynamic> toPoint,
  ) async {
    final routed = await _fetchRoadRouteMetrics(fromPoint, toPoint);
    if (routed != null) {
      _distanceKm = routed['distance_km'] as double;
      _durationMins = routed['duration_mins'] as int;
      return;
    }

    final meters = geo.Geolocator.distanceBetween(
      (fromPoint['lat'] as num).toDouble(),
      (fromPoint['lng'] as num).toDouble(),
      (toPoint['lat'] as num).toDouble(),
      (toPoint['lng'] as num).toDouble(),
    );
    final km = meters / 1000.0;
    _distanceKm = km.clamp(0.1, 1000).toDouble();
    // Basic ETA assumption for city movement (avg 22 km/h).
    _durationMins = ((_distanceKm / 22.0) * 60).clamp(3, 240).round();
  }

  Future<void> _submit() async {
    final user = ref.read(userProvider);
    if (user == null) return;

    final fromName = _fromNameController.text.trim();
    final toName = _toNameController.text.trim();
    if (fromName.isEmpty || toName.isEmpty) {
      _showSnack('Please fill in both From and To');
      return;
    }

    setState(() => _loading = true);
    final api = ref.read(apiProvider);

    try {
      final fromFinal =
          _fromSelectedWaypoint ??
          await _resolveWaypoint(query: fromName, isFrom: true);
      final toFinal =
          _toSelectedWaypoint ??
          await _resolveWaypoint(query: toName, isFrom: false);
      if (fromFinal == null || toFinal == null) {
        setState(() => _loading = false);
        return;
      }

      await _updateDistanceAndDuration(fromFinal, toFinal);

      switch (_mode) {
        case ComposerMode.live:
          if (user.role != 'pilot') {
            HapticFeedback.vibrate();
            _showSnack('Switch to Pilot mode in your profile first');
            setState(() => _loading = false);
            return;
          }
          await api.createRoute({
            'pilot_id': user.id,
            'pilot_name': user.name,
            'pilot_college': user.college,
            'from_point': fromFinal,
            'to_point': toFinal,
            'departure_time': DateTime.now()
                .add(const Duration(minutes: 10))
                .toIso8601String(),
            'time_window_mins': 15,
            'seats_available': _seats,
            'distance_km': _distanceKm,
            'duration_mins': _durationMins,
            'note': _noteController.text.trim().isEmpty
                ? null
                : _noteController.text.trim(),
          });
          // Live route should immediately appear on radar; ensure live tracking
          // starts from the same flow instead of relying on a separate toggle.
          await ref
              .read(pilotLiveProvider.notifier)
              .enable(user.id, seats: _seats);
          HapticFeedback.heavyImpact();
          _showSnack('Route is live! Riders can find you now.');
          break;

        case ComposerMode.plan:
          await api.createPlannedTrip({
            'user_id': user.id,
            'user_name': user.name,
            'user_college': user.college,
            'from_point': fromFinal,
            'to_point': toFinal,
            'planned_date': DateTime.now()
                .add(const Duration(days: 2))
                .toIso8601String(),
            'seats_needed': _seats,
            'description': _noteController.text.trim().isEmpty
                ? null
                : _noteController.text.trim(),
          });
          HapticFeedback.heavyImpact();
          _showSnack('Trip planned! Others can match with you.');
          break;

        case ComposerMode.memory:
          await api.createMemory({
            'user_id': user.id,
            'user_name': user.name,
            'user_college': user.college,
            'from_point': fromFinal,
            'to_point': toFinal,
            'story': _storyController.text.trim(),
            'tags': _noteController.text
                .trim()
                .split(',')
                .map((t) => t.trim())
                .where((t) => t.isNotEmpty)
                .toList(),
            'distance_km': _distanceKm,
          });
          HapticFeedback.heavyImpact();
          _showSnack('Memory shared! Your story inspires the campus.');
          break;
      }
      if (mounted) context.pop();
    } catch (e) {
      HapticFeedback.vibrate();
      _showSnack('Failed: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showSnack(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(HRadius.md),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(userProvider);
    return Scaffold(
      backgroundColor: HColors.gray100,
      appBar: AppBar(
        title: const Text('New Post'),
        leading: IconButton(
          icon: const Icon(Icons.close_rounded),
          onPressed: () => context.pop(),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: HSpacing.sm),
            child: HButton(
              label: 'Post',
              onPressed: _submit,
              loading: _loading,
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(HSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Mode selector
            Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: HColors.white,
                borderRadius: BorderRadius.circular(HRadius.lg),
                border: Border.all(color: HColors.gray200),
              ),
              child: Row(
                children: ComposerMode.values.map((m) {
                  final sel = _mode == m;
                  final labels = {
                    ComposerMode.live: ('Live Now', Icons.bolt_rounded),
                    ComposerMode.plan: (
                      'Plan Trip',
                      Icons.calendar_today_rounded,
                    ),
                    ComposerMode.memory: ('Memory', Icons.auto_stories_rounded),
                  };
                  return Expanded(
                    child: GestureDetector(
                      onTap: () {
                        HapticFeedback.selectionClick();
                        setState(() => _mode = m);
                      },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: sel ? HColors.coral500 : Colors.transparent,
                          borderRadius: BorderRadius.circular(HRadius.md),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              labels[m]!.$2,
                              size: 16,
                              color: sel ? HColors.white : HColors.gray500,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              labels[m]!.$1,
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: sel ? HColors.white : HColors.gray500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: HSpacing.lg),

            // Pilot warning
            if (_mode == ComposerMode.live && user?.role != 'pilot')
              Container(
                padding: const EdgeInsets.all(HSpacing.md),
                margin: const EdgeInsets.only(bottom: HSpacing.md),
                decoration: BoxDecoration(
                  color: HColors.warning.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(HRadius.md),
                  border: Border.all(
                    color: HColors.warning.withValues(alpha: 0.3),
                  ),
                ),
                child: const Row(
                  children: [
                    Icon(
                      Icons.info_outline_rounded,
                      color: HColors.warning,
                      size: 20,
                    ),
                    SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Switch to Pilot mode in your profile to post live routes.',
                        style: TextStyle(fontSize: 13, color: HColors.gray700),
                      ),
                    ),
                  ],
                ),
              ),

            // From
            _buildField(
              'From',
              _fromNameController,
              Icons.trip_origin_rounded,
              'Search pickup/origin',
              onChanged: (_) => _fromSelectedWaypoint = null,
            ),
            const SizedBox(height: HSpacing.xs),
            Align(
              alignment: Alignment.centerLeft,
              child: TextButton.icon(
                onPressed: () async {
                  final pos = await _ensureCurrentPosition();
                  if (pos == null) return;
                  final resolved = await _reverseGeocodePoint(
                    pos.latitude,
                    pos.longitude,
                  );
                  if (!mounted) return;
                  setState(() {
                    _fromNameController.text =
                        resolved?.address ?? 'Current Location';
                    _fromSelectedWaypoint = {
                      'lat': pos.latitude,
                      'lng': pos.longitude,
                      'name': resolved?.name ?? 'Current Location',
                      'address': resolved?.address ?? 'Current Location',
                    };
                  });
                },
                icon: const Icon(Icons.my_location_rounded, size: 16),
                label: const Text('Use current location'),
              ),
            ),
            const SizedBox(height: HSpacing.xs),
            Row(
              children: [
                TextButton.icon(
                  onPressed: () async {
                    final picked = await _openAutocompletePicker(isFrom: true);
                    if (picked == null || !mounted) return;
                    setState(() {
                      _fromNameController.text = picked.address;
                      _fromSelectedWaypoint = picked.toWaypointJson();
                    });
                  },
                  icon: const Icon(Icons.search_rounded, size: 16),
                  label: const Text('Autocomplete'),
                ),
                TextButton.icon(
                  onPressed: () async {
                    final picked = await _openMapPinPicker(isFrom: true);
                    if (picked == null || !mounted) return;
                    setState(() {
                      _fromNameController.text = picked.address;
                      _fromSelectedWaypoint = picked.toWaypointJson();
                    });
                  },
                  icon: const Icon(Icons.map_rounded, size: 16),
                  label: const Text('Pick on map'),
                ),
              ],
            ),
            const SizedBox(height: HSpacing.md),
            // To
            _buildField(
              'To',
              _toNameController,
              Icons.flag_rounded,
              'Search dropoff/destination',
              onChanged: (_) => _toSelectedWaypoint = null,
            ),
            const SizedBox(height: HSpacing.xs),
            Row(
              children: [
                TextButton.icon(
                  onPressed: () async {
                    final picked = await _openAutocompletePicker(isFrom: false);
                    if (picked == null || !mounted) return;
                    setState(() {
                      _toNameController.text = picked.address;
                      _toSelectedWaypoint = picked.toWaypointJson();
                    });
                  },
                  icon: const Icon(Icons.search_rounded, size: 16),
                  label: const Text('Autocomplete'),
                ),
                TextButton.icon(
                  onPressed: () async {
                    final picked = await _openMapPinPicker(isFrom: false);
                    if (picked == null || !mounted) return;
                    setState(() {
                      _toNameController.text = picked.address;
                      _toSelectedWaypoint = picked.toWaypointJson();
                    });
                  },
                  icon: const Icon(Icons.map_rounded, size: 16),
                  label: const Text('Pick on map'),
                ),
              ],
            ),

            // Memory: story
            if (_mode == ComposerMode.memory) ...[
              const SizedBox(height: HSpacing.md),
              const Text(
                'Your Story',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: HColors.gray700,
                ),
              ),
              const SizedBox(height: 6),
              TextField(
                controller: _storyController,
                maxLines: 5,
                decoration: const InputDecoration(
                  hintText: 'Share your journey story...',
                ),
              ),
            ],

            // Seats (live & plan)
            if (_mode != ComposerMode.memory) ...[
              const SizedBox(height: HSpacing.lg),
              const Text(
                'Seats Available',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: HColors.gray700,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: List.generate(5, (i) {
                  final n = i + 1;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: GestureDetector(
                      onTap: () {
                        HapticFeedback.selectionClick();
                        setState(() => _seats = n);
                      },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 150),
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: _seats == n ? HColors.coral500 : HColors.white,
                          borderRadius: BorderRadius.circular(HRadius.md),
                          border: Border.all(
                            color: _seats == n
                                ? HColors.coral500
                                : HColors.gray200,
                          ),
                        ),
                        child: Center(
                          child: Text(
                            '$n',
                            style: TextStyle(
                              fontWeight: FontWeight.w700,
                              color: _seats == n
                                  ? HColors.white
                                  : HColors.gray700,
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                }),
              ),
            ],

            // Note / tags
            const SizedBox(height: HSpacing.md),
            _buildField(
              _mode == ComposerMode.memory
                  ? 'Tags (comma separated)'
                  : 'Note (optional)',
              _noteController,
              _mode == ComposerMode.memory
                  ? Icons.tag_rounded
                  : Icons.edit_note_rounded,
              _mode == ComposerMode.memory
                  ? 'fun, late-night, campus'
                  : 'e.g. Taking highway, have AC',
            ),
            const SizedBox(height: HSpacing.xxl),
          ],
        ),
      ),
    );
  }

  Widget _buildField(
    String label,
    TextEditingController controller,
    IconData icon,
    String hint, {
    ValueChanged<String>? onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: HColors.gray700,
          ),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          onChanged: onChanged,
          decoration: InputDecoration(
            hintText: hint,
            prefixIcon: Icon(icon, color: HColors.gray400, size: 20),
          ),
        ),
      ],
    );
  }
}

class _PlaceSuggestion {
  final String name;
  final String address;
  final double lat;
  final double lng;

  const _PlaceSuggestion({
    required this.name,
    required this.address,
    required this.lat,
    required this.lng,
  });

  Map<String, dynamic> toWaypointJson() => {
    'lat': lat,
    'lng': lng,
    'name': name,
    'address': address,
  };
}
