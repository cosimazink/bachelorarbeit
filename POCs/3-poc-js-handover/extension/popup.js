document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("start-selection");
  const preview = document.getElementById("payload-preview");
  const generateBtn = document.getElementById("generate");
  const presetEl = document.getElementById("promptPreset");
  const extraEl = document.getElementById("promptExtra");
  const statusEl = document.getElementById("status");
  const outEl = document.getElementById("llm-output");
  const copyBtn = document.getElementById("copy");

  function setOutput(code) {
    outEl.textContent = code || "{ noch kein Output }";
    copyBtn.disabled = !code;
  }

  function clearOutput(reason = "") {
    // optional: du kannst reason nutzen, um eine Statusmeldung zu zeigen
    setOutput("");
    chrome.storage.local.remove(["lastGeneratedCode"]);
    if (reason) setStatus(reason);
  }

  function clearExtra(reason = "") {
    extraEl.value = "";
    chrome.storage.local.remove(["lastPromptExtra"]);
    if (reason) setStatus(reason);
  }

  function saveExtra() {
    chrome.storage.local.set({ lastPromptExtra: extraEl.value || "" });
  }

  function setButtonState(isOn) {
    btn.dataset.mode = isOn ? "on" : "off";
    btn.textContent = isOn ? "Select Mode: ON (click to stop)" : "Select Mode: OFF (click to start)";
  }

  // UI-Statusmeldung im Popup anzeigen (Info/Fehler)
  function setStatus(text, type = "info") {
    statusEl.textContent = text;
    statusEl.classList.remove("hidden");
    statusEl.style.borderColor = type === "error" ? "#ef4444" : "#d1d5db";
  }

  // Statusmeldung ausblenden
  function clearStatus() {
    statusEl.classList.add("hidden");
    statusEl.textContent = "";
  }

  // Ladezustand (Button disable + Text ändern)
  function setLoading(isLoading) {
    generateBtn.disabled = isLoading;
    generateBtn.textContent = isLoading ? "Generating..." : "Generate Code";
  }

  // Prompt aus Preset + optionalen Zusatzhinweisen bauen
  function buildPrompt(preset, extra) {
    const base = {
      vanilla_webcomponent: `
      Erstelle eine Webkomponente in Vanilla JavaScript (eine Datei).
      Ziel: visuell so nah wie möglich am Originalelement.
      Nutze die gelieferten Daten (outerHTML, computed styles, hover/focus snapshots, attributes).
      Baue eine selbstständige Komponente, ohne externe Libraries.
      Enthalten sein müssen: HTML-Template + CSS (scoped) + JS (Custom Element).
      Gib NUR den finalen Code zurück, als eine komplette Datei (z.B. index.html oder component.js).
      `,
      snippet_html_css: `
      Erstelle ein minimal mögliches HTML+CSS Snippet, das das Element so nah wie möglich nachbildet.
      Nutze die gelieferten Styles, aber halte den Output kompakt.
      Gib NUR Code zurück (keine Erklärungen).
      `
    };

    return (base[preset] || base.vanilla_webcomponent) + (extra ? `\nZusatzhinweise:\n${extra}\n` : "");
  }

  // Beim Öffnen: letzte Auswahl laden
  chrome.storage.local.get("lastSelection", (result) => {
    if (result.lastSelection) {
      preview.textContent = JSON.stringify(result.lastSelection, null, 2);
    } else {
      preview.textContent = "{ noch kein Element ausgewählt }";
    }
  });

  // Beim Öffnen: letzten Output laden
  chrome.storage.local.get("lastGeneratedCode", (result) => {
    if (result.lastGeneratedCode) {
      setOutput(result.lastGeneratedCode);
    } else {
      setOutput("");
    }
  });

  // Beim Öffnen: Zusatzhinweis + Preset laden
  chrome.storage.local.get(["lastPromptExtra", "lastPromptPreset"], (result) => {
    if (typeof result.lastPromptExtra === "string") {
      extraEl.value = result.lastPromptExtra;
    }
    if (typeof result.lastPromptPreset === "string") {
      presetEl.value = result.lastPromptPreset;
    }
  });

  // Beim Öffnen: aktuellen State vom Content Script abfragen
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab?.id) return;

    chrome.tabs.sendMessage(tab.id, { type: "GET_SELECTION_STATE" }, (res) => {
      // falls content script nicht verfügbar (z.B. chrome:// pages)
      if (chrome.runtime.lastError) {
        setButtonState(false);
        return;
      }
      setButtonState(!!res?.selectionMode);
    });
  });

  btn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.id) {
        console.error("Kein aktiver Tab gefunden.");
        return;
      }

      const isOn = btn.dataset.mode === "on";
      const nextType = isOn ? "STOP_SELECTION" : "START_SELECTION";

      chrome.tabs.sendMessage(tab.id, { type: nextType }, (res) => {
        if (chrome.runtime.lastError) {
          preview.textContent =
            "{ Fehler: Content Script nicht erreichbar (z.B. interne Browser-Seite oder blockierter Kontext) }";
          setButtonState(false);
          return;
        }

        setButtonState(!!res?.selectionMode);

        const turnedOn = !isOn; // weil nextType = START_SELECTION wenn isOn=false
        if (turnedOn) {
          clearOutput("Select Mode aktiv – Output zurückgesetzt.");
          clearExtra("Select Mode aktiv – Zusatzhinweis zurückgesetzt.");
        }

        preview.textContent = isOn
          ? "{ Select Mode deaktiviert. }"
          : "{ Select Mode aktiv. Fahre über die Seite und klicke auf ein Element ... }";
      });
    });
  });

  let lastSerialized = null;
  setInterval(() => {
    chrome.storage.local.get("lastSelection", (result) => {
      if (!result.lastSelection) return;
      const serialized = JSON.stringify(result.lastSelection, null, 2);
      if (serialized !== lastSerialized) {
        lastSerialized = serialized;
        preview.textContent = serialized;

        if (hadPrevious) {
          clearOutput("Neue Auswahl erkannt – Output zurückgesetzt.");
        }
      }
    });
  }, 800);

  generateBtn.addEventListener("click", async () => {
    clearStatus();
    setLoading(true);
    outEl.textContent = "{ generating... }";
    copyBtn.disabled = true;

    try {
      const { lastSelection } = await chrome.storage.local.get("lastSelection");
      if (!lastSelection) {
        throw new Error("Kein Payload gefunden. Bitte erst ein Element auswählen (POC 3).");
      }

      const prompt = buildPrompt(presetEl.value, extraEl.value.trim());

      const res = await fetch("http://localhost:8787/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          payload: lastSelection
        })
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(`API Error (${res.status}): ${msg || "unknown"}`);
      }

      const data = await res.json();
      const code = data.code || "";
      setOutput(code);
      await chrome.storage.local.set({ lastGeneratedCode: code });
      setStatus("Done");
    } catch (err) {
      setStatus(err.message || "Unbekannter Fehler", "error");
      outEl.textContent = "{ error }";
    } finally {
      setLoading(false);
    }
  });

  copyBtn.addEventListener("click", async () => {
    const text = outEl.textContent || "";
    await navigator.clipboard.writeText(text);
    setStatus("Copied to clipboard");
  });

  extraEl.addEventListener("input", () => {
    saveExtra();
  });
});