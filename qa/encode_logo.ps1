$logoPath = "c:\Users\PC\Desktop\OCCITOUR- INTERFAZ\Interfaz-Grafica\public\logo.png"
$outPath = "c:\Users\PC\Desktop\OCCITOUR- INTERFAZ\Interfaz-Grafica\qa\logo_base64.txt"
$bytes = [System.IO.File]::ReadAllBytes($logoPath)
$base64 = [System.Convert]::ToBase64String($bytes)
[System.IO.File]::WriteAllText($outPath, $base64)
Write-Host "OK length: $($base64.Length)"
