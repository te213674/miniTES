$env:FILTER_BRANCH_SQUELCH_WARNING = "1"
git filter-branch --force --tree-filter {
    $file = "cline_docs\activeContext.md"
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $content = $content -replace 'ghp_[A-Za-z0-9_]+', '[REDACTED]'
        Set-Content $file -Value $content -NoNewline
    }
} HEAD