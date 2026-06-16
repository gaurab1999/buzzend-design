/* Reusable OTP input. Auto-wires any `.otp-row` of `.otp-box` inputs:
   - digits only, auto-advance, backspace to previous, paste support
   - dispatches "otp-complete" (detail.code) on the row when all boxes filled
   - dispatches "otp-change" on every change
   Helper: Buzzend.otpValue(rowEl) → string; Buzzend.otpReset(rowEl). */
(function () {
  window.Buzzend = window.Buzzend || {};

  function boxes(row) { return Array.from(row.querySelectorAll(".otp-box")); }
  window.Buzzend.otpValue = (row) => boxes(row).map((b) => b.value).join("");
  window.Buzzend.otpReset = function (row) {
    row.classList.remove("error");
    boxes(row).forEach((b) => (b.value = ""));
    boxes(row)[0] && boxes(row)[0].focus();
  };

  function wire(row) {
    const bs = boxes(row);
    bs.forEach((box, i) => {
      box.setAttribute("inputmode", "numeric");
      box.setAttribute("maxlength", "1");
      box.addEventListener("input", () => {
        row.classList.remove("error");
        box.value = box.value.replace(/\D/g, "").slice(-1);
        if (box.value && i < bs.length - 1) bs[i + 1].focus();
        const code = window.Buzzend.otpValue(row);
        row.dispatchEvent(new CustomEvent("otp-change", { detail: { code } }));
        if (code.length === bs.length) row.dispatchEvent(new CustomEvent("otp-complete", { detail: { code } }));
      });
      box.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !box.value && i > 0) bs[i - 1].focus();
      });
      box.addEventListener("paste", (e) => {
        e.preventDefault();
        const digits = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, bs.length);
        digits.split("").forEach((d, j) => (bs[j].value = d));
        bs[Math.min(digits.length, bs.length - 1)].focus();
        const code = window.Buzzend.otpValue(row);
        if (code.length === bs.length) row.dispatchEvent(new CustomEvent("otp-complete", { detail: { code } }));
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => document.querySelectorAll(".otp-row").forEach(wire));
})();
