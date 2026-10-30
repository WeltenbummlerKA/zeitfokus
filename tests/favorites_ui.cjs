const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('fs');
const {spawn} = require('child_process');

(async () => {
    const root = fs.mkdtempSync('/private/tmp/zeitfokus-favorites-');
    const port = 18305;
    const processServer = spawn(process.env.TRAGGO_TEST_BINARY, [], {
        cwd: root,
        env: {...process.env, TRAGGO_PORT: String(port), TRAGGO_DATABASE_CONNECTION: root + '/traggo.db', TRAGGO_DEFAULT_USER_NAME: 'admin', TRAGGO_DEFAULT_USER_PASS: 'Traggo-Test-2026!'},
    });
    let log = '';
    processServer.stdout.on('data', chunk => log += chunk);
    processServer.stderr.on('data', chunk => log += chunk);
    let browser;
    try {
        for (let attempt = 0; attempt < 100; attempt++) {
            try { if ((await fetch(`http://127.0.0.1:${port}`)).ok) { break; } } catch {}
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        browser = await chromium.launch({headless: true, ...(process.env.CHROME_EXECUTABLE ? {executablePath: process.env.CHROME_EXECUTABLE} : {})});
        const page = await browser.newPage({viewport: {width: 1200, height: 1000}, locale: 'de-DE'});
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(`http://127.0.0.1:${port}`);
        await page.getByLabel('Benutzername', {exact: false}).fill('admin');
        await page.getByLabel('Passwort', {exact: false}).fill('Traggo-Test-2026!');
        await page.getByRole('button', {name: 'Anmelden', exact: true}).click();
        await page.getByRole('button', {name: 'Timer starten', exact: true}).waitFor();
        const composer = page.locator('.tracker-composer');
        await composer.getByLabel('Beschreibung', {exact: true}).fill('Original activity');
        await page.getByRole('button', {name: 'Aktuelle Eingabe als Favorit', exact: true}).click();
        let manager = page.getByRole('dialog', {name: 'Favoriten verwalten', exact: true});
        await manager.getByLabel('Name', {exact: true}).fill('Review template');
        await manager.getByRole('button', {name: 'Speichern', exact: true}).click();
        await manager.getByText('Review template', {exact: true}).waitFor();
        await manager.getByRole('button', {name: 'Schließen', exact: true}).click();
        await composer.getByLabel('Beschreibung', {exact: true}).fill('Replaced');
        await composer.getByRole('button', {name: 'Review template', exact: true}).click();
        if (await composer.getByLabel('Beschreibung', {exact: true}).inputValue() !== 'Original activity') { throw Error('Favorite did not fill composer'); }
        await page.reload();
        await page.getByRole('button', {name: 'Review template', exact: true}).waitFor();
        await page.getByRole('button', {name: 'Favoriten verwalten', exact: true}).click();
        manager = page.getByRole('dialog', {name: 'Favoriten verwalten', exact: true});
        await manager.getByRole('button', {name: 'Bearbeiten', exact: true}).click();
        await manager.getByLabel('Name', {exact: true}).fill('Updated template');
        await manager.getByLabel('Beschreibung', {exact: true}).fill('Updated activity');
        await manager.getByRole('button', {name: 'Speichern', exact: true}).click();
        await manager.getByText('Updated template', {exact: true}).waitFor();
        await manager.getByRole('button', {name: 'Löschen', exact: true}).click();
        const confirmation = page.getByRole('dialog', {name: 'Favorit löschen?', exact: true});
        await confirmation.getByRole('button', {name: 'Abbrechen', exact: true}).click();
        await manager.getByText('Updated template', {exact: true}).waitFor();
        await manager.getByRole('button', {name: 'Löschen', exact: true}).click();
        await confirmation.getByRole('button', {name: 'Löschen', exact: true}).click();
        await manager.getByText('Noch keine Favoriten.', {exact: false}).waitFor();
        await manager.getByRole('button', {name: 'Schließen', exact: true}).click();
        await page.setViewportSize({width: 390, height: 844});
        await composer.getByRole('button', {name: 'Aktuelle Eingabe als Favorit', exact: true}).waitFor();
        if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) { throw Error('Mobile favorite controls overflow'); }
        if (errors.length) { throw Error(errors.join('\n')); }
        console.log(JSON.stringify({passed: true, root, checks: ['favorite create', 'apply without starting timer', 'reload persistence', 'edit', 'cancel delete', 'confirm delete', 'mobile overflow', 'no browser errors']}));
    } catch (error) {
        console.error(error, log);
        process.exitCode = 1;
    } finally {
        if (browser) { await browser.close(); }
        processServer.kill('SIGTERM');
    }
})();
