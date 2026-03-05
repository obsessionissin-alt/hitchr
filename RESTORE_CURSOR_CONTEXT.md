# Restore Cursor context on your second laptop

Use this so your chat history and project context carry over when you open the hitchr repo in Cursor on the new machine.

## What’s in `hitchr-cursor-context.zip`

- **agent-transcripts/** – Chat/conversation history with the AI
- **agent-tools/** – Agent tool state
- **assets/** – Images/screenshots from chats
- **mcps/** – MCP (e.g. browser) metadata
- **terminals/** – Terminal session state

## Steps on the second laptop

1. **Clone the repo and open it in Cursor**
   ```bash
   git clone https://github.com/obsessionissin-alt/hitchr.git
   cd hitchr
   ```
   Then in Cursor: **File → Open Folder** → select the `hitchr` folder.

2. **Quit Cursor** (so the project folder isn’t locked).

3. **Find the project folder Cursor created**
   - Linux: `~/.cursor/projects/`
   - You’ll see a folder named like `home-<yourusername>-Documents-hitchr` (or similar, depending on where you cloned it).

4. **Restore the backup**
   - Copy `hitchr-cursor-context.zip` to the second laptop (USB, cloud, etc.).
   - Unzip it somewhere temporary, e.g.:
     ```bash
     unzip hitchr-cursor-context.zip -d /tmp/cursor-restore
     ```
   - Copy the **contents** (the five folders) into Cursor’s project folder:
     ```bash
     cp -r /tmp/cursor-restore/agent-transcripts   ~/.cursor/projects/home-<YOUR_USER>-Documents-hitchr/
     cp -r /tmp/cursor-restore/agent-tools        ~/.cursor/projects/home-<YOUR_USER>-Documents-hitchr/
     cp -r /tmp/cursor-restore/assets             ~/.cursor/projects/home-<YOUR_USER>-Documents-hitchr/
     cp -r /tmp/cursor-restore/mcps               ~/.cursor/projects/home-<YOUR_USER>-Documents-hitchr/
     cp -r /tmp/cursor-restore/terminals          ~/.cursor/projects/home-<YOUR_USER>-Documents-hitchr/
     ```
     Replace `home-<YOUR_USER>-Documents-hitchr` with the actual folder name you saw in step 3.

5. **Open Cursor again** and open the hitchr project. Your previous chats and context should appear.

## Optional: Cursor app settings

To also keep editor settings, keybindings, and extensions:

- **From this laptop:** Copy `~/.config/Cursor/User/` (e.g. `settings.json`, `keybindings.json`) into a zip and move it to the second laptop.
- **On second laptop:** After installing Cursor, quit it, then copy those files into `~/.config/Cursor/User/` (merge or replace as you prefer).
