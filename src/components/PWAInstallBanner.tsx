import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, CheckCircle2, Share, PlusSquare, ArrowRight } from 'lucide-react';

interface PWAInstallBannerProps {
  onDismiss?: () => void;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ onDismiss }) => {
  const { isInstallable, isInstalled, isAndroid, isIOS, install, vibrate } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || dismissed) {
    return null;
  }

  const handleInstallClick = async () => {
    vibrate(40);
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) onDismiss();
  };

  return (
    <>
      <div className="bg-gradient-to-r from-cyan-950/90 via-slate-900/95 to-slate-950 border border-cyan-500/40 rounded-xl p-3 sm:p-3.5 mb-4 shadow-xl backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shrink-0 shadow-lg">
            <Smartphone className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-display font-bold text-xs sm:text-sm text-slate-100 flex items-center gap-1.5">
                <span>INSTALL J.A.R.V.I.S. AS ANDROID APP</span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  APK / PWA
                </span>
              </h4>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Install to your home screen for full-screen HUD, voice recognition, and offline companion mode.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            onClick={handleInstallClick}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isInstallable ? 'INSTALL ON ANDROID' : 'HOW TO INSTALL'}</span>
          </button>

          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
            title="Dismiss install banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Guide Modal for Manual Add to Home Screen */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-cyan-400 font-bold">
                <Smartphone className="w-4 h-4" />
                <span>INSTALL ON YOUR PHONE / TABLET</span>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isAndroid || !isIOS ? (
              <div className="space-y-2.5 text-slate-300">
                <div className="flex items-start gap-2.5 p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0 font-bold">1</span>
                  <div>Tap the browser menu (<strong>three dots ⋮</strong> in the top right corner of Chrome).</div>
                </div>

                <div className="flex items-start gap-2.5 p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0 font-bold">2</span>
                  <div>Select <strong>&ldquo;Install app&rdquo;</strong> or <strong>&ldquo;Add to Home screen&rdquo;</strong>.</div>
                </div>

                <div className="flex items-start gap-2.5 p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0 font-bold">3</span>
                  <div>Confirm installation. J.A.R.V.I.S. will appear as a native Android app on your home screen with no browser address bar!</div>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 text-slate-300">
                <div className="flex items-start gap-2.5 p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <Share className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>1. Tap the <strong>Share</strong> button in Safari toolbar.</div>
                </div>

                <div className="flex items-start gap-2.5 p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <PlusSquare className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>2. Scroll down and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong>.</div>
                </div>
              </div>
            )}

            <div className="p-2 bg-cyan-950/40 rounded-lg border border-cyan-800/40 text-[11px] text-cyan-200 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Full microphone voice recognition and sound effects enabled.</span>
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg font-bold"
            >
              GOT IT
            </button>
          </div>
        </div>
      )}
    </>
  );
};
