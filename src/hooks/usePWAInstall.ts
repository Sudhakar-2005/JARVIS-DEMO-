import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [wakeLockActive, setWakeLockActive] = useState(false);

  useEffect(() => {
    // Detect standalone mode (already installed as PWA or Android APK)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Detect device OS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const androidDevice = /android/.test(userAgent);
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsAndroid(androidDevice);
    setIsIOS(iosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Request Android Screen Wake Lock (prevents screen from sleeping during voice session)
  const toggleScreenWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        if (!wakeLockActive) {
          const lock = await (navigator as any).wakeLock.request('screen');
          setWakeLockActive(true);
          lock.addEventListener('release', () => setWakeLockActive(false));
          return true;
        }
      }
    } catch (err) {
      console.warn('Wake Lock error:', err);
    }
    return false;
  };

  // Trigger Android native installation prompt
  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  // Android Haptic Vibration
  const vibrate = (pattern: number | number[] = 25) => {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {
      // ignore
    }
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isAndroid,
    isIOS,
    wakeLockActive,
    install,
    vibrate,
    toggleScreenWakeLock,
  };
}
