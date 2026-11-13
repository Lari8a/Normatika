Add-Type -AssemblyName System.Drawing

$srcPath = "c:\Users\lariz\OneDrive\Desktop\Antigravity Proyectos\Web Normatika\assets\doctora-hero-clean-bg.jpg"
$destPath = "c:\Users\lariz\OneDrive\Desktop\Antigravity Proyectos\Web Normatika\assets\doctora-hero-50-50.jpg"

$src = [System.Drawing.Bitmap]::FromFile($srcPath)
Write-Output "Source size: $($src.Width) x $($src.Height)"

# Desired output dimensions for 50% right column (width: 900, height: 768)
# We want the doctor and her right-side clinic:
# From source (1376 x 768):
# Crop X from 476 to 1376 (width = 900, height = 768)
$cropX = 476
$cropY = 0
$cropW = 900
$cropH = 768

$canvas = New-Object System.Drawing.Bitmap($cropW, $cropH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($canvas)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

# 1. Fill base with white
$brushWhite = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
$g.FillRectangle($brushWhite, 0, 0, $cropW, $cropH)
$brushWhite.Dispose()

# 2. Draw cropped doctor image
$destRect = New-Object System.Drawing.Rectangle(0, 0, $cropW, $cropH)
$srcRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)
$g.DrawImage($src, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

# 3. Apply smooth white gradient on the left 260px (from X=0 to X=260)
# Doctor's coat starts around X=350, so her face (at X~650) is never touched!
$fadeWidth = 260
for ($x = 0; $x -le $fadeWidth; $x += 2) {
    $progress = $x / [double]$fadeWidth
    # Smoothstep curve: 3p^2 - 2p^3
    $smooth = $progress * $progress * (3.0 - 2.0 * $progress)
    $alpha = [int](255 * (1.0 - $smooth))
    if ($alpha -gt 0) {
        $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb($alpha, 255, 255, 255), 3)
        $g.DrawLine($pen, $x, 0, $x, $cropH)
        $pen.Dispose()
    }
}

# 4. Soft blend at the very top (first 20px) to pure white
for ($y = 0; $y -le 20; $y += 2) {
    $alpha = [int](255 * (1.0 - ($y / 20.0)))
    if ($alpha -gt 0) {
        $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb($alpha, 255, 255, 255), 3)
        $g.DrawLine($pen, 0, $y, $cropW, $y)
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

Write-Output "Successfully created $destPath ($cropW x $cropH)"

