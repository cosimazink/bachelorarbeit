document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("start-selection");
  const preview = document.getElementById("payload-preview");

  function setButtonState(isOn) {
    btn.dataset.mode = isOn ? "on" : "off";
    btn.textContent = isOn ? "Select Mode: ON (click to stop)" : "Select Mode: OFF (click to start)";
  }

  // Beim Öffnen: letzte Auswahl laden
  chrome.storage.local.get("lastSelection", (result) => {
    if (result.lastSelection) {
      preview.textContent = JSON.stringify(result.lastSelection, null, 2);
    } else {
      preview.textContent = "{ noch kein Element ausgewählt }";
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

        preview.textContent = isOn
          ? "{ Select Mode deaktiviert. }"
          : "{ Select Mode aktiv. Fahre über die Seite und klicke auf ein Element ... }";
      });
    });
  });

  // live updates, wenn neues Payload gespeichert wurde
  let lastSerialized = null;
  setInterval(() => {
    chrome.storage.local.get("lastSelection", (result) => {
      if (!result.lastSelection) return;
      const serialized = JSON.stringify(result.lastSelection, null, 2);
      if (serialized !== lastSerialized) {
        lastSerialized = serialized;
        preview.textContent = serialized;
      }
    });
  }, 800);
});
