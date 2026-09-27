import { type Href, Redirect } from "expo-router";
import { HOME_FOR } from "@/features/space/flow";
import { useFlowState } from "@/features/space/flow-context";

/** The anchor route: sends each user to the first screen of their current step. */
export default function Index() {
  const state = useFlowState();
  if (state === "loading") return null;
  return <Redirect href={HOME_FOR[state] as Href} />;
}
