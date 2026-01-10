# Proof of Concepts

## 2. Übergabe an und Kommunikation mit einem LLM

### Beschreibung
Basierend auf der DOM-Auswahl aus POC 1 werden HTML-, CSS- und Kontextinformationen als strukturierter Payload an ein externes Large Language Model (GPT-5.2) übergeben. Ziel ist es, eine visuell möglichst originalgetreue Webkomponente zu erzeugen. Die Kommunikation erfolgt über eine lokal laufende Server-API, welche den Prompt und Payload an das Modell sendet und die Antwort strukturiert zurückliefert.

### Exit-Kriterien
- Integration eines API-Calls zur Übergabe von Prompt und Payload an GPT-5.2
- Auswahl zwischen zwei Prompt-Presets im UI (Snippet oder Webkomponente)
- Modellantwort wird im Extension-UI als Codefeld angezeigt
- Erfolgreiches Parsen und Anzeigen des JSON-Antwortformats { code: string }

### Fehlerkriterien
- Keine oder fehlerhafte Modellantwort (leere oder ungültige Antwort)
- Fehlerhafte API-Kommunikation (Timeouts, Netzwerkfehler)
- Payload wird nicht korrekt übertragen (fehlende oder falsche Struktur)
- UI zeigt keine Rückmeldung bei Fehlern oder leerer Antwort

### Fallbacks
- Mehrfache Retry-Logik bei API-Fehlschlägen
- Fehleranzeige mit Feedback im UI
- Validierung der Modellantwortstruktur (strict schema enforcement)

### Verwendete Technologien
- GPT-5.2 (OpenAI API mit Structured Output)
- Lokaler Proxy-Server mit Express (Node.js)
- JSON-basiertes Messaging zwischen Frontend und API
- UI-Logik in popup.js zur Auswahl und Anzeige
- Dynamische Prompt-Generierung basierend auf Presets
- Persistenz über `chrome.storage.local` zur Zwischenspeicherung des Payloads