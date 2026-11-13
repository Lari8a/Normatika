Add-Type -AssemblyName System.Drawing

$srcPath = "c:\Users\lariz\OneDrive\Desktop\Antigravity Proyectos\Web Normatika\assets\candidate-6749778.jpg"
$destPath = "c:\Users\lariz\OneDrive\Desktop\Antigravity Proyectos\Web Normatika\assets\doctora-hero-mobile.jpg"

$src = [System.Drawing.Image]::FromFile($srcPath)

# Mobile portrait: 800 x 900 px
# Headroom starts at Y=120, hair at Y=350, waist/arms at Y=2550
# Torso width: X=500 to 2150 (width = 1650)
$cropX = 480
$cropY = 120
$cropW = 1680
$cropH = 2450

$W = 800
$H = [int]($cropH * ($W / $cropW)) # ~1166

$canvas = New-Object System.Drawing.Bitmap($W, $H)
$g = [System.Drawing.Graphics]::FromImage($canvas)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

$srcRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)
$destRect = New-Object System.Drawing.Rectangle(0, 0, $W, $H)

$g.DrawImage($src, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

$g.Dispose()
$src.Dispose()

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]95)

$canvas.Save($destPath, $codec, $encoderParams)
$canvas.Dispose()

Write-Output "Successfully generated $destPath ($W x $H)"

