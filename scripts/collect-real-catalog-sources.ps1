$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$source = Get-Content -Raw -LiteralPath (Join-Path $projectRoot "app\lib\catalog-expansion.ts")
$block = [regex]::Match($source, 'const seeds: ProductSeed\[\] = \[([\s\S]*?)\r?\n\];').Groups[1].Value
$products = [System.Collections.Generic.List[object]]::new()
foreach ($line in ($block -split "`r?`n")) {
  $match = [regex]::Match($line, '^\s+\[(.*)\],?$')
  if (-not $match.Success) { continue }
  $values = ConvertFrom-Json ("[" + $match.Groups[1].Value + "]")
  $products.Add([pscustomobject]@{ slug=$values[0]; genericName=$values[1]; dosageForm=$values[4]; strength=$values[5] })
}
if ($products.Count -ne 50) { throw "Expected 50 products, found $($products.Count)" }

function Get-Candidates([object]$product, [string]$query) {
  $uri = 'https://www.bing.com/images/search?q=' + [uri]::EscapeDataString($query) + '&form=HDRSC2&setlang=en-US&cc=IN&adlt=strict'
  $html = (Invoke-WebRequest -UseBasicParsing -Uri $uri -Headers @{'Accept-Language'='en-US,en;q=0.9'}).Content
  $tokens = @($product.genericName.ToLowerInvariant() -split '[^a-z0-9]+' | Where-Object { $_.Length -ge 4 -and $_ -notin @('paediatric','multimineral') })
  $required = [Math]::Min(2, $tokens.Count)
  $strengthTokens = @($product.strength.Replace(',', '') -split '[^0-9.]+' | Where-Object { $_ })
  $results = [System.Collections.Generic.List[object]]::new()
  foreach ($match in [regex]::Matches($html, 'm="(\{&quot;[^>]+?\})"')) {
    try { $item = ConvertFrom-Json ([System.Net.WebUtility]::HtmlDecode($match.Groups[1].Value)) } catch { continue }
    if (-not $item.murl -or -not $item.purl -or $item.murl -notmatch '^https?://' -or $item.murl -match '\.(svg|gif)(\?|$)') { continue }
    $haystack = (($item.t + ' ' + $item.murl + ' ' + $item.purl).ToLowerInvariant().Replace(',', ''))
    if ($haystack -match 'porn|adult|sex|pinterest|wallpaper|clipart|chemical.structure|molecular|formula|diagram') { continue }
    $matched = @($tokens | Where-Object { $haystack.Contains($_) }).Count
    if ($matched -lt $required) { continue }
    $score = ($matched * 10)
    if (@($strengthTokens | Where-Object { $haystack.Contains($_) }).Count -gt 0) { $score += 6 }
    if ($haystack.Contains(($product.dosageForm.ToLowerInvariant() -split ' ')[0])) { $score += 4 }
    if ($haystack -match 'tablet|capsule|cream|ointment|syrup|suspension|inhaler|sachet|drops|lotion|bottle|pack|strip|blister') { $score += 4 }
    $results.Add([pscustomobject]@{ murl=$item.murl; turl=$item.turl; purl=$item.purl; title=$item.t; score=$score })
  }
  return @($results | Sort-Object score -Descending)
}

$manifest = [ordered]@{}
for ($index = 0; $index -lt $products.Count; $index++) {
  $product = $products[$index]
  $query = $product.genericName + ' ' + $product.strength + ' ' + $product.dosageForm + ' medicine pack India'
  $candidates = @(Get-Candidates $product $query)
  if ($candidates.Count -lt 2) { $candidates += @(Get-Candidates $product ($product.genericName + ' medicine packaging blister bottle')) }
  $selected = [System.Collections.Generic.List[object]]::new()
  foreach ($candidate in $candidates) {
    if (@($selected | Where-Object { $_.murl -eq $candidate.murl }).Count -gt 0) { continue }
    $selected.Add($candidate)
    if ($selected.Count -eq 2) { break }
  }
  if ($selected.Count -lt 2) { throw "Fewer than two verified candidates for $($product.slug)" }
  $manifest[$product.slug] = @($selected)
  Write-Output ("[{0}/50] {1}: {2}" -f ($index + 1), $product.slug, (($selected | ForEach-Object { $_.title }) -join ' || '))
}
$manifestPath = Join-Path $projectRoot '.openai\catalog-photo-manifest.json'
$manifest | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $manifestPath -Encoding utf8
Write-Output $manifestPath
