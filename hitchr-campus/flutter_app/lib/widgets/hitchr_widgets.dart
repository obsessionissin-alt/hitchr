import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:ui' as ui;
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_map/flutter_map.dart' as fm;
import 'package:geolocator/geolocator.dart' as geo;
import 'package:latlong2/latlong.dart' as latlng;
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';
import '../models/live_pilot.dart';
import '../models/route_model.dart';
import '../theme/hitchr_theme.dart';
import '../models/waypoint.dart';
import '../providers/app_provider.dart';
import '../map/hitchr_map_widget.dart';
import '../map/map_controller.dart';

Future<void> _agentDebugLog({
  required String runId,
  required String hypothesisId,
  required String location,
  required String message,
  required Map<String, dynamic> data,
}) async {
  try {
    final payload = {
      'id': 'log_${DateTime.now().millisecondsSinceEpoch}_${hypothesisId}',
      'timestamp': DateTime.now().millisecondsSinceEpoch,
      'runId': runId,
      'hypothesisId': hypothesisId,
      'location': location,
      'message': message,
      'data': data,
    };
    await File('/home/internt-zato/Documents/hitchr/.cursor/debug.log')
        .writeAsString('${jsonEncode(payload)}\n', mode: FileMode.append);
  } catch (_) {}
}

/// Hitchr primary button
class HButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool loading;
  final bool outlined;
  final IconData? icon;
  final Color? color;
  final double? width;

  const HButton({
    super.key,
    required this.label,
    this.onPressed,
    this.loading = false,
    this.outlined = false,
    this.icon,
    this.color,
    this.width,
  });

  @override
  Widget build(BuildContext context) {
    final bg = color ?? HColors.coral500;
    return SizedBox(
      width: width,
      height: 52,
      child: outlined
          ? OutlinedButton(
              onPressed: loading
                  ? null
                  : () {
                      HapticFeedback.mediumImpact();
                      onPressed?.call();
                    },
              style: OutlinedButton.styleFrom(
                side: BorderSide(color: bg, width: 1.5),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(HRadius.lg),
                ),
              ),
              child: _content(bg),
            )
          : ElevatedButton(
              onPressed: loading
                  ? null
                  : () {
                      HapticFeedback.mediumImpact();
                      onPressed?.call();
                    },
              style: ElevatedButton.styleFrom(
                backgroundColor: bg,
                foregroundColor: HColors.white,
                disabledBackgroundColor: HColors.gray200,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(HRadius.lg),
                ),
              ),
              child: _content(HColors.white),
            ),
    );
  }

  Widget _content(Color fg) {
    if (loading) {
      return SizedBox(
        width: 22,
        height: 22,
        child: CircularProgressIndicator(strokeWidth: 2, color: fg),
      );
    }
    if (icon != null) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 20, color: outlined ? fg : null),
          const SizedBox(width: 8),
          Text(
            label,
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 15,
              color: outlined ? fg : null,
            ),
          ),
        ],
      );
    }
    return Text(
      label,
      style: TextStyle(
        fontWeight: FontWeight.w700,
        fontSize: 15,
        color: outlined ? fg : null,
      ),
    );
  }
}

/// Hitchr card wrapper
class HCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final VoidCallback? onTap;
  final Color? color;

  const HCard({
    super.key,
    required this.child,
    this.padding,
    this.onTap,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap != null
          ? () {
              HapticFeedback.selectionClick();
              onTap!();
            }
          : null,
      child: Container(
        padding: padding ?? const EdgeInsets.all(HSpacing.md),
        decoration: BoxDecoration(
          color: color ?? HColors.white,
          borderRadius: BorderRadius.circular(HRadius.lg),
          border: Border.all(color: HColors.gray200),
          boxShadow: HShadows.card,
        ),
        child: child,
      ),
    );
  }
}

/// Chip / tag
class HChip extends StatelessWidget {
  final String label;
  final Color? color;
  final IconData? icon;
  final VoidCallback? onTap;
  final bool selected;

  const HChip({
    super.key,
    required this.label,
    this.color,
    this.icon,
    this.onTap,
    this.selected = false,
  });

  @override
  Widget build(BuildContext context) {
    final bg = selected ? (color ?? HColors.coral500) : HColors.gray100;
    final fg = selected ? HColors.white : HColors.gray700;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(HRadius.pill),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 14, color: fg),
              const SizedBox(width: 4),
            ],
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: fg,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Avatar circle
class HAvatar extends StatelessWidget {
  final String name;
  final double size;
  final String? imageUrl;

  const HAvatar({super.key, required this.name, this.size = 40, this.imageUrl});

  @override
  Widget build(BuildContext context) {
    final initials = name
        .split(' ')
        .take(2)
        .map((w) => w.isNotEmpty ? w[0].toUpperCase() : '')
        .join();
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: const LinearGradient(
          colors: [HColors.coral400, HColors.coral500],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Center(
        child: Text(
          initials,
          style: TextStyle(
            color: HColors.white,
            fontWeight: FontWeight.w700,
            fontSize: size * 0.36,
          ),
        ),
      ),
    );
  }
}

