import { useEffect, useState, type ReactNode } from "react";
import QRCode from "qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Download, Check, QrCode as QrCodeIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { haptic } from "@/lib/haptics";

type Props = {
  url: string;
  title?: string;
  description?: string;
  fileName?: string;
  trigger?: ReactNode;
  /** When provided, the dialog is controlled by the parent. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function QrCodeDialog({
  url,
  title = "Share via QR code",
  description,
  fileName = "qr-code",
  trigger,
  open,
  onOpenChange,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? !!open : internalOpen;
  const setOpen = (v: boolean) => { if (isControlled) onOpenChange?.(v); else setInternalOpen(v); };

  const [dataUrl, setDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !url) return;
    let cancelled = false;
    setDataUrl("");
    (async () => {
      try {
        const du = await QRCode.toDataURL(url, {
          width: 720,
          margin: 2,
          color: { dark: "#0f172a", light: "#ffffff" },
          errorCorrectionLevel: "M",
        });
        if (!cancelled) setDataUrl(du);
      } catch {
        if (!cancelled) toast.error("Couldn't generate QR code");
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen, url]);


  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      haptic("success");
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.message(url);
    }
  };

  const download = () => {
    if (!dataUrl) return;
    haptic("light");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${fileName}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const share = async () => {
    if (typeof navigator === "undefined" || !navigator.share) {
      copyLink();
      return;
    }
    try {
      await navigator.share({ title, text: description, url });
    } catch { /* user cancelled */ }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger !== undefined && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCodeIcon className="h-4 w-4" /> {title}
          </DialogTitle>
        </DialogHeader>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        <div className="mx-auto mt-2 flex h-[296px] w-[296px] items-center justify-center rounded-2xl border border-border bg-white p-3 shadow-soft">
          {dataUrl ? (
            <img src={dataUrl} alt="QR code" className="block h-[272px] w-[272px]" />
          ) : (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Generating QR code" />
          )}
        </div>

        <button
          type="button"
          onClick={copyLink}
          className="mt-1 w-full break-all rounded-lg border border-border bg-muted/40 px-3 py-2 text-left text-xs text-muted-foreground hover:bg-muted"
          title="Tap to copy"
        >
          {url}
        </button>
        <Button
          type="button"
          onClick={download}
          disabled={!dataUrl}
          className="mt-2 w-full gap-2"
        >
          <Download className="h-4 w-4" />
          Download PNG
        </Button>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" size="sm" onClick={copyLink} className="gap-1">
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            <span className="text-xs">{copied ? "Copied" : "Copy link"}</span>
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={share} className="gap-1">
            <QrCodeIcon className="h-4 w-4" />
            <span className="text-xs">Share</span>
          </Button>
        </div>
        <p className="mt-1 text-center text-[10px] text-muted-foreground">Scan with any phone camera, or download the PNG to share anywhere.</p>
      </DialogContent>
    </Dialog>
  );
}
