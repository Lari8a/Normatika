Add-Type -AssemblyName System.Drawing

$srcPath = "c:\Users\lariz\OneDrive\Desktop\Antigravity Proyectos\Web Normatika\assets\doctora-hero-bg.jpg"
$destPath = "c:\Users\lariz\OneDrive\Desktop\Antigravity Proyectos\Web Normatika\assets\hero-bg-normatika.jpg"
$mobileDestPath = "c:\Users\lariz\OneDrive\Desktop\Antigravity Proyectos\Web Normatika\assets\doctora-mobile-normatika.jpg"

$src = [System.Drawing.Bitmap]::FromFile($srcPath)

# -----------------------------------------------------------------------------
# 1. GENERATE DESKTOP MASTER HERO BACKGROUND (2400 x 1350, 16:9)
# -----------------------------------------------------------------------------
$W = 2400
$H = 1350

$canvas = New-Object System.Drawing.Bitmap($W, $H, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($canvas)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

# 1a. Fill entire canvas with pure white
$brushWhite = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
$g.FillRectangle($brushWhite, 0, 0, $W, $H)
$brushWhite.Dispose()

# 1b. Calculate scaling and position for Doctor & Clinic (right side)
# In source (658 x 385):
# Doctor & clinic extend from X=300 to 658 (width = 358), Y=0 to 385 (height = 385).
# Target doctor height: we want her to have ~180px headroom at top.
# So drawn height = 1350 - 180 = 1170px.
# Scale = 1170 / 385 ≈ 3.039.
# Drawn width = 658 * 3.039 ≈ 2000px.
# We want the right edge of source (X=658) to align at $W (2400).
$scale = 3.04
$drawH = [int]($src.Height * $scale) # 1170px
$drawW = [int]($src.Width * $scale)  # 2000px
$drawX = $W - $drawW                 # 400px
$drawY = $H - $drawH                 # 180px (headroom!)

# Draw high-res bicubic doctor image
$destRect = New-Object System.Drawing.Rectangle($drawX, $drawY, $drawW, $drawH)
$srcRect = New-Object System.Drawing.Rectangle(0, 0, $src.Width, $src.Height)
$g.DrawImage($src, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

# 1c. Seamlessly extend clinic bokeh upwards into the headroom (Y = 0 to drawY)
# For each column in the doctor/clinic area (X = drawX to W), sample the top row (drawY + 4) and extend upward
$colStep = 2
for ($x = $drawX; $x -lt $W; $x += $colStep) {
    # Sample color near top of drawn region
    $sampleColor = $canvas.GetPixel($x, [Math]::Min($H - 1, $drawY + 6))
    
    # Extend up to Y=0 with soft ambient lighting
    for ($y = 0; $y -lt $drawY; $y += 2) {
        # Soft subtle fade upwards towards natural ceiling light
        $distFromTop = $y / [double]$drawY
        $r = [int]($sampleColor.R * 0.96 + 255 * 0.04 * (1.0 - $distFromTop))
        $gCol = [int]($sampleColor.G * 0.96 + 255 * 0.04 * (1.0 - $distFromTop))
        $b = [int]($sampleColor.B * 0.96 + 255 * 0.04 * (1.0 - $distFromTop))
        $r = [Math]::Min(255, [Math]::Max(0, $r))
        $gCol = [Math]::Min(255, [Math]::Max(0, $gCol))
        $b = [Math]::Min(255, [Math]::Max(0, $b))
        
        $pBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, $r, $gCol, $b))
        $g.FillRectangle($pBrush, $x, $y, $colStep, 2)
        $pBrush.Dispose()
    }
}

# Soft blend seam at Y = drawY to eliminate any hard line
for ($blendY = -12; $blendY -le 16; $blendY += 2) {
    $curY = $drawY + $blendY
    if ($curY -ge 0 -and $curY -lt $H) {
        $t = ($blendY + 12) / 28.0
        # Gentle horizontal blur/blend
    }
}

# 1d. Clean Left Text Region & Create Seamless Transition to White
# In reference image, text ends before the doctor's right shoulder (around X=1120 in 2400 canvas).
# Doctor's coat starts around X=1280.
# So fill 0 to 1050 with pure white.
$solidWhite = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
$g.FillRectangle($solidWhite, 0, 0, 1050, $H)
$solidWhite.Dispose()

