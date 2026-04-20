# Auto-updater setup

FFCalc uses Tauri's updater plugin. Releases are signed; clients verify via an
embedded public key and pull `latest.json` from the latest GitHub Release.

## One-time setup

1. Generate a signing keypair locally:

   ```
   npx tauri signer generate -w ~/.tauri/ffcalc.key
   ```

   Choose a strong password. Keep the `.key` file out of git.

2. Add GitHub repo secrets (Settings → Secrets and variables → Actions):

   - `TAURI_SIGNING_PRIVATE_KEY` — contents of the `.key` file.
   - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` — the password you chose.

3. Copy the public key (printed by the `signer generate` command, and also in
   `~/.tauri/ffcalc.key.pub`) into `src-tauri/tauri.conf.json`, replacing the
   `REPLACE_WITH_PUBLIC_KEY` placeholder.

4. Commit the config change and tag a release (`npm version minor` then push
   with `git push --tags`). CI signs the bundles, uploads them and a
   `latest.json` manifest to the draft release. Publish the draft to make
   it discoverable via the `releases/latest/download/...` URL.

## Platforms

- **Windows NSIS (.exe)** — full self-update path.
- **Linux AppImage** — full self-update path.
- **.deb / .rpm** — bundled but not self-updating; users reinstall via their
  package manager.

## Gotcha: first signed release

Clients that are already installed *without* the updater (e.g. v0.2.0) have
no way to receive updates — they don't know to check. The updater only
starts working from the first release that shipped with the plugin
included. Tell users to manually reinstall once.
