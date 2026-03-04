import 'package:flutter/material.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';
import 'map_controller.dart';

/// Light/dark base style presets for [HitchrMapWidget].
enum MapBaseStyle {
  light,
  dark,
  streets,
}

extension MapBaseStyleX on MapBaseStyle {
  String get styleUri {
    switch (this) {
      case MapBaseStyle.light:
        return MapboxStyles.LIGHT;
      case MapBaseStyle.dark:
        return MapboxStyles.DARK;
      case MapBaseStyle.streets:
        return MapboxStyles.MAPBOX_STREETS;
    }
  }
}

/// A Mapbox map widget that provides [MapController] and runs style-loaded
/// logic in [onStyleLoadedListener]. Use this to avoid rebuilding the entire
/// map on state changes; use [MapController] for layers, zoom, and style switching.
///
/// - [styleUri] or [baseStyle]: initial base map style (default: streets).
/// - [onControllerReady]: called when the map is created with the [MapController].
/// - [onStyleLoaded]: called when the style has finished loading (use for adding
///   sources/layers or other style-dependent setup).
/// - [cameraOptions]: initial camera. Further camera changes via [MapController].
///
/// Annotation logic (point/polyline markers) stays separate: use
/// [MapController.mapboxMap].annotations in [onControllerReady] or [onStyleLoaded].
class HitchrMapWidget extends StatefulWidget {
  final String? styleUri;
  final MapBaseStyle? baseStyle;
  final CameraOptions? cameraOptions;
  final void Function(MapController controller)? onControllerReady;
  final void Function(MapController controller)? onStyleLoaded;
  final void Function(MapLoadingErrorEventData data)? onMapLoadError;
  final OnMapIdleListener? onMapIdleListener;

  const HitchrMapWidget({
    super.key,
    this.styleUri,
    this.baseStyle,
    this.cameraOptions,
    this.onControllerReady,
    this.onStyleLoaded,
    this.onMapLoadError,
    this.onMapIdleListener,
  }) : assert(
         styleUri == null || baseStyle == null,
         'Provide either styleUri or baseStyle, not both.',
       );

  String get _resolvedStyleUri {
    if (styleUri != null) return styleUri!;
    return (baseStyle ?? MapBaseStyle.streets).styleUri;
  }

  @override
  State<HitchrMapWidget> createState() => _HitchrMapWidgetState();
}

class _HitchrMapWidgetState extends State<HitchrMapWidget> {
  MapController? _controller;

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  void _onMapCreated(MapboxMap mapboxMap) {
    _controller?.dispose();
    _controller = MapController.create(mapboxMap);
    if (widget.onStyleLoaded != null) {
      _controller!.onStyleLoaded = () => widget.onStyleLoaded!(_controller!);
    }
    widget.onControllerReady?.call(_controller!);
  }

  void _onStyleLoaded(StyleLoadedEventData data) {
    _controller?.notifyStyleLoaded();
  }

  @override
  Widget build(BuildContext context) {
    return MapWidget(
      styleUri: widget._resolvedStyleUri,
      cameraOptions: widget.cameraOptions,
      onMapCreated: _onMapCreated,
      onStyleLoadedListener: _onStyleLoaded,
      onMapLoadErrorListener: widget.onMapLoadError,
      onMapIdleListener: widget.onMapIdleListener,
    );
  }
}
