# Script para generar el .doc con el logo embebido en base64
$logoPath = "c:\Users\PC\Desktop\OCCITOUR- INTERFAZ\Interfaz-Grafica\public\logo.png"
$outDoc = "c:\Users\PC\Desktop\OCCITOUR- INTERFAZ\Interfaz-Grafica\qa\Reporte_QA_Occitours_Completo.doc"

# Leer logo y convertir a base64
$bytes = [System.IO.File]::ReadAllBytes($logoPath)
$base64 = [System.Convert]::ToBase64String($bytes)
$logoDataUri = "data:image/png;base64,$base64"

# Leer el archivo .doc actual
$content = [System.IO.File]::ReadAllText($outDoc, [System.Text.Encoding]::UTF8)

# Reemplazar la referencia file:// por el data URI base64
$oldSrc = 'src="file:///c:/Users/PC/Desktop/OCCITOUR-%20INTERFAZ/Interfaz-Grafica/public/logo.png" alt="Logo Occitours" style="width: 220px; height: auto; border: none; background: transparent; display: inline-block;"'
$newSrc = "src=`"$logoDataUri`" alt=`"Logo Occitours`" style=`"width: 350px; height: auto; border: 0; border-style: none; outline: none; background: none; padding: 0; margin: 0 auto; display: block;`""

$content = $content.Replace($oldSrc, $newSrc)

# Guardar
[System.IO.File]::WriteAllText($outDoc, $content, [System.Text.Encoding]::UTF8)
Write-Host "OK - Logo embebido en base64 (350px, sin bordes) en el documento .doc"
