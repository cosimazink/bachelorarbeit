document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("start-selection");
  const preview = document.getElementById("payload-preview");

  // Beim Öffnen: letzte Auswahl laden
  chrome.storage.local.get("lastSelection", (result) => {
    if (result.lastSelection) {
      const formatted = JSON.stringify(result.lastSelection, null, 2);
      preview.textContent = formatted;
    } else {
      preview.textContent = "{ noch kein Element ausgewählt }";
    }
  });

  btn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.id) {
        console.error("Kein aktiver Tab gefunden.");
        return;
      }

      chrome.tabs.sendMessage(tab.id, { type: "START_SELECTION" }, () => {
        preview.textContent =
          "{ Auswahlmodus aktiv. Klicke auf der Seite auf ein Element ... }";
      });
    });
  });
});
