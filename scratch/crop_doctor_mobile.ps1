Add-Type -AssemblyName System.Drawing

$srcPath = "c:\Users\lariz\OneDrive\Desktop\Antigravity Proyectos\Web Normatika\assets\doctora-hero-clean-bg.jpg"
$destPath = "c:\Users\lariz\OneDrive\Desktop\Antigravity Proyectos\Web Normatika\assets\doctora-hero-mobile-compact.jpg"

$src = [System.Drawing.Bitmap]::FromFile($srcPath)

# Source size: 1376 x 768. Doctor is centered at X ≈ 1150.
# We crop X from 820 to 1376 (width = 556, height = 768).
$cropX = 820
$cropY = 0
$cropW = 556
$cropH = 768

# Output size: 600 x 680 (compact vertical portrait for mobile)
$outW = 600
$outH = 680

$canvas = New-Object System.Drawing.Bitmap($outW, $outH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($canvas)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

# 1. Fill base with white
$brushWhite = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
$g.FillRectangle($brushWhite, 0, 0, $outW, $outH)
$brushWhite.Dispose()

# 2. Draw doctor
$destRect = New-Object System.Drawing.Rectangle(0, 0, $outW, $outH)
$srcRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)
$g.DrawImage($src, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

# 3. Soft vignette / top and bottom fade
for ($y = 0; $y -le 24; $y += 2) {
    $alpha = [int](255 * (1.0 - ($y / 24.0)))
    if ($alpha -gt 0) {
        $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb($alpha, 255, 255, 255), 3)
        $g.DrawLine($pen, 0, $y, $outW, $y)
        $pen.Dispose()
    }
}

for ($y = $outH - 30; $y -le $outH; $y += 2) {
    $alpha = [int](255 * (($y - ($outH - 30)) / 30.0))
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

Write-Output "Successfully created $destPath ($outW x $outH)"

