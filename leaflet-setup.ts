import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// ─── Leaflet marker icon fix for Vite/bundler environments ────────────────────
//
// By default, Leaflet resolves marker icon assets using a relative URL path
// that breaks when processed by Vite (or any webpack-style bundler) because
// the internal `_getIconUrl` method references files that get hashed/moved.
//
// Fix: delete the broken method and manually supply the resolved asset URLs
// using Vite's static import system so the paths are always correct.
//
// Usage — import this file ONCE at the app entry point (already done in main.tsx):
//   import '@/lib/leaflet-setup'
//
// After that, any <Marker /> in react-leaflet will display the default pin icon
// without any additional configuration.

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
});
