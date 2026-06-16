/* Auth flow controller (prototype). Centralises the success/fail branches so
   every login variation behaves the same.

   Demo switches via URL query so you can preview each case:
     ?demo=fail    → social sign-in fails (error dialog)
   OTP success code = "123456" (any other code = verify fail).

   In the real Flutter app these call Firebase/Google/Apple SDKs; here they
   simulate latency + route between screens. */
(function () {
  const params = new URLSearchParams(location.search);
  const FORCE_FAIL = params.get("demo") === "fail";
  window.Auth = window.Auth || {};

  // ── Social sign-in (Google / Apple) ──
  window.Auth.social = function (provider) {
    const loader = Buzzend.loading("Connecting to " + provider + "…");
    setTimeout(function () {
      loader.close();
      if (FORCE_FAIL) {
        Buzzend.confirm({
          icon: "alert", danger: true,
          title: "Sign-in failed",
          message: "We couldn't sign you in with " + provider + ". Check your connection and try again.",
          confirmLabel: "Try again", cancelLabel: "Dismiss",
          onConfirm: () => window.Auth.social(provider),
        });
      } else {
        // success → new user must complete profile
        go("complete-profile.html?via=" + provider.toLowerCase());
      }
    }, 1100);
  };

  // ── Phone: send OTP then go to verify screen ──
  window.Auth.sendOtp = function (dial, masked) {
    Buzzend.confirm({
      icon: "phone", title: "Send verification code?",
      message: "We'll text a 6-digit code to " + (dial || "+977") + " " + (masked || "98•• •••• 21") + ".",
      confirmLabel: "Send code", cancelLabel: "Edit number",
      onConfirm: function () {
        const loader = Buzzend.loading("Sending code…");
        setTimeout(() => { loader.close(); go("verify-otp.html"); }, 900);
      },
    });
  };

  // ── Verify OTP code → returns boolean (success when "123456") ──
  window.Auth.verify = function (code) { return code === "123456"; };

  function go(href) { window.location.href = href; }
})();
