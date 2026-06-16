const GOOGLE_STREETVIEW_BASE_URL = 'https://maps.googleapis.com/maps/api/streetview';

export type StreetViewOptions = {
  size?: string;
  fov?: number;
  heading?: number;
  pitch?: number;
  apiKey?: string;
};

export function generateStreetViewUrl(
  latitude: number,
  longitude: number,
  options: StreetViewOptions = {}
): string {
  const {
    size = '600x400',
    fov = 90,
    heading = 0,
    pitch = 0,
    apiKey = process.env.GOOGLE_STREETVIEW_API_KEY,
  } = options;

  if (!apiKey) {
    throw new Error('Missing Google Street View API key. Provide GOOGLE_STREETVIEW_API_KEY env variable or pass apiKey option.');
  }

  const params = new URLSearchParams({
    size,
    location: `${latitude},${longitude}`,
    fov: String(fov),
    heading: String(heading),
    pitch: String(pitch),
    key: apiKey,
  });

  return `${GOOGLE_STREETVIEW_BASE_URL}?${params.toString()}`;
}
