const DEFAULT_UTM = {
  utm_source: "lp",
  utm_medium: "owned",
  utm_campaign: "seasonal_promo"
};

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

async function loadCampaign() {
  try {
    const response = await fetch("data/campaign.json", { cache: "no-store" });
    if (!response.ok) return {};
    return await response.json();
  } catch {
    return {};
  }
}

function currentUtmParams(campaign = {}) {
  const searchParams = new URLSearchParams(window.location.search);
  const defaults = {
    ...DEFAULT_UTM,
    utm_campaign: campaign.utm_campaign || DEFAULT_UTM.utm_campaign
  };

  return UTM_KEYS.reduce((params, key) => {
    const value = searchParams.get(key) || defaults[key];
    if (value) params[key] = value;
    return params;
  }, {});
}

function decorateUrl(baseUrl, content, campaign) {
  const url = new URL(baseUrl);
  const inherited = currentUtmParams(campaign);

  Object.entries(inherited).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  if (!url.searchParams.has("utm_content")) {
    url.searchParams.set("utm_content", content || "lp_cta");
  }

  return url.toString();
}

function emitCtaEvent(anchor) {
  const eventName = anchor.dataset.event || `click_${anchor.dataset.utmContent || "lp_cta"}`;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    cta_content: anchor.dataset.utmContent || "lp_cta",
    destination_url: anchor.dataset.baseUrl || anchor.href
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const campaign = await loadCampaign();

  document.querySelectorAll("a[data-base-url]").forEach((anchor) => {
    anchor.href = decorateUrl(anchor.dataset.baseUrl, anchor.dataset.utmContent, campaign);
    anchor.addEventListener("click", () => emitCtaEvent(anchor));
  });
});
