document.addEventListener("DOMContentLoaded", () => {
  const year = document.querySelector("[data-current-year]");
  if (year) year.textContent = new Date().getFullYear();

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const target = document.querySelector(anchor.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
  });

  const budgetTabs = document.querySelectorAll("[data-budget-tab]");
  const budgetPanels = document.querySelectorAll("[data-budget-panel]");

  if (budgetTabs.length && budgetPanels.length) {
    budgetPanels.forEach((panel) => {
      panel.hidden = !panel.classList.contains("is-active");
    });

    budgetTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const target = tab.dataset.budgetTab;

        budgetTabs.forEach((item) => {
          const isActive = item === tab;
          item.classList.toggle("is-active", isActive);
          item.setAttribute("aria-selected", String(isActive));
        });

        budgetPanels.forEach((panel) => {
          const isActive = panel.dataset.budgetPanel === target;
          panel.classList.toggle("is-active", isActive);
          panel.hidden = !isActive;
        });
      });

      tab.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const tabs = [...budgetTabs];
        const currentIndex = tabs.indexOf(tab);
        const nextIndex = event.key === "Home"
          ? 0
          : event.key === "End"
            ? tabs.length - 1
            : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
        tabs[nextIndex].focus();
        tabs[nextIndex].click();
      });
    });
  }

  const stickyCta = document.querySelector(".mobile-sticky-cta");
  const bottomCtaButton = document.querySelector(".bottom-cta .button");
  const updateStickyCta = () => {
    if (!stickyCta) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const stickyHeight = stickyCta.offsetHeight || 0;
    const bottomButtonTop = bottomCtaButton
      ? bottomCtaButton.getBoundingClientRect().top
      : Number.POSITIVE_INFINITY;
    const isNearBottomButton = bottomButtonTop <= window.innerHeight - stickyHeight - 16;
    stickyCta.classList.toggle("is-visible", scrollTop > 680 && !isNearBottomButton);
  };

  updateStickyCta();
  window.addEventListener("scroll", updateStickyCta, { passive: true });
  window.addEventListener("resize", updateStickyCta);
  window.setInterval(updateStickyCta, 300);
});
