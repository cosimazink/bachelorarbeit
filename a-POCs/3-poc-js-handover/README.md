# Proof of Concepts

## 3. Ergänzende Übergabe von JavaScript-Verhalten an das LLM

### Beschreibung
Aufbauend auf der LLM-Übergabe aus POC 02 wird der Prompt- und UI-Flow erweitert, um neben HTML/CSS auch Interaktions- bzw. JavaScript-Verhalten in die Generierung einzubeziehen. Ziel ist es, nicht nur ein statisches Layout zu erzeugen, sondern eine funktionsnähere Webkomponente.
Dazu werden zwei Strategien kombiniert:

1. Automatischer Kontextansatz: Es findet keine aktive JavaScript-Analyse der Seite statt. Stattdessen wird das LLM über einen optimierten Prompt dazu angeleitet, Verhalten (z. B. Hover/Focus/Click-Muster) aus den gelieferten Daten selbstständig zu rekonstruieren.
2. Manueller Zusatzansatz: Nutzer können optional eigene Verhaltenshinweise (Text oder Codefragment) im Extension-UI ergänzen. Diese Eingabe wird separat als „untrusted“ übergeben und klar vom Preset getrennt.

Zusätzlich wird der Prompt strukturell optimiert (klar gegliedert in Task/Goal/Context/Instructions/Output Rules), um Robustheit und Output-Qualität zu erhöhen und Missverständnisse zu reduzieren.

### Exit-Kriterien
- Prompt wird um einen klar gekennzeichneten Abschnitt für USER_PREFERENCES (untrusted) erweitert
- Zusatzhinweise können im UI erfasst und an die API übergeben werden (separates Feld)
- Prompt-Optimierung ist umgesetzt (strukturierte Prompt-Sektionierung, expliziter Kontext „keine JS-Analyse“)
- Generierter Output enthält neben HTML/CSS bei Bedarf auch integriertes JS bzw. Verhaltenslogik innerhalb einer Webkomponente
- Zusatzhinweise und Output bleiben persistent sichtbar, bis Select Mode erneut aktiviert oder eine neue Auswahl getroffen wird

### Fehlerkriterien
- Zusatzhinweise werden nicht korrekt übertragen oder gehen beim Prompt-Build verloren
- Modell erzeugt Verhalten, das nicht zum Element passt (z. B. falsche Trigger oder Zustandswechsel)
- Nutzer-Eingaben führen zu inkonsistentem Output (z. B. JS nicht eindeutig zugeordnet)
- Prompt/Preference-Trennung ist fehlerhaft (z. B. User-Text wird fälschlich als „trusted“ behandelt)

### Fallbacks
- Strikte Trennung von Preset und Zusatzhinweis, um Prompt-Injection/Fehlinterpretation zu reduzieren
- (Optional erweiterbar) Ausgabe ohne JS mit Hinweis, dass Verhalten nicht zuverlässig rekonstruiert werden konnte

### Prompt Engineering
- Strukturierter Prompt-Aufbau (Task, Goal, Context, Instructions, Output Rules)
- Explizite Kennzeichnung eines automatischen Kontextansatzes (keine aktive JS-Analyse)
- Trennung von Preset-Instruktionen (trusted) und Nutzer-Zusatzhinweisen (untrusted)
- Anleitung zur selbstständigen Rekonstruktion von Interaktionen durch das LLM
- Reduktion von Mehrdeutigkeiten durch klare Rollen- und Kontextdefinition

### Verwendete Technologien, Mechanismen, Konzeptentscheidungen
- Erweiterte Eingabemaske im Extension-UI zur Erfassung von Verhaltenshinweisen
- Persistenz von Zusatzhinweisen und generiertem Output über chrome.storage.local
- Separater API-Parameter zur Übergabe von Nutzer-Zusatzkontext (extra)
- Erweiterter Prompt-Building-Mechanismus zur Zusammenführung von Struktur-, Stil- und Verhaltensinformationen