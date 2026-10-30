# Zeitfokus – Handout für eine neue Instanz

Stand: 30.10.2026

Dieses Handout beschreibt die saubere Neuinstallation einer Zeitfokus-Instanz in Portainer. Das Image ist unabhängig von Portainer; Netzwerk, IP-Adresse, Datenpfad und Umgebungsvariablen werden ausschließlich im Stack festgelegt.

## 1. Verwendetes Image

```text
ghcr.io/weltenbummlerka/zeitfokus:stable
```

Vor dem Deploy in Portainer **Pull latest image** aktivieren. Danach wird bei einem Redeploy der aktuelle `stable`-Stand geladen.

## 2. Vorbereitungen auf dem NAS

Den bereits angelegten Ordner für diese Instanz verwenden:

```text
/volume1/docker/zeitfokus
```

Der Ordner muss für den Container les- und schreibbar sein. Die Datenbank liegt danach unter `/opt/zeitfokus/data` im Container und bleibt bei Container-Neuerstellung erhalten.

Das externe macvlan-Netzwerk muss bereits in Docker existieren. Die im ursprünglichen Stack vereinbarte Adresse ist `192.168.178.168`. Falls diese Adresse im NAS-Netzwerk tatsächlich anders reserviert wurde, darf nur die eine `ipv4_address`-Zeile angepasst werden.

## 3. Portainer-Stack

Stack-Name: `zeitfokus`

```yaml
services:
  zeitfokus:
    image: ghcr.io/weltenbummlerka/zeitfokus:stable
    container_name: zeitfokus
    restart: unless-stopped
    environment:
      ZEITFOKUS_DEFAULT_USER_NAME: "admin"
      # Mindestens 12 Zeichen. Sonderzeichen nicht mit $ beginnen lassen,
      # oder jedes $ in Portainer als $$ schreiben.
      ZEITFOKUS_DEFAULT_USER_PASS: "BITTE_EIN_EINDEUTIGES_PASSWORT_SETZEN"
      ZEITFOKUS_LOG_LEVEL: "info"
      ZEITFOKUS_COOKIE_SECURE: "false"
      ZEITFOKUS_DATABASE_DIALECT: "sqlite3"
      ZEITFOKUS_DATABASE_CONNECTION: "data/zeitfokus.db"

      # Systemdarstellung ist die Voreinstellung der Weboberfläche.
      # Jede Person kann sie später unter Einstellungen ändern.

      # KI: disabled, ollama oder lmstudio
      ZEITFOKUS_AI_PROVIDER: "disabled"
      ZEITFOKUS_AI_BASE_URL: ""
      ZEITFOKUS_AI_MODEL: ""
      ZEITFOKUS_AI_TIMEOUT_SECONDS: "60"

      # Nur aktivieren, wenn die Favoriten-Synchronisation benötigt wird.
      ZEITFOKUS_FAVORITES_ADDR: "0.0.0.0:3031"
      ZEITFOKUS_FAVORITES_TOKEN: "EIN_LANGES_FAVORITEN_TOKEN_SETZEN"
      ZEITFOKUS_FAVORITES_ALLOW_UNAUTHENTICATED: "false"
      ZEITFOKUS_FAVORITES_CORS_ORIGIN: ""
    volumes:
      - /volume1/docker/zeitfokus:/opt/zeitfokus/data
    networks:
      docker-macvlan:
        ipv4_address: 192.168.178.168

networks:
  docker-macvlan:
    external: true
```

Wichtig: In diesem Stack gibt es **kein** `build:` und kein `traggo-client`-Image. Portainer lädt ausschließlich das Zeitfokus-Image aus GHCR.

## 4. Erststart und Anmeldung

1. In Portainer den Stack anlegen.
2. Das Passwort ersetzen und den Stack deployen.
3. Nur beim allerersten Start einer leeren Datenbank wird der Benutzer aus `ZEITFOKUS_DEFAULT_USER_NAME` und `ZEITFOKUS_DEFAULT_USER_PASS` angelegt.
4. Bei einer vorhandenen Datenbank ändern diese Variablen den bestehenden Benutzer nicht.
5. Anmeldung erfolgt mit `admin` und dem beim Erststart gesetzten Passwort.

Wenn eine Anmeldung fehlschlägt, nicht wiederholt das Stack-Passwort ändern: zuerst prüfen, ob die Datenbank bereits vorhanden ist. Für einen neuen Test muss eine **separate leere Datenbank** verwendet werden.

## 5. Systemdarstellung und KI

Unter **Einstellungen**:

- **Darstellung → System** folgt dem hellen/dunklen Erscheinungsbild des Browsers bzw. Betriebssystems.
- Bestehende Konten behalten ihre bisherige Auswahl, bis sie einmal „System“ wählen.
- Die KI-Sektion zeigt, welcher Administrator-Endpunkt aktiv ist.

KI wird serverseitig über die Stack-Variablen konfiguriert. Beispiele:

### Ollama im lokalen Netz

```yaml
ZEITFOKUS_AI_PROVIDER: "ollama"
ZEITFOKUS_AI_BASE_URL: "http://192.168.178.XX:11434"
ZEITFOKUS_AI_MODEL: "llama3.2:3b"
```

### LM Studio im lokalen Netz

```yaml
ZEITFOKUS_AI_PROVIDER: "lmstudio"
ZEITFOKUS_AI_BASE_URL: "http://192.168.178.XX:1234/v1"
ZEITFOKUS_AI_MODEL: "Name-des-geladenen-Modells"
```

Die Weboberfläche speichert keine KI-Zugangsdaten. Bei `disabled` bleibt die KI-Auswertung deaktiviert.

## 6. Updates

1. In Portainer **Pull latest image** aktivieren.
2. Stack erneut deployen/redeployen.
3. Datenpfad und Umgebungsvariablen unverändert lassen.
4. Im Browser `Cmd+Shift+R` bzw. `Ctrl+F5` ausführen.

Das Datenverzeichnis wird dabei nicht gelöscht. Vor einem produktiven Update empfiehlt sich eine Kopie von `/volume1/docker/zeitfokus`.

## 7. Logs und Startdiagnose

Der Fehler „Unable to get container logs: No such container: …“ bedeutet in der Regel, dass Portainer noch die ID eines bereits ersetzten Containers abfragt. Das ist kein Beweis für einen Anwendungsfehler, wenn der neue Container läuft.

In Portainer:

1. Zum Stack `zeitfokus` wechseln.
2. Den aktuell laufenden Container `zeitfokus` öffnen.
3. **Logs** öffnen und **Auto-refresh** aktivieren.

Auf dem NAS ist die zuverlässige Variante:

```bash
docker logs -f --tail=200 zeitfokus
```

Ein erfolgreicher Start enthält mindestens die Meldung des Favoriten-Dienstes und anschließend die Servermeldungen von Zeitfokus. Bei einem Neustart immer den aktuellen Container-Namen bzw. die aktuelle Stack-Ansicht öffnen; alte Container-IDs sind nach einem Redeploy ungültig.

## 8. Schnellprüfung nach dem Deploy

```bash
docker ps --filter name=zeitfokus
docker inspect --format '{{.State.Status}} {{.State.Health.Status}}' zeitfokus
docker logs --tail=100 zeitfokus
```

Erwartet wird `running`. Die Weboberfläche ist auf Port `3030` erreichbar; die optionale Favoriten-Schnittstelle lauscht auf Port `3031`.

