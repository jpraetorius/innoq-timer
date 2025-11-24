# INNOQ Timer

Ein Timer im INNOQ Stil, den man bei Remote Trainings in den Pausen zeigen kann.

![](docs/product.jpg)

## Einfache Nutzung

1. Die letzte Version aus den [Releases](https://github.com/innoq/innoq-timer/releases) herunterladen
2. File im Browser öffnen

## Nutzung

1. Repository klonen oder herunterladen.

## Nutzung mit lokalem Server

2. In das Repository-Verzeichnis wechseln.
3. Lokalen HTTP-Server starten (z.B. in Python: `python3 -m http.server -p ${PORT}`)
4. Timer im Broser öffnen: http://localhost:${PORT}/

## Standalone Lösung

2. In das Repository-Verzeichnis wechseln.
3. Standalone-File bauen über `node build.js` (setzt lokal installierets Node und esbuild voraus)
4. File im Browser öffnen (`dist/index.html`)

## Custom Element Attribute

Das `<innoq-timer>` Element versteht optionale Attribute:

- `offsetInMinutes="15"` initialisiert das Formular mit einer Zeit, die `15` Minuten in der Zukunft liegt (und setzt neue Werte nach einem Reset).
