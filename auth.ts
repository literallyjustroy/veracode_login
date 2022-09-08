import puppeteer, { Browser, Page } from 'puppeteer';
import fs from 'fs';
import { log } from './src/util/log';
import { getBrowser } from './src/util/util';
import settings from './settings.json';
import 'source-map-support/register'; // Error handling showing typescript lines
import open from 'open';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({path: path.join(__dirname, '..', '.env')});

(async () => {
    let username;
    let password;

    if (process.argv[2] != null && process.argv[3] != null) {
        username = process.argv[2];
        password = process.argv[3];
    } else {
        if (process.env.VERACODE_USERNAME != null && process.env.VERACODE_PASSWORD != null) {
            username = process.env.VERACODE_USERNAME;
            password = process.env.VERACODE_PASSWORD;
        } else {
            log.error('Environment Variables VERACODE_USERNAME and VERACODE_PASSWORD must be defined, or setup in a .env file, or username/password must be passed in as the first and second arguments');
            process.exit();
        }
    }

    log.debug(`Attempting sign in as ${username} to ${settings.baseUrl}`);

    const browser: Browser = await getBrowser(settings.headlessChrome);
    const page = await browser.newPage();

    try {
        await page.goto(`${settings.baseUrl}`);
    } catch (e) {
        log.error(`Failed to connect to provided baseUrl (${settings.baseUrl}). Check your VPN?`, e);
        process.exit(1);
    }

    try {
        await page.waitForSelector('#okta-signin-username', {timeout: 10000});
        log.info('Entering username...');
        await page.type('#okta-signin-username', username);
        log.info('Entering password...');
        await page.type('#okta-signin-password', password);
        log.info('Submitting...');
        await page.click('#okta-signin-submit');
        log.info('Waiting for navigation...');
        await waitForCookieNamed('vsid', page);
        log.info('Saving cookies...');
        await saveCookies(page);
    } catch (e) {
        log.error(e);

        await saveErrorScreenshot(page);
    }

    await browser.close();
})();

async function waitForCookieNamed(cookieName: string, page: Page, numOfRetries = 5) {
    for (let i = 1; i <= numOfRetries; i++) {
        try {
            await page.waitForNavigation({waitUntil: 'networkidle0', timeout: 15000});
            const cookies = await page.cookies();
            if (cookies.some(cookie => cookie.name === cookieName)) {
                log.info(`Desired cookie located! (${cookieName})`);
                return;
            }
            log.warn(`Cookie not found on attempt ${i}.`);
        } catch (e) {
            log.error(`Error getting cookie on attempt ${i} due to an exception. This is likely due to bad credentials:\n\n`, e);
            break;
        }
    }
    log.error(`Failed to get the desired cookie (${cookieName})`);
    await saveErrorScreenshot(page);
    process.exit(1);
}

async function saveCookies(page: puppeteer.Page) {
    const cookies = await page.cookies();
    const cookiePath = path.join(__dirname, '..', 'cookies.json');

    fs.writeFileSync(cookiePath, JSON.stringify(cookies, null, 4));
    log.debug(`Cookies saved to ${path.join(__dirname, '..', 'cookies.json')}: ${cookies.map(c => c.name).join(', ')}`);
}

async function saveErrorScreenshot(page: puppeteer.Page) {
    await page.screenshot({path: path.join(__dirname, '..', 'error_screenshot.png')});
    await open('error_screenshot.png');
}
