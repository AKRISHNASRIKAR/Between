# Clients generate the ids of what they create

Notes, blocks, vibes, pet care, quiz sessions and future items are created with an id the app generates, and inserts ignore duplicates. Retries after a flaky network can never create two of something, and the app can render the item optimistically under its final id before the server answers.
