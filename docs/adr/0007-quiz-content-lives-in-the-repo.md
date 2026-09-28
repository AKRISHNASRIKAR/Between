# Quiz content lives in the repo and syncs on boot

Quiz packs and the daily pool are JSON files in `content/quizzes/`, validated by the shared contracts and upserted into Postgres every time the API starts. New content ships with a server deploy, not an app release, and removed questions are unpublished rather than deleted so past sessions stay intact. An admin UI was rejected as premature.
