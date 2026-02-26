# Machbarkeitsanalyse und prototypische Entwicklung einer Browsererweiterung zur LLM-basierten Extraktion und Rekonstruktion von UI-Elementen 

Dieses Projekt verfolgt das Ziel, eine Browserextension zu entwickeln, mit der Nutzer UI-Elemente auf beliebigen Webseiten auswählen können. Die Extension extrahiert automatisch die HTML- und CSS-Strukturen des ausgewählten Elements und übergibt diese an ein Large Language Model (LLM). Auf dieser Basis generiert das LLM entweder ein Code-Snippet oder eine Webkomponente, die dem originalen Element möglichst nahekommt. <br>
Der Fokus liegt dabei bewusst auf der technischen Machbarkeit innerhalb eines klar definierten neunwöchigen Projektzeitraums sowie auf der Priorisierung essentieller Kernfunktionen. Das Projekt greift verschiedene Umsetzungsvarianten auf, bewertet deren Eignung für den Prototypen und schafft ein Verständnis dafür, wie aktuelle LLMs im Kontext von Webentwicklung eingesetzt werden können. <br>

[Projektseite - Christian Noss](https://cnoss.github.io/thesis/) <br>

## Kontext des Werks

Die Browserextension entsteht im Rahmen der Bachelorarbeit im 7. Semester Medieninformatik an der TH Köln. Das Projekt bewegt sich an der Schnittstelle zwischen Webentwicklung und modernen KI-Technologien. Im Mittelpunkt steht die Frage, wie weit eine solche Browsererweiterung innerhalb eines begrenzten Zeitraums praktisch realisiert werden kann. 

## Dokumentation & Ressourcen
**Wiki**: Detaillierte technische Dokumentation und Anleitungen zur Nutzung der Anwendung findest du im [Projekt-Wiki](https://github.com/cosimazink/bachelorarbeit/wiki) <br>
Exposé: [Exposé ‐ Web‐Anwendung zur Selfie-Dokumentation](https://github.com/cosimazink/bachelorarbeit/wiki/Exposé) <br>
Weekly Documentation: [Wöchentliche Dokumentation der Arbeit](https://github.com/cosimazink/bachelorarbeit/wiki/Weekly-Documentation) <br>
Kanban Board: [Kanban Board mit Issues für das Projekt](https://github.com/users/cosimazink/projects/2) <br>
Miro-Board: Weitere Details und die visuelle Darstellung des Projekts findest du auf dem [Miro-Board](https://miro.com/app/board/uXjVJplQ-zY=/)

## Installation & Nutzung 
### Voraussetzung 
- Google Chrome (Manifest V3 kompatibel)
- Node.js
- Zugangsschlüssel für die verwendete LLM-API (OpenAI)

### Server einrichten
Die Kommunikation mit dem Sprachmodell erfolgt über einen lokalen Proxy-Server, um API-Schlüssel nicht im Client offenzulegen. <br>
In das Server-Verzeichnis wechseln: <br> `cd server` <br>
Abhängigkeiten installieren: <br> `npm install` <br>
.env Datei im Ordner /server anlegen: <br>
`OPENAI_API_KEY=your_api_key_here
PORT=3000` <br>
Server starten: <br>
`node server.js` <br>
Standardmäßig läuft der Server unter: <br>
`http://localhost:3000`

### Browserextension installieren
1. Chrome öffnen
2. `chrome://extensions` aufrufen
3. Meine Erweiterungen aufrufen
4. "Entpackte Erweiterung laden" klicken
5. Ordner `/extension` auswählen

## Projektstruktur 
```
bachelorarbeit/
│
├── extension/                  # Chrome Extension
│   ├── manifest.json           # Extension-Konfiguration
│   ├── popup.html              # Popup-Interface
│   ├── src/
│   │   ├── scripts/
│   │   │   ├── contentScript.js
│   │   │   └── popup.js
│   │   ├── styles/
│   │   │   ├── base.css
│   │   │   ├── combined.css
│   │   │   ├── content.css
│   │   │   ├── fonts.css
│   │   │   ├── icons.css
│   │   │   ├── popup.css
│   │   │   ├── reset.css
│   │   │   └── variables.css
│   │   ├── assets/
│   │   └── fonts/
│   │       └── Inter/
│   └── vendor/
│
├── server/                     # Proxy-Server
│   ├── server.js
│   ├── package.json
│   ├── package-lock.json
│   ├── .env
│   └── node_modules/
│
├── POCs/                       # Proof of Concepts
│
├── .gitignore
├── LICENSE
└── README.md
```

## Technische Architektur
- Frontend: Chrome Extension (Manifest V3)
- Backend: Node.js Proxy-Server
- Modell: GPT-5.2
- Eingabekontext: JSON-Payload + optional Screenshot
- Sicherheitskonzept: Trennung von Instruktions- und Datenebene zur Reduktion von Prompt-Injection-Risiken

## Contributers
[Cosima Hiromi Zink](https://github.com/cosimazink)

[**Lizenz**](https://github.com/cosimazink/bachelorarbeit/blob/main/LICENSE)
