import puppeteer, { Browser, Page } from 'puppeteer';
import fs from 'fs';
import { log } from './src/util/log';
import { getBrowser, Output } from './src/util/util';
import settings from './settings.json';
import 'source-map-support/register'; // Error handling showing typescript lines
import open from 'open';
import path from 'path';
import dotenv from 'dotenv';

const LOGOUT_TOKEN_DOT_DO_VAR = 'logoutUrlWithToken';
const CSRF_PARAM_SPLITTER = 'CsrfProtString=';

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

    log.debug(`Attempting sign in as ${username} to ${settings.apiCredsUrl}`);

    const browser: Browser = await getBrowser(settings.headlessChrome);
    const page = await browser.newPage();

    try {
        await page.goto(`${settings.apiCredsUrl}`);
    } catch (e) {
        log.error(`Failed to connect to provided apiCredsUrl (${settings.apiCredsUrl}). Check your VPN?`, e);
        process.exit(1);
    }

    try {
        await page.waitForSelector('#okta-signin-username');
        log.info('Entering username...');
        await page.click('#okta-signin-username');
        await page.type('#okta-signin-username', username);

        log.info('Entering password...');
        await page.click('#okta-signin-password');
        await page.type('#okta-signin-password', password);

        log.info('Submitting...');
        await page.click('#okta-signin-submit');

        log.info('Waiting for navigation and cookie...');
        await waitForCookieNamed('vsid', page);

        log.info('Navigating to API Credentials page to grab CSRF token');
        await page.waitForSelector('#generateCredentialsButton');

        const csrfToken = await getCsrfTokenFromPage(page);
        log.info('Saving cookies and csrf token...');

        await saveOutput(page, csrfToken);
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

    throw Error(`Failed to get the desired cookie (${cookieName})`);
}

async function saveOutput(page: puppeteer.Page, csrfToken: string) {
    const cookies = await page.cookies();

    const output: Output = {
        cookies: cookies,
        csrfToken: csrfToken
    };

    const outputPath = path.join(__dirname, '..', 'output.json');

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 4));
    log.debug(`Cookies and CSRF token saved to ${path.join(__dirname, '..', 'output.json')}`);
}

async function saveErrorScreenshot(page: puppeteer.Page) {
    await page.screenshot({path: path.join(__dirname, '..', 'error_screenshot.png')});
    await open('error_screenshot.png');
}

async function getCsrfTokenFromPage(page: puppeteer.Page): Promise<string> {
    let logoutUrlWithToken; 
    
    try {
        logoutUrlWithToken = await page.evaluate(LOGOUT_TOKEN_DOT_DO_VAR); 
            
        if (!logoutUrlWithToken) {
            throw Error(`"${LOGOUT_TOKEN_DOT_DO_VAR}" variable has bad value or type:  "${logoutUrlWithToken}"`);
        }

        const splitUrl = String(logoutUrlWithToken).split(CSRF_PARAM_SPLITTER);
        const csrfToken = splitUrl[splitUrl.length - 1]; // not using .at() to support Node v12

        if (!csrfToken) {
            throw Error(`Badly formatted variable "${LOGOUT_TOKEN_DOT_DO_VAR}" with value "${logoutUrlWithToken}".\n Expected a divider of "${CSRF_PARAM_SPLITTER}."`);
        }

        return csrfToken;
    } catch (e) {
        log.error(`Failed to get/format "${LOGOUT_TOKEN_DOT_DO_VAR}" variable (with value "${logoutUrlWithToken}") from page "${page.url()}".\nPerhaps this variable was renamed/removed?`);
        throw e;
    }
}