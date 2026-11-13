Add-Type -AssemblyName System.Drawing

$srcPath = "c:\Users\lariz\OneDrive\Desktop\Antigravity Proyectos\Web Normatika\assets\candidate-6749778.jpg"
$destPath = "c:\Users\lariz\OneDrive\Desktop\Antigravity Proyectos\Web Normatika\assets\doctora-hero-hd.jpg"

$src = [System.Drawing.Image]::FromFile($srcPath)

# Source crop from candidate-6749778.jpg (2560 x 3840):
# X: 450 to 2250 (width = 1800)
# Y: 0 to 2600 (height = 2600)
# Hair top is at Y=350, so starting at Y=0 gives 350px of real clinic headroom.
# To give an even MORE open and airy feel, we add 180px of top headroom extension!

$cropX = 420
$cropY = 0
$cropW = 1840
$cropH = 2600

# Canvas output size: 1200 x 1800 (ratio 2:3, perfect for web medium portrait)
$outW = 1200
$outH = 1800

$topPad = 120 # extra headroom padding
$drawH = $outH - $topPad
$drawW = [int]($cropW * ($drawH / $cropH))
$drawX = [int](($outW - $drawW) / 2)
$drawY = $topPad

$canvas = New-Object System.Drawing.Bitmap($outW, $outH)
$g = [System.Drawing.Graphics]::FromImage($canvas)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

# 1. Fill base with top clinic bokeh color (R=222, G=230, B=232)
$bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 222, 230, 232))
$g.FillRectangle($bgBrush, 0, 0, $outW, $outH)
$bgBrush.Dispose()

# 2. Draw doctor
$srcRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)
$destRect = New-Object System.Drawing.Rectangle($drawX, $drawY, $drawW, $drawH)
$g.DrawImage($src, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

# 3. Softly blend the top 140px seamlessly
for ($y = 0; $y -le 140; $y += 2) {
    # Sample from drawY + 10 to blend upward
    $t = $y / 140.0
    $alpha = [int](255 * (1.0 - $t))
    if ($alpha -gt 0) {
        $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb($alpha, 222, 230, 232), 3)
        $g.DrawLine($pen, 0, $y, $outW, $y)
        $pen.Dispose()
    }
}

# 4. Seamless fade on the left edge into white (first 180px)
for ($x = 0; $x -le 180; $x += 2) {
    $t = $x / 180.0
    $smoothT = $t * $t * (3.0 - 2.0 * $t)
    $alpha = [int](255 * (1.0 - $smoothT))
    if ($alpha -gt 0) {
        $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb($alpha, 255, 255, 255), 3)
        $g.DrawLine($pen, $x, 0, $x, $outH)
        $pen.Dispose()
    }
}

# 5. Seamless fade on the bottom edge into white (last 100px)
$botStart = $outH - 100
for ($y = $botStart; $y -le $outH; $y += 2) {
    $t = ($y - $botStart) / 100.0
    $smoothT = $t * $t * (3.0 - 2.0 * $t)
    $alpha = [int](255 * $smoothT)
    if ($alpha -gt 0) {
        $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb($alpha, 255, 255, 255), 3)
        $g.DrawLine($pen, 0, $y, $outW, $y)
        $pen.Dispose()
    }
}

$g.Dispose()
$src.Dispose()

# Save with 95% quality JPEG
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]95)

$canvas.Save($destPath, $codec, $encoderParams)
$canvas.Dispose()

Write-Output "Successfully generated $destPath ($outW x $outH)"

