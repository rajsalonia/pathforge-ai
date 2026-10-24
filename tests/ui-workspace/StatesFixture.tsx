// Explicit controlled component states for QA, outside the product's app routes.
import {
  Button,
  EmptyState,
  Feedback,
  PageHeading,
  Skeleton,
  WorkspaceShell,
} from "@/app/components/workspace-v2";
export function StatesFixture() {
  return (
    <WorkspaceShell
      view="home"
      onNavigate={() => {}}
      onMission={() => {}}
      onLanguage={() => {}}
      name="Test learner"
      accountLabel="Controlled states fixture"
      sync="No account operations"
    >
      <PageHeading
        title="Loading and feedback states"
        description="Controlled component examples for accessibility tests; no progress is invented."
      />
      <Skeleton label="Loading your learning record" />
      <Button busy>Preparing your path</Button>
      <Feedback title="The request could not complete" tone="danger">
        Your local work remains available. Retry after checking the connection.
      </Feedback>
      <EmptyState icon={null} title="No recorded work yet">
        A real attempt will appear after the existing controller records it.
      </EmptyState>
    </WorkspaceShell>
  );
}
