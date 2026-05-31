import { WorkspaceNav } from "./_components/WorkspaceNav";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <WorkspaceNav />
      {children}
    </div>
  );
}
