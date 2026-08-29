import { afterEach, describe, it, expect, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { TaskDetailPane } from "@/components/workspace/TaskDetailPane";
import { createMinimalStoreProfile, createMinimalTask } from "@/lib/data/factories";

const noop = vi.fn();
const vehicleTask = {
  ...createMinimalTask("t-vr", "号車報告書"),
  kind: "vehicleReport" as const,
};

function renderPane(address: string) {
  return render(
    <TaskDetailPane
      task={vehicleTask}
      profile={{ ...createMinimalStoreProfile("テスト店"), address }}
      pane4Open
      onTogglePane4={noop}
      onUpdateTask={noop}
      onUpdateProfile={noop}
      onUpdateOpenDate={noop}
      onUpdateFirstDeliveryDate={noop}
    />,
  );
}

describe("号車報告書の Googleマップを開く", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("住所があるとき、新しいタブで Google マップ検索を開く", () => {
    const address = "東京都港区芝浦1-1-1";
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    renderPane(address);

    fireEvent.click(screen.getByRole("button", { name: "Googleマップを開く" }));

    expect(open).toHaveBeenCalledWith(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("住所が空のときは押せない", () => {
    renderPane("");
    expect(screen.getByRole("button", { name: "Googleマップを開く" })).toBeDisabled();
  });
});
