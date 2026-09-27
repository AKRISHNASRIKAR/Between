export const keys = {
  me: ["me"] as const,
  invitePreview: (code: string) => ["invite-preview", code] as const,
  space: (sid: string) => ["space", sid] as const,
};
