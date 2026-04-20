Param(
  [string]$Version = "",
  [ValidateSet("major","minor","patch")]
  [string]$Bump = ""
)

function Fail($msg) { Write-Error $msg; exit 1 }
function Run($cmd, $err) { Write-Host "-> $cmd"; iex $cmd; if ($LASTEXITCODE -ne 0) { Fail $err } }

function Get-RepoSlug {
  $url = (git remote get-url origin).Trim()
  if ($url -match 'github\.com[:/](.+?)(\.git)?$') { return $Matches[1] }
  return ""
}

# --- Pre-checks ---
if (-not (Get-Command git -EA SilentlyContinue)) { Fail "git no esta en PATH" }
if (-not (Get-Command npm -EA SilentlyContinue)) { Fail "npm no esta en PATH" }
if (-not (Test-Path package.json)) { Fail "No se encontro package.json" }
if (git status --porcelain) { Fail "Working tree sucio. Haz commit/stash antes." }
$branch = git rev-parse --abbrev-ref HEAD
if ($branch -ne "main") { Fail "No estas en 'main' (actual: $branch)." }

Run "git pull --rebase origin main" "git pull --rebase fallo"

# --- Capturar tag anterior ---
$prevTag = ""
try { $prevTag = (git describe --tags --abbrev=0 2>$null) } catch {}

# --- QA previo ---
$pkg = Get-Content package.json | ConvertFrom-Json
$hasTest  = $pkg.PSObject.Properties.Name -contains "scripts" -and $pkg.scripts.PSObject.Properties.Name -contains "test"
$hasBuild = $pkg.PSObject.Properties.Name -contains "scripts" -and $pkg.scripts.PSObject.Properties.Name -contains "build"
if ($hasTest)  { Run "npm test" "Tests fallaron" }
if ($hasBuild) { Run "npm run build" "Build fallo (pre-version)" }

# --- Versionar ---
if ([string]::IsNullOrWhiteSpace($Version)) {
  if ([string]::IsNullOrWhiteSpace($Bump)) { Fail "Pasa -Version 1.0.0 o -Bump major|minor|patch" }
  Run "npm version $Bump -m 'chore(release): v%s'" "npm version $Bump fallo"
  $pkg = Get-Content package.json | ConvertFrom-Json
  $Version = $pkg.version
} else {
  if ($Version -notmatch '^\d+\.\d+\.\d+(-[0-9A-Za-z\.-]+)?$') { Fail "Version invalida: $Version (SemVer)" }
  Run "npm version $Version -m 'chore(release): v$Version'" "npm version $Version fallo"
}
$newTag = "v$Version"

# --- Re-build post-version ---
if ($hasBuild) { Run "npm run build" "Build fallo (post-version)" }

# --- Changelog ---
Write-Host "-> Actualizando CHANGELOG.md..."
$repoSlug = Get-RepoSlug
$compareUrl = ""
if ($repoSlug -and $prevTag) { $compareUrl = "https://github.com/$repoSlug/compare/$prevTag...$newTag" }

$hasConventional = $false
try {
  & npx --yes conventional-changelog -p angular -i CHANGELOG.md -s -r 0 *> $null
  if ($LASTEXITCODE -eq 0) { $hasConventional = $true }
} catch { $hasConventional = $false }

if (-not $hasConventional) {
  $header = "## $newTag - $(Get-Date -Format 'yyyy-MM-dd')"
  $range = if ($prevTag) { "$prevTag..HEAD" } else { "" }
  $commits = if ($range) { git log $range --pretty="* %s (%h)" } else { git log --pretty="* %s (%h)" }

  if (-not (Test-Path CHANGELOG.md)) { "" | Out-File -Encoding UTF8 CHANGELOG.md }
  $content = Get-Content CHANGELOG.md -Raw

  # Se eliminan los emojis para evitar el ParserError de Windows
  $linkBlock = if ($compareUrl) { "`r`n`r`n**Comparacion:** $compareUrl" } else { "" }
  $newSection = ($header + "`r`n`r`n" + ($commits -join "`r`n") + $linkBlock + "`r`n`r`n")
  $newSection + $content | Out-File -Encoding UTF8 CHANGELOG.md

  git add CHANGELOG.md
  Run "git commit -m 'docs(changelog): $newTag'" "commit de CHANGELOG fallo"
}

# --- Push rama + tags ---
Run "git push origin main --follow-tags" "git push fallo"

# --- Crear Release ---
if (Get-Command gh -EA SilentlyContinue) {
  try {
    $releaseBody = ""
    if (Test-Path CHANGELOG.md) {
      $cl = Get-Content CHANGELOG.md -Raw
      $escapedTag = [regex]::Escape($newTag)
      $pattern = "## $escapedTag.*?(?:(?=\r?\n## )|\Z)"
      $m = [regex]::Match($cl, $pattern, "Singleline")
      if ($m.Success) { $releaseBody = $m.Value.Trim() }
    }
    if ($compareUrl -and ($releaseBody -notmatch [regex]::Escape($compareUrl))) {
      $releaseBody += "`r`n`r`n**Comparacion:** $compareUrl"
    }
    Write-Host "-> Creando Release $newTag (gh)..."
    if ([string]::IsNullOrWhiteSpace($releaseBody)) {
      Run "gh release create '$newTag' -t '$newTag' -n 'Release $newTag'" "gh release fallo"
    } else {
      $tmp = New-TemporaryFile; $releaseBody | Out-File -Encoding UTF8 $tmp
      Run "gh release create '$newTag' -t '$newTag' -F $tmp" "gh release fallo"
      Remove-Item $tmp -Force
    }
  } catch { Write-Warning "No se pudo crear el Release con gh: $($_.Exception.Message)" }
} else {
  if ($compareUrl) { Write-Host "Compare: $compareUrl" }
  Write-Host "Si quieres Release en GitHub: gh release create $newTag -F CHANGELOG.md -t '$newTag'"
}

Write-Host "Release listo: $newTag"