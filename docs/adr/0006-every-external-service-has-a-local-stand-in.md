# Every external service has a local stand-in

Development needs no accounts or network services: sign-in codes are fixed (`DEV_FIXED_OTP`), pushes are logged, photos go to local disk behind signed URLs, and a simulated Partner (`DEV_TOOLS`) drives the other side of every two-person flow through the real services. The API refuses to start in production with any of these enabled. This keeps the whole product testable by one person on one laptop, which matters more here than most apps because every feature needs two people.
