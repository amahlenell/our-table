import { EmptyState } from "@/components/ui/states";
export default function NotFound() {
  return (
    <EmptyState
      title="This page isn’t in the recipe book."
      href="/"
      action="Back to your kitchen"
    />
  );
}
