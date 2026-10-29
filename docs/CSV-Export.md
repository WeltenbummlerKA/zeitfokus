# CSV-Export in Zeitfokus

Der Export übernimmt die aktuell angewendeten Historienfilter und lädt sämtliche passenden abgeschlossenen Einträge. Laufende Timer gehören nicht zur Exportgrundlage. Der Browser bietet die Datei erst an, wenn alle Seiten erfolgreich vorliegen; Netzwerkfehler, Abbruch oder erkennbare Änderungen während des Abrufs erzeugen keine Teildatei. Alle Seiten verwenden dieselbe Start-ID. Bei Änderungen an der Historie während eines Exports kann ein erneuter Abruf erforderlich sein.

Die Datei ist UTF-8 mit BOM, Komma als Trennzeichen und CRLF-Zeilenenden. Textfelder werden in Anführungszeichen gesetzt und darin enthaltene Anführungszeichen verdoppelt. Formelähnliche Beschreibungen erhalten ein führendes Apostroph als Schutz beim Öffnen in Tabellenkalkulationen.

Die Spaltennamen bleiben unabhängig von der Oberflächensprache stabil:

| Spalte | Inhalt |
| --- | --- |
| `id` | ID des bestehenden Zeiteintrags |
| `original_start`, `original_end` | Ursprüngliche Zeitstempel mit UTC-Offset |
| `report_start_utc`, `report_end_utc` | Auf den Filterzeitraum begrenztes Intervall als UTC-Zeitstempel |
| `duration_seconds` | Dauer dieses begrenzten Intervalls in Sekunden |
| `description` | Beschreibung des Eintrags |
| `tags_json` | Alle Tags als JSON-Liste aus Schlüssel/Wert-Paaren |

Datumsgrenzen werden als Zeitpunkte ausgewertet; ein Tag mit Zeitumstellung muss deshalb nicht 24 Stunden umfassen. Überlappende Einträge bleiben getrennte Beiträge. Mehrere Tags auf einem Eintrag vervielfachen seine Dauer nicht.

Der Export nutzt die bestehende angemeldete Sitzung. Die Daten werden im Browser zur Datei zusammengeführt; es findet keine Übermittlung an einen zusätzlichen Dienst statt.
