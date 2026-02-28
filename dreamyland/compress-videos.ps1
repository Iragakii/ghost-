# PowerShell script to compress video files using FFmpeg
# Compresses: mojito.mp4, videoo.mp4, videoippo.mp4, videoape.mp4

Write-Host "Starting video compression..." -ForegroundColor Green

# Check if ffmpeg is available
$ffmpegPath = $null

# First, try to find ffmpeg in PATH
$ffmpeg = Get-Command ffmpeg -ErrorAction SilentlyContinue
if ($ffmpeg) {
    $ffmpegPath = $ffmpeg.Path
}

# If not found in PATH, try common installation locations
if (-not $ffmpegPath) {
    # Refresh PATH from registry
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    
    # Try again after refreshing PATH
    $ffmpeg = Get-Command ffmpeg -ErrorAction SilentlyContinue
    if ($ffmpeg) {
        $ffmpegPath = $ffmpeg.Path
    }
}

# If still not found, search common locations
if (-not $ffmpegPath) {
    $searchPaths = @(
        "$env:ProgramFiles\ffmpeg\bin\ffmpeg.exe",
        "${env:ProgramFiles(x86)}\ffmpeg\bin\ffmpeg.exe",
        "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\*\ffmpeg*\bin\ffmpeg.exe"
    )
    
    foreach ($pattern in $searchPaths) {
        $found = Get-ChildItem -Path (Split-Path $pattern -Parent) -Filter "ffmpeg.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found -and (Test-Path $found.FullName)) {
            $ffmpegPath = $found.FullName
            break
        }
    }
}

if (-not $ffmpegPath) {
    Write-Host "Error: ffmpeg not found. Please install FFmpeg first." -ForegroundColor Red
    Write-Host "Install with: winget install ffmpeg" -ForegroundColor Yellow
    Write-Host "Or download from: https://ffmpeg.org" -ForegroundColor Yellow
    Write-Host "" -ForegroundColor Yellow
    Write-Host "If FFmpeg is already installed, try:" -ForegroundColor Yellow
    Write-Host "1. Restart your terminal/PowerShell" -ForegroundColor Yellow
    Write-Host "2. Add FFmpeg to your PATH manually" -ForegroundColor Yellow
    exit 1
}

Write-Host "Using ffmpeg at: $ffmpegPath" -ForegroundColor Gray

# Define the videos to compress
$videosToCompress = @(
    @{ Input = "public/mojito.mp4"; Output = "public/mojito.mp4" },
    @{ Input = "public/videoo.mp4"; Output = "public/videoo.mp4" },
    @{ Input = "public/playground/videoippo.mp4"; Output = "public/playground/videoippo.mp4" },
    @{ Input = "public/playground/videoape.mp4"; Output = "public/playground/videoape.mp4" }
)

# Compression settings
$crf = 23  # Quality setting (18-22 = higher quality, 26-30 = smaller file)
$preset = "slow"  # Encoding speed (slower = better compression)
$audioBitrate = "128k"

# Process each video
foreach ($video in $videosToCompress) {
    if (Test-Path $video.Input) {
        Write-Host "Compressing: $($video.Input)" -ForegroundColor Yellow
        
        # Create backup
        $backupPath = "$($video.Input).backup"
        Copy-Item $video.Input $backupPath -Force
        Write-Host "  Backup created: $backupPath" -ForegroundColor Gray
        
        # Create temp output file with proper .mp4 extension
        $tempOutput = $video.Output -replace '\.mp4$', '_temp.mp4'
        
        # Run ffmpeg compression
        $arguments = @(
            "-i", $video.Input,
            "-vcodec", "libx264",
            "-crf", $crf.ToString(),
            "-preset", $preset,
            "-acodec", "aac",
            "-b:a", $audioBitrate,
            "-f", "mp4",  # Explicitly specify output format
            "-y",  # Overwrite output file
            $tempOutput
        )
        
        $process = Start-Process -FilePath $ffmpegPath -ArgumentList $arguments -Wait -NoNewWindow -PassThru
        
        if ($process.ExitCode -eq 0) {
            # Replace original with compressed version
            Move-Item $tempOutput $video.Output -Force
            Write-Host "  [OK] Successfully compressed: $($video.Input)" -ForegroundColor Green
            
            # Get file sizes
            $originalSize = (Get-Item $backupPath).Length
            $compressedSize = (Get-Item $video.Output).Length
            $savings = $originalSize - $compressedSize
            $savingsPercent = [math]::Round(($savings / $originalSize) * 100, 2)
            
            Write-Host "  Original size: $([math]::Round($originalSize / 1MB, 2)) MB" -ForegroundColor Gray
            Write-Host "  Compressed size: $([math]::Round($compressedSize / 1MB, 2)) MB" -ForegroundColor Gray
            $percentText = "$savingsPercent" + "%"
            Write-Host "  Savings: $([math]::Round($savings / 1MB, 2)) MB ($percentText)" -ForegroundColor Cyan
        } else {
            Write-Host "  [FAILED] Failed to compress: $($video.Input)" -ForegroundColor Red
            # Restore backup if compression failed
            if (Test-Path $backupPath) {
                Move-Item $backupPath $video.Input -Force
                Write-Host "  Restored from backup" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "Warning: Video not found: $($video.Input)" -ForegroundColor Yellow
    }
    Write-Host ""
}

Write-Host "Compression complete!" -ForegroundColor Green
Write-Host "Backup files (.backup) have been created. You can delete them if you're satisfied with the results." -ForegroundColor Gray