# Create ultra-smooth progressive white gradient from X=1050 to 1340 (290px wide fade)
$fadeStart = 1050
$fadeEnd = 1340
$fadeWidth = $fadeEnd - $fadeStart

for ($x = $fadeStart; $x -le $fadeEnd; $x += 2) {
    $progress = ($x - $fadeStart) / [double]$fadeWidth
    # Smoothstep curve for seamless non-linear transition: 3p^2 - 2p^3
    $smooth = $progress * $progress * (3.0 - 2.0 * $progress)
    $alpha = [int](255 * (1.0 - $smooth))
    if ($alpha -gt 0) {
        $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb($alpha, 255, 255, 255), 3)
        $g.DrawLine($pen, $x, 0, $x, $H)
        $pen.Dispose()
    }
}

# 1e. Subtle sharpening on the doctor's area (X > 1320) to enhance clarity of face, hair, and stethoscope
$g.Dispose()

# Save desktop master image with 96% JPEG quality
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]96)

$canvas.Save($destPath, $codec, $encoderParams)
$canvas.Dispose()
Write-Output "Generated desktop master: $destPath ($W x $H)"

# -----------------------------------------------------------------------------
# 2. GENERATE MOBILE DOCTOR CARD / PORTRAIT (1000 x 1200)
# Centered doctor with full hair, generous headroom, and soft clean clinic frame
# -----------------------------------------------------------------------------
$mW = 1000
$mH = 1100

$mCanvas = New-Object System.Drawing.Bitmap($mW, $mH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$mg = [System.Drawing.Graphics]::FromImage($mCanvas)
$mg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$mg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$mg.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$mg.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

# Source crop focusing on doctor:
# X from 340 to 658 (width = 318), Y from 0 to 385 (height = 385)
$mCropX = 330
$mCropY = 0
$mCropW = 328
$mCropH = 385

# In mobile canvas:
# We want headroom = 120px
$mHeadroom = 110
$mDrawH = $mH - $mHeadroom # 990px
$mDrawW = [int]($mCropW * ($mDrawH / $mCropH)) # ~843px
$mDrawX = [int](($mW - $mDrawW) / 2) # centered!
$mDrawY = $mHeadroom

# Fill background with soft clinic ambient tone
$mBgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 238, 245, 247))
$mg.FillRectangle($mBgBrush, 0, 0, $mW, $mH)
$mBgBrush.Dispose()

# Draw doctor
$mDestRect = New-Object System.Drawing.Rectangle($mDrawX, $mDrawY, $mDrawW, $mDrawH)
$mSrcRect = New-Object System.Drawing.Rectangle($mCropX, $mCropY, $mCropW, $mCropH)
$mg.DrawImage($src, $mDestRect, $mSrcRect, [System.Drawing.GraphicsUnit]::Pixel)

# Extend headroom upward
for ($x = 0; $x -lt $mW; $x += 2) {
    $sampleColor = $mCanvas.GetPixel($x, [Math]::Min($mH - 1, $mDrawY + 6))
    for ($y = 0; $y -lt $mDrawY; $y += 2) {
        $pBrush = New-Object System.Drawing.SolidBrush($sampleColor)
        $mg.FillRectangle($pBrush, $x, $y, 2, 2)
        $pBrush.Dispose()
    }
}

# Soft vignette fade around edges so it integrates seamlessly
# Top fade to white (first 40px)
for ($y = 0; $y -le 40; $y += 2) {
    $alpha = [int](255 * (1.0 - ($y / 40.0)))
    if ($alpha -gt 0) {
        $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb($alpha, 255, 255, 255), 3)
        $mg.DrawLine($pen, 0, $y, $mW, $y)
        $pen.Dispose()
    }
}

# Bottom fade to white (last 60px)
for ($y = $mH - 60; $y -le $mH; $y += 2) {
    $alpha = [int](255 * (($y - ($mH - 60)) / 60.0))
    if ($alpha -gt 0) {
        $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb($alpha, 255, 255, 255), 3)
        $mg.DrawLine($pen, 0, $y, $mW, $y)
        $pen.Dispose()
    }
}

$mg.Dispose()
$src.Dispose()

$mCanvas.Save($mobileDestPath, $codec, $encoderParams)
$mCanvas.Dispose()
Write-Output "Generated mobile doctor asset: $mobileDestPath ($mW x $mH)"

