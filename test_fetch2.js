const { execFile } = require('child_process');

// Test WITHOUT -UseBasicParsing (uses IE engine, WinInet proxy, cookie store)
const script = [
    `$ErrorActionPreference = 'Stop'`,
    `$r = Invoke-WebRequest -Uri 'https://www.chabad.org/library/bible_cdo/aid/8165' -TimeoutSec 30 -UserAgent 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'`,
    `Write-Output "STATUS:$($r.StatusCode)"`,
    `Write-Output "LENGTH:$($r.Content.Length)"`,
].join('\n');

const enc = Buffer.from(script, 'utf16le').toString('base64');
console.log('Testing IE-engine (no -UseBasicParsing)...');
execFile('powershell.exe', ['-EncodedCommand', enc], { maxBuffer: 10e6, encoding: 'buffer', timeout: 40000 }, (err, stdout, stderr) => {
    const out = stdout.toString('utf8').trim();
    const errText = stderr.toString('utf8').replace(/#<\s*CLIXML[\s\S]*$/, '').trim().slice(0, 300);
    console.log('STDOUT:', out.slice(0, 200));
    if (errText) console.log('STDERR (errors only):', errText);

    // Also test Tls12 + UseDefaultCredentials
    const script2 = [
        `[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12`,
        `$r = Invoke-WebRequest -Uri 'https://www.chabad.org/library/bible_cdo/aid/8165' -UseBasicParsing -TimeoutSec 30 -UseDefaultCredentials -UserAgent 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'`,
        `Write-Output "STATUS:$($r.StatusCode)"`,
    ].join('\n');
    const enc2 = Buffer.from(script2, 'utf16le').toString('base64');
    console.log('\nTesting TLS1.2 + UseDefaultCredentials...');
    execFile('powershell.exe', ['-EncodedCommand', enc2], { maxBuffer: 5e6, encoding: 'buffer', timeout: 40000 }, (err2, stdout2, stderr2) => {
        const out2 = stdout2.toString('utf8').trim();
        const err2Text = stderr2.toString('utf8').replace(/#<\s*CLIXML[\s\S]*$/, '').trim().slice(0, 300);
        console.log('STDOUT:', out2.slice(0, 200));
        if (err2Text) console.log('STDERR:', err2Text);
    });
});
