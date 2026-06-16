/* Buzzend prototype — shared behaviour across every screen.
   Theme, color set, and font all persist in localStorage so they carry
   across every screen you open. */
(function () {
  const KEY = "buzzend-theme";
  const PKEY = "buzzend-palette";
  const FKEY = "buzzend-font";

  // each color set's recommended font (applied automatically on selection)
  const RECOMMENDED_FONT = {
    teal: "nunito", // current — leave as is
    neomint: "inter",
    electricblue: "jakarta",
    blackgold: "sfpro",
    energyorange: "inter",
    aipurple: "manrope",
  };

  const el = document.documentElement;

  // apply persisted theme + palette + font as early as possible
  const savedTheme = localStorage.getItem(KEY);
  if (savedTheme) el.setAttribute("data-theme", savedTheme);
  const palette = localStorage.getItem(PKEY) || "teal";
  el.setAttribute("data-palette", palette);
  const font = localStorage.getItem(FKEY) || "nunito";
  el.setAttribute("data-font", font);

  // Home swatches: choosing a set also applies its recommended font
  window.setPalette = function (name) {
    el.setAttribute("data-palette", name);
    localStorage.setItem(PKEY, name);
    const recFont = RECOMMENDED_FONT[name] || "nunito";
    window.setFont(recFont);
    markActive("[data-swatch]", "data-swatch", name);
  };

  // Font picker: override the font independently
  window.setFont = function (name) {
    el.setAttribute("data-font", name);
    localStorage.setItem(FKEY, name);
    markActive("[data-font-pick]", "data-font-pick", name);
  };

  window.toggleTheme = function () {
    const next = el.getAttribute("data-theme") === "dark" ? "light" : "dark";
    el.setAttribute("data-theme", next);
    localStorage.setItem(KEY, next);
    const btn = document.querySelector(".theme-toggle");
    if (btn) btn.textContent = next === "dark" ? "☀️ Light" : "🌙 Dark";
  };

  function markActive(selector, attr, value) {
    document.querySelectorAll(selector).forEach(function (n) {
      n.classList.toggle("active", n.getAttribute(attr) === value);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    const btn = document.querySelector(".theme-toggle");
    if (btn) {
      const dark = el.getAttribute("data-theme") === "dark";
      btn.textContent = dark ? "☀️ Light" : "🌙 Dark";
    }
    markActive("[data-swatch]", "data-swatch", localStorage.getItem(PKEY) || "teal");
    markActive("[data-font-pick]", "data-font-pick", localStorage.getItem(FKEY) || "nunito");
    document.querySelectorAll("[data-go]").forEach(function (n) {
      n.addEventListener("click", function () {
        window.location.href = n.getAttribute("data-go");
      });
    });
  });
})();
