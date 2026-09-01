const campaign = "fukuoka_airport_popup_2026";
const incoming = new URLSearchParams(window.location.search);
const attribution = {
  utm_source: incoming.get("utm_source") || "lp",
  utm_medium: incoming.get("utm_medium") || "owned",
  utm_campaign: incoming.get("utm_campaign") || campaign
};

window.dataLayer = window.dataLayer || [];

document.querySelectorAll("[data-track]").forEach((link) => {
  link.addEventListener("click", () => {
    window.dataLayer.push({
      event: "popup_location_click",
      cta_id: link.dataset.track,
      ...attribution
    });
  });
});

