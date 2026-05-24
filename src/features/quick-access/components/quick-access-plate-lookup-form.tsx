"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Camera, Loader2, ScanSearch, VideoOff } from "lucide-react";
import { useRouter } from "next/navigation";

import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { extractPlateCandidatesFromTextBlocks, normalizeQuickAccessPlate } from "@/features/quick-access/utils";

type BrowserTextDetector = {
  detect: (source: CanvasImageSource) => Promise<Array<{ rawValue?: string }>>;
};

type BrowserTextDetectorConstructor = new () => BrowserTextDetector;

export function QuickAccessPlateLookupForm({
  initialPlate,
  onLookupSubmitted,
}: {
  initialPlate: string;
  onLookupSubmitted?: () => void;
}) {
  const router = useRouter();
  const [plateInput, setPlateInput] = useState(initialPlate);
  const [cameraState, setCameraState] = useState<"idle" | "loading" | "ready">("idle");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraNote, setCameraNote] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(
    () => () => {
      stopCamera();
    },
    [],
  );

  const canScanWithBrowserOcr = useMemo(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return typeof getTextDetectorConstructor() !== "undefined";
  }, []);

  function submitPlateLookup(rawPlate: string) {
    const normalizedPlate = normalizeQuickAccessPlate(rawPlate);

    if (!normalizedPlate) {
      setCameraError("Enter or scan a plate number before searching.");
      return;
    }

    onLookupSubmitted?.();
    startTransition(() => {
      router.push(`/quick-access?q=${encodeURIComponent(normalizedPlate)}`);
    });
  }

  async function openCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera access is not available in this browser. Use manual plate entry instead.");
      return;
    }

    stopCamera();
    setCameraError(null);
    setCameraNote(null);
    setCameraState("loading");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraState("ready");
      if (!canScanWithBrowserOcr) {
        setCameraNote("Camera preview is ready. If automatic text scan does not work on this browser, type the plate manually below.");
      }
    } catch {
      setCameraState("idle");
      setCameraError("Unable to access the camera. Check browser permissions or use manual plate entry.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraState("idle");
  }

  async function scanCurrentFrame() {
    const detectorConstructor = getTextDetectorConstructor();

    if (!detectorConstructor) {
      setCameraError("Automatic plate scanning is not supported on this browser yet. Use manual plate entry instead.");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError("The camera preview is not ready yet. Wait a moment and try again.");
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      setCameraError("Unable to capture a frame from the camera. Use manual plate entry instead.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    setCameraError(null);
    setCameraNote("Scanning the current frame...");

    try {
      const detector = new detectorConstructor();
      const blocks = await detector.detect(canvas);
      const candidates = extractPlateCandidatesFromTextBlocks(
        blocks.map((block) => block.rawValue ?? "").filter(Boolean),
      );

      if (candidates.length === 0) {
        setCameraError("No readable plate candidate was detected. Hold the plate steady, improve the angle, or type it manually.");
        setCameraNote(null);
        return;
      }

      const bestCandidate = candidates[0];
      setPlateInput(bestCandidate);
      setCameraNote(`Detected plate candidate: ${bestCandidate}`);
      submitPlateLookup(bestCandidate);
    } catch {
      setCameraError("Camera scanning failed on this browser. Use manual plate entry instead.");
      setCameraNote(null);
    }
  }

  return (
    <div className="space-y-4">
      <form
        className="flex flex-col gap-3 md:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          submitPlateLookup(plateInput);
        }}
      >
        <SearchInput
          value={plateInput}
          onChange={(event) => setPlateInput(event.target.value.toUpperCase())}
          placeholder="Enter plate number"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
        />
        <Button type="submit" className="shrink-0" disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <ScanSearch className="size-4" />}
          Search record
        </Button>
      </form>

      <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Camera scan</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Use the camera to detect a plate candidate, then jump straight into the record lookup.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {cameraState === "ready" ? (
              <>
                <Button type="button" variant="outline" onClick={scanCurrentFrame}>
                  <ScanSearch className="size-4" />
                  Scan plate
                </Button>
                <Button type="button" variant="ghost" onClick={stopCamera}>
                  <VideoOff className="size-4" />
                  Close camera
                </Button>
              </>
            ) : (
              <Button type="button" variant="outline" onClick={openCamera} disabled={cameraState === "loading"}>
                {cameraState === "loading" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Camera className="size-4" />
                )}
                {cameraState === "loading" ? "Opening camera..." : "Open camera"}
              </Button>
            )}
          </div>
        </div>

        {cameraState === "ready" ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-border/80 bg-background">
            <video ref={videoRef} className="aspect-[4/3] w-full bg-black object-cover" muted playsInline />
          </div>
        ) : null}

        {cameraError ? <p className="mt-3 text-sm text-destructive">{cameraError}</p> : null}
        {cameraNote ? <p className="mt-3 text-sm text-muted-foreground">{cameraNote}</p> : null}

        <p className="mt-3 text-xs text-muted-foreground">
          Camera OCR support varies by browser. Manual plate entry remains the reliable fallback.
        </p>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}

function getTextDetectorConstructor(): BrowserTextDetectorConstructor | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const detector = (window as Window & { TextDetector?: BrowserTextDetectorConstructor })
    .TextDetector;

  return detector;
}
