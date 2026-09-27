import { CreateNoteInput, NoteBox, UpdateNoteInput } from "@lovenotes/contracts";
import { Hono } from "hono";
import { z } from "zod";
import { validate } from "../../lib/validate";
import type { AppEnv } from "../../types";
import { createNote, deleteNote, getNote, listNotes, openNote, reactToNote, updateNote } from "./service";

const ListQ = z.object({ box: NoteBox.default("all"), cursor: z.string().optional() });
const NoteParam = z.object({ nid: z.uuid() });

export const noteRoutes = new Hono<AppEnv>()
  .get("/", validate("query", ListQ), async (c) => {
    const q = c.req.valid("query");
    return c.json(await listNotes(c.get("scope"), q.box, q.cursor));
  })
  .post("/", validate("json", CreateNoteInput), async (c) =>
    c.json(await createNote(c.get("scope"), c.req.valid("json")), 201),
  )
  .get("/:nid", validate("param", NoteParam), async (c) =>
    c.json(await getNote(c.get("scope"), c.req.valid("param").nid)),
  )
  .patch("/:nid", validate("param", NoteParam), validate("json", UpdateNoteInput), async (c) =>
    c.json(await updateNote(c.get("scope"), c.req.valid("param").nid, c.req.valid("json"))),
  )
  .delete("/:nid", validate("param", NoteParam), async (c) => {
    await deleteNote(c.get("scope"), c.req.valid("param").nid);
    return c.body(null, 204);
  })
  .post("/:nid/open", validate("param", NoteParam), async (c) =>
    c.json(await openNote(c.get("scope"), c.req.valid("param").nid)),
  )
  .put("/:nid/reaction", validate("param", NoteParam), async (c) =>
    c.json(await reactToNote(c.get("scope"), c.req.valid("param").nid, true)),
  )
  .delete("/:nid/reaction", validate("param", NoteParam), async (c) =>
    c.json(await reactToNote(c.get("scope"), c.req.valid("param").nid, false)),
  );
