document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("start-selection");

  btn.addEventListener("click", () => {
    // Aktiven Tab holen
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.id) {
        console.error("Kein aktiver Tab gefunden.");
        return;
      }

      // Nachricht an das Content Script schicken
      chrome.tabs.sendMessage(tab.id, { type: "START_SELECTION" }, () => {
        // Optional: Feedback im Popup
        window.close(); // Popup schließen, damit man die Seite sieht
      });
    });
  });
});