/// Search bar
class HSearchBar extends StatelessWidget {
  final String hint;
  final ValueChanged<String>? onChanged;
  final TextEditingController? controller;
  final VoidCallback? onTap;
  final bool readOnly;

  const HSearchBar({
    super.key,
    this.hint = 'Where are you headed?',
    this.onChanged,
    this.controller,
    this.onTap,
    this.readOnly = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 48,
      decoration: BoxDecoration(
        color: HColors.gray100,
        borderRadius: BorderRadius.circular(HRadius.xl),
        border: Border.all(color: HColors.gray200),
      ),
      child: TextField(
        controller: controller,
        onChanged: onChanged,
        onTap: onTap,
        readOnly: readOnly,
        decoration: InputDecoration(
          hintText: hint,
          prefixIcon: const Icon(
            Icons.search_rounded,
            color: HColors.gray400,
            size: 22,
          ),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(
            vertical: 12,
            horizontal: 16,
          ),
          hintStyle: const TextStyle(
            color: HColors.gray400,
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: HColors.gray900,
        ),
      ),
    );
  }
}

/// Section header
class HSectionHeader extends StatelessWidget {
  final String title;
  final String? action;
  final VoidCallback? onAction;

  const HSectionHeader({
    super.key,
    required this.title,
    this.action,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: HSpacing.md,
        vertical: HSpacing.sm,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: HColors.gray900,
            ),
          ),
          if (action != null)
            GestureDetector(
              onTap: onAction,
              child: Text(
                action!,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: HColors.coral500,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// Route card (compact feed version)
class RouteCard extends StatelessWidget {
  final String pilotName;
  final String origin;
  final String destination;
  final int seatsLeft;
  final String time;
  final VoidCallback? onTap;
  final String? note;

  const RouteCard({
    super.key,
    required this.pilotName,
    required this.origin,
    required this.destination,
    required this.seatsLeft,
    this.time = 'Now',
    this.onTap,
    this.note,
  });

  @override
  Widget build(BuildContext context) {
    return HCard(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              HAvatar(name: pilotName, size: 36),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      pilotName,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                        color: HColors.gray900,
                      ),
                    ),
                    Text(
                      time,
                      style: const TextStyle(
                        fontSize: 12,
                        color: HColors.gray500,
                      ),
                    ),
                  ],
                ),
              ),
              HChip(
                label: '$seatsLeft seats',
                color: seatsLeft > 0 ? HColors.trustGreen : HColors.gray400,
                selected: seatsLeft > 0,
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Route line
          Row(
            children: [
              Column(
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: HColors.coral500,
                    ),
                  ),
                  Container(width: 2, height: 28, color: HColors.gray200),
                  Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: HColors.trustBlue,
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      origin,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: HColors.gray800,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      destination,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: HColors.gray800,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (note != null && note!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              '"$note"',
              style: const TextStyle(
                fontSize: 12,
                fontStyle: FontStyle.italic,
                color: HColors.gray500,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// Whether Mapbox token was provided at compile time (via --dart-define)
const _kMapboxToken = String.fromEnvironment(
  'MAPBOX_ACCESS_TOKEN',
  defaultValue: '',
);
bool get hasMapboxToken => _kMapboxToken.isNotEmpty;

/// Mini map view with Mapbox integration and graceful fallback.
///
/// Shows a real Mapbox map when a token is available (via --dart-define),
/// otherwise renders a styled placeholder that doesn't break the feed.
class MiniMapView extends ConsumerStatefulWidget {
  final double height;
  final Waypoint? fromPoint;
  final Waypoint? toPoint;
  final bool showOnlyRadar;

  const MiniMapView({
    super.key,
    this.height = 160,
    this.fromPoint,
    this.toPoint,
    this.showOnlyRadar = false,
  });

  @override
  ConsumerState<MiniMapView> createState() => _MiniMapViewState();
}

class _MiniMapViewState extends ConsumerState<MiniMapView> {
  MapboxMap? _mapboxMap;
  MapController? _controller;
  PointAnnotationManager? _pointAnnotationManager;
  PointAnnotationManager? _livePilotManager;
  Cancelable? _livePilotTapEvents;
  final Map<String, PointAnnotation> _pilotAnnotations = {};
  final Map<String, LivePilot> _currentPilots = {};
  final Map<String, String> _annotationToPilotId = {};
  Timer? _radarTimer;
  StreamSubscription<geo.Position>? _positionStream;
  StreamSubscription<Map<String, dynamic>>? _notificationSub;
  geo.Position? _currentPosition;
  bool _didCenterOnFirstFix = false;
  latlng.LatLng? _fallbackCenter;
  bool _interceptLoading = false;
  bool _interceptSheetOpen = false;
  Uint8List? _routeFromIcon;
  Uint8List? _routeToIcon;
  Uint8List? _livePilotIcon;
  bool _useFallback = false;
  String? _routeGeoJson;
  DateTime? _lastRadarAt;
  List<latlng.LatLng> _fallbackRoutePoints = const [];
  String? _fallbackRouteKey;

  static const String _routeSourceId = 'trip-route-source';
  static const String _routeLayerId = 'trip-route-layer';
  static const String _busyCorridorSourceId = 'busy-corridor-source';
  static const String _busyCorridorLayerId = 'busy-corridor-layer';

  @override
  void initState() {
    super.initState();
    _startPositionStream();
    _startRadarPolling();
    _subscribeNotificationEvents();
    if (!widget.showOnlyRadar) {
      unawaited(_refreshFallbackRoutePolyline());
    }
  }

  @override
  void dispose() {
    _radarTimer?.cancel();
    _positionStream?.cancel();
    _notificationSub?.cancel();
    _livePilotTapEvents?.cancel();
    _pointAnnotationManager?.deleteAll();
    _livePilotManager?.deleteAll();
    super.dispose();
  }

  @override
  void didUpdateWidget(covariant MiniMapView oldWidget) {
    super.didUpdateWidget(oldWidget);
    final routeChanged =
        oldWidget.fromPoint?.lat != widget.fromPoint?.lat ||
        oldWidget.fromPoint?.lng != widget.fromPoint?.lng ||
        oldWidget.toPoint?.lat != widget.toPoint?.lat ||
        oldWidget.toPoint?.lng != widget.toPoint?.lng;
    final radarOnlyChanged = oldWidget.showOnlyRadar != widget.showOnlyRadar;
    if (routeChanged || radarOnlyChanged) {
      _routeGeoJson = null;
      _fallbackRouteKey = null;
      _fallbackRoutePoints = const [];
      _addMarkers();
      if (_controller != null) {
        _addRoadSnappedRouteLayer(_controller!);
      }
      if (!widget.showOnlyRadar) {
        unawaited(_refreshFallbackRoutePolyline());
      }
      _fitCamera();
    }
    if (_controller != null) {
      unawaited(_addBusyCorridorLayer(_controller!));
    }
  }

  @override
  Widget build(BuildContext context) {
    final routes = ref.watch(routesProvider);
    final updatedSecs = _lastRadarAt == null
        ? null
        : DateTime.now().difference(_lastRadarAt!).inSeconds;
    final busyCorridorLines = _computeBusyCorridorLines(routes);
    return Container(
      height: widget.height,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(HRadius.lg),
        border: Border.all(color: HColors.gray200),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(HRadius.lg),
        child: Stack(
          children: [
            Positioned.fill(
              child: hasMapboxToken && !_useFallback
                  ? HitchrMapWidget(
                      baseStyle: MapBaseStyle.streets,
                      onControllerReady: _onControllerReady,
                      onStyleLoaded: _onStyleLoaded,
                      onMapLoadError: _onMapLoadError,
                    )
                  : _buildFallback(),
            ),
            Positioned(top: 8, left: 8, child: _buildLiveHud(updatedSecs)),
            if (_lastRadarAt != null && _currentPilots.isEmpty)
              Positioned(
                bottom: 8,
                left: 8,
                right: 8,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.9),
                    borderRadius: BorderRadius.circular(HRadius.md),
                    border: Border.all(color: HColors.gray200),
                  ),
                  child: const Text(
                    'No live pilots nearby right now',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: HColors.gray700,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildLiveHud(int? updatedSecs) {
    final ageText = updatedSecs == null
        ? 'Updating...'
        : updatedSecs <= 1
        ? 'Updated just now'
        : 'Updated ${updatedSecs}s ago';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.92),
        borderRadius: BorderRadius.circular(HRadius.md),
        border: Border.all(color: HColors.gray200),
      ),
      child: Text(
        'Nearby pilots: ${_currentPilots.length} · $ageText',
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: HColors.gray700,
        ),
      ),
    );
  }

  /// Called if the map fails to load (bad token, no network, etc.)
  void _onMapLoadError(MapLoadingErrorEventData data) {
    debugPrint('[MiniMapView] Map load error: ${data.type} ${data.message}');
    if (mounted) setState(() => _useFallback = true);
  }

  Widget _buildFallback() {
    final routes = ref.watch(routesProvider);
    final busyCorridorLines = _computeBusyCorridorLines(routes);
    final center =
        _fallbackCenter ??
        (_currentPosition != null
            ? latlng.LatLng(
                _currentPosition!.latitude,
                _currentPosition!.longitude,
              )
            : widget.fromPoint != null
            ? latlng.LatLng(widget.fromPoint!.lat, widget.fromPoint!.lng)
            : widget.toPoint != null
            ? latlng.LatLng(widget.toPoint!.lat, widget.toPoint!.lng)
            : null);
    if (center == null) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            SizedBox(
              width: 22,
              height: 22,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: HColors.coral500,
              ),
            ),
            SizedBox(height: 8),
            Text(
              'Getting your location...',
              style: TextStyle(fontSize: 12, color: HColors.gray600),
            ),
          ],
        ),
      );
    }
    final markers = <fm.Marker>[
      if (!widget.showOnlyRadar && widget.fromPoint != null)
        fm.Marker(
          point: latlng.LatLng(widget.fromPoint!.lat, widget.fromPoint!.lng),
          width: 28,
          height: 28,
          child: const Icon(
            Icons.radio_button_checked,
            color: HColors.coral500,
            size: 24,
          ),
        ),
      if (!widget.showOnlyRadar && widget.toPoint != null)
        fm.Marker(
          point: latlng.LatLng(widget.toPoint!.lat, widget.toPoint!.lng),
          width: 28,
          height: 28,
          child: const Icon(
            Icons.radio_button_checked,
            color: HColors.trustBlue,
            size: 24,
          ),
        ),
      ..._currentPilots.values.map(
        (pilot) => fm.Marker(
          point: latlng.LatLng(pilot.lat, pilot.lng),
          width: 34,
          height: 34,
          child: GestureDetector(
            onTap: () => _openInterceptSheet(pilot),
            child: Container(
              decoration: BoxDecoration(
                color: HColors.trustGreen,
                shape: BoxShape.circle,
                border: Border.all(color: HColors.white, width: 2),
              ),
              child: Center(
                child: Text(
                  '${pilot.seats}',
                  style: const TextStyle(
                    color: HColors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    ];

    final routePolyline = _fallbackRoutePoints.length >= 2
        && !widget.showOnlyRadar
        ? fm.Polyline(
            points: _fallbackRoutePoints,
            color: HColors.coral500.withValues(alpha: 0.65),
            strokeWidth: 4,
          )
        : null;
    final busyCorridorPolylines = busyCorridorLines
        .map(
          (line) => fm.Polyline(
            points: [
              latlng.LatLng(line.from.lat, line.from.lng),
              latlng.LatLng(line.to.lat, line.to.lng),
            ],
            color: HColors.warning.withValues(alpha: 0.45),
            strokeWidth: 5.0 + line.weight * 0.8,
          ),
        )
        .toList();

    return fm.FlutterMap(
      options: fm.MapOptions(
        initialCenter: center,
        initialZoom: 14,
        interactionOptions: const fm.InteractionOptions(
          flags: fm.InteractiveFlag.all,
        ),
      ),
      children: [
        fm.TileLayer(
          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          userAgentPackageName: 'com.hitchr.campus',
        ),
        if (busyCorridorPolylines.isNotEmpty)
          fm.PolylineLayer(polylines: busyCorridorPolylines),
        if (routePolyline != null) fm.PolylineLayer(polylines: [routePolyline]),
        fm.MarkerLayer(markers: markers),
      ],
    );
  }

  Future<void> _refreshFallbackRoutePolyline() async {
    if (widget.showOnlyRadar) {
      if (!mounted) return;
      setState(() {
        _fallbackRouteKey = null;
        _fallbackRoutePoints = const [];
      });
      return;
    }
    if (widget.fromPoint == null || widget.toPoint == null) {
      if (!mounted) return;
      setState(() {
        _fallbackRouteKey = null;
        _fallbackRoutePoints = const [];
      });
      return;
    }

    final from = widget.fromPoint!;
    final to = widget.toPoint!;
    final key = '${from.lat},${from.lng}|${to.lat},${to.lng}';
    if (_fallbackRouteKey == key && _fallbackRoutePoints.isNotEmpty) return;

    try {
      final url =
          'https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}';
      final response = await Dio().get(
        url,
        queryParameters: {
          'overview': 'full',
          'geometries': 'geojson',
          'alternatives': false,
          'steps': false,
        },
      );
      final routes = response.data['routes'] as List<dynamic>? ?? [];
      if (routes.isEmpty) {
        if (!mounted) return;
        setState(() {
          _fallbackRouteKey = key;
          _fallbackRoutePoints = const [];
        });
        return;
      }

      final geometry = routes.first['geometry'] as Map<String, dynamic>?;
      final coords = geometry?['coordinates'] as List<dynamic>? ?? const [];
      final points = coords
          .whereType<List>()
          .where((c) => c.length >= 2)
          .map(
            (c) => latlng.LatLng(
              (c[1] as num).toDouble(),
              (c[0] as num).toDouble(),
            ),
          )
          .toList();
      if (!mounted) return;
      setState(() {
        _fallbackRouteKey = key;
        _fallbackRoutePoints = points;
      });
    } catch (e) {
      debugPrint('[MiniMapView] OSRM fallback route error: $e');
      if (!mounted) return;
      setState(() {
        _fallbackRouteKey = key;
        _fallbackRoutePoints = const [];
      });
    }
  }

  void _onControllerReady(MapController controller) {
    _controller = controller;
    _mapboxMap = controller.mapboxMap;
    debugPrint('[MiniMapView] Map created, adding markers + fitting camera');
    _addMarkers();
    _fitCameraOnceIfNeeded();
    _ensureLivePilotManager();
    unawaited(_addBusyCorridorLayer(controller));
  }

  /// Re-add corridor spine on every style load so it does not flicker.
  Future<void> _onStyleLoaded(MapController controller) async {
    // #region agent log
    unawaited(
      _agentDebugLog(
        runId: 'run-compile-investigation',
        hypothesisId: 'H4',
        location: 'hitchr_widgets.dart:_onStyleLoaded',
        message: 'Map style loaded callback',
        data: {
          'showOnlyRadar': widget.showOnlyRadar,
          'hasMapboxToken': hasMapboxToken,
        },
      ),
    );
    // #endregion
    await _addBusyCorridorLayer(controller);
    if (!widget.showOnlyRadar) {
      await _addRoadSnappedRouteLayer(controller);
    } else {
      await _clearRoadSnappedRouteLayer(controller);
    }
  }

  Future<void> _addBusyCorridorLayer(MapController controller) async {
    final routes = ref.read(routesProvider);
    final lines = _computeBusyCorridorLines(routes);
    final style = controller.mapboxMap.style;
    // #region agent log
    unawaited(
      _agentDebugLog(
        runId: 'run-compile-investigation',
        hypothesisId: 'H5',
        location: 'hitchr_widgets.dart:_addBusyCorridorLayer',
        message: 'Computed corridor lines',
        data: {
          'routesCount': routes.length,
          'lineCount': lines.length,
        },
      ),
    );
    // #endregion

    try {
      await style.removeStyleLayer(_busyCorridorLayerId);
    } catch (_) {}
    try {
      await style.removeStyleSource(_busyCorridorSourceId);
    } catch (_) {}

    if (lines.isEmpty) {
      return;
    }

    final features = lines
        .map(
          (line) => {
            'type': 'Feature',
            'properties': {'weight': line.weight},
            'geometry': {
              'type': 'LineString',
              'coordinates': [
                [line.from.lng, line.from.lat],
                [line.to.lng, line.to.lat],
              ],
            },
          },
        )
        .toList();
    final collection = jsonEncode({
      'type': 'FeatureCollection',
      'features': features,
    });

    final source = GeoJsonSource(id: _busyCorridorSourceId, data: collection);
    await style.addSource(source);

    final layer = LineLayer(
      id: _busyCorridorLayerId,
      sourceId: _busyCorridorSourceId,
      lineColor: HColors.warning.value,
      lineOpacity: 0.55,
      lineCap: LineCap.ROUND,
      lineJoin: LineJoin.ROUND,
      lineWidthExpression: [
        'interpolate',
        ['linear'],
        ['get', 'weight'],
        1,
        4,
        2,
        6,
        3,
        8,
        5,
        10,
      ],
    );
    await style.addLayer(layer);
  }

  Future<void> _clearRoadSnappedRouteLayer(MapController controller) async {
    try {
      await controller.removeLayer(_routeLayerId);
    } catch (_) {}
    try {
      await controller.removeSource(_routeSourceId);
    } catch (_) {}
  }

  Future<void> _addRoadSnappedRouteLayer(MapController controller) async {
    if (widget.showOnlyRadar) {
      await _clearRoadSnappedRouteLayer(controller);
      return;
    }
    if (widget.fromPoint == null || widget.toPoint == null) return;
    final geoJson = await _getRoadSnappedRouteGeoJson();
    if (geoJson == null) return;

    try {
      // Remove previous style objects if they exist before re-adding.
      await _clearRoadSnappedRouteLayer(controller);

      await controller.addGeoJsonSource(_routeSourceId, geoJson);
      await controller.addLineLayer(
        AddLineLayerOptions(
          layerId: _routeLayerId,
          sourceId: _routeSourceId,
          lineColor: HColors.warning.value,
          lineWidth: 7.0, // slightly thicker than corridor core
          lineOpacity: 0.95,
          position: const LayerPositionOptions(
            aboveLayerId: _busyCorridorLayerId,
          ),
        ),
      );
    } catch (e) {
      debugPrint('[MiniMapView] Route style-layer error: $e');
    }
  }

  Future<String?> _getRoadSnappedRouteGeoJson() async {
    if (_routeGeoJson != null) return _routeGeoJson;
    if (widget.fromPoint == null || widget.toPoint == null) return null;
    if (!hasMapboxToken) return null;

    final from = widget.fromPoint!;
    final to = widget.toPoint!;
    final url =
        'https://api.mapbox.com/directions/v5/mapbox/driving/${from.lng},${from.lat};${to.lng},${to.lat}';

    try {
      final response = await Dio().get(
        url,
        queryParameters: {
          'geometries': 'polyline6',
          'overview': 'full',
          'steps': false,
          'access_token': _kMapboxToken,
        },
      );

      final routes = response.data['routes'] as List<dynamic>? ?? [];
      if (routes.isEmpty) return null;
      final polyline = routes.first['geometry'] as String?;
      if (polyline == null || polyline.isEmpty) return null;

      final coords = _decodePolyline6(polyline);
      if (coords.length < 2) return null;

      final featureCollection = {
        'type': 'FeatureCollection',
        'features': [
          {
            'type': 'Feature',
            'properties': <String, dynamic>{},
            'geometry': {'type': 'LineString', 'coordinates': coords},
          },
        ],
      };
      _routeGeoJson = jsonEncode(featureCollection);
      return _routeGeoJson;
    } catch (e) {
      debugPrint('[MiniMapView] Directions API error: $e');
      return null;
    }
  }

  List<List<double>> _decodePolyline6(String encoded) {
    final coordinates = <List<double>>[];
    int index = 0;
    int lat = 0;
    int lng = 0;

    while (index < encoded.length) {
      int result = 0;
      int shift = 0;
      int b;
      do {
        b = encoded.codeUnitAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      final dLat = (result & 1) != 0 ? ~(result >> 1) : (result >> 1);
      lat += dLat;

      result = 0;
      shift = 0;
      do {
        b = encoded.codeUnitAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      final dLng = (result & 1) != 0 ? ~(result >> 1) : (result >> 1);
      lng += dLng;

      coordinates.add([lng / 1e6, lat / 1e6]);
    }
    return coordinates;
  }

  Future<void> _addMarkers() async {
    if (_mapboxMap == null) return;

    try {
      _routeFromIcon ??= await _createMarkerIcon(HColors.coral500);
      _routeToIcon ??= await _createMarkerIcon(HColors.trustBlue);
      if (_pointAnnotationManager != null) {
        await _pointAnnotationManager!.deleteAll();
      }
      _pointAnnotationManager = await _mapboxMap!.annotations
          .createPointAnnotationManager();
      final annotations = <PointAnnotationOptions>[];

      // Add "from" marker (coral/red circle)
      if (!widget.showOnlyRadar && widget.fromPoint != null) {
        annotations.add(
          PointAnnotationOptions(
            geometry: Point(
              coordinates: Position(
                widget.fromPoint!.lng,
                widget.fromPoint!.lat,
              ),
            ),
            image: _routeFromIcon,
            iconSize: 1.0,
          ),
        );
      }

      // Add "to" marker (blue circle)
      if (!widget.showOnlyRadar && widget.toPoint != null) {
        annotations.add(
          PointAnnotationOptions(
            geometry: Point(
              coordinates: Position(widget.toPoint!.lng, widget.toPoint!.lat),
            ),
            image: _routeToIcon,
            iconSize: 1.0,
          ),
        );
      }

      if (annotations.isNotEmpty) {
        await _pointAnnotationManager!.createMulti(annotations);
        debugPrint('[MiniMapView] Added ${annotations.length} marker(s)');
      }
    } catch (e) {
      debugPrint('[MiniMapView] Marker error: $e');
    }
  }

  /// Renders a colored circle marker as a PNG Uint8List.
  Future<Uint8List> _createMarkerIcon(Color color) async {
    final recorder = ui.PictureRecorder();
    final canvas = Canvas(recorder);
    const size = 40.0;

    // Filled circle
    canvas.drawCircle(
      const Offset(size / 2, size / 2),
      size / 2,
      Paint()..color = color,
    );
    // White border
    canvas.drawCircle(
      const Offset(size / 2, size / 2),
      size / 2 - 1,
      Paint()
        ..color = Colors.white
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2,
    );

    final picture = recorder.endRecording();
    final image = await picture.toImage(size.toInt(), size.toInt());
    final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
    return byteData!.buffer.asUint8List();
  }

  Future<void> _fitCamera() async {
    if (_mapboxMap == null) return;

    try {
      final positions = <Position>[];
      if (!widget.showOnlyRadar && widget.fromPoint != null) {
        positions.add(Position(widget.fromPoint!.lng, widget.fromPoint!.lat));
      }
      if (!widget.showOnlyRadar && widget.toPoint != null) {
        positions.add(Position(widget.toPoint!.lng, widget.toPoint!.lat));
      }

      if (positions.isEmpty) {
        final currentPosition = _currentPosition;
        final current = currentPosition == null
            ? null
            : Position(currentPosition.longitude, currentPosition.latitude);
        if (current != null) {
          await _mapboxMap!.flyTo(
            CameraOptions(center: Point(coordinates: current), zoom: 13.5),
            null,
          );
          return;
        }
        // If no location is available yet, keep current camera as-is.
        return;
      }

      if (positions.length == 1) {
        // Single point — center on it
        await _mapboxMap!.flyTo(
          CameraOptions(
            center: Point(coordinates: positions.first),
            zoom: 14.0,
          ),
          null,
        );
        return;
      }

      // Two points — fit bounds
      double minLng = positions.first.lng.toDouble();
      double maxLng = positions.first.lng.toDouble();
      double minLat = positions.first.lat.toDouble();
      double maxLat = positions.first.lat.toDouble();

      for (final pos in positions) {
        final lng = pos.lng.toDouble();
        final lat = pos.lat.toDouble();
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }

      // Padding so markers aren't at the edge
      final lngPad = (maxLng - minLng) * 0.15 + 0.002;
      final latPad = (maxLat - minLat) * 0.15 + 0.002;

      final cameraOptions = await _mapboxMap!.cameraForCoordinateBounds(
        CoordinateBounds(
          southwest: Point(
            coordinates: Position(minLng - lngPad, minLat - latPad),
          ),
          northeast: Point(
            coordinates: Position(maxLng + lngPad, maxLat + latPad),
          ),
          infiniteBounds: false,
        ),
        MbxEdgeInsets(top: 16, left: 16, bottom: 16, right: 16),
        null,
        null,
        null,
        null,
      );

      await _mapboxMap!.flyTo(cameraOptions, null);
    } catch (e) {
      debugPrint('[MiniMapView] Camera error: $e');
    }
  }

  Future<void> _startPositionStream() async {
    final enabled = await geo.Geolocator.isLocationServiceEnabled();
    if (!enabled) return;

    var permission = await geo.Geolocator.checkPermission();
    if (permission == geo.LocationPermission.denied) {
      permission = await geo.Geolocator.requestPermission();
    }
    if (permission == geo.LocationPermission.denied ||
        permission == geo.LocationPermission.deniedForever) {
      return;
    }

    _positionStream?.cancel();
    _positionStream =
        geo.Geolocator.getPositionStream(
          locationSettings: const geo.LocationSettings(
            accuracy: geo.LocationAccuracy.high,
          ),
        ).listen((position) {
          _currentPosition = position;
          if (!_didCenterOnFirstFix &&
              widget.showOnlyRadar &&
              widget.fromPoint == null &&
              widget.toPoint == null) {
            _didCenterOnFirstFix = true;
            _fallbackCenter = latlng.LatLng(
              position.latitude,
              position.longitude,
            );
            if (mounted && (_mapboxMap == null || _livePilotManager == null)) {
              setState(() {});
            }
            _fitCameraOnceIfNeeded();
          } else if (!_didCenterOnFirstFix &&
              widget.fromPoint == null &&
              widget.toPoint == null) {
            _didCenterOnFirstFix = true;
            _fallbackCenter = latlng.LatLng(
              position.latitude,
              position.longitude,
            );
            if (mounted && (_mapboxMap == null || _livePilotManager == null)) {
              setState(() {});
            }
            _fitCameraOnceIfNeeded();
          }
        });
  }

  void _startRadarPolling() {
    _radarTimer?.cancel();
    _radarTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      _pollRadar();
    });
    _pollRadar();
  }

  Future<void> _pollRadar() async {
    final currentPosition = _currentPosition;
    if (currentPosition == null) return;

    try {
      final pilots = await ref
          .read(apiProvider)
          .getLiveRadar(currentPosition.latitude, currentPosition.longitude);
      // #region agent log
      unawaited(
        _agentDebugLog(
          runId: 'run-compile-investigation',
          hypothesisId: 'H3',
          location: 'hitchr_widgets.dart:_pollRadar',
          message: 'Radar fetch result',
          data: {
            'pilotCount': pilots.length,
            'lat': currentPosition.latitude,
            'lng': currentPosition.longitude,
          },
        ),
      );
      // #endregion
      _lastRadarAt = DateTime.now();
      if (_livePilotManager != null && _mapboxMap != null) {
        await _refreshLivePilotMarkers(pilots);
        if (_controller != null) {
          await _addBusyCorridorLayer(_controller!);
        }
        if (mounted) setState(() {});
      } else if (mounted) {
        setState(() {
          _currentPilots
            ..clear()
            ..addEntries(pilots.map((p) => MapEntry(p.pilotId, p)));
        });
      }
    } catch (_) {
      // Keep polling; failures retry next interval.
    }
  }

  Future<void> _ensureLivePilotManager() async {
    if (_mapboxMap == null) return;
    _livePilotManager ??= await _mapboxMap!.annotations
        .createPointAnnotationManager();
    _livePilotTapEvents?.cancel();
    _livePilotTapEvents = _livePilotManager!.tapEvents(
      onTap: (annotation) {
        final pilotId = _annotationToPilotId[annotation.id];
        if (pilotId == null) return;
        final pilot = _currentPilots[pilotId];
        if (pilot == null) return;
        _openInterceptSheet(pilot);
      },
    );
  }

  Future<void> _refreshLivePilotMarkers(List<LivePilot> pilots) async {
    if (_livePilotManager == null) return;
    _livePilotIcon ??= await _createMarkerIcon(HColors.trustGreen);

    final nextPilots = <String, LivePilot>{
      for (final p in pilots) p.pilotId: p,
    };

    // Delete markers for pilots no longer present.
    final removedIds = _pilotAnnotations.keys
        .where((id) => !nextPilots.containsKey(id))
        .toList();
    for (final removedId in removedIds) {
      final annotation = _pilotAnnotations.remove(removedId);
      if (annotation != null) {
        try {
          await _livePilotManager!.delete(annotation);
        } catch (_) {}
      }
    }

    // Update existing markers / create missing ones.
    for (final pilot in pilots) {
      final existing = _pilotAnnotations[pilot.pilotId];
      if (existing == null) {
        final created = await _livePilotManager!.create(
          PointAnnotationOptions(
            geometry: Point(coordinates: Position(pilot.lng, pilot.lat)),
            image: _livePilotIcon,
            iconSize: 0.9,
            iconRotate: pilot.heading,
            textField: '${pilot.seats}',
            textColor: HColors.gray900.toARGB32(),
            textSize: 11.0,
            textHaloColor: Colors.white.toARGB32(),
            textHaloWidth: 1.0,
            textOffset: const [0.0, 1.2],
          ),
        );
        _pilotAnnotations[pilot.pilotId] = created;
        continue;
      }

      existing.geometry = Point(coordinates: Position(pilot.lng, pilot.lat));
      existing.iconRotate = pilot.heading;
      existing.textField = '${pilot.seats}';
      try {
        await _livePilotManager!.update(existing);
      } catch (_) {}
    }

    _annotationToPilotId
      ..clear()
      ..addEntries(
        _pilotAnnotations.entries.map((e) => MapEntry(e.value.id, e.key)),
      );
    _currentPilots
      ..clear()
      ..addAll(nextPilots);
  }

  Future<void> _openInterceptSheet(LivePilot pilot) async {
    if (!mounted) return;
    _interceptSheetOpen = true;
    await showModalBottomSheet<void>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(HRadius.lg)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (sheetContext, setSheetState) => Padding(
          padding: const EdgeInsets.all(HSpacing.md),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Pilot ${pilot.pilotId}',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Seats: ${pilot.seats}',
                style: const TextStyle(color: HColors.gray600),
              ),
              const SizedBox(height: HSpacing.md),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _interceptLoading
                      ? null
                      : () async {
                          final user = ref.read(userProvider);
                          if (user == null) return;
                          setSheetState(() => _interceptLoading = true);
                          try {
                            await ref
                                .read(apiProvider)
                                .requestIntercept(user.id, pilot.pilotId);
                          } catch (_) {
                            if (!mounted) return;
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Unable to request intercept'),
                              ),
                            );
                            setSheetState(() => _interceptLoading = false);
                          }
                        },
                  child: _interceptLoading
                      ? const SizedBox(
                          height: 18,
                          width: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: HColors.white,
                          ),
                        )
                      : const Text('Intercept'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
    _interceptSheetOpen = false;
  }

  void _subscribeNotificationEvents() {
    _notificationSub?.cancel();
    _notificationSub = ref.read(notificationCenterProvider).stream.listen((
      message,
    ) {
      if (!mounted) return;
      final type = message['type'];
      if (type == 'intercept_accepted') {
        if (_interceptSheetOpen && Navigator.of(context).canPop()) {
          Navigator.of(context).pop();
        }
        _interceptLoading = false;
        showDialog<void>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Intercept accepted'),
            content: const Text('Pilot accepted your intercept request.'),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(),
                child: const Text('OK'),
              ),
            ],
          ),
        );
      } else if (type == 'intercept_expired') {
        _interceptLoading = false;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Intercept request expired')),
        );
      }
    });
  }

