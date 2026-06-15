Add-Type -AssemblyName System.Drawing

$inputFile = 'C:\Users\pablo\VS Code Projects\Investments PY\build\icon.png'
$outputFile = 'C:\Users\pablo\VS Code Projects\Investments PY\build\icon.ico'

Write-Host "Loading image from: $inputFile"
$img = [System.Drawing.Image]::FromFile($inputFile)
$sizes = @(256, 64, 48, 32, 16)
$images = @()

foreach ($size in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($img, $size, $size)
    $imgMs = New-Object System.IO.MemoryStream
    $bmp.Save($imgMs, [System.Drawing.Imaging.ImageFormat]::Png)
    $images += ,@($size, $imgMs.ToArray())
    $bmp.Dispose()
}

$ms = New-Object System.IO.MemoryStream
$bw = New-Object System.IO.BinaryWriter($ms)

# ICO Header: reserved=0, type=1 (icon), count
$bw.Write([uint16]0)
$bw.Write([uint16]1)
$bw.Write([uint16]$images.Count)

# Calculate initial offset: header(6) + directory entries (16 bytes each)
$offset = 6 + ($images.Count * 16)

# Write directory entries
foreach ($entry in $images) {
    $size = $entry[0]
    $data = $entry[1]
    $w = if ($size -ge 256) { [byte]0 } else { [byte]$size }
    $bw.Write($w)           # Width
    $bw.Write($w)           # Height
    $bw.Write([byte]0)      # Color count (0 = no palette)
    $bw.Write([byte]0)      # Reserved
    $bw.Write([uint16]1)    # Color planes
    $bw.Write([uint16]32)   # Bits per pixel
    $bw.Write([uint32]$data.Length)  # Size of image data
    $bw.Write([uint32]$offset)       # Offset of image data
    $offset += $data.Length
}

# Write image data blobs
foreach ($entry in $images) {
    $bw.Write($entry[1])
}

$bw.Flush()
[System.IO.File]::WriteAllBytes($outputFile, $ms.ToArray())
$ms.Dispose()
$img.Dispose()

Write-Host "SUCCESS: icon.ico created!"
$f = Get-Item $outputFile
Write-Host "File: $($f.FullName) | Size: $($f.Length) bytes"
