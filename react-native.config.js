/**
 * react-native-maps is intentionally disabled on Android:
 * - Its Google Play Services map runtime would bloat the APK and break on
 *   GMS-less Chinese OEM ROMs. Android uses the lightweight OSM TileMap
 *   instead and hands off navigation to whichever native map app the user
 *   has installed (see src/utils/mapLinks.ts).
 * On iOS nothing changes — react-native-maps' default provider is Apple's
 * MapKit, which ships with the OS (negligible size impact).
 */
module.exports = {
  dependencies: {
    'react-native-maps': {
      platforms: {
        android: null,
        web: null,
      },
    },
  },
};
