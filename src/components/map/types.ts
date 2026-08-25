export interface MapPin {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  onPress?: () => void;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  /** Span in degrees derived from the discover radius. */
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface AppMapProps {
  region: MapRegion;
  pins?: MapPin[];
  className?: string;
}

/** Converts a search radius in km to a comfortable map span. */
export function radiusToRegion(latitude: number, longitude: number, radiusKm: number): MapRegion {
  const latitudeDelta = ((radiusKm * 2) / 111) * 1.7;
  return {
    latitude,
    longitude,
    latitudeDelta,
    longitudeDelta: latitudeDelta * 1.35,
  };
}
