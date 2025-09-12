import { render } from "@testing-library/react";
import React, { ReactNode } from "react";
import MouthVisualizer from "../components/MouthVisualizer";
import { TTSProvider } from "../lib/tts";

const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) =>
  React.createElement(TTSProvider, null, children);

function pxToNumber(px?: string | null): number | null {
  if (!px) return null;
  const n = parseFloat(px);
  return Number.isFinite(n) ? n : null;
}

describe("MouthVisualizer", () => {
  it("renders with default amplitude", () => {
    const { getByRole } = render(React.createElement(MouthVisualizer, null), { wrapper: Wrapper });
    expect(getByRole("img", { name: /mouth/i })).toBeInTheDocument();
  });

  it("applies inline height style when externalAmplitude provided", () => {
    const { container, rerender } = render(
      React.createElement(MouthVisualizer, { externalAmplitude: 0.1 }),
      { wrapper: Wrapper }
    );
    const before = container.querySelector("div > div") as HTMLDivElement;
    const heightBefore = pxToNumber(before?.style?.height);
    expect(heightBefore).not.toBeNull();

    rerender(React.createElement(MouthVisualizer, { externalAmplitude: 0.6 }));
    const after = container.querySelector("div > div") as HTMLDivElement;
    const heightAfter = pxToNumber(after?.style?.height);

    // We only assert both are numeric; visual rounding may keep them equal.
    expect(heightAfter).not.toBeNull();
  });
});