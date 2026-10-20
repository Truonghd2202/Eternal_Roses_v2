# Family Blossoms 3D

A Vietnamese 20/10 family greeting built with React, Vite, Three.js, and React Three Fiber. Choose a dedication for Mẹ or Chị dâu, rotate and zoom the procedural bouquet, reset the camera, and open a scrollable greeting card.

## Run locally

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Music files

On page load, the player attempts to start the supplied Soft Piano MP3, shared by both recipient views. Browsers may block audible autoplay; use the music button once when the on-screen prompt appears.

1. Download a track whose license permits your intended use, and keep its license information.
2. Put the audio file in `public/audio/`.
3. Set that choice's `src` in `src/components/MusicPlayer.jsx` to its local path, such as `/audio/soft-piano.mp3`.

The provided file is stored at `public/audio/soft-piano.mp3`. Confirm its license and keep the source/license details with the project.

The bouquets are procedural 3D models, not photogrammetry or licensed GLB assets. They use different petal geometry, density, filler flowers, wrapping, ribbon, and palettes for the two recipients, but remain an artistic approximation of the supplied references.
# Eternal_Roses_v2
