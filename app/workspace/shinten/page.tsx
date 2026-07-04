import { Workspace } from '@/components/workspace/Workspace';
import workspaceData from '@/data/workspace.json';
import {
  getWorkspaceData,
  updateStoreStatus,
  updateTaskStatus,
  toggleSubtaskCompleted,
  updateStoreProfile,
  updateTaskDetail,
} from './actions';

export const revalidate = 0;

export default async function ShintenPage() {
  const initialStores = await getWorkspaceData();

  return (
    <Workspace
      initialStores={initialStores}
      workspace={workspaceData}
      onSaveStoreStatus={updateStoreStatus}
      onSaveTaskStatus={updateTaskStatus}
      onToggleSubtask={toggleSubtaskCompleted}
      onSaveProfile={updateStoreProfile}
      onSaveTaskDetail={updateTaskDetail}
    />
  );
}
