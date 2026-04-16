const { execFile } = require('child_process');

// Test 1: TLS 1.2 explicit
const script1 = [
    `[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12`,
    `$r = Invoke-WebRequest -Uri 'https://www.chabad.org/library/bible_cdo/aid/8165' -UseBasicParsing -TimeoutSec 30 -UserAgent 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'`,
    `$r.StatusCode`,
].join('\n');

const enc1 = Buffer.from(script1, 'utf16le').toString('base64');
execFile('powershell.exe', ['-EncodedCommand', enc1], { maxBuffer: 5e6, encoding: 'buffer' }, (err, stdout, stderr) => {
    console.log('TEST 1 (TLS1.2):');
    console.log('  STDOUT:', stdout.toString('utf8').trim().slice(0, 200));
    console.log('  STDERR:', stderr.toString('utf8').trim().slice(0, 500));
    console.log();

    // Test 2: WebClient
    const script2 = [
        `[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12`,
        `[System.Net.WebRequest]::DefaultWebProxy.Credentials = [System.Net.CredentialCache]::DefaultCredentials`,
        `$wc = New-Object System.Net.WebClient`,
        `$wc.Headers.Add('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36')`,
        `$wc.Headers.Add('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8')`,
        `$html = $wc.DownloadString('https://www.chabad.org/library/bible_cdo/aid/8165')`,
        `Write-Output $html.Length`,
    ].join('\n');

    const enc2 = Buffer.from(script2, 'utf16le').toString('base64');
    execFile('powershell.exe', ['-EncodedCommand', enc2], { maxBuffer: 5e6, encoding: 'buffer' }, (err2, stdout2, stderr2) => {
        console.log('TEST 2 (WebClient):');
        console.log('  STDOUT:', stdout2.toString('utf8').trim().slice(0, 200));
        console.log('  STDERR:', stderr2.toString('utf8').trim().slice(0, 500));
    });
});
