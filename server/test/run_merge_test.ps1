$f = Get-Item 'C:\pdf-tools-app\server\test_files\sample.pdf'
$form = @{ files = @($f, $f) }
Invoke-WebRequest -Uri 'http://localhost:4000/api/merge-pdf' -Method Post -Form $form -OutFile 'C:\pdf-tools-app\server\test_files\merged.pdf' -UseBasicParsing
Write-Output 'Done'
