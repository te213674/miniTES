@echo off
set FILTER_BRANCH_SQUELCH_WARNING=1
git filter-branch --force --tree-filter "if exist cline_docs\activeContext.md (powershell -Command \"(Get-Content cline_docs\activeContext.md -Raw) -replace 'ghp_[A-Za-z0-9_]+', '[REDACTED]' | Set-Content cline_docs\activeContext.md -NoNewline\")" HEAD