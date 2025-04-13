# Simple wrapper script for run-gource.js with default for rendering in 4K

# Get directory paths
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir

# Check for required tools
function Check-Command($cmdName) {
    try {
        if (Get-Command $cmdName -ErrorAction Stop) { return $true }
    }
    catch {
        Write-Host "Error: $cmdName is required but not installed." -ForegroundColor Red
        return $false
    }
}

# Check for required tools
$hasNode = Check-Command "node"
$hasFFmpeg = Check-Command "ffmpeg"
$hasGource = Check-Command "gource"

if (-not ($hasNode -and $hasFFmpeg -and $hasGource)) {
    exit 1
}

# Set default timestamp
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$outputFile = Join-Path -Path $projectRoot -ChildPath "exports\renders\gource-$timestamp.mp4"

# Default values
$logFile = $null
$preset = "4k"
$timeRange = $null

# Helper function to show usage
function Show-Help {
    Write-Host "Gource Rendering Script"
    Write-Host "Usage: $($MyInvocation.MyCommand.Name) [options] <log-file>"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Preset <preset>    Use a preset (hd, 4k, preview)"
    Write-Host "  -Output <file>      Specify output file"
    Write-Host "  -TimeRange <range>  Time range (week, month, year)"
    Write-Host "  -Help               Show this help"
    Write-Host ""
    Write-Host "Example:"
    Write-Host "  $($MyInvocation.MyCommand.Name) -Preset hd -TimeRange month logs\project.log"
    exit 0
}

# Parse command line parameters
[CmdletBinding()]
param(
    [Parameter(ValueFromRemainingArguments=$true)]
    $RemainingArgs,
    
    [string]$Preset,
    [string]$Output,
    [string]$TimeRange,
    [switch]$Help
)

# Show help if requested
if ($Help) {
    Show-Help
}

# Process named parameters
if ($Preset) {
    $preset = $Preset
}

if ($Output) {
    $outputFile = $Output
}

if ($TimeRange) {
    $timeRange = $TimeRange
}

# Process remaining arguments (log file)
if ($RemainingArgs -and $RemainingArgs.Count -gt 0) {
    $logFile = $RemainingArgs[$RemainingArgs.Count - 1]
}

# Check for log file
if (-not $logFile) {
    Write-Host "Error: No log file specified" -ForegroundColor Red
    Show-Help
}

# Build the command
$cmd = "node `"$scriptDir\run-gource.js`""

# Add options
$cmd += " --preset $preset"
$cmd += " --output `"$outputFile`""

if ($timeRange) {
    $cmd += " --time-range $timeRange"
}

# Add log file
$cmd += " `"$logFile`""

# Echo the command to be executed
Write-Host "Executing: $cmd" -ForegroundColor Cyan

# Execute the command
Invoke-Expression $cmd

exit $LASTEXITCODE 