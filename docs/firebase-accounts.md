# Firebase accounts

Project: `oscar-st2s` (Spark). Public Web configuration lives in `data/firebase-config.json`; it is not an Admin SDK credential. Never add a service-account key to this repository.

Enable Email/Password in Firebase Authentication. Add the deployed hostname to Authentication → Settings → Authorized domains. Password registration requires at least eight characters. Password reset and email verification use Firebase email links, localized to the selected language.

Create the default Standard Firestore database in `eur3` and deploy `firestore.rules` with `firebase deploy --only firestore:rules --project oscar-st2s` or the Firebase console. Rules allow only the owner UID to access `users/{uid}/devices/{tabId}` and validate the progress document shape. Other paths remain denied.

Each browser tab writes its own absolute progress branch. The UI merges independent XP/review counters, uses the latest review for mastery/scheduling, and merges favorite changes by timestamp. Repeated snapshots do not double-count progress. No public leaderboard or profile directory is exposed.

Guest storage (`oscar-progress-v1`) remains separate from account caches (`oscar-progress-user-v1:{uid}`). Creating a new account imports the current guest progress once. Logging into an existing account loads that account; signing out restores guest progress. Cloud branch caches support reconnecting after temporary network loss. Local caches are not encrypted; users of shared devices should sign out and may clear browser site data.

Run `npm run typecheck`, `npm run test:learning`, and `npm run test:model` before publication. Learning checks cover account cache isolation, guest restoration, independent device counters, repeated snapshots and favorite removal. Firebase integration checks must also verify that anonymous and other-UID reads/writes are rejected.
