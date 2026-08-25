import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import {
  clamp,
  latToTileY,
  lngToTileX,
  tileXToLng,
  tileYToLat,
} from '@/utils/geo';

const TILE = 256;

export interface MapMarker {
  id?: string;
  latitude: number;
  longitude: number;
  label?: string;
  onPress?: () => void;
}

interface TileMapProps {
  center: { latitude: number; longitude: number };
  markers?: MapMarker[];
  initialZoom?: number;
  className?: string;
}

/**
 * Dependency-free slippy map (OpenStreetMap tiles) used on Android and web.
 * Supports drag panning and pinch-zoom with fractional zoom levels.
 * Keeps the APK free of any map SDK so it stays tiny and works on GMS-less
 * Chinese OEM ROMs. OSM attribution is rendered on-map as their license
 * requires.
 */
export function TileMap({ center, markers = [], initialZoom = 12, className }: TileMapProps) {
  const [zoomF, setZoomF] = useState(initialZoom);
  const [size, setSize] = useState({ w: 320, h: 224 });
  /** Screen-pixel pan offset at the current fractional zoom. */
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Refs mirroring state for stable gesture callbacks.
  const stateRef = useRef({ zoomF, offset });
  stateRef.current = { zoomF, offset };
  const gesture = useRef<{
    mode: 'pan' | 'pinch' | null;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    pinchDist: number;
    pinchZoom: number;
  }>({ mode: null, startX: 0, startY: 0, offsetX: 0, offsetY: 0, pinchDist: 0, pinchZoom: initialZoom });

  const intZoom = clamp(Math.floor(zoomF), 3, 18);
  /** Visual scale applied to integer-zoom tiles for fractional levels. */
  const k = Math.pow(2, zoomF - intZoom);

  const effCenter = useMemo(() => {
    if (offset.x === 0 && offset.y === 0) return center;
    const cx = lngToTileX(center.longitude, zoomF) * TILE - offset.x / k;
    const cy = latToTileY(center.latitude, zoomF) * TILE - offset.y / k;
    return { latitude: tileYToLat(cy / TILE, zoomF), longitude: tileXToLng(cx / TILE, zoomF) };
  }, [center, offset, zoomF, k]);

  const centerX = lngToTileX(effCenter.longitude, zoomF) * TILE;
  const centerY = latToTileY(effCenter.latitude, zoomF) * TILE;

  const tiles = useMemo(() => {
    if (size.w <= 1) return [];
    const n = Math.pow(2, intZoom);
    const contX = lngToTileX(effCenter.longitude, zoomF);
    const contY = latToTileY(effCenter.latitude, zoomF);
    const halfW = size.w / 2 / (TILE * k);
    const halfH = size.h / 2 / (TILE * k);
    const x0 = Math.floor(contX - halfW);
    const x1 = Math.ceil(contX + halfW);
    const y0 = Math.floor(clamp(contY - halfH, 0, n));
    const y1 = Math.ceil(clamp(contY + halfH, 0, n));
    const out: { key: string; url: string; left: number; top: number }[] = [];
    for (let y = y0; y <= y1; y++) {
      if (y < 0 || y >= n) continue;
      for (let x = x0; x <= x1; x++) {
        const wrapped = ((x % n) + n) % n;
        out.push({
          key: `${intZoom}/${x}/${y}`,
          url: `https://${['a', 'b', 'c'][Math.abs(x + y) % 3]}.tile.openstreetmap.org/${intZoom}/${x}/${y}.png`,
          left: (x - contX) * TILE * k + size.w / 2,
          top: (y - contY) * TILE * k + size.h / 2,
        });
      }
    }
    return out;
  }, [effCenter, zoomF, intZoom, k, size]);

  const projectedMarkers = useMemo(
    () =>
      markers.map((m, i) => ({
        ...m,
        key: `${m.id}-${i}`,
        left: (lngToTileX(m.longitude, zoomF) * TILE - centerX) + size.w / 2,
        top: (latToTileY(m.latitude, zoomF) * TILE - centerY) + size.h / 2,
      })),
    [markers, centerX, centerY, zoomF, size]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_e, g) =>
          g.numberActiveTouches > 1 || Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
        onPanResponderGrant: (e, g) => {
          if (g.numberActiveTouches > 1) {
            const [a, b] = e.nativeEvent.touches;
            gesture.current.mode = 'pinch';
            gesture.current.pinchDist = Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
            gesture.current.pinchZoom = stateRef.current.zoomF;
          } else {
            gesture.current.mode = 'pan';
            gesture.current.startX = e.nativeEvent.pageX;
            gesture.current.startY = e.nativeEvent.pageY;
            gesture.current.offsetX = stateRef.current.offset.x;
            gesture.current.offsetY = stateRef.current.offset.y;
          }
        },
        onPanResponderMove: (e, g) => {
          if (g.numberActiveTouches > 1 && gesture.current.mode === 'pinch') {
            const [a, b] = e.nativeEvent.touches;
            const dist = Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
            if (gesture.current.pinchDist > 0) {
              setZoomF(
                clamp(gesture.current.pinchZoom + Math.log2(dist / gesture.current.pinchDist), 4, 18)
              );
            }
          } else if (gesture.current.mode === 'pan') {
            setOffset({
              x: gesture.current.offsetX - (e.nativeEvent.pageX - gesture.current.startX),
              y: clamp(gesture.current.offsetY - (e.nativeEvent.pageY - gesture.current.startY), -80000, 80000),
            });
          }
        },
        onPanResponderRelease: () => {
          gesture.current.mode = null;
        },
        onPanResponderTerminate: () => {
          gesture.current.mode = null;
        },
      }),
    []
  );

  const zoomBy = (delta: number) => {
    setOffset({ x: 0, y: 0 });
    setZoomF((z) => clamp(z + delta, 3, 18));
  };

  return (
    <View className={`overflow-hidden rounded-2xl border border-base-300/40 bg-base-200 ${className ?? ''}`}>
      <View
        style={{ flex: 1 }}
        {...panResponder.panHandlers}
        onLayout={(e) =>
          setSize({ w: Math.max(1, e.nativeEvent.layout.width), h: Math.max(1, e.nativeEvent.layout.height) })
        }
      >
        {tiles.map((tile) => (
          <Image
            key={tile.key}
            source={{ uri: tile.url }}
            style={{ position: 'absolute', left: tile.left, top: tile.top, width: TILE * k, height: TILE * k }}
            cachePolicy="disk"
            transition={80}
          />
        ))}
        {projectedMarkers.map((m) => (
          <Pressable
            key={m.key}
            onPress={m.onPress}
            hitSlop={8}
            style={{ position: 'absolute', left: m.left - 14, top: m.top - 30 }}
          >
            <Ionicons name="location" size={28} color="#E23A78" />
          </Pressable>
        ))}
      </View>

      {/* Zoom + re-center controls */}
      <View style={{ position: 'absolute', right: 10, bottom: 26, gap: 6 }}>
        <MapButton icon="add" onPress={() => zoomBy(1)} />
        <MapButton icon="remove" onPress={() => zoomBy(-1)} />
      </View>
      <View style={{ position: 'absolute', right: 10, bottom: 100 }}>
        <MapButton icon="locate" onPress={() => setOffset({ x: 0, y: 0 })} accent />
      </View>

      <Text
        style={{
          position: 'absolute',
          right: 4,
          bottom: 3,
          fontSize: 8.5,
          color: '#555',
          backgroundColor: 'rgba(255,255,255,0.75)',
          paddingHorizontal: 3,
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        © OpenStreetMap contributors
      </Text>
    </View>
  );
}

function MapButton({
  icon,
  onPress,
  accent = false,
}: {
  icon: 'add' | 'remove' | 'locate';
  onPress: () => void;
  accent?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="h-8 w-8 items-center justify-center rounded-lg border border-base-300/60 bg-base-100/95 active:bg-base-200"
    >
      <Ionicons name={icon} size={16} color={accent ? '#377CFB' : undefined} className={accent ? 'text-secondary' : 'text-base-content'} />
    </Pressable>
  );
}
