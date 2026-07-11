# Tiny static file server (no Python/Node needed).
# Usage:  powershell -ExecutionPolicy Bypass -File serve.ps1 [-Port 8321]
# Then open http://localhost:8321/toybox-tactics.html  (or chameleon3d.html)
param(
  [int]$Port = 8321
)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$mime = @{
  '.html'='text/html; charset=utf-8'; '.js'='text/javascript; charset=utf-8'
  '.css'='text/css; charset=utf-8';   '.json'='application/json'
  '.glb'='model/gltf-binary';         '.gltf'='model/gltf+json'
  '.png'='image/png'; '.jpg'='image/jpeg'; '.jpeg'='image/jpeg'; '.svg'='image/svg+xml'
  '.mp3'='audio/mpeg'; '.m4a'='audio/mp4'; '.wav'='audio/wav'; '.ico'='image/x-icon'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $root at http://localhost:$Port/  (Ctrl+C to stop)"

while ($listener.IsListening) {
  try { $ctx = $listener.GetContext() } catch { break }
  $req = $ctx.Request
  $res = $ctx.Response
  try {
    $rel = [Uri]::UnescapeDataString($req.Url.AbsolutePath).TrimStart('/')
    if ($rel -eq '') { $rel = 'index.html' }
    # debug screenshot drop: POST a data-URL body to /__shot, lands in .tt-shot.jpg
    if ($req.HttpMethod -eq 'POST' -and $rel -eq '__shot') {
      $reader = New-Object IO.StreamReader($req.InputStream, $req.ContentEncoding)
      $body = $reader.ReadToEnd()
      $b64 = $body.Substring($body.IndexOf(',') + 1)
      [IO.File]::WriteAllBytes((Join-Path $root '.tt-shot.jpg'), [Convert]::FromBase64String($b64))
      $bytes = [Text.Encoding]::UTF8.GetBytes('ok')
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
      $res.OutputStream.Close()
      continue
    }
    $path = Join-Path $root $rel
    $full = [IO.Path]::GetFullPath($path)
    if (-not $full.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path $full -PathType Leaf)) {
      $res.StatusCode = 404
      $bytes = [Text.Encoding]::UTF8.GetBytes('404 Not Found')
    } else {
      $ext = [IO.Path]::GetExtension($full).ToLower()
      $res.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
      # stale JS/HTML from heuristic caching breaks the game after updates:
      # code files always revalidate; big assets get 304s via Last-Modified
      $res.Headers.Add('Cache-Control', 'no-cache')
      $res.Headers.Add('Access-Control-Allow-Origin', '*')
      $lastMod = [IO.File]::GetLastWriteTimeUtc($full)
      $res.Headers.Add('Last-Modified', $lastMod.ToString('R'))
      $ims = $req.Headers['If-Modified-Since']
      $imsDate = [DateTime]::MinValue
      if ($ims -and [DateTime]::TryParse($ims, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal, [ref]$imsDate) -and $lastMod -le $imsDate.AddSeconds(1)) {
        $res.StatusCode = 304
        $bytes = [byte[]]@()
      } else {
        $bytes = [IO.File]::ReadAllBytes($full)
      }
    }
    $res.ContentLength64 = $bytes.Length
    $res.OutputStream.Write($bytes, 0, $bytes.Length)
  } catch {
    try { $res.StatusCode = 500 } catch {}
  } finally {
    try { $res.OutputStream.Close() } catch {}
  }
}
