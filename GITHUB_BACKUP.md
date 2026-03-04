# GitHub backup – push and restore

Your full project is committed locally and ready to push. **You need to push once from this machine (or any machine where you’re logged into GitHub).**

## Push from this system (one time)

1. **Option A – HTTPS (Personal Access Token)**  
   - GitHub → Settings → Developer settings → Personal access tokens → Generate new token (classic).  
   - Scope: `repo`.  
   - In a terminal:
     ```bash
     cd /home/internt-zato/Documents/hitchr
     git push -u origin main
     ```
   - When prompted for password, paste the **token** (not your GitHub password).

2. **Option B – SSH**  
   - Generate a key: `ssh-keygen -t ed25519 -C "your_email@example.com"`  
   - Add the public key in GitHub → Settings → SSH and GPG keys.  
   - Then:
     ```bash
     cd /home/internt-zato/Documents/hitchr
     git remote set-url origin git@github.com:obsessionissin-alt/hitchr.git
     git push -u origin main
     ```

## Restore on a new system

```bash
git clone https://github.com/obsessionissin-alt/hitchr.git
cd hitchr
```

Then:

- **Backend (Node):** `cd backend && npm install`  
- **Backend (campus Python):** `cd hitchr-campus/backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt`  
- **Flutter app:** `cd hitchr-campus/flutter_app && flutter pub get`  
- **hitch-app (Expo):** `cd hitch-app && npm install`  
- Copy `.env.example` to `.env` in each app/backend and fill in secrets (never commit `.env`).

## What was backed up (this commit)

- Entire `hitchr-campus/` (Flutter app, FastAPI backend, frontend) as normal folders (nested repo was removed so everything is in one repo).
- All `backend/` and `hitch-app/` changes.
- Docs, specs, wireframes, and plan files.
- `.gitignore` updated to exclude `.flutter-sdk/`, `.pub-cache/`, `venv/`, `*.AppImage` so they aren’t pushed.

Repo URL: **https://github.com/obsessionissin-alt/hitchr**
