import { Linking, Platform } from 'react-native';

/**
 * Opens the device's own map app for a destination.
 *
 * - iOS: Apple Maps via the `maps://` scheme (falls back to the
 *   maps.apple.com universal link, which also routes to Apple Maps).
 * - Android: there is no AOSP map service and Chinese OEM ROMs often lack
 *   Google Play Services, so we never bundle one. Instead we deep-link into
 *   whichever map app the user already has:
 *     1. the standard `geo:` URI (handled by Google Maps, AMap ≥ 8.60,
 *        Baidu Maps, Tencent Maps…)
 *     2. AMap's URI API universal link (opens the AMap app when installed,
 *        otherwise amap.com in a browser)
 *     3. Google Maps on the web as the last resort.
 */
export async function openDirections(
  latitude: number,
  longitude: number,
  label?: string
): Promise<void> {
  const name = label ? encodeURIComponent(label) : '';

  if (Platform.OS === 'ios') {
    const schemeUrl = `maps://?daddr=${latitude},${longitude}${name ? `&q=${name}` : ''}`;
    const webUrl = `https://maps.apple.com/?daddr=${latitude},${longitude}${name ? `&q=${name}` : ''}`;
    try {
      await Linking.openURL(schemeUrl);
    } catch {
      await Linking.openURL(webUrl);
    }
    return;
  }

  if (Platform.OS === 'android') {
    const geoUrl = `geo:0,0?q=${latitude},${longitude}${name ? `(${name})` : ''}`;
    try {
      await Linking.openURL(geoUrl);
      return;
    } catch {
      // No handler for geo: — try AMap next.
    }
    try {
      await Linking.openURL(
        `https://uri.amap.com/navigation?to=${longitude},${latitude},${name}&mode=car&src=nearcade&coordinate=gaode&callnative=1`
      );
      return;
    } catch {
      // Fall through to Google Maps on the web.
    }
  }

  const q = name ? encodeURIComponent(`${label ?? ''} ${latitude},${longitude}`) : `${latitude},${longitude}`;
  await Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${q}`);
}

/** Shows a coordinate on the user's map app without routing. */
export async function openMapAt(latitude: number, longitude: number, label?: string): Promise<void> {
  if (Platform.OS === 'android') {
    try {
      await Linking.openURL(`geo:${latitude},${longitude}?z=16${label ? `&q=${latitude},${longitude}(${encodeURIComponent(label)})` : ''}`);
      return;
    } catch {
      // fall through
    }
  }
  if (Platform.OS === 'ios') {
    try {
      await Linking.openURL(`maps:?ll=${latitude},${longitude}&q=${encodeURIComponent(label ?? 'Location')}`);
      return;
    } catch {
      // fall through
    }
  }
  await Linking.openURL(
    `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
  );
}
