import React, { useEffect, useRef, useState } from "react";

/**
 * Printable bezel template helper:
 * - Provides measurements in mm for a double-DIN opening (approx 180 x 100 mm).
 * - Allows exporting a PNG via canvas and printing via window.print().
 */
const PrintableBezel: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dpi, setDpi] = useState(300);

  useEffect(() => {
    renderTemplate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dpi]);

  const mmToPx = (mm: number) => Math.round((mm / 25.4) * dpi);

  const renderTemplate = () => {
    const canvas = canvasRef.current!;
    // Outer: a bit larger than 180x100 to include margin
    const outerWmm = 200;
    const outerHmm = 130;
    canvas.width = mmToPx(outerWmm);
    canvas.height = mmToPx(outerHmm);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#0a0f0a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#39FF14";
    ctx.lineWidth = 2;

    // Draw outer margin
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Draw cutout: 180 x 100 mm, centered
    const cutW = mmToPx(180);
    const cutH = mmToPx(100);
    const x = (canvas.width - cutW) / 2;
    const y = (canvas.height - cutH) / 2;

    // Hatch background
    for (let i = 0; i < canvas.width; i += 12) {
      ctx.strokeStyle = "rgba(57,255,20,0.2)";
      ctx.beginPath();
      ctx.moveTo(i, y);
      ctx.lineTo(i, y + cutH);
      ctx.stroke();
    }

    ctx.strokeStyle = "#39FF14";
    ctx.strokeRect(x, y, cutW, cutH);

    ctx.fillStyle = "#c8ffcc";
    ctx.font = "20px 'Share Tech Mono', monospace";
    ctx.fillText("RetroSpy Car AI - Double-DIN Bezel Template", 20, 40);
    ctx.font = "16px 'Share Tech Mono', monospace";
    ctx.fillText(`Inner cutout: 180 x 100 mm`, 20, 70);
    ctx.fillText(`Page DPI: ${dpi} (Set printer scaling to 100%)`, 20, 95);

    // Tick marks every 10mm along top edge of the cutout
    ctx.strokeStyle = "#39FF14";
    for (let mm = 0; mm <= 180; mm += 10) {
      const tx = x + mmToPx(mm);
      ctx.beginPath();
      ctx.moveTo(tx, y - 8);
      ctx.lineTo(tx, y);
      ctx.stroke();
    }
    for (let mm = 0; mm <= 100; mm += 10) {
      const ty = y + mmToPx(mm);
      ctx.beginPath();
      ctx.moveTo(x - 8, ty);
      ctx.lineTo(x, ty);
      ctx.stroke();
    }
  };

  const downloadPng = () => {
    const url = canvasRef.current!.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "retrospy-bezel-template.png";
    a.click();
  };

  const printPage = () => window.print();

  return (
    <section className="space-y-3">
      <h1 className="text-2xl">Printable Bezel Template</h1>
      <div className="text-sm opacity-85">
        This template outlines a 180 × 100 mm double-DIN opening. Set printer scaling to 100% (no
        “fit to page”). Measure with a ruler after printing to verify accuracy.
      </div>
      <div className="flex items-center gap-3">
        <label className="text-sm">
          DPI
          <input
            type="number"
            className="ml-2 w-24 bg-black/40 border border-neon-dim rounded px-2 py-1"
            value={dpi}
            min={72}
            max={600}
            step={1}
            onChange={(e) => setDpi(Number(e.target.value))}
          />
        </label>
        <button
          className="px-3 py-1 border border-neon-dim rounded hover:bg-neon-green/10"
          onClick={downloadPng}
        >
          Download PNG
        </button>
        <button
          className="px-3 py-1 border border-neon-dim rounded hover:bg-neon-green/10"
          onClick={printPage}
        >
          Print
        </button>
      </div>
      <div className="border border-neon-dim rounded p-2 bg-black/40">
        <canvas ref={canvasRef} className="w-full h-auto" />
      </div>
      <div className="text-xs opacity-70">
        Note: actual mounting varies by vehicle. Provide extra margin and check clearances.
      </div>
    </section>
  );
};

export default PrintableBezel;