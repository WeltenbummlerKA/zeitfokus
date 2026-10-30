# Zeitfokus

Deine Zeit im Fokus.

Zeitfokus ist eine selbst gehostete, tagbasierte Zeiterfassung mit Kalender-, Verlaufs-, Statistik- und KI-Auswertung. Die Daten bleiben auf dem eigenen Server.

## Funktionen

- Zeiterfassung mit Tags und Beschreibungen
- Listen-, Kalender- und Tagesansicht
- Verlaufssuche, Zeitraum- und Tagfilter
- korrekte Tages-, Wochen- und Monatssummen
- CSV-Export und Einträge duplizieren
- serverseitige Favoriten
- optionale Soll-/Ist-Arbeitsprofile
- deutsche und englische Oberfläche mit integrierter Hilfe
- optionale KI-Auswertung über administrativ konfiguriertes Ollama oder LM Studio

## KI-Datenschutz

Die KI-Auswertung wird ausschließlich vom Backend ausgeführt. Standardmäßig werden nur aggregierte Zeitdaten übertragen; Beschreibungen und Notizen bleiben außen vor. Ergebnisse werden nicht gespeichert und ändern keine Zeitdaten automatisch. Unterstützt werden lokale oder private Ollama- und LM-Studio-Endpunkte.

## Entwicklung

```sh
go test ./...
```

Für den Webbereich:

```sh
cd ui
npm ci
npm run build
```

## Herkunft und Lizenz

Zeitfokus steht unter GPL-3.0. Das Projekt basiert auf dem ursprünglichen Projekt [Traggo](https://github.com/traggo/server); die entsprechenden Lizenz- und Herkunftshinweise bleiben in `NOTICE` erhalten.

Zeitfokus ist ein eigenständiges Projekt und wird unabhängig weiterentwickelt.
