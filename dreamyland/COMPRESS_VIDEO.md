# Video Compression Guide

Compress video files using FFmpeg with optimal quality/size balance.

## Prerequisites

Install FFmpeg:

**Windows:**
```powershell
winget install ffmpeg
```

Or download from: https://ffmpeg.org

## Compression Commands

### Recommended Settings (Best Quality/Size Balance)

```bash
# Compress video.mp4
ffmpeg -i public/video.mp4 -vcodec libx264 -crf 23 -preset slow -acodec aac -b:a 128k public/video.mp4

# Compress videoo.mp4
ffmpeg -i public/videoo.mp4 -vcodec libx264 -crf 23 -preset slow -acodec aac -b:a 128k public/videoo.mp4

# Compress videoippo.mp4
ffmpeg -i public/playground/videoippo.mp4 -vcodec libx264 -crf 23 -preset slow -acodec aac -b:a 128k public/playground/videoippo.mp4

# Compress videoape.mp4
ffmpeg -i public/playground/videoape.mp4 -vcodec libx264 -crf 23 -preset slow -acodec aac -b:a 128k public/playground/videoape.mp4
```

## Quality Settings

- **CRF 23** (Recommended): Best balance between quality and file size
- **CRF 18-22**: Higher quality, larger file
- **CRF 26-30**: Smaller file, lower quality

## Note

⚠️ **Important**: The commands above overwrite the original files. Make backups first!

To keep originals, use different output names:
```bash
ffmpeg -i public/video.mp4 -vcodec libx264 -crf 23 -preset slow -acodec aac -b:a 128k public/video_compressed.mp4
```

