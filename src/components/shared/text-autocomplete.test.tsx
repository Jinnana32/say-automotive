import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { TextAutocomplete } from "@/components/shared/text-autocomplete";

describe("TextAutocomplete", () => {
  it("filters options and allows selecting a suggestion", () => {
    function TestHarness() {
      const [value, setValue] = useState("");

      return (
        <TextAutocomplete
          id="vehicle-make"
          name="make"
          value={value}
          onValueChange={setValue}
          options={[
            { value: "Toyota" },
            { value: "Mitsubishi" },
            { value: "Mazda" },
          ]}
        />
      );
    }

    render(<TestHarness />);

    const input = screen.getByRole("textbox");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "toy" } });

    expect(screen.getByRole("option", { name: /Toyota/i })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Mitsubishi/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("option", { name: /Toyota/i }));

    expect(screen.getByRole("textbox")).toHaveValue("Toyota");
  });
});
