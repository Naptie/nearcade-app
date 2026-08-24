import React, { useMemo, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import {
  clamp,
  latToTileY,
  lngToTileX,
  osmTileUrl,
  tileXToLng,
  tileYToLat,
} from '@/utils/geo';

export interface MapMarker {
  latitude: number;
  longitude: number;
  label?: string;
  onPress?: () => void;
}

interface TileMapProps {
  center: { latitude: number; longitude: number };
  markers?: MapMarker[];
  initialZoom?: number;
  height?: number;
  interactive?: boolean;
}

/**
 * Dependency-free slippy map (OpenStreetMap tiles) that works on iOS,
 * Android and web. Supports one-finger drag panning and zoom buttons.
 * Attribution required by the OSM license is rendered on the map.
 */
export function TileMap({ center, markers = [], initialZoom = 13, height = 200, interactive = true }: TileMapProps) {
  const { colors } = useTheme();
  const [zoom, setZoom] = useState(initialZoom);
  const [size, setSize] = useState({ w: 320, h: height });
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // pan offset in px
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    setSize({ w: Math.max(1, width), h: height });
  };

  // Effective center after panning
  const effCenter = useMemo(() => {
    if (offset.x === 0 && offset.y === 0) return center;
    const cx = lngToTileX(center.longitude, zoom) * 256 - offset.x;
    const cy = latToTileY(center.latitude, zoom) * 256 - offset.y;
    return { latitude: tileYToLat(cy / 256, zoom), longitude: tileXToLng(cx / 256, zoom) };
  }, [center, offset, zoom]);

  const tiles = useMemo(() => {
    const n = Math.pow(2, zoom);
    const centerX = lngToTileX(effCenter.longitude, zoom);
    const centerY = latToTileY(effCenter.latitude, zoom);
    const halfW = size.w / 2 / 256;
    const halfH = size.h / 2 / 256;
    const x0 = Math.floor(centerX - halfW);
    const x1 = Math.ceil(centerX + halfW);
    const y0 = Math.floor(clamp(centerY - halfH, 0, n));
    const y1 = Math.ceil(clamp(centerY + halfH, 0, n));
    const out: { key: string; url: string; left: number; top: number }[] = [];
    for (let y = y0; y <= y1; y++) {
      if (y < 0 || y >= n) continue;
      for (let x = x0; x <= x1; x++) {
        const wrappedX = ((x % n) + n) % n;
        out.push({
          key: `${zoom}/${x}/${y}`,
          url: osmTileUrl(wrappedX, y, zoom),
          left: (x - centerX) * 256 + size.w / 2,
          top: (y - centerY) * 256 + size.h / 2,
        });
      }
    }
    return out;
  }, [effCenter, zoom, size]);

  const projectedMarkers = useMemo(
    () =>
      markers.map((m, i) => ({
        ...m,
        key: `${i}`,
        left: (lngToTileX(m.longitude, zoom) - lngToTileX(effCenter.longitude, zoom)) * 256 + size.w / 2,
        top: (latToTileY(m.latitude, zoom) - latToTileY(effCenter.latitude, zoom)) * 256 + size.h / 2,
      })),
    [markers, effCenter, zoom, size]
  );

  const zoomBy = (delta: number) => {
    setZoom((z) => clamp(z + delta, 3, 18));
    setOffset({ x: 0, y: 0 });
  };

  const panHandlers = interactive
    ? {
          onStartShouldSetResponder: () => true,
          onMoveShouldSetResponder: () => true,
          onResponderGrant: (e: { nativeEvent: { pageX: number; pageY: number; locationX: number; locationY: number } }) => {
            dragStart.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY, ox: offset.x, oy: offset.y };
          },
          onResponderMove: (e: { nativeEvent: { pageX: number; pageY: number } }) => {
            const s = dragStart.current;
            if (!s) return;
            setOffset({
              x: s.ox - (e.nativeEvent.pageX - s.x),
              y: clamp(s.oy - (e.nativeEvent.pageY - s.y), -4000, 4000),
            });
          },
          onResponderRelease: () => {
            dragStart.current = null;
          },
        }
      : {};

  // Web fallback: static render with buttons only (no drag), keeps bundle simple.
  return (
    <View style={[styles.container, { height, backgroundColor: colors.surfaceAlt, borderRadius: 14, overflow: 'hidden' }]}>
      <View style={StyleSheet.absoluteFill} onLayout={onLayout} {...panHandlers}>
        {tiles.map((tile) => (
          <Image
            key={tile.key}
            source={{ uri: tile.url }}
            style={{ position: 'absolute', left: tile.left, top: tile.top, width: 256, height: 256 }}
            cachePolicy="disk"
            transition={0}
          />
        ))}
        {projectedMarkers.map((m) => (
          <Pressable
            key={m.key}
            onPress={m.onPress}
            style={{
              position: 'absolute',
              left: m.left - 14,
              top: m.top - 34,
              alignItems: 'center',
            }}
          >
            <Ionicons name="location" size={28} color={colors.primary} />
            {m.label ? (
              <View style={{ position: 'absolute', top: 24 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: colors.text }}>{m.label}</Text>
              </View>
            ) : null}
          </Pressable>
        ))}
      </View>
      {/* Zoom controls */}
      <View style={{ position: 'absolute', right: 10, bottom: 26, gap: 6 }}>
        {[
          { icon: 'add' as const, delta: 1 },
          { icon: 'remove' as const, delta: -1 },
        ].map(({ icon, delta }) => (
          <Pressable
            key={icon}
            onPress={() => zoomBy(delta)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: colors.surface,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={icon} size={18} color={colors.text} />
          </Pressable>
        ))}
      </View>
      {/* Re-center */}
      <Pressable
        onPress={() => setOffset({ x: 0, y: 0 })}
        style={{
          position: 'absolute',
          right: 10,
          bottom: 100,
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: colors.surface,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="locate" size={16} color={colors.accent} />
      </Pressable>
      <Text
        style={{
          position: 'absolute',
          right: 4,
          bottom: 2,
          fontSize: 8,
          color: '#555',
          backgroundColor: 'rgba(255,255,255,0.7)',
          paddingHorizontal: 3,
          borderRadius: 3,
        }}
      >
        © OpenStreetMap contributors
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
});
