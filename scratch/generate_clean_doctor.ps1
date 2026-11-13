Add-Type -AssemblyName System.Drawing

$srcPath = "c:\Users\lariz\OneDrive\Desktop\Antigravity Proyectos\Web Normatika\assets\doctora-hero-bg.jpg"
$destPath = "c:\Users\lariz\OneDrive\Desktop\Antigravity Proyectos\Web Normatika\assets\doctora-hero-clean.jpg"

$src = [System.Drawing.Bitmap]::FromFile($srcPath)

# Source crop: ONLY the doctor and clinic, completely past all text and buttons
# Title text ends at X=340. Buttons end at X=345.
# We crop from X=360 to 658 (width = 298), Y=0 to 385 (height = 385).
$cropX = 360
$cropY = 0
$cropW = $src.Width - $cropX # 298px
$cropH = $src.Height         # 385px

# Canvas dimensions for high-res clean portrait
$outW = 1200
$outH = 1400

# We want 200px of headroom above her hair
$topHeadroom = 180
$drawH = $outH - $topHeadroom # 1220px
$drawW = [int]($cropW * ($drawH / $cropH)) # ~944px
$drawX = [int]($outW - $drawW) # align to right edge
$drawY = $topHeadroom

$canvas = New-Object System.Drawing.Bitmap($outW, $outH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($canvas)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

# 1. Fill entire base with white
$brushWhite = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
$g.FillRectangle($brushWhite, 0, 0, $outW, $outH)
$brushWhite.Dispose()

# 2. Draw doctor photo from clean crop
$destRect = New-Object System.Drawing.Rectangle($drawX, $drawY, $drawW, $drawH)
$srcRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)
$g.DrawImage($src, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

# 3. Seamlessly extend clinic bokeh into the headroom (Y=0 to drawY)
# For each column in the doctor area, sample the top row of the drawn image and extend upward
for ($x = $drawX; $x -lt $outW; $x += 2) {
    $sampleColor = $canvas.GetPixel($x, [Math]::Min($outH - 1, $drawY + 4))
    for ($y = 0; $y -lt $drawY; $y += 2) {
        $pBrush = New-Object System.Drawing.SolidBrush($sampleColor)
        $g.FillRectangle($pBrush, $x, $y, 2, 2)
        $pBrush.Dispose()
    }
}

# 4. Soft smooth gradient on the left edge (from drawX to drawX + 160)
# This gently fades the clinic bokeh into the pure white background of the hero section
$fadeWidth = 160
for ($x = $drawX; $x -le ($drawX + $fadeWidth); $x += 2) {
    $progress = ($x - $drawX) / [double]$fadeWidth
    # Smoothstep curve: 3p^2 - 2p^3
    $smooth = $progress * $progress * (3.0 - 2.0 * $progress)
    $alpha = [int](255 * (1.0 - $smooth))
    if ($alpha -gt 0) {
        $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb($alpha, 255, 255, 255), 3)
        $g.DrawLine($pen, $x, 0, $x, $outH)
        $pen.Dispose()
    }
}

# 5. Soft fade on the bottom edge (last 60px) to seamlessly rest on section bottom
$botFade = 60
$botStart = $outH - $botFade
for ($y = $botStart; $y -le $outH; $y += 2) {
    $progress = ($y - $botStart) / [double]$botFade
    $smooth = $progress * $progress * (3.0 - 2.0 * $progress)
    $alpha = [int](255 * $smooth)
    if ($alpha -gt 0) {
        $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb($alpha, 255, 255, 255), 3)
        $g.DrawLine($pen, 0, $y, $outW, $y)
        $pen.Dispose()
    }
}

# 6. Top fade (first 30px) to pure white at ceiling
for ($y = 0; $y -le 30; $y += 2) {
    $alpha = [int](255 * (1.0 - ($y / 30.0)))
    if ($alpha -gt 0) {
        $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb($alpha, 255, 255, 255), 3)
        $g.DrawLine($pen, 0, $y, $outW, $y)
        $pen.Dispose()
    }
}

$g.Dispose()
$src.Dispose()

# Save with 98% quality JPEG
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]98)

$canvas.Save($destPath, $codec, $encoderParams)
$canvas.Dispose()

Write-Output "Successfully generated 100% clean doctor photo: $destPath ($outW x $outH)"

