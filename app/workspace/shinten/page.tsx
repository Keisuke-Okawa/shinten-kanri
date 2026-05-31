import { Workspace } from "@/components/workspace/Workspace";
import storesData from "@/data/stores.json";
import workspaceData from "@/data/workspace.json";
import { storesSchema, workspaceSchema } from "@/lib/schema";

export default function ShintenPage() {
  const storesResult = storesSchema.safeParse(storesData);
  const wsResult = workspaceSchema.safeParse(workspaceData);

  if (!storesResult.success || !wsResult.success) {
    const errors = [
      !storesResult.success &&
        `stores.json: ${storesResult.error.issues[0]?.message}`,
      !wsResult.success &&
        `workspace.json: ${wsResult.error.issues[0]?.message}`,
    ].filter(Boolean);
    throw new Error(`データの形式が正しくありません:\n${errors.join("\n")}`);
  }

  return (
    <Workspace
      initialStores={storesResult.data}
      workspace={wsResult.data}
    />
  );
}
