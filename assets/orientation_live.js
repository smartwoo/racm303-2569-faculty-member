/* ==========================================================================
   RACM 303 (2569) — Orientation Kahoot! Live Retired Stub
   - Floating bar (#orlFloatingJoinPill), background MQTT/PeerJS sync,
     and Kahoot WebAudio BGM/SFX have been permanently removed.
   ========================================================================== */
(function () {
  "use strict";

  function purgeKahootLiveDom() {
    ["orlFloatingJoinPill", "orientParticipantModal", "orientLiveAuxOverlay"].forEach((id) => {
      const el = document.getElementById(id);
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });
    try {
      const h = (window.location.hash || "").replace(/^#/, "").toLowerCase();
      if (h === "live" || h === "orient-live") {
        history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    } catch (_) {}
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", purgeKahootLiveDom);
    } else {
      purgeKahootLiveDom();
    }
  }
})();
