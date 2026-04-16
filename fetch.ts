import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export const sleep = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

/** Fetch a URL using PowerShell's Invoke-WebRequest (.NET / Schannel TLS stack),
 *  which avoids Cloudflare's TLS-fingerprint checks that block Node's OpenSSL stack.
 *  Uses -EncodedCommand (base64 UTF-16LE) to avoid all shell-quoting issues. */
async function fetchPage(url: string): Promise<string> {
    const script = [
        `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8`,
        `[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12`,
        `$headers = @{`,
        `  'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'`,
        `  'Accept' = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'`,
        `  'Accept-Language' = 'en-US,en;q=0.5'`,
        `  'DNT' = '1'`,
        `  'Referer' = 'https://www.chabad.org/'`,
        `}`,
        `$r = Invoke-WebRequest -Uri '${url}' -UseBasicParsing -TimeoutSec 30 -Headers $headers`,
        `$r.Content`,
    ].join("\n");

    const encoded = Buffer.from(script, "utf16le").toString("base64");

    const { stdout, stderr } = (await execFileAsync(
        "powershell.exe",
        ["-EncodedCommand", encoded],
        { maxBuffer: 20 * 1024 * 1024, encoding: "buffer" },
    )) as unknown as { stdout: Buffer; stderr: Buffer };

    if (stderr && stderr.length > 0) {
        const errText = stderr.toString("utf8").trim();
        if (
            errText.toLowerCase().includes("error") ||
            errText.toLowerCase().includes("exception")
        ) {
            throw new Error(`PowerShell error: ${errText}`);
        }
    }
    return stdout.toString("utf8");
}

export async function fetchWithRetry(
    url: string,
    retries = 3,
): Promise<string> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fetchPage(url);
        } catch (err) {
            if (attempt === retries) throw err;
            const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
            console.log(`  Retry ${attempt}/${retries - 1} after ${delay}ms…`);
            await sleep(delay);
        }
    }
    throw new Error("unreachable");
}