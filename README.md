# Disney Trip Calendar

A browser-based park planner for Walt Disney World. Organize your days, add park attractions and dining, and view planned stops on a map. Schedule edits are stored in the current browser.

## Run locally

From the repository root, run `python3 -m http.server --directory dist 8000` and open http://localhost:8000. The calendar starts with sample days you can edit or remove.

## Use your own trip

In **Manage days**, choose **Import JSON** and select your trip file. Importing replaces the trip in the current browser. **Export JSON** downloads the current trip, so you can keep a backup or move it to another browser. The app reads the selected file locally and saves the schedule in browser storage.

A trip file has a `days` array. Each day has a unique `id` in YYYY-MM-DD format and an `events` array. An event needs a `title`, `start`, and `end`. Times are minutes after midnight, so 540 is 9:00 AM and 1440 is midnight at the end of the day. Use **Export JSON** from the sample trip to see optional fields and park place IDs.

Keep personal itineraries outside the repository. Export files ending in `.trip.json` and files in `private/` are ignored by Git.

## Hosting

Serve `dist/` on any HTTPS static host. No server or API keys are required by the current app. Map tiles, park boundaries, and optional address lookups use third-party services. An address entered into the address lookup is sent to the geocoding provider.
