import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text } from 'react-native';
import MapView, { Callout, Marker } from 'react-native-maps';
import type { AppMapProps } from './types';

/**
 * iOS implementation — Apple Maps (MapKit) via react-native-maps' default
 * provider. MapKit ships with the OS, so this adds no meaningful app size.
 */
export function AppMap({ region, pins = [], className }: AppMapProps) {
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    mapRef.current?.animateToRegion(region, 350);
  }, [region.latitude, region.longitude, region.latitudeDelta]);

  return (
    <MapView
      ref={mapRef}
      style={[styles.fill, className ? {} : null]}
      initialRegion={region}
      rotateEnabled={false}
      pitchEnabled={false}
      toolbarEnabled={false}
      showsCompass={false}
      showsUserLocation
      
      className={className}
    >
      {pins.map((pin) => (
        <Marker
          key={pin.id}
          coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
          title={pin.title}
          onPress={() => {
            // Marker taps open the venue; callout tap would double-navigate.
            pin.onPress?.();
          }}
        >
          <Callout>
            <Text style={{ maxWidth: 180, fontWeight: '600' }}>{pin.title}</Text>
          </Callout>
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
