$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$publicPath = Join-Path $PSScriptRoot '..\public'
$sourcePath = Join-Path $publicPath 'thoorigai-logo.png'
$source = [System.Drawing.Image]::FromFile($sourcePath)
$svg = @"
<svg xmlns="http://www.w3.org/2000/svg" width="$($source.Width)" height="$($source.Height)" viewBox="0 0 $($source.Width) $($source.Height)"><image width="100%" height="100%" href="/thoorigai-logo.png"/></svg>
"@
[System.IO.File]::WriteAllText((Join-Path $publicPath 'icon.svg'), $svg.Trim())

foreach ($target in @(
  @{ Name = 'favicon-32x32.png'; Size = 32 },
  @{ Name = 'icon-light-32x32.png'; Size = 32 },
  @{ Name = 'icon-dark-32x32.png'; Size = 32 },
  @{ Name = 'apple-icon.png'; Size = 180 }
)) {
  $bitmap = [System.Drawing.Bitmap]::new($target.Size, $target.Size)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.Clear([System.Drawing.Color]::Transparent)
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $scale = [Math]::Min($target.Size / $source.Width, $target.Size / $source.Height)
  $width = [int]($source.Width * $scale)
  $height = [int]($source.Height * $scale)
  $graphics.DrawImage($source, [int](($target.Size - $width) / 2), [int](($target.Size - $height) / 2), $width, $height)
  $bitmap.Save((Join-Path $publicPath $target.Name), [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $bitmap.Dispose()
}

$faviconBytes = [System.IO.File]::ReadAllBytes((Join-Path $publicPath 'favicon-32x32.png'))
$stream = [System.IO.MemoryStream]::new()
$writer = [System.IO.BinaryWriter]::new($stream)
$writer.Write([UInt16]0)
$writer.Write([UInt16]1)
$writer.Write([UInt16]1)
$writer.Write([Byte]32)
$writer.Write([Byte]32)
$writer.Write([Byte]0)
$writer.Write([Byte]0)
$writer.Write([UInt16]1)
$writer.Write([UInt16]32)
$writer.Write([UInt32]$faviconBytes.Length)
$writer.Write([UInt32]22)
$writer.Write($faviconBytes)
[System.IO.File]::WriteAllBytes((Join-Path $publicPath 'favicon.ico'), $stream.ToArray())
$writer.Dispose()
$stream.Dispose()
$source.Dispose()
Write-Output 'Generated branded SVG, PNG icons and ICO from public/thoorigai-logo.png'
