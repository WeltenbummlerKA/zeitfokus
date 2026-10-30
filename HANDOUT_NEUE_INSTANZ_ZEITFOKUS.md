# Zeitfokus – Übergabe-Handout für die nächste Instanz

Stand: 30.10.2026

Dieses Dokument ist eine Übergabeakte. Es beschreibt verbindlich, was erledigt, offen und als Nächstes zu prüfen ist.

## Projekt und Leitplanken

- Produktname: **Zeitfokus**
- GitHub-Repository: `WeltenbummlerKA/zeitfokus`
- Image: `ghcr.io/weltenbummlerka/zeitfokus:stable`
- Portainer-Stack: `zeitfokus`
- Vorhandenes NAS-Verzeichnis `.../docker/zeitfokus` weiterverwenden; niemals bei Redeploys löschen.
- Externes macvlan-Netzwerk verwenden; zuletzt vereinbarte feste IP: `192.168.178.168`.
- Kein `traggo-client`-Image, kein neues Test-Image und kein zweites Datenvolume anlegen.
- Nur im About-Bereich darf klein „based on Traggo“ stehen. Sichtbarer Produktname, Tab-Titel, Manifest, Favicon und Repository-Verweise heißen Zeitfokus.

## Erledigt

### Branding und Oberfläche

- Produktname auf Zeitfokus umgestellt.
- Browser-Titel und Manifest angepasst.
- GHCR-Image auf `ghcr.io/weltenbummlerka/zeitfokus` umgestellt.
- Zeitfokus-App-Symbol als Favicon, Manifest-Icon und Seiten-Symbol eingebunden.
- Altes/erfundenes SVG-Icon entfernt.
- Harte helle Formularflächen entfernt; semantische Theme-Farben verwendet.
- Kontrast- und Icon-Korrekturen vorgenommen.
- Apple-Design-Prinzipien gezielt angewendet: semantische Farben, Systemdarstellung, klare Hierarchie und zugänglicher Kontrast.

### Funktionen

- Verlaufssuche, Zeitraum- und Tagfilter.
- Tages-/Wochen-/Monatssummen.
- CSV-Export und Einträge duplizieren.
- Tagesansicht mit Gesamtsumme.
- Favoritenverwaltung und Synchronisationsdienst.
- Hilfe-Seite mit kontextbezogenen Hinweisen.
- KI-Auswertung vorbereitet.
- System-Thema als Einstellung ergänzt; neue Konten starten mit `System`.

### Qualität und Veröffentlichung

- Audit-PR #5 abgeschlossen/übernommen.
- Docker-Image wird unabhängig gebaut; Portainer übernimmt Netzwerk, Volume und ENV.
- Veröffentlichung ist auf `master` und versionierte Tags begrenzt.
- Workflow nutzt Ubuntu 24.04 und Node.js 24.
- Sicherheits-/Lizenzprüfung: keine verwundbaren oder inkompatiblen Pakete; acht unbekannte Lizenzmetadaten.
- Letzter bekannter Code-Stand vor diesem Handout: `13d3996`.

## Offen und verbindlich zu erledigen

### 1. Build und Image

- Aktuellen `master`-Workflow vollständig prüfen.
- Nur bei grünem Workflow `ghcr.io/weltenbummlerka/zeitfokus:stable` verwenden.
- Prüfen, dass GHCR öffentlich lesbar ist und Portainer keinen alten Digest bzw. kein `traggo-client`-Image verwendet.
- Erst danach auf dem NAS redeployen.

### 2. Systemdarstellung live prüfen

- Unter **Einstellungen → Theme → System** auswählen.
- Betriebssystem einmal auf hell und dunkel stellen.
- Prüfen, dass die Oberfläche automatisch folgt.
- Browser-Hard-Reload durchführen.
- Tab, Favicon, Seitenkopf und About-Bereich auf durchgängiges Zeitfokus-Branding prüfen.

### 3. KI-Einstellung vervollständigen

Administratoren wählen unter **Einstellungen → KI-Auswertung** zwischen **Deaktiviert**, **Ollama** und **LM Studio** und speichern Serveradresse, Modell und Zeitlimit. Die Einstellung gilt für die gesamte Instanz, liegt in der vorhandenen Datenbank und bleibt bei Redeploys erhalten. Bis zum ersten Speichern dienen die Stack-Variablen als Vorgabe. Normale Konten dürfen die Verbindung nicht ändern.

- `ZEITFOKUS_AI_PROVIDER`: `disabled`, `ollama` oder `lmstudio`.
- `ZEITFOKUS_AI_BASE_URL`: erreichbarer Backend-Endpunkt.
- `ZEITFOKUS_AI_MODEL`: vorhandenes Modell.
- KI-Auswertung mit echten Zeitdaten testen.
- Fehler bei nicht erreichbarem Backend verständlich anzeigen.
- Admin-Maske mit beiden Anbietern prüfen; Zugangsdaten werden nicht unterstützt und nicht im Browser gespeichert.
- LM Studio akzeptiert die Serveradresse mit oder ohne `/v1`.

### 4. Start- und Containerlogs

Portainer kann nach einem Redeploy noch die alte Container-ID abfragen und zweimal „No such container“ melden. Das ist eine veraltete ID-Abfrage, wenn der neue Container bereits läuft.

Live prüfen, ob die Logs mindestens Folgendes zeigen: Prozessstart, Datenbank/Datenpfad, Port `3030`, optional Port `3031`, KI-Konfiguration ohne Geheimnisse und eine abschließende Bereitschaftsmeldung.

```bash
docker logs -f --tail=200 zeitfokus
docker inspect --format '{{.State.Status}} {{.State.Health.Status}}' zeitfokus
```

Immer den aktuell laufenden Container öffnen, niemals eine alte Container-ID diagnostizieren.

### 5. Portainer-Stack live prüfen

- Host-Pfad auf den bestehenden Ordner `.../docker/zeitfokus` zeigen lassen.
- Keine automatische Volume-Neuanlage verwenden.
- Externes macvlan-Netzwerk muss vorhanden sein.
- Feste IP darf nicht belegt sein.
- `Pull latest image` aktivieren.
- Nach Redeploy prüfen, dass derselbe Datenbestand sichtbar bleibt.

## Aktionsreihenfolge

1. GitHub-Actions-Run des aktuellen `master` prüfen.
2. Bei Fehlern den konkreten fehlgeschlagenen Schritt beheben; keinen neuen Stack bauen.
3. Bei grünem Build `stable` veröffentlichen.
4. Portainer mit Pull-latest redeployen.
5. Containerstatus und aktuelle Logs prüfen.
6. Bestehenden Datenbestand und Anmeldung testen.
7. System-Thema hell/dunkel testen.
8. Favicon, Tab-Titel und About-Branding kontrollieren.
9. Als Administrator unter Einstellungen den KI-Anbieter, Serveradresse und Modell speichern und eine Testauswertung durchführen.
10. Erst danach den Stand als abgeschlossen melden.

## Nicht tun

- Nicht auf `traggo-client` zurückfallen.
- Nicht `traggo_data` oder ein zweites Kandidaten-Volume verwenden.
- Nicht das bestehende Zeitfokus-Datenverzeichnis löschen.
- Nicht behaupten, die KI sei vollständig konfigurierbar, solange nur ENV-Variablen vorhanden sind.
- Nicht „Build erfolgreich“ mit „live auf dem NAS geprüft“ gleichsetzen.
