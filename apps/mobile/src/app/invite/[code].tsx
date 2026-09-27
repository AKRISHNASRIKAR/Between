import { Redirect, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { pendingInvite } from "@/features/space/pending-invite";

/** Deep link target (lovenotes://invite/CODE): remember the code, then let the flow guards route. */
export default function InviteLink() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (code) pendingInvite.set(code).finally(() => setSaved(true));
    else setSaved(true);
  }, [code]);
  return saved ? <Redirect href="/join" /> : null;
}
