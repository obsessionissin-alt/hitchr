# One-time: add this SSH key to GitHub (then push)

Your SSH key was generated. **Do this once**, then you can push.

## 1. Copy this public key (entire line)

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAID4v/vwJGWQKfnCqAnS9Lhdr1cFbgLG2iVBiXWOTrHeE github
```

Or run: `cat ~/.ssh/id_ed25519.pub` and copy the output.

## 2. Add it on GitHub

- Open: **https://github.com/settings/ssh/new**
- **Title:** e.g. `hitchr laptop`
- **Key type:** Authentication Key
- **Key:** paste the line from step 1
- Click **Add SSH key**

## 3. Push your repo

```bash
cd /home/internt-zato/Documents/hitchr
git push -u origin main
```

No password prompt if the key is added. After this, future pushes: `git push`.
