# Proof of Concepts

## 1. Auswahl von UI-Elementen über DOM-Interaction (Select Mode)

### Beschreibung
Nutzer sollen per Browserextension ein beliebiges UI-Element auf einer beliebigen Webseite gezielt auswählen können. Dafür wird ein sogenannter „Select Mode“ implementiert, der das DOM interaktiv zugänglich macht: Beim Überfahren der Seite werden HTML-Elemente hervorgehoben und durch Klick ausgewählt. Die gewählte Komponente wird gespeichert und ist Grundlage für die spätere Analyse und Codegenerierung.

### Exit-Kriterien
- Aktivierung und Deaktivierung des Select Modes über die Extension
- Visuelles Feedback beim Überfahren und Auswählen von DOM-Elementen
- Eindeutige Auswahl eines Elements (inkl. Zugriff auf HTML-Struktur)
- Übergabe der Auswahl in Form eines strukturierten Payloads an nachfolgende Module

### Fehlerkriterien
- Keine oder fehlerhafte Hervorhebung bei Hover
- Mehrdeutige Auswahl oder fehlerhafte Identifikation des Elements
- DOM-Element nicht erreichbar oder durch Shadow DOM blockiert
- Ausgewähltes Element nicht an nächsten Prozess übergebbar

### Fallbacks (konzeptionell)
- Timeout oder Reset-Funktion bei fehlerhafter Auswahl
- Automatische Auswahl von Elternkomponente bei tief verschachtelten DOMs

### Verwendete Technologien, Mechanismen, Konzeptentscheidungen
- Chrome Extension (Manifest V3)
- Content Scripts zur Interaktion mit dem DOM der besuchten Webseite
- DOM- und CSSOM-APIs (`getComputedStyle`, `cloneNode`)
- Chrome Extension APIs
- Messaging (`chrome.runtime`, `chrome.tabs`)
- Persistenz (`chrome.storage.local`)
- HTML / CSS / Vanilla JavaScript