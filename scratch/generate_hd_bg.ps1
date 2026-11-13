Add-Type -AssemblyName System.Drawing

$srcPath = "c:\Users\lariz\OneDrive\Desktop\Antigravity Proyectos\Web Normatika\assets\candidate-6749778.jpg"
$destPath = "c:\Users\lariz\OneDrive\Desktop\Antigravity Proyectos\Web Normatika\assets\hero-bg-reference.jpg"

$src = [System.Drawing.Image]::FromFile($srcPath)

# Desired dimensions: 2400 x 1260 (high-res 16:8.4 ratio)
$W = 2400
$H = 1260

$canvas = New-Object System.Drawing.Bitmap($W, $H)
$g = [System.Drawing.Graphics]::FromImage($canvas)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

# 1. Fill base with white
$brushWhite = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
$g.FillRectangle($brushWhite, 0, 0, $W, $H)

# 2. Draw Doctor onto the right side
# In candidate-6749778.jpg:
# Headroom starts at Y=100. Doctor's hair is at Y=350.
# Arms crossed bottom is around Y=2650.
# Doctor torso width is X=550 to X=2150 (width = 1600).
# Clinic background to the right goes to X=2560.
# So crop: X=450, Y=120, Width=2110, Height=2550
$cropX = 450
$cropY = 120
$cropW = 2110
$cropH = 2550

# We want her positioned so her center is at ~72% of canvas width (X ≈ 1720)
# Her head at ~1720, headroom at top = 50px, waist at bottom = 1260px.
# Scaling factor: Height = 1260. Source height = 2550 -> scale = 1260 / 2550 ≈ 0.494
# Target width = 2110 * 0.494 ≈ 1042px.
# Let's draw from X = (2400 - 1100) = 1300 to 2400?
# Wait, let's make her slightly larger and extend to the right edge:
$destH = $H
$destW = [int]($cropW * ($destH / $cropH) * 1.15)
$destX = $W - $destW + 50
$destY = 0

$srcRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)
$destRect = New-Object System.Drawing.Rectangle($destX, $destY, $destW, $destH)

$g.DrawImage($src, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

# 3. Apply smooth gradient fade from left to right over the doctor's left side (viewer's left)
# We want clean white from X=0 to X=950.
# From X=950 to X=1450, we fade smoothly from white to transparent.
# At X >= 1500, the doctor's face and arms are 100% uncovered!
$fadeStart = [int]($W * 0.38) # ~912
$fadeEnd = [int]($W * 0.62)   # ~1488

# Draw vertical strips for smooth gradient
for ($x = $fadeStart; $x -le $fadeEnd; $x += 2) {
    $t = ($x - $fadeStart) / ($fadeEnd - $fadeStart) # 0 to 1
    # Smooth easing curve (Hermite / smoothstep)
    $smoothT = $t * $t * (3.0 - 2.0 * $t)
    $alpha = [int](255 * (1.0 - $smoothT))
    if ($alpha -gt 0) {
        $color = [System.Drawing.Color]::FromArgb($alpha, 255, 255, 255)
        $pen = New-Object System.Drawing.Pen($color, 3)
        $g.DrawLine($pen, $x, 0, $x, $H)
        $pen.Dispose()
    }
}

# Left block 0 to fadeStart is pure solid white
$g.FillRectangle($brushWhite, 0, 0, $fadeStart, $H)

# 4. Add subtle decorative brand watermark rings (matching the reference)
# Large soft teal ring behind doctor / right edge
$tealColor = [System.Drawing.Color]::FromArgb(20, 46, 196, 182) # very subtle 8% opacity
$tealPen = New-Object System.Drawing.Pen($tealColor, 35)
$g.DrawEllipse($tealPen, 1500, 100, 900, 900)
$tealPen2 = New-Object System.Drawing.Pen($tealColor, 20)
$g.DrawEllipse($tealPen2, 1650, 250, 600, 600)

# Subtle organic curve in top right
$tealPen3 = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(15, 46, 196, 182), 50)
$g.DrawArc($tealPen3, 1900, -200, 700, 700, 0, 360)

# Clean up
$brushWhite.Dispose()
$tealPen.Dispose()
$tealPen2.Dispose()
$tealPen3.Dispose()
$g.Dispose()
$src.Dispose()

# Save with high JPEG quality (95)
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]95)

$canvas.Save($destPath, $codec, $encoderParams)
$canvas.Dispose()

Write-Output "Successfully generated $destPath"

