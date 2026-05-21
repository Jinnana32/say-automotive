import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AppImage } from "@/components/shared/app-image";

vi.mock("next/image", () => ({
  default: ({
    priority: _priority,
    unoptimized: _unoptimized,
    ...props
  }: Record<string, unknown>) => <img {...props} />,
}));

describe("AppImage", () => {
  it("applies transparent-friendly brand rendering to raster brand assets", () => {
    render(
      <AppImage
        src="/say-auto-care-logo.jpeg"
        alt="Brand logo"
        width={240}
        height={120}
        mode="brand"
        className="h-12 w-auto"
      />,
    );

    expect(screen.getByAltText("Brand logo")).toHaveClass(
      "object-contain",
      "mix-blend-multiply",
    );
  });

  it("keeps content images in normal content-image mode", () => {
    render(
      <AppImage
        src="https://example.com/product.png"
        alt="Product photo"
        width={640}
        height={480}
        mode="content"
        fit="cover"
        className="aspect-[4/3] w-full"
      />,
    );

    expect(screen.getByAltText("Product photo")).toHaveClass("object-cover");
    expect(screen.getByAltText("Product photo")).not.toHaveClass("mix-blend-multiply");
  });
});
