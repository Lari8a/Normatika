$pdfPath = "Paleta de colores Resolumed (1).pdf"
$bytes = [System.IO.File]::ReadAllBytes($pdfPath)
$text = [System.Text.Encoding]::ASCII.GetString($bytes)
$colorPattern = '#[0-9A-Fa-f]{6}'
$found = [regex]::Matches($text, $colorPattern)
$found | ForEach-Object { $_.Value } | Sort-Object -Unique

# Also search for RGB patterns like "0.xxx 0.xxx 0.xxx rg"
$rgbPattern = '(\d+\.\d+) (\d+\.\d+) (\d+\.\d+) rg'
$rgbFound = [regex]::Matches($text, $rgbPattern)
Write-Host "--- RGB values in PDF ---"
$rgbFound | ForEach-Object { $_.Value } | Select-Object -First 30
