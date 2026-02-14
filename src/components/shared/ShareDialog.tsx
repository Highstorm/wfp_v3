import React, { useState, useRef, useEffect } from "react";

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shareCode?: string;
  isSharing: boolean;
  onShare?: () => void;
  onImport?: (code: string) => void;
  isLoading: boolean;
  errorMessage?: string;
}

export const ShareDialog: React.FC<ShareDialogProps> = ({
  isOpen,
  onClose,
  shareCode,
  isSharing,
  onShare,
  onImport,
  isLoading,
  errorMessage,
}) => {
  const [importCode, setImportCode] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const shareUrlRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && shareUrlRef.current && shareCode) {
      shareUrlRef.current.focus();
      shareUrlRef.current.select();
    }
  }, [isOpen, shareCode]);

  useEffect(() => {
    // Reset copySuccess when dialog is reopened
    if (isOpen) {
      setCopySuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const shareUrl = shareCode
    ? `${window.location.origin}/shared-dish/${shareCode}`
    : "";

  const handleCopyToClipboard = () => {
    if (shareUrlRef.current) {
      shareUrlRef.current.select();
      document.execCommand("copy");
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    }
  };

  const handleImport = () => {
    if (onImport && importCode.trim()) {
      onImport(importCode.trim());
    }
  };

  const handleShareClick = () => {
    console.log("Share button clicked");
    if (onShare) {
      onShare();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`card w-full max-w-md p-6`}>
        <h2 className="text-xl font-semibold mb-4">
          {isSharing ? "Gericht teilen" : "Gericht importieren"}
        </h2>

        {isSharing ? (
          <div>
            {!shareCode ? (
              <>
                <p className="mb-4">
                  Generiere einen Link, um dieses Gericht mit anderen zu teilen.
                </p>
                <button
                  onClick={handleShareClick}
                  disabled={isLoading}
                  className={`btn-primary w-full ${
                    isLoading ? "cursor-not-allowed opacity-50" : ""
                  }`}
                >
                  {isLoading ? "Generiere Link..." : "Link generieren"}
                </button>
                {errorMessage && (
                  <p className="mt-2 text-sm text-destructive-foreground">
                    {errorMessage}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="mb-2 text-sm text-muted-foreground">
                  Dieser Link ist 7 Tage gültig. Jeder mit dem Link kann das
                  Gericht importieren:
                </p>
                <div className="flex mb-4">
                  <input
                    ref={shareUrlRef}
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="input rounded-r-none"
                  />
                  <button
                    onClick={handleCopyToClipboard}
                    className="btn-primary rounded-l-none"
                  >
                    {copySuccess ? "Kopiert!" : "Kopieren"}
                  </button>
                </div>
                {copySuccess && (
                  <p className="mb-4 text-sm text-success-foreground">
                    Link in die Zwischenablage kopiert!
                  </p>
                )}
              </>
            )}
          </div>
        ) : (
          <div>
            <p className="mb-2">
              Gib den Code oder die komplette URL ein, um ein geteiltes Gericht
              zu importieren:
            </p>
            <div className="mb-4">
              <input
                ref={inputRef}
                type="text"
                value={importCode}
                onChange={(e) => setImportCode(e.target.value)}
                placeholder="z.B. ABCD1234 oder vollständige URL"
                className="input"
              />
            </div>
            {errorMessage && (
              <p className="mb-4 text-sm text-destructive-foreground">
                {errorMessage}
              </p>
            )}
            <button
              onClick={handleImport}
              disabled={isLoading || !importCode.trim()}
              className={`btn-primary w-full ${
                isLoading || !importCode.trim()
                  ? "cursor-not-allowed opacity-50"
                  : ""
              }`}
            >
              {isLoading ? "Importiere..." : "Importieren"}
            </button>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="btn-ghost">
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
