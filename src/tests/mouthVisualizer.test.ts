import { render } from "@testing-library/react";
import React from "react";
import MouthVisualizer from "../components/MouthVisualizer";

describe("MouthVisualizer", () => {
  it("renders with default amplitude", () => {
    const { getByRole } = render(React.createElement(MouthVisualizer, null));
    expect(getByRole("img", { name: /mouth/i })).toBeInTheDocument();
  });

  it("respects external amplitude prop", () => {
    const { container, rerender } = render(
      React.createElement(MouthVisualizer, { externalAmplitude: 0.1 })
    );
    const before = container.querySelector("div > div") as HTMLDivElement;
    const heightBefore = before.style.height;

    rerender(React.createElement(MouthVisualizer, { externalAmplitude: 0.6 }));
    const after = container.querySelector("div > div") as HTMLDivElement;
    const heightAfter = after.style.height;

    expect(heightAfter).not.toEqual(heightBefore);
  });
});