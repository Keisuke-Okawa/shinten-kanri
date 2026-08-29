import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { TaskDetailPane } from "@/components/workspace/TaskDetailPane";
import { createMinimalStoreProfile, createMinimalTask } from "@/lib/data/factories";

const noop = vi.fn();
const profile = createMinimalStoreProfile("テスト店");

function renderPane(task: ReturnType<typeof createMinimalTask>) {
  return render(
    <TaskDetailPane
      task={task}
      profile={profile}
      pane4Open
      onTogglePane4={noop}
      onUpdateTask={noop}
      onUpdateProfile={noop}
      onUpdateOpenDate={noop}
      onUpdateFirstDeliveryDate={noop}
    />,
  );
}

describe("Pane 4 メモ欄はタスクごとに独立する", () => {
  it("別タスクに切り替えると、前のタスクのメモが残らない", () => {
    const taskA = { ...createMinimalTask("t-a", "初回納品"), memo: "タスクAのメモ" };
    const taskB = createMinimalTask("t-b", "コード作成");

    const { rerender } = renderPane(taskA);
    expect(screen.getByLabelText("メモ")).toHaveValue("タスクAのメモ");

    rerender(
      <TaskDetailPane
        task={taskB}
        profile={profile}
        pane4Open
        onTogglePane4={noop}
        onUpdateTask={noop}
        onUpdateProfile={noop}
        onUpdateOpenDate={noop}
        onUpdateFirstDeliveryDate={noop}
      />,
    );

    expect(screen.getByLabelText("メモ")).toHaveValue("");
  });
});
