// Install button in the header. Chrome / Edge / Android fire
// beforeinstallprompt when the app can be installed; iOS Safari never does,
// so there the button explains Add to Home Screen instead. Hidden once
// running as an installed app.
import { toast } from './toast.js';

export function initInstall() {
  const btn = document.getElementById('installBtn');
  const installed = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let prompt = null;

  if (installed) return;
  if (ios) btn.hidden = false;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // show our button rather than the browser's mini bar
    prompt = e;
    btn.hidden = false;
  });

  window.addEventListener('appinstalled', () => {
    prompt = null;
    btn.hidden = true;
  });

  btn.addEventListener('click', async () => {
    if (prompt) {
      const event = prompt;
      prompt = null; // each prompt can only be shown once
      event.prompt();
      const { outcome } = await event.userChoice;
      if (outcome === 'accepted') btn.hidden = true;
    }
    else if (ios) {
      toast('To install, tap Share, then Add to Home Screen', 6000);
    }
  });
}
