# KI-Auswertung (Grundlage)

Zeitfokus berechnet die Datenbasis für eine spätere optionale KI-Auswertung
zunächst deterministisch und ohne Netzwerkzugriff. `ai.Summarize` verarbeitet
nur abgeschlossene Zeitspannen; offene oder ungültige Spannen werden verworfen.
Notizen und Beschreibungen werden absichtlich nicht in die Zusammenfassung
übernommen. Zeitzonen werden für Tagesgrenzen berücksichtigt, die Dauer bleibt
eine echte Zeitdifferenz.

Die Modellanbindung ist bewusst noch nicht aktiviert. Für die nächste Stufe
soll ausschließlich ein administrativ konfigurierter lokaler Ollama-Endpunkt
mit festem Modell erlaubt werden. Benutzer dürfen keine beliebigen URLs oder
Prompts als Serverziel vorgeben. Standardmäßig werden nur Aggregatwerte
gesendet; Beschreibungen erfordern eine ausdrückliche Einstellung. Es werden
keine KI-Ergebnisse gespeichert oder automatisch Zeitdaten verändert.
