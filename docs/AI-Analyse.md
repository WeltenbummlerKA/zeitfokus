# KI-Auswertung (Grundlage)

Zeitfokus berechnet die Datenbasis für eine spätere optionale KI-Auswertung
zunächst deterministisch und ohne Netzwerkzugriff. `ai.Summarize` verarbeitet
nur abgeschlossene Zeitspannen; offene oder ungültige Spannen werden verworfen.
Notizen und Beschreibungen werden absichtlich nicht in die Zusammenfassung
übernommen. Zeitzonen werden für Tagesgrenzen berücksichtigt, die Dauer bleibt
eine echte Zeitdifferenz.

Die Provider-Schicht unterstützt administrativ konfigurierte lokale Ollama-
Endpunkte (`/api/chat`) und LM-Studio/OpenAI-kompatible Endpunkte
(`/v1/chat/completions`). Akzeptiert werden nur HTTP-Endpunkte im lokalen oder
privaten Netz; URLs mit Zugangsdaten, Querystring oder öffentlichen Hosts werden
abgelehnt. Der Aufruf läuft ausschließlich im Backend mit Timeout. Standardmäßig
werden nur Aggregatwerte gesendet; Beschreibungen sind nicht Bestandteil des
Payloads. Es werden keine KI-Ergebnisse gespeichert oder automatisch Zeitdaten
verändert. Die GraphQL/UI-Aktivierung kann darauf aufbauen, ohne Providerzugang
an den Browser zu geben.
