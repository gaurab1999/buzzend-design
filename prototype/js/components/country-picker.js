/* Reusable country picker — a searchable bottom-sheet of dial codes.
   Reuses the .bz-overlay.sheet styles from dialog.css.

   Auto-wires any `.country-select` button: tapping it opens the picker and,
   on choose, updates the button's .flag + .ccode. Or call directly:
     Buzzend.country(function (c) { ... }, currentIso);
*/
(function () {
  const COUNTRIES = [
    ["NP", "🇳🇵", "Nepal", "+977"], ["IN", "🇮🇳", "India", "+91"],
    ["US", "🇺🇸", "United States", "+1"], ["GB", "🇬🇧", "United Kingdom", "+44"],
    ["AU", "🇦🇺", "Australia", "+61"], ["CA", "🇨🇦", "Canada", "+1"],
    ["AE", "🇦🇪", "United Arab Emirates", "+971"], ["SA", "🇸🇦", "Saudi Arabia", "+966"],
    ["QA", "🇶🇦", "Qatar", "+974"], ["KW", "🇰🇼", "Kuwait", "+965"],
    ["SG", "🇸🇬", "Singapore", "+65"], ["MY", "🇲🇾", "Malaysia", "+60"],
    ["JP", "🇯🇵", "Japan", "+81"], ["KR", "🇰🇷", "South Korea", "+82"],
    ["CN", "🇨🇳", "China", "+86"], ["DE", "🇩🇪", "Germany", "+49"],
    ["FR", "🇫🇷", "France", "+33"], ["IT", "🇮🇹", "Italy", "+39"],
    ["ES", "🇪🇸", "Spain", "+34"], ["NL", "🇳🇱", "Netherlands", "+31"],
    ["SE", "🇸🇪", "Sweden", "+46"], ["NO", "🇳🇴", "Norway", "+47"],
    ["BD", "🇧🇩", "Bangladesh", "+880"], ["PK", "🇵🇰", "Pakistan", "+92"],
    ["LK", "🇱🇰", "Sri Lanka", "+94"], ["BT", "🇧🇹", "Bhutan", "+975"],
    ["TH", "🇹🇭", "Thailand", "+66"], ["ID", "🇮🇩", "Indonesia", "+62"],
    ["PH", "🇵🇭", "Philippines", "+63"], ["VN", "🇻🇳", "Vietnam", "+84"],
    ["BR", "🇧🇷", "Brazil", "+55"], ["MX", "🇲🇽", "Mexico", "+52"],
    ["ZA", "🇿🇦", "South Africa", "+27"], ["NG", "🇳🇬", "Nigeria", "+234"],
    ["EG", "🇪🇬", "Egypt", "+20"], ["TR", "🇹🇷", "Türkiye", "+90"],
    ["RU", "🇷🇺", "Russia", "+7"], ["NZ", "🇳🇿", "New Zealand", "+64"],
  ];

  function host() { return document.querySelector(".screen-box") || document.body; }

  window.Buzzend = window.Buzzend || {};
  window.Buzzend.country = function (onSelect, currentIso) {
    const overlay = document.createElement("div");
    overlay.className = "bz-overlay sheet" + (host() === document.body ? " fixed" : "");
    overlay.innerHTML =
      '<div class="bz-dialog cp-sheet">' +
        '<div class="bz-grip"></div>' +
        '<div class="cp-title">Select country</div>' +
        '<div class="cp-searchwrap"><span>🔎</span>' +
          '<input class="cp-search" type="text" placeholder="Search country or code" autocomplete="off"/></div>' +
        '<div class="cp-list"></div>' +
      '</div>';

    const list = overlay.querySelector(".cp-list");
    const search = overlay.querySelector(".cp-search");

    function render(q) {
      q = (q || "").trim().toLowerCase();
      list.innerHTML = "";
      COUNTRIES
        .filter((c) => !q || c[2].toLowerCase().includes(q) || c[3].includes(q) || c[0].toLowerCase() === q)
        .forEach((c) => {
          const row = document.createElement("button");
          row.className = "cp-row" + (c[0] === currentIso ? " active" : "");
          row.innerHTML = '<span class="fl">' + c[1] + '</span><span class="nm">' + c[2] +
            '</span><span class="dc">' + c[3] + '</span>';
          row.onclick = function () {
            onSelect({ iso: c[0], flag: c[1], name: c[2], dial: c[3] });
            close();
          };
          list.appendChild(row);
        });
    }
    function close() { overlay.classList.remove("open"); setTimeout(() => overlay.remove(), 220); }

    search.addEventListener("input", () => render(search.value));
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    render("");
    host().appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add("open"));
  };

  // auto-wire .country-select buttons on the page
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".country-select").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const iso = btn.getAttribute("data-iso") || "NP";
        Buzzend.country(function (c) {
          btn.setAttribute("data-iso", c.iso);
          const fl = btn.querySelector(".flag"); if (fl) fl.textContent = c.flag;
          const cc = btn.querySelector(".ccode"); if (cc) cc.textContent = c.dial;
        }, iso);
      });
    });
  });
})();
