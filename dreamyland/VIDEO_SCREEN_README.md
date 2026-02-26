# Video Screen Component

A 3D video display screen with glitch/distortion shader effects for your Three.js scene.

## Features

- 🎥 **Video playback** with automatic looping
- 🧊 **Shader-based glitch effects**:
  - RGB channel separation (chromatic aberration)
  - Horizontal glitch lines
  - Scanline effects
  - Random distortion noise
  - Occasional flash effects
- 💡 **Emissive glow** like LED screens
- 📍 **Positioned at spawn location** by default

## Setup

### 1. Add Your Video File

Place your video file in the `public` folder:
```
dreamyland/public/video.mp4
```

**Recommended video format:**
- Format: MP4 (H.264)
- Resolution: 1080p or lower (for performance)
- Keep file size reasonable

### 2. Enable the Video Screen

In `dreamyland/src/game/Game.js`, uncomment the video screen creation:

```javascript
// Create video screen at spawn location
videoScreen = createVideoScreen(scene, '/video.mp4', {
    width: 20,
    height: 12,
    position: new THREE.Vector3(0, 8, -15), // In front of spawn, facing camera
    distortionIntensity: 0.02,  // Distortion amount (0-1)
    glitchIntensity: 0.1,       // Glitch effect intensity (0-1)
    emissiveIntensity: 1.5      // Screen brightness/glow
});
```

### 3. Customize Position

Adjust the `position` parameter to place the screen where you want:

```javascript
position: new THREE.Vector3(x, y, z)
```

- `x`: Left/Right (-left, +right)
- `y`: Up/Down (-down, +up)
- `z`: Forward/Back (-forward, +back)

**Default spawn location:** `(0, 8, -15)` - In front of the player, elevated

### 4. Customize Effects

Adjust shader parameters:

- **`distortionIntensity`**: How much the video distorts (0.0 = none, 0.1 = heavy)
- **`glitchIntensity`**: How strong the glitch lines are (0.0 = none, 0.5 = very glitchy)
- **`emissiveIntensity`**: Screen brightness (1.0 = normal, 2.0 = very bright/glowing)

### 5. Customize Size

Adjust screen dimensions:

```javascript
width: 20,   // Screen width
height: 12,  // Screen height
```

## Usage Examples

### Basic Setup
```javascript
videoScreen = createVideoScreen(scene, '/video.mp4');
```

### Custom Position and Size
```javascript
videoScreen = createVideoScreen(scene, '/video.mp4', {
    width: 30,
    height: 18,
    position: new THREE.Vector3(10, 10, -20),
    rotation: new THREE.Euler(0, Math.PI / 4, 0) // Rotate 45 degrees
});
```

### Heavy Glitch Effect
```javascript
videoScreen = createVideoScreen(scene, '/video.mp4', {
    distortionIntensity: 0.05,
    glitchIntensity: 0.3,
    emissiveIntensity: 2.0
});
```

### Subtle Effect
```javascript
videoScreen = createVideoScreen(scene, '/video.mp4', {
    distortionIntensity: 0.01,
    glitchIntensity: 0.05,
    emissiveIntensity: 1.2
});
```

## Controls

The video screen returns an object with control methods:

```javascript
// Play video
videoScreen.play();

// Pause video
videoScreen.pause();

// Set volume (0.0 to 1.0)
videoScreen.setVolume(0.5);

// Adjust distortion in real-time
videoScreen.setDistortionIntensity(0.05);

// Adjust glitch in real-time
videoScreen.setGlitchIntensity(0.2);
```

## Shader Effects Explained

The shader includes:

1. **Chromatic Aberration**: RGB channels are slightly offset, creating a color separation effect
2. **Glitch Lines**: Random horizontal lines that shift the image
3. **Distortion Noise**: Perlin noise-based warping
4. **Scanlines**: CRT-style horizontal lines
5. **Flash Effects**: Occasional full-screen brightness flashes

## Performance Tips

- ✅ Use MP4 (H.264) format
- ✅ Keep resolution at 1080p or lower
- ✅ Compress video files
- ✅ Use `muted` attribute (required for autoplay)
- ✅ Avoid 4K unless necessary

## Browser Autoplay Policy

Most browsers require user interaction before playing video. The component handles this automatically:
- Tries to autoplay on load
- Falls back to playing on first user interaction (click, keypress, touch)

## Troubleshooting

**Video not playing?**
- Check browser console for errors
- Ensure video file exists in `public` folder
- Check video format (MP4 recommended)
- Try clicking/interacting with the page

**Video too dark?**
- Increase `emissiveIntensity` (try 2.0 or higher)

**Too much glitch?**
- Decrease `glitchIntensity` (try 0.05)
- Decrease `distortionIntensity` (try 0.01)

**Video not visible?**
- Check position coordinates
- Ensure screen is facing camera
- Check if screen is behind other objects

