import React from 'react';
import { View } from 'react-native';
import { TileMap } from './TileMap';
import type { AppMapProps } from './types';

/**
 * Canonical implementation — the lightweight OSM tile map (used on web and
 * as the tsc-visible module). Metro resolves `AppMap.ios.tsx` (native Apple
 * Maps via MapKit) on iOS builds automatically.
 */
export function AppMap({ region, pins = [], className }: AppMapProps) {
  const zoom = Math.max(3, Math.round(Math.log2(360 / region.longitudeDelta)));
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

export type { AppMapProps, MapPin, MapRegion } from './types';
export { radiusToRegion } from './types';
