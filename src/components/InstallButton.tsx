import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from './ui';

// El evento `beforeinstallprompt` no está tipado en lib.dom; declaramos lo justo.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
function getDeferred(): BeforeInstallPromptEvent | null {
  return (window as unknown as { __deferredInstallPrompt?: BeforeInstallPromptEvent }).__deferredInstallPrompt ?? null;
}
function setDeferred(v: BeforeInstallPromptEvent | null) {
  (window as unknown as { __deferredInstallPrompt?: BeforeInstallPromptEvent | null }).__deferredInstallPrompt = v;
}

export default function InstallButton() {
  const [installable, setInstallable] = useState(false);

  useEffect(() => {
    setInstallable(!!getDeferred());
    const onAvail = () => setInstallable(true);
    const onDone = () => setInstallable(false);
    window.addEventListener('pwa-installable', onAvail);
    window.addEventListener('pwa-installed', onDone);
    return () => {
      window.removeEventListener('pwa-installable', onAvail);
      window.removeEventListener('pwa-installed', onDone);
    };
  }, []);

  if (!installable) return null;

  async function install() {
    const prompt = getDeferred();
    if (!prompt) return;
    await prompt.prompt();
    await prompt.userChoice;
    setDeferred(null);
    setInstallable(false);
  }

  return (
    <Button variant="ghost" onClick={install} title="Instalar NexoCotiza como app">
      <Download className="h-4 w-4" /> Instalar app
    </Button>
  );
}
