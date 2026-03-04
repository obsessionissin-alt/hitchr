import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';
import 'map_controller.dart';

/// Id of the corridor GeoJSON source. Use this for layer ordering if needed.
const String corridorSourceId = 'corridor-source';

/// Id of the corridor glow (outer) line layer.
const String corridorGlowLayerId = 'corridor-glow';

/// Id of the corridor core (inner) line layer.
const String corridorCoreLayerId = 'corridor-core';

/// Warm amber used for the corridor spine (#F5A623).
const int corridorAmberColor = 0xFFF5A623;

/// Main campus-to-campus road as a LineString (hardcoded).
/// Replace coordinates with your actual campus spine; format is [lng, lat].
final List<List<double>> _corridorCoordinates = [
  [77.2050, 28.6160], // campus A
  [77.2080, 28.6145],
  [77.2110, 28.6130],
  [77.2140, 28.6115],
  [77.2170, 28.6100], // campus B
];

/// Builds the corridor GeoJSON Feature (LineString) as a JSON string.
String get corridorGeoJson {
  final feature = {
    'type': 'Feature',
    'properties': <String, dynamic>{},
    'geometry': {
      'type': 'LineString',
      'coordinates': _corridorCoordinates,
    },
  };
  final collection = {'type': 'FeatureCollection', 'features': [feature]};
  return jsonEncode(collection);
}

/// Zoom-based line width: low zoom thin, mid zoom thicker, far zoom moderate.
/// Mapbox expression: ["interpolate", ["linear"], ["zoom"], z0, w0, z1, w1, ...]
List<Object> _zoomWidthExpression({
  required double lowZoom,
  required double midZoom,
  required double farZoom,
  required double widthLow,
  required double widthMid,
  required double widthFar,
}) {
  return [
    'interpolate',
    ['linear'],
    ['zoom'],
    lowZoom,
    widthLow,
    midZoom,
    widthMid,
    farZoom,
    widthFar,
  ];
}

/// Zoom-based line opacity: e.g. slightly reduced at far zoom.
List<Object> _zoomOpacityExpression({
  required double lowZoom,
  required double midZoom,
  required double farZoom,
  required double opacityLow,
  required double opacityMid,
  required double opacityFar,
}) {
  return [
    'interpolate',
    ['linear'],
    ['zoom'],
    lowZoom,
    opacityLow,
    midZoom,
    opacityMid,
    farZoom,
    opacityFar,
  ];
}

/// Adds the permanent corridor spine (source + glow + core layers) to the map.
/// Call this from [onStyleLoaded] so the corridor is re-added on every style load
/// (e.g. after setBaseStyle) and does not flicker. Layers are drawn above base
/// roads by adding them on top of the layer stack.
Future<void> addCorridorTo(MapController controller) async {
  try {
    final style = controller.mapboxMap.style;

    // 1. GeoJSON source
    final source = GeoJsonSource(id: corridorSourceId, data: corridorGeoJson);
    await style.addSource(source);

    // 2. Glow layer (thicker, low opacity) — drawn first so it sits below core
    final glowWidth = _zoomWidthExpression(
      lowZoom: 10,
      midZoom: 14,
      farZoom: 18,
      widthLow: 8,
      widthMid: 22,
      widthFar: 14,
    );
    final glowOpacity = _zoomOpacityExpression(
      lowZoom: 10,
      midZoom: 14,
      farZoom: 18,
      opacityLow: 0.2,
      opacityMid: 0.3,
      opacityFar: 0.25,
    );
    final glowLayer = LineLayer(
      id: corridorGlowLayerId,
      sourceId: corridorSourceId,
      lineColor: corridorAmberColor,
      lineWidthExpression: glowWidth,
      lineOpacityExpression: glowOpacity,
    );
    await style.addLayer(glowLayer);

    // 3. Core layer (thinner, solid) — drawn above glow
    final coreWidth = _zoomWidthExpression(
      lowZoom: 10,
      midZoom: 14,
      farZoom: 18,
      widthLow: 4,
      widthMid: 10,
      widthFar: 6,
    );
    final coreOpacity = _zoomOpacityExpression(
      lowZoom: 10,
      midZoom: 14,
      farZoom: 18,
      opacityLow: 0.9,
      opacityMid: 0.9,
      opacityFar: 0.85,
    );
    final coreLayer = LineLayer(
      id: corridorCoreLayerId,
      sourceId: corridorSourceId,
      lineColor: corridorAmberColor,
      lineWidthExpression: coreWidth,
      lineOpacityExpression: coreOpacity,
    );
    await style.addLayerAt(
      coreLayer,
      LayerPosition(above: corridorGlowLayerId),
    );
  } catch (e, stack) {
    debugPrint('[CorridorLayer] Failed to add corridor: $e');
    debugPrint(stack.toString());
  }
}
