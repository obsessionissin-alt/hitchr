import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'screens/onboarding/onboarding_screen.dart';
import 'screens/home/home_shell.dart';
import 'screens/home/home_screen.dart';
import 'screens/requests/requests_screen.dart';
import 'screens/rides/rides_screen.dart';
import 'screens/communities/communities_screen.dart';
import 'screens/profile/profile_screen.dart';
import 'screens/composer/composer_screen.dart';
import 'screens/route_detail/route_detail_screen.dart';
import 'screens/riding/riding_screen.dart';
import 'screens/complete_ride/complete_ride_screen.dart';
final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

final router = GoRouter(
  navigatorKey: _rootNavigatorKey,
  initialLocation: '/onboarding',
  routes: [
    GoRoute(
      path: '/onboarding',
      builder: (context, state) => const OnboardingScreen(),
    ),
    ShellRoute(
      navigatorKey: _shellNavigatorKey,
      builder: (context, state, child) => HomeShell(child: child),
      routes: [
        GoRoute(
          path: '/home',
          pageBuilder: (context, state) => const NoTransitionPage(child: HomeScreen()),
        ),
        GoRoute(
          path: '/requests',
          pageBuilder: (context, state) => const NoTransitionPage(child: RequestsScreen()),
        ),
        GoRoute(
          path: '/rides',
          pageBuilder: (context, state) => const NoTransitionPage(child: RidesScreen()),
        ),
        GoRoute(
          path: '/communities',
          pageBuilder: (context, state) => const NoTransitionPage(child: CommunitiesScreen()),
        ),
        GoRoute(
          path: '/profile',
          pageBuilder: (context, state) => const NoTransitionPage(child: ProfileScreen()),
        ),
      ],
    ),
    GoRoute(
      path: '/composer',
      builder: (context, state) => const ComposerScreen(),
    ),
    GoRoute(
      path: '/route/:id',
      builder: (context, state) => RouteDetailScreen(routeId: state.pathParameters['id']!),
    ),
    GoRoute(
      path: '/riding/:id',
      builder: (context, state) => RidingScreen(rideId: state.pathParameters['id']!),
    ),
    GoRoute(
      path: '/complete-ride/:id',
      builder: (context, state) => CompleteRideScreen(rideId: state.pathParameters['id']!),
    ),
  ],
);
