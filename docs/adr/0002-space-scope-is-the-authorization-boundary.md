# SpaceScope is the authorization boundary

Every space-scoped route passes one middleware that turns the URL's space id into a `SpaceScope` only if the caller is a member, and every repository function that touches space data takes that `SpaceScope` rather than a raw id. Non-members get 404, never 403, so ids can't be probed. We chose this over per-handler checks (easy to forget) and over Postgres row-level security (harder with pooling; kept as a later hardening step), and back it with an authorization test that runs every space route with another space's ids.
