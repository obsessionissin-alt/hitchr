/// Layer-based Mapbox map support: [MapController] and [HitchrMapWidget].
///
/// Use [HitchrMapWidget] with [onControllerReady] and [onStyleLoaded].
/// Use [MapController] for style layers (GeoJSON sources, line/circle layers),
/// zoom stream, and dynamic base style switching. Keep annotation logic
/// (point/polyline managers) separate via [MapController.mapboxMap].annotations.
library;

export 'map_controller.dart';
export 'hitchr_map_widget.dart';
export 'corridor_layer.dart';
