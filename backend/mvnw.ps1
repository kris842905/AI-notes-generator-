$MavenVersion = "3.9.6"
$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$MavenDir = Join-Path $ProjectDir ".maven"
$MvnHome = Join-Path $MavenDir "apache-maven-$MavenVersion"
$MvnCmd = Join-Path $MvnHome "bin\mvn.cmd"

if (-not (Test-Path $MvnCmd)) {
    Write-Host "Local Maven distribution not found. Downloading Apache Maven $MavenVersion..."
    $Url = "https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/$MavenVersion/apache-maven-$MavenVersion-bin.zip"
    
    if (-not (Test-Path $MavenDir)) {
        New-Item -ItemType Directory -Path $MavenDir | Out-Null
    }
    
    $ZipFile = Join-Path $MavenDir "maven.zip"
    Write-Host "Downloading Maven from $Url..."
    Invoke-WebRequest -Uri $Url -OutFile $ZipFile
    
    Write-Host "Extracting Maven package..."
    Expand-Archive -Path $ZipFile -DestinationPath $MavenDir
    Remove-Item $ZipFile
    Write-Host "Maven downloaded and configured successfully!"
}

# Forward all arguments to Maven command
$argList = @()
foreach ($arg in $args) {
    $argList += $arg
}

if ($argList.Length -eq 0) {
    & $MvnCmd
} else {
    & $MvnCmd $argList
}

exit $LASTEXITCODE
