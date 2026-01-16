# Proof of Concepts

## 4. Screenshot-Erfassung des ausgewählten UI-Elements

### Beschreibung
Ziel dieses PoCs ist die Erweiterung der Extension um eine Screenshot-Funktion, um neben strukturierter DOM- und Style-Extraktion auch eine visuelle Referenz des ausgewählten UI-Elements bereitzustellen. Damit kann ein LLM die visuelle Erscheinung zuverlässiger rekonstruieren, insbesondere bei komplexen Layouts, Grafiken oder schwer aus Styles ableitbaren Effekten. <br>

Es werden zwei Varianten erprobt:
1. Manuelle Screenshot-Erfassung
Nutzer starten die Screenshot-Erfassung über das Extension-UI. Anschließend wird ein Screenshot des Tabs aufgenommen und der Nutzer kann (falls nötig) den relevanten Bereich auswählen oder bestätigen.

2. Automatische Ausschnitt-Erfassung (präferiert)
Nach der Elementauswahl wird der sichtbare Tab automatisch gescreenshottet und der relevante Ausschnitt anhand des boundingClientRect des selektierten Elements berechnet. Der Screenshot wird anschließend als Cropped Image (Elementausschnitt) als Teil des Payloads gespeichert bzw. an das LLM übergeben.
Die Screenshot-Daten sollen vorzugsweise als komprimiertes Bild (z. B. PNG oder JPEG) bereitgestellt werden. Optional kann zusätzlich eine verkleinerte Vorschau im Extension-UI angezeigt werden.

### Exit-Kriterien
Integration einer Screenshot-Funktion in die Extension (manuell und/oder automatisch)
Der Screenshot wird dem selektierten Element eindeutig zugeordnet (Matching über boundingClientRect)
Automatisches Cropping des Elementausschnitts ist möglich und liefert einen visuell korrekten Ausschnitt
Screenshot-Preview kann im Extension-UI angezeigt werden (optional)
Screenshot wird persistiert (z. B. in chrome.storage.local) oder direkt als Teil des API-Requests an den Proxy übergeben
Das LLM erhält zusätzlich zum strukturierten Payload eine visuelle Referenz (z. B. Base64 oder Blob-Transfer)

### Fehlerkriterien
Screenshot-Erfassung nicht möglich (fehlende Berechtigungen, Tab-Kontext nicht unterstützbar)
Falscher oder leerer Ausschnitt durch fehlerhafte Koordinaten (Scroll-Offset, Zoom, Device Pixel Ratio)
Cropping schneidet wichtige Teile ab oder enthält zu viel Umgebung
Performance-Probleme oder zu große Bilddaten (Payload zu groß, API-Limits)
Screenshot entspricht nicht dem tatsächlichen UI-Zustand (Hover/Focus nicht sichtbar, Timing-Probleme)

### Fallbacks
Fallback auf manuelle Screenshot-Erfassung, falls automatisches Cropping fehlschlägt
Fallback auf Full-Page/Full-Viewport Screenshot ohne Cropping, falls Koordinaten unsicher sind
Reduktion der Bildgröße durch Kompression oder Downscaling (z. B. Zielbreite/-höhe)
Hinweis im UI, wenn Screenshot im aktuellen Kontext nicht möglich ist (z. B. interne Browser-Seiten)
Übermittlung nur des strukturierten Payloads, falls Bilddaten zu groß oder nicht verfügbar sind

### Prompt Engineering
Erweiterung des Prompts um die Information, dass eine visuelle Referenz vorliegt (Screenshot des Elementausschnitts)
Anweisung zur Nutzung des Screenshots als Referenz für visuelle Details, die nicht zuverlässig aus CSS ableitbar sind
Klare Definition der Prioritäten: Struktur (HTML/CSS) primär, Screenshot als visuelle Validierung und Feintuning
Optional: Hinweis, dass Screenshot ausschließlich zur visuellen Annäherung dient (keine Textextraktion durch OCR als Voraussetzung)

### Verwendete Technologien, Mechanismen, Konzeptentscheidungen
Chrome Extensions Tabs API zur Screenshot-Erfassung (chrome.tabs.captureVisibleTab)
Bildverarbeitung im Extension-Kontext (Cropping/Downscaling über Canvas API)
Koordinaten- und Skalierungsabgleich (Device Pixel Ratio, Scroll-Offsets, Zoomfaktoren) zur korrekten Ausschnittberechnung
Optional: Anzeige einer Bildvorschau im Extension-UI (z. B. als Data URL im Popup)