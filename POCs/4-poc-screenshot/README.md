# Proof of Concepts

## 4. Visuelle Referenz via Screenshot-Upload (Datei auswählen)

### Beschreibung
Ziel dieses PoCs ist die Erweiterung der Extension um eine zusätzliche visuelle Referenz in Form eines vom Nutzer bereitgestellten Screenshots. Neben strukturierter DOM- und Style-Extraktion kann damit ein LLM die visuelle Erscheinung zuverlässiger rekonstruieren, insbesondere bei komplexen Layouts, Bildern, Overlays oder Effekten, die sich nicht sauber aus CSS ableiten lassen.

Im Unterschied zu einer Tab-basierten Screenshot-Erfassung wird die Bildquelle hier explizit durch den Nutzer gewählt: Über das Extension-UI kann eine lokale Bilddatei (z. B. ein Screenshot) ausgewählt und als Referenz an den Proxy bzw. an das LLM mitgegeben werden. Optional kann das Bild im Popup als Vorschau angezeigt und wieder entfernt werden.

### Funktionsumfang (aktuelle Umsetzung)
1. **Screenshot auswählen (Upload)**
   - Nutzer wählen im Popup eine lokale Bilddatei aus (accept: `image/*`).
   - Die Datei wird im Extension-Kontext als Data URL gelesen.
   - Optional: Downscaling/Kompression, um die Datenmenge zu reduzieren (z. B. JPEG, begrenzte Maximalbreite/-höhe).

2. **Screenshot als Referenz an das LLM übergeben**
   - Beim Klick auf „Generate Code“ wird neben dem strukturierten Payload zusätzlich die Bildreferenz über den Proxy an das LLM übermittelt.
   - Das Bild dient ausschließlich als **visuelle Referenz** für Styling/Shape/Spacing – nicht als Quelle für Textextraktion.

3. **Screenshot-Preview im Extension-UI (optional)**
   - Das hochgeladene Bild kann im Popup als Vorschau angezeigt werden.
   - Ein „Remove“-Button ermöglicht das Entfernen der Bildreferenz.

### Exit-Kriterien
- Upload-Funktion im Extension-UI integriert (Datei auswählen)
- Screenshot wird im Extension-Kontext verarbeitet (mindestens: Data URL; optional: Kompression/Downscaling)
- Screenshot kann im Popup als Vorschau angezeigt und entfernt werden (optional)
- Screenshot wird persistiert (z. B. `chrome.storage.local`) oder zumindest im Request mitgesendet
- LLM erhält neben dem strukturierten Payload eine zusätzliche visuelle Referenz und kann diese für die Rekonstruktion nutzen

### Fehlerkriterien
- Upload nicht möglich (z. B. ungültiges Dateiformat, Lesefehler)
- Bilddaten zu groß → Performance-/Payload-Probleme (API-Limits, Request-Size, Context-Window)
- Fehlende/defekte Preview-Darstellung im Popup
- Bild wird nicht korrekt mit dem Request übertragen oder vom Server nicht berücksichtigt

### Fallbacks
- Übermittlung nur des strukturierten Payloads, falls keine Bilddatei vorhanden ist
- Reduktion der Bildgröße durch Downscaling/Kompression (z. B. Zielbreite/-höhe und JPEG-Qualität)
- Entfernen/Reset der Bildreferenz im UI, falls Upload fehlschlägt
- Hinweis im UI, wenn Bilddaten zu groß sind oder nicht verarbeitet werden können

### Prompt Engineering
- Erweiterung des Prompts um die Information, dass eine visuelle Referenz vorliegt (hochgeladener Screenshot)
- Anweisung: Screenshot nur zur visuellen Annäherung verwenden (Form, Abstände, Farben, Schatten, Bildausschnitt)
- Klare Priorität: Struktur (HTML/CSS) primär, Bildreferenz sekundär zur Validierung/Feintuning
- Keine OCR-Anforderung: Screenshot dient nicht der Textextraktion, sondern nur de