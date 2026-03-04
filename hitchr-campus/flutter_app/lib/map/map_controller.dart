import 'dart:async';
import 'package:flutter/material.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';

/// Layer position for ordering: above a layer, below a layer, or at index.
class LayerPositionOptions {
  final String? aboveLayerId;
  final String? belowLayerId;
  final int? atIndex;

  const LayerPositionOptions({
    this.aboveLayerId,
    this.belowLayerId,
    this.atIndex,
  });

  LayerPosition? toLayerPosition() {
    if (aboveLayerId != null) return LayerPosition(above: aboveLayerId);
    if (belowLayerId != null) return LayerPosition(below: belowLayerId);
    if (atIndex != null) return LayerPosition(at: atIndex);
    return null;
  }
}

/// Options for adding a line layer (style layer, not annotation).
class AddLineLayerOptions {
  final String layerId;
  final String sourceId;
  final int? lineColor;
  final double? lineWidth;
  final double? lineOpacity;
  final LayerPositionOptions? position;

  const AddLineLayerOptions({
    required this.layerId,
    required this.sourceId,
    this.lineColor,
    this.lineWidth,
    this.lineOpacity,
    this.position,
  });
}

/// Options for adding a circle layer (style layer, not annotation).
class AddCircleLayerOptions {
  final String layerId;
  final String sourceId;
  final int? circleColor;
  final double? circleRadius;
  final double? circleOpacity;
  final int? circleStrokeColor;
  final double? circleStrokeWidth;
  final LayerPositionOptions? position;

  const AddCircleLayerOptions({
    required this.layerId,
    required this.sourceId,
    this.circleColor,
    this.circleRadius,
    this.circleOpacity,
    this.circleStrokeColor,
    this.circleStrokeWidth,
    this.position,
  });
}

/// Controller for a single Mapbox map instance. Exposes style/source/layer APIs,
/// zoom stream, and base style switching. Annotation logic stays in the UI
/// using [mapboxMap] (e.g. PointAnnotationManager, PolylineAnnotationManager).
class MapController {
  MapController._(this._mapboxMap) {
    _zoomController = StreamController<double>.broadcast();
    _setupZoomListener();
  }

  final MapboxMap _mapboxMap;
  late final StreamController<double> _zoomController;
  VoidCallback? _onStyleLoadedCallback;

  /// Raw MapboxMap for annotations (point/polyline managers) and camera.
  /// Use this for annotation APIs; use [addGeoJsonSource], [addLineLayer], etc.
  /// for style layers.
  MapboxMap get mapboxMap => _mapboxMap;

  /// Stream of zoom level updates (from onMapZoomListener).
  Stream<double> get zoomLevelStream => _zoomController.stream;

  /// Called when the style has finished loading (initial load or after [setBaseStyle]).
  set onStyleLoaded(VoidCallback? callback) {
    _onStyleLoadedCallback = callback;
  }

  /// Invoked by the map widget when style has loaded. Do not call directly.
  void notifyStyleLoaded() {
    _onStyleLoadedCallback?.call();
  }

  void _setupZoomListener() {
    _mapboxMap.onMapZoomListener = (MapContentGestureContext context) {
      getZoomLevel().then((zoom) {
        if (!_zoomController.isClosed) {
          _zoomController.add(zoom);
        }
      });
    };
  }

  /// Adds a GeoJSON source. Call only after style is loaded (e.g. in [onStyleLoaded]).
  Future<void> addGeoJsonSource(String id, String geoJsonData) async {
    final source = GeoJsonSource(id: id, data: geoJsonData);
    await _mapboxMap.style.addSource(source);
  }

  /// Adds a line layer. Source [sourceId] must exist. Use [LayerPositionOptions]
  /// for ordering (above/below layer or at index).
  Future<void> addLineLayer(AddLineLayerOptions options) async {
    final layer = LineLayer(
      id: options.layerId,
      sourceId: options.sourceId,
      lineColor: options.lineColor ?? 0xFF000000,
      lineWidth: options.lineWidth ?? 2.0,
      lineOpacity: options.lineOpacity ?? 1.0,
    );
    final pos = options.position?.toLayerPosition();
    if (pos != null) {
      await _mapboxMap.style.addLayerAt(layer, pos);
    } else {
      await _mapboxMap.style.addLayer(layer);
    }
  }

  /// Adds a circle layer. Source [sourceId] must exist.
  Future<void> addCircleLayer(AddCircleLayerOptions options) async {
    final layer = CircleLayer(
      id: options.layerId,
      sourceId: options.sourceId,
      circleColor: options.circleColor ?? 0xFF000000,
      circleRadius: options.circleRadius ?? 5.0,
      circleOpacity: options.circleOpacity ?? 1.0,
      circleStrokeColor: options.circleStrokeColor,
      circleStrokeWidth: options.circleStrokeWidth,
    );
    final pos = options.position?.toLayerPosition();
    if (pos != null) {
      await _mapboxMap.style.addLayerAt(layer, pos);
    } else {
      await _mapboxMap.style.addLayer(layer);
    }
  }

  /// Removes a style layer by id.
  Future<void> removeLayer(String id) async {
    await _mapboxMap.style.removeStyleLayer(id);
  }

  /// Removes a style source by id.
  Future<void> removeSource(String id) async {
    await _mapboxMap.style.removeStyleSource(id);
  }

  /// Returns the current zoom level.
  Future<double> getZoomLevel() async {
    final state = await _mapboxMap.getCameraState();
    return state.zoom;
  }

  /// Returns the current camera state (center, zoom, etc.).
  Future<CameraState> getCameraState() async {
    return _mapboxMap.getCameraState();
  }

  /// Flies the camera to the given options.
  Future<void> flyTo(CameraOptions options, MapAnimationOptions? animation) async {
    await _mapboxMap.flyTo(options, animation);
  }

  /// Fits the camera to the given coordinate bounds.
  Future<void> flyToBounds(
    CoordinateBounds bounds,
    MbxEdgeInsets padding, {
    double? bearing,
    double? pitch,
    double? maxZoom,
    ScreenCoordinate? offset,
  }) async {
    final cameraOptions = await _mapboxMap.cameraForCoordinateBounds(
      bounds,
      padding,
      bearing,
      pitch,
      maxZoom,
      offset,
    );
    await _mapboxMap.flyTo(cameraOptions, null);
  }

  /// Switches the base map style (e.g. light/dark). [onStyleLoaded] will fire
  /// again after the new style is loaded. Custom sources/layers are not
  /// re-applied automatically; re-add them in [onStyleLoaded] if needed.
  Future<void> setBaseStyle(String styleUri) async {
    await _mapboxMap.loadStyleURI(styleUri);
  }

  /// Disposes the controller and closes the zoom stream.
  void dispose() {
    _zoomController.close();
  }

  /// Creates a [MapController] for the given [MapboxMap]. Typically used
  /// from [HitchrMapWidget.onMapCreated] / [HitchrMapWidget.onControllerReady].
  static MapController create(MapboxMap mapboxMap) {
    return MapController._(mapboxMap);
  }
}
