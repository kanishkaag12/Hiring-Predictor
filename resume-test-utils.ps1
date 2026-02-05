# Quick Resume Testing Script for Windows

function Test-Resume {
    param(
        [Parameter(Mandatory=$true)]
        [string]$ResumeFile,
        
        [Parameter(Mandatory=$false)]
        [string]$UserId
    )
    
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║    🧪 RESUME SHORTLIST PREDICTION TEST                         ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    
    # Verify file exists
    if (-not (Test-Path $ResumeFile)) {
        Write-Host "❌ Resume file not found: $ResumeFile" -ForegroundColor Red
        return
    }
    
    Write-Host "📄 Resume: $ResumeFile" -ForegroundColor Green
    Write-Host "📦 Size: $((Get-Item $ResumeFile).Length / 1KB)KB" -ForegroundColor Green
    
    if ($UserId) {
        Write-Host "👤 User ID: $UserId" -ForegroundColor Green
    } else {
        Write-Host "👤 User ID: (auto-generated)" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "🚀 Running predictions..." -ForegroundColor Cyan
    Write-Host ""
    
    $args = @($ResumeFile)
    if ($UserId) {
        $args += $UserId
    }
    
    & npx tsx test-resume-predictions-standalone.ts @args
}

function Build-Project {
    Write-Host "🔨 Building project..." -ForegroundColor Cyan
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Build successful!" -ForegroundColor Green
    } else {
        Write-Host "❌ Build failed!" -ForegroundColor Red
    }
}

function Test-SingleResume {
    Write-Host ""
    Write-Host "═" * 70 -ForegroundColor Gray
    Write-Host "Quick Test: Testing single resume" -ForegroundColor Cyan
    Write-Host "═" * 70 -ForegroundColor Gray
    Write-Host ""
    
    $resume = Read-Host "Enter resume file path"
    $userId = Read-Host "Enter user ID (optional, press Enter to skip)"
    
    if ($userId) {
        Test-Resume -ResumeFile $resume -UserId $userId
    } else {
        Test-Resume -ResumeFile $resume
    }
}

function Test-MultipleResumes {
    Write-Host ""
    Write-Host "═" * 70 -ForegroundColor Gray
    Write-Host "Batch Test: Testing multiple resumes" -ForegroundColor Cyan
    Write-Host "═" * 70 -ForegroundColor Gray
    Write-Host ""
    
    $files = @()
    while ($true) {
        $file = Read-Host "Enter resume file (or 'done' to start testing)"
        if ($file -eq "done") { break }
        if (Test-Path $file) {
            $files += $file
            Write-Host "✅ Added: $file" -ForegroundColor Green
        } else {
            Write-Host "❌ File not found: $file" -ForegroundColor Red
        }
    }
    
    if ($files.Count -eq 0) {
        Write-Host "No files to test" -ForegroundColor Red
        return
    }
    
    Write-Host ""
    Write-Host "🚀 Testing $($files.Count) resume(s)..." -ForegroundColor Cyan
    Write-Host ""
    
    $index = 0
    foreach ($file in $files) {
        $index++
        Write-Host "[$index/$($files.Count)] Testing: $file" -ForegroundColor Yellow
        Test-Resume -ResumeFile $file
        Write-Host ""
        Write-Host "─" * 70 -ForegroundColor Gray
        Write-Host ""
    }
    
    Write-Host "✅ All tests complete!" -ForegroundColor Green
}

function Show-Help {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║    🧪 RESUME TESTING UTILITY                                  ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "AVAILABLE COMMANDS:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Test-Resume -ResumeFile <path> [-UserId <id>]" -ForegroundColor Green
    Write-Host "    Test a single resume file" -ForegroundColor Gray
    Write-Host "    Example: Test-Resume -ResumeFile uploads/resume.pdf" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Test-SingleResume" -ForegroundColor Green
    Write-Host "    Interactive prompt to test one resume" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Test-MultipleResumes" -ForegroundColor Green
    Write-Host "    Interactive prompt to test multiple resumes" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Build-Project" -ForegroundColor Green
    Write-Host "    Compile TypeScript to JavaScript" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Show-Help" -ForegroundColor Green
    Write-Host "    Show this help message" -ForegroundColor Gray
    Write-Host ""
    Write-Host "QUICK EXAMPLES:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  # First time setup" -ForegroundColor Gray
    Write-Host "  Build-Project" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  # Test your resume" -ForegroundColor Gray
    Write-Host "  Test-Resume -ResumeFile uploads/resume-1769407134942-931026016.pdf" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  # Test with user ID" -ForegroundColor Gray
    Write-Host "  Test-Resume -ResumeFile ./my-resume.pdf -UserId john-doe" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  # Interactive mode" -ForegroundColor Gray
    Write-Host "  Test-SingleResume" -ForegroundColor Cyan
    Write-Host ""
}

# Export functions
Export-ModuleMember -Function Test-Resume, Build-Project, Test-SingleResume, Test-MultipleResumes, Show-Help

Write-Host "✅ Resume testing utilities loaded!" -ForegroundColor Green
Write-Host ""
Write-Host "Type 'Show-Help' for available commands" -ForegroundColor Cyan
Write-Host ""
