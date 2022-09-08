# veracode_login

Log in through the Veracode Okta Login and save cookies to json.

## Usage

1. Make sure you have [NodeJS](https://nodejs.org/en/) installed (This was tested on v12 and v16).
2. Set up the `baseUrl` for the Okta environment you want to log into via the `settings.json` file.
3. Navigate to the root directory of the project (`/veracode_login`).
4. Install the dependencies via `npm i`.
5. Run the project with `npm run start -- exampleUsername examplePassword` to get the cookies for the user (replacing the exampleUsername and examplePassword).
   1. You could instead fill out the `.env` file based on the `.env.example`, or pass environment variables VERACODE_USERNAME and VERACODE_PASSWORD and just run `npm run start`.

## Example cookie file

```json
[
    {
        "name": "XSRF-TOKEN",
        "value": "9+B11MAH11PyNpHf11deeeezabcasiBzAimaginewagonscqBubTauY7123+12==",
        "domain": ".analysiscenter.veracode.com",
        "path": "/",
        "expires": -1,
        "size": 122,
        "httpOnly": false,
        "secure": true,
        "session": true,
        "sameParty": false,
        "sourceScheme": "Secure",
        "sourcePort": 443
    },
    {
        "name": "vsid",
        "value": "86753098-6753-0986-7530-986753098675",
        "domain": ".analysiscenter.veracode.com",
        "path": "/",
        "expires": -1,
        "size": 40,
        "httpOnly": true,
        "secure": true,
        "session": true,
        "sameParty": false,
        "sourceScheme": "Secure",
        "sourcePort": 443
    }
]
```

## Example run

```shell
➜  veracode_login git:(main) ✗ npm run start -- exampleUsername examplePassword

> veracode_login@1.0.0 start /Users/literallyjustroy/dev/auto/veracode_login
> tsc && node dist/auth.js "exampleUsername" "examplePassword"

[2022-09-07T17:52:53.720] [DEBUG] default - Attempting sign in as exampleUsername to http://web.analysiscenter.veracode.com
[2022-09-07T17:52:57.413] [INFO] default - Entering username...
[2022-09-07T17:52:57.480] [INFO] default - Entering password...
[2022-09-07T17:52:57.527] [INFO] default - Submitting...
[2022-09-07T17:52:57.586] [INFO] default - Waiting for navigation...
[2022-09-07T17:53:02.965] [INFO] default - Desired cookie located! (vsid)
[2022-09-07T17:53:02.965] [INFO] default - Saving cookies...
[2022-09-07T17:53:02.967] [DEBUG] default - Cookies saved to /Users/literallyjustroy/dev/auto/veracode_login/cookies.json: XSRF-TOKEN, vsid
```

## .. And Beyond!

You can read cookies from this file via NodeJS Puppeteer like so:

```javascript
const cookiesString = fs.readFileSync('./cookies.json', 'utf8');
const cookies: puppeteer.Protocol.Network.Cookie[] = JSON.parse(cookiesString);
```
