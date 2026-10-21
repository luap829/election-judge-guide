# DuPage Election Judge Reference Guide (unofficial draft)

An offline reference and study guide for DuPage County, Illinois election judges. It is an installable web app (PWA) for iPhone, iPad, and Android.

**For study before Election Day, and during meals and breaks away from your workstation.** The Election Judge Manual (p. 9) says: "No use of personal cell phones, laptops, tablets or ear buds during working hours. Personal cell phones may be used away from workstations during meals and breaks."

**UNOFFICIAL DRAFT. Not endorsed by DuPage County, the DuPage County Clerk, or its Election Division.** It is for testing and study only and has not been reviewed by the county. Where this guide and the official Election Judge Manual or county staff differ, follow the manual and the county. Every screen cites a printed page in the Election Judge Manual – Policies and Procedures, DuPage County Clerk Election Division, Updated: November 2026.

Live app: https://luap829.github.io/election-judge-guide/

## Privacy and offline design
- No accounts, analytics, cookies, trackers, or third-party fonts or scripts. No voter data is entered or stored.
- A service worker saves every file on the first visit, so the app then works fully offline (Airplane Mode).

## Add it to an iPhone home screen
1. Open https://luap829.github.io/election-judge-guide/ in **Safari**.
2. Tap **Share** (square with an up arrow), then **Add to Home Screen**, then **Add**.
3. While you have signal, **open it once from the new icon** and wait a few seconds so it saves its offline copy.
4. Test it: turn on Airplane Mode and open the icon.

## Add it to an Android phone
1. Open https://luap829.github.io/election-judge-guide/ in **Chrome**.
2. Tap the **⋮** menu, then **Install app** (or **Add to Home screen**), then **Install**.
3. Open it once from the new icon while online, then test it in Airplane Mode.

## Repository contents
Only the built static app (`index.html`, `css/`, `js/`, `data/`, `icons/`, `manifest.webmanifest`, `sw.js`). Source manuals, build tools, screenshots, and planning files are not included.