  void _fitCameraOnceIfNeeded() {
    if (_didCenterOnFirstFix &&
        widget.fromPoint == null &&
        widget.toPoint == null) {
      return;
    }
    unawaited(_fitCamera());
  }

  List<_BusyCorridorLine> _computeBusyCorridorLines(List<RouteModel> routes) {
    if (routes.isEmpty) return const [];
    final current = _currentPosition;
    final grouped = <String, _BusyCorridorLine>{};

    for (final route in routes) {
      final from = route.fromPoint;
      final to = route.toPoint;
      if (current != null) {
        final dFrom = geo.Geolocator.distanceBetween(
          current.latitude,
          current.longitude,
          from.lat,
          from.lng,
        );
        final dTo = geo.Geolocator.distanceBetween(
          current.latitude,
          current.longitude,
          to.lat,
          to.lng,
        );
        final minDist = dFrom < dTo ? dFrom : dTo;
        // Keep corridors relevant to current area.
        if (minDist > 15000) {
          continue;
        }
      }

      final key =
          '${from.lat.toStringAsFixed(3)},${from.lng.toStringAsFixed(3)}|'
          '${to.lat.toStringAsFixed(3)},${to.lng.toStringAsFixed(3)}';
      final existing = grouped[key];
      if (existing == null) {
        grouped[key] = _BusyCorridorLine(from: from, to: to, weight: 1);
      } else {
        grouped[key] = existing.copyWith(weight: existing.weight + 1);
      }
    }

    final lines = grouped.values.toList()
      ..sort((a, b) => b.weight.compareTo(a.weight));
    if (lines.length > 4) {
      return lines.sublist(0, 4);
    }
    return lines;
  }
}

class _BusyCorridorLine {
  final Waypoint from;
  final Waypoint to;
  final int weight;

  const _BusyCorridorLine({
    required this.from,
    required this.to,
    required this.weight,
  });

  _BusyCorridorLine copyWith({
    Waypoint? from,
    Waypoint? to,
    int? weight,
  }) {
    return _BusyCorridorLine(
      from: from ?? this.from,
      to: to ?? this.to,
      weight: weight ?? this.weight,
    );
  }
}

/// Safety action button
class SafetyButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback? onTap;

  const SafetyButton({
    super.key,
    required this.icon,
    required this.label,
    this.color = HColors.gray600,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.heavyImpact();
        onTap?.call();
      },
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

/// Empty state widget
class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;

  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(HSpacing.xxl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: HColors.coral50,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 40, color: HColors.coral400),
            ),
            const SizedBox(height: HSpacing.lg),
            Text(
              title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: HColors.gray900,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: HSpacing.sm),
            Text(
              subtitle,
              style: const TextStyle(
                fontSize: 14,
                color: HColors.gray500,
                height: 1.4,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
