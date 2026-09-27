/** The email being verified. Kept in memory — never in the URL (privacy). */
let email = "";
export const signInDraft = {
  set: (e: string) => {
    email = e;
  },
  get: () => email,
};
