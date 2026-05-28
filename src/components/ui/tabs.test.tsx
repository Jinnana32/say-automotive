import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

describe("Tabs", () => {
  it("renders the active tab with the branded navy treatment and keeps inactive tabs neutral", () => {
    render(
      <Tabs defaultValue="attendance">
        <TabsList>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="roster">Roster</TabsTrigger>
        </TabsList>
        <TabsContent value="attendance">Attendance content</TabsContent>
        <TabsContent value="roster">Roster content</TabsContent>
      </Tabs>,
    );

    const activeTab = screen.getByRole("tab", { name: "Attendance" });
    const inactiveTab = screen.getByRole("tab", { name: "Roster" });

    expect(activeTab).toHaveAttribute("data-state", "active");
    expect(activeTab).toHaveClass("bg-[#0B1F4D]", "text-white");
    expect(inactiveTab).toHaveAttribute("data-state", "inactive");
    expect(inactiveTab).toHaveClass("text-slate-600");
  });

  it("updates the active tab styling after selection changes", () => {
    render(
      <Tabs defaultValue="attendance">
        <TabsList>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="roster">Roster</TabsTrigger>
        </TabsList>
        <TabsContent value="attendance">Attendance content</TabsContent>
        <TabsContent value="roster">Roster content</TabsContent>
      </Tabs>,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Roster" }));

    expect(screen.getByRole("tab", { name: "Roster" })).toHaveAttribute("data-state", "active");
    expect(screen.getByText("Roster content")).toBeInTheDocument();
    expect(screen.queryByText("Attendance content")).not.toBeVisible();
  });
});
