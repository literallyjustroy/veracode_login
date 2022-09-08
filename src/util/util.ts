
import puppeteer, { Browser } from 'puppeteer';
import fs from 'fs';
import 'source-map-support/register'; // Error handling showing typescript lines

export function readCookies(): puppeteer.Protocol.Network.Cookie[] {
    const cookiesString = fs.readFileSync('./cookies.json', 'utf8');
    const cookies: puppeteer.Protocol.Network.Cookie[] = JSON.parse(cookiesString);

    const vsidCookie = cookies.find((cookie: puppeteer.Protocol.Network.Cookie) => cookie.name === 'vsid');
    if (vsidCookie === undefined) {
        throw Error('No vsid cookie found');
    }

    return [vsidCookie];
}

// export async function sleep(ms: number): Promise<void> {
//     return new Promise(resolve => setTimeout(resolve, ms));
// }

function isNumeric(num: string): boolean {
    return !Number.isNaN(num);
}

export async function getBrowser(isHeadlessWOnly: boolean): Promise<Browser> {
    if (process.arch === 'arm') {
        return await puppeteer.launch({
            headless: true,
            executablePath: '/usr/bin/chromium-browser'
        });
    } else {
        return await puppeteer.launch({ headless: isHeadlessWOnly });
    }
}
