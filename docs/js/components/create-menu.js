/* Create menu — the bottom sheet shown when the "+" FAB is tapped.
   Two entries: AI Workout (pose-detection rep counting) and Record or Upload
   (reusable camera/gallery capture → compose). Reusable across screens; needs
   dialog.js + icons.js. Relative links assume the caller lives in screens/home/. */
window.CreateMenu = (function () {
  const I = (n, s) => window.Icons.svg(n, s);
  function open() {
    Buzzend.sheet({ html: `<div class="cm-menu">
      <div class="cm-mtitle">Create</div>
      <button class="cm-opt" onclick="location.href='../workout/moment.html'">
        <span class="cm-oi ai">${I("zap", 22)}</span>
        <div class="cm-otx"><b>AI Workout</b><span>Count reps automatically with the camera</span></div>
        <span class="cm-go">${I("chevron", 18)}</span></button>
      <button class="cm-opt" onclick="location.href='capture.html?purpose=post'">
        <span class="cm-oi rec">${I("camera", 22)}</span>
        <div class="cm-otx"><b>Record or Upload</b><span>Capture a photo / video or pick from your gallery</span></div>
        <span class="cm-go">${I("chevron", 18)}</span></button>
    </div>` });
  }
  return { open };
})();
