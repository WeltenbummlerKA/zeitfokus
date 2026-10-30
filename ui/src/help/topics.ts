export const helpTopics = [
    {
        id: 'dashboards',
        de: {
            title: 'Wozu dienen die Übersichten?',
            steps: [
                'Übersichten sind gespeicherte Auswertungen deiner erfassten Zeiten, zum Beispiel Wochenstunden pro Projekt oder der Vergleich zweier Monate. Für Timer, Verlauf und CSV-Export brauchst du keine Übersicht.',
                'Lege unter „Übersichten“ eine Auswertung mit einem verständlichen Namen an. Öffne sie und wähle „Übersicht bearbeiten“, dann „Eintrag hinzufügen“. Wähle einen Diagrammtyp, Zeitraum und passende Tags.',
                'Mit gemeinsamen Zeiträumen können mehrere Diagramme dieselben Datumsgrenzen verwenden. now/w bedeutet diese Woche, now-1w/w die letzte Woche. Solche relativen Zeiträume wechseln automatisch mit dem Kalender.',
                'Beende den Bearbeitungsmodus, um die gespeicherte Auswertung zu betrachten. Das Verschieben oder Bearbeiten eines Diagramms verändert deine Zeiteinträge nicht.',
            ],
        },
        en: {
            title: 'What are dashboards for?',
            steps: [
                'Dashboards are saved reports on tracked time, such as weekly hours per project or a comparison of two months. Timers, history and CSV export work without a dashboard.',
                'Create a dashboard with a meaningful name, open it and select Edit dashboard, then Add entry. Choose a chart type, period and relevant tags.',
                'Shared date ranges let multiple charts use the same boundaries. now/w means this week; now-1w/w means last week. Relative ranges move with the calendar.',
                'Finish editing to view the saved report. Moving or editing a chart never changes your time entries.',
            ],
        },
    },
    {
        id: 'recording',
        de: {
            title: 'Zeit erfassen',
            steps: [
                'Trage in der Zeiterfassung eine Beschreibung und bei Bedarf Tags ein. Mit „Timer starten“ beginnt ein Timer; mit „Stopp“ schließt du den laufenden Eintrag ab.',
                'Für einen nachträglichen Eintrag wählst du „Manuell“, stellst Beginn und Ende ein und speicherst den Zeitraum. Das Ende muss nach dem Beginn liegen.',
                'Die Beschreibung und Tags helfen dir, Einträge später wiederzufinden. Über das Eintragsmenü kannst du gespeicherte Angaben bearbeiten.',
            ],
        },
        en: {
            title: 'Record time',
            steps: [
                'Enter a description and optional tags in time tracking. Start begins a timer; Stop completes a running entry.',
                'To record time afterwards, select Manual, set a start and end, then save the interval. The end must be later than the start.',
                'Descriptions and tags help you find entries later. Use an entry’s menu to edit saved details.',
            ],
        },
    },
    {
        id: 'history',
        de: {
            title: 'Verlauf, Filter und CSV-Export',
            steps: [
                'Unter deinen laufenden Timern findest du den Verlauf. Suche nach Beschreibung oder Tags, wähle bei Bedarf einen Zeitraum und bestätige mit „Filter anwenden“. Das Bis-Datum ist eingeschlossen.',
                'Unter „Tagfilter“ kannst du Tags einschließen oder ausschließen. Die Gesamtsumme gilt für alle passenden abgeschlossenen Einträge, auch wenn noch nicht alle Zeilen geladen sind. Laufende Timer zählen nicht mit.',
                '„CSV exportieren“ lädt alle Einträge passend zu den aktuellen Filtern herunter. Über das Menü eines abgeschlossenen Eintrags kannst du ihn duplizieren. Prüfe die neuen Zeiten anschließend; vor dem Löschen erscheint eine Bestätigung.',
            ],
        },
        en: {
            title: 'History, filters and CSV export',
            steps: [
                'History appears below your running timers. Search descriptions or tags, choose an optional date range and select Apply filters. The To date is inclusive.',
                'Tag filters include or exclude selected tags. The total covers all matching completed entries, including rows not loaded yet. Running timers are excluded.',
                'Export CSV downloads all entries matching your current filters. Use a completed entry’s menu to duplicate it, then check its new times. Deleting an entry requires confirmation.',
            ],
        },
    },
    {
        id: 'favorites',
        de: {
            title: 'Favoriten verwenden',
            steps: [
                'Bereite eine Beschreibung mit Tags vor und wähle „Aktuelle Eingabe als Favorit“. Gib der Vorlage einen eindeutigen Namen und speichere sie.',
                'Ein Klick auf einen Favoriten übernimmt seine Beschreibung und Tags in die Eingabe. Du entscheidest danach, wann du den Timer startest.',
                'Unter „Favoriten verwalten“ kannst du Vorlagen bearbeiten oder löschen. Web-Favoriten gehören zu deinem Konto; die Verbindung mit den bisherigen Favoriten der Apple-App ist noch nicht hergestellt.',
            ],
        },
        en: {
            title: 'Use favorites',
            steps: [
                'Prepare a description and tags, then select Save current entry as favorite. Give the template a clear name and save it.',
                'Selecting a favorite fills in its description and tags. You still choose when to start the timer.',
                'Manage favorites lets you edit or delete templates. Web favorites belong to your account; they are not connected to the Apple app’s existing favorites yet.',
            ],
        },
    },
    {
        id: 'settings',
        de: {
            title: 'Persönliche Einstellungen',
            steps: [
                'Öffne „Einstellungen“ in der Navigation oder im Benutzermenü. Sprache, Datumsformat, Wochenbeginn und Datumseingabe gelten für dein Konto und werden sofort gespeichert.',
                '„Darstellung → System“ folgt automatisch der hellen oder dunklen Einstellung deines Geräts. Die anderen Darstellungen bleiben fest, bis du sie änderst.',
                'Arbeitszeitprofil und KI-Verbindung haben eigene Speichern-Schaltflächen. Diese werden aktiv, sobald du etwas geändert hast. Bei einem Fehler bleibt deine Eingabe erhalten, damit du erneut speichern kannst.',
            ],
        },
        en: {
            title: 'Personal settings',
            steps: [
                'Open Settings from navigation or the user menu. Language, date format, first day of the week and date entry style apply to your account and save automatically.',
                'Appearance → System follows your device’s light or dark setting. Other appearances stay fixed until you change them.',
                'The work target profile and AI connection have their own save buttons. These become available when something changes. Failed saves retain your draft so you can retry.',
            ],
        },
    },
    {
        id: 'work-target',
        de: {
            title: 'Soll-/Ist-Auswertung einrichten',
            steps: [
                'Aktiviere die Soll-/Ist-Auswertung in den Einstellungen, trage dein Wochenziel ein, wähle deine Arbeitstage und speichere das Profil.',
                'Das Wochenziel wird gleichmäßig auf die gewählten Tage verteilt. Der Vergleich dient deiner persönlichen Orientierung; Feiertage und Abwesenheiten werden nicht automatisch abgezogen.',
                'Wenn du den Vergleich ausschaltest und speicherst, verschwinden die Sollwerte. Dein Wochenziel und deine Arbeitstage bleiben gespeichert.',
            ],
        },
        en: {
            title: 'Set up target/actual comparison',
            steps: [
                'Enable the comparison in Settings, enter your weekly target, select work days and save the profile.',
                'The weekly target is divided evenly across selected days. This is a personal guide; public holidays and absences are not deducted automatically.',
                'Disable the comparison and save to hide targets. Your weekly target and selected days are retained.',
            ],
        },
    },
    {
        id: 'ai',
        de: {
            title: 'Ollama und LM Studio',
            steps: [
                'Als Administrator wählst du unter „Einstellungen → KI-Auswertung“ Ollama oder LM Studio. Trage eine lokale Serveradresse und den exakten Namen eines dort verfügbaren Modells ein und speichere. Die Verbindung gilt für alle Konten und bleibt bei Updates erhalten.',
                'Ollama verwendet üblicherweise Port 11434, LM Studio Port 1234. Bei LM Studio darf die Adresse mit /v1 enden. Die Adresse muss vom Zeitfokus-Server erreichbar sein; localhost bezeichnet dessen Container, nicht deinen Mac oder PC. Zugangsdaten in der Adresse werden nicht unterstützt.',
                'Öffne den Reiter „KI“, wähle einen Zeitraum und starte „Mit KI auswerten“. Die Auswertung ist auch im Verlauf verfügbar. Erst dadurch werden Zeit-Summen und Tags deines Kontos übertragen; Notizen bleiben ausgeschlossen. KI-Ergebnisse können falsch sein und ändern keine Einträge.',
                'Bei einer fehlgeschlagenen Auswertung prüfe, ob der Modellserver läuft, das Modell verfügbar und die Adresse erreichbar ist. Mit „Deaktiviert“ und anschließendem Speichern schaltest du KI-Anfragen aus; die normale Zeiterfassung bleibt nutzbar.',
            ],
        },
        en: {
            title: 'Ollama and LM Studio',
            steps: [
                'As an administrator, choose Ollama or LM Studio under Settings → AI analysis. Enter a local server address and the exact name of an available model, then save. The connection applies to all accounts and survives updates.',
                'Ollama typically uses port 11434; LM Studio uses port 1234. An LM Studio address may end in /v1. The address must be reachable from the Zeitfokus server; localhost means its container, not your Mac or PC. Credentials in the address are unsupported.',
                'Open AI, select a date range and start Analyze with AI. Analysis is also available in history. Only this action sends your account’s time totals and tags; notes are excluded. AI results may be wrong and never change entries.',
                'If analysis fails, check that the model server is running, the model is available and the address is reachable. Select Disabled and save to turn off AI requests; time tracking remains available.',
            ],
        },
    },
    {
        id: 'updates',
        de: {
            title: 'Version und Updates',
            steps: [
                'Unter dem Zeitfokus-Logo steht die installierte Version. Ein Klick darauf öffnet „Über Zeitfokus“ mit der zusätzlichen technischen Buildkennung.',
                'Für ein Update lädt der Administrator in Portainer das aktuelle stable-Image und erstellt den Container erneut. Der vorhandene Datenpfad muss erhalten bleiben. Vor einem produktiven Update den Datenbestand sichern.',
                'Lade die Webseite danach vollständig neu. Ändert sich die Versionsanzeige nicht, prüfe das tatsächlich verwendete Image. Eine Anmeldung mit vorhandener Datenbank verwendet weiterhin das bestehende Passwort.',
            ],
        },
        en: {
            title: 'Version and updates',
            steps: [
                'The installed version appears below the Zeitfokus logo. Selecting it opens About Zeitfokus with the additional technical build identifier.',
                'To update, the administrator pulls the current stable image in Portainer and recreates the container. Keep the existing data path and back up production data first.',
                'Fully reload the website afterwards. If the version does not change, check which image the container uses. Existing databases retain their existing login password.',
            ],
        },
    },
];
