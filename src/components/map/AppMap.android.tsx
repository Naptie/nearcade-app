import React from 'react';
import { View } from 'react-native';
import { TileMap } from './TileMap';
import type { AppMapProps } from './types';

/**
 * Android implementation — deliberately NOT a bundled map SDK:
 * Google Play Services maps bloats the APK and renders blank on the many
 * Chinese OEM ROMs without GMS. A lightweight OSM tile map works everywhere,
 * and turn-by-turn navigation hands off to whichever native map app the user
 * has installed (AMap / Baidu / Google via `geo:` — see src/utils/mapLinks.ts).
 */
export function AppMap({ region, pins = [], className }: AppMapProps) {
  const zoom = Math.max(4, Math.round(Math.log2(360 / region.longitudeDelta)));
  return (
    <View style={{ flex: 1 }} className={className}>
      <TileMap
        center={{ latitude: region.latitude, longitude: region.longitude }}
        markers={pins.map((p) => ({
          latitude: p.latitude,
          longitude: p.longitude,
          label: p.title,
          onPress: p.onPress,
        }))}
        initialZoom={zoom}
        className="flex-1"
      />
    </View>
  );
}
