# 🗄️ WebVault

WebVault is a self-hosted, highly secure, and pixel-perfect **macOS Finder-like File Manager** built with React, TypeScript, Express, and Docker. It features modern glassmorphic aesthetics, multi-factor authentication (TOTP), persistent dynamic color themes, smart clipboard interceptions, and advanced multi-item drag-and-drop relocations.

---

## ✨ Features

### 🖥️ Similar to macOS Finder Interface
* **Fully Responsive Split Layout:** Classic macOS window header controls, Favorites & Volumes sidebar, drag-resizable panels, and dynamic search bars.
* **View Modes:** Toggle instantly between fluid **Grid Icon view** and metadata-rich **List Details view**.
* **Visual Inspector:** A collapsible **Get Info** right sidebar displaying creation times, modified metrics, absolute server paths, and size tags for individual items.

### 🎨 Persisted Dynamic Themes
* **JSON-Driven Engine:** Colors, gradients, and icon sets are externalized in `/config/theme.json`.
* **Sonic Colorways:** Toggle dynamically inside UI settings between **macOS Sonoma (Default)**, **Industrial Graphite**, and **Cyberpunk Neon**.
* **Real-time Synchronization:** Inline style overrides inject variables globally to `:root` and `body` tags instantly on selection, flowing cleanly across light and dark theme configurations.

### 🖼️ Centered Sonoma Lightbox modal
* **Frosted Backgrounds:** Clicking assets opens a full-screen blurred modal backed by `backdrop-filter: blur(15px)`.
* **Containment Scale:** Images dynamically scale using `object-fit: contain` to preserve their aspect ratio.
* **Inline Document Reader:** Text (`.txt`) and Markdown (`.md`) files load dynamically in amonospace scrollable editor card.
* **Control Capsule:** Capsule bar at the bottom for instant downloads, filename inspection, and red close buttons.

### 📂 Advanced Drag-and-Drop Relocation
* **Virtual `..` Parent Folder:** Prepends a visual `..` item at the top of Grid and List views when inside subdirectories. Double-click to go up; drag and drop selected items onto it to move them to the parent folder.
* **Multi-Item Drag & Drop:** Dragging any selected file aggregates your **entire active selection**. Standard sidebar drops, breadcrumb trail drops, and folder drops execute bulk relocations in parallel.
* **Visual Hovers:** Breadcrumb trail segments and target drop zones highlight elegantly with active accent colors (`rgba(10, 132, 255, 0.25)`) when dragged over.
* **External Upload Overlay:** Drop external files from your desktop onto the browser viewport to stream uploads directly to the active folder.

### 📋 Smart Clipboard paste
* **Instant Screenshot Paste:** Copy a screenshot to your clipboard and press `CMD+V` / `CTRL+V` inside the window to convert it to a binary blob and upload it as `Screenshot_YYYYMMDD_HHMMSS.png` with a toast progress indicator.
* **Instant Text Paste:** Copy plain text and paste to automatically package and upload it as a `.txt` file named after the sanitized first word of the text.

### 🛡️ Hardened Production Security
* **Double-Layered Session Cookies:** signed JWT tokens are delivered in secure cookies (`httpOnly: true`, `sameSite: 'strict'`, `secure: true` in production) to isolate tokens from XSS and defend against CSRF.
* **Salted Password Storage:** Salted hashes are handled via **bcrypt** with `10` rounds and saved in persistent server-side configurations.
* **Master TOTP Setup:** Interactive dynamic setup generates a base64 setup QR code for Google Authenticator/1Password, enforcing MFA validation before session credentials grant.
* **Safe Path Resolution:** Absolute traversal checks block input traversal attempts (e.g. `../../etc/passwd`).
* **Cloudflare-Tunnel Rate Limiting:** Trust proxy configuration and rate limiting middleware (`express-rate-limit`) parse incoming `CF-Connecting-IP` headers to prevent brute-forcing authentication routes without penalizing other users behind the reverse proxy.

---

## 🏗️ Technical Architecture

```
webvault/
├── backend/                  # Node.js + Express TS Server
│   ├── src/
│   │   ├── config.ts         # Server Settings Parser
│   │   ├── middleware.ts     # Auth & Cookie Security Middleware
│   │   ├── fileService.ts    # File Utils & Traversal Defenses
│   │   └── index.ts          # Express Router & Multer Storage
│   └── package.json
├── frontend/                 # React + TypeScript SPA (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Finder/       # Toolbar, Sidebar, Grid/List Workspace
│   │   │   ├── ContextMenu/  # macOS Right-Click Context overlays
│   │   │   └── Login.tsx     # Frosted MFA Lock Screen
│   │   ├── assets/           # SF Symbols modular SVG packages
│   │   ├── App.tsx           # Session and Theme Injection Core
│   │   └── index.css         # Monterey/Sonoma Style Tokens
│   └── package.json
├── Dockerfile                # Multi-stage Container Compiler
└── docker-compose.yml        # Volumes, Ports & Secrets Orchestrator
```

### Current functionality map

WebVault currently has one configured application account. The React client and
the JSON API are served by the same Express process on port `8080`.

| Area | Current behavior |
| --- | --- |
| Authentication | Username/password login, first-run TOTP enrollment, TOTP verification, 30-day signed HTTP-only session cookie, logout, and authenticated account updates. |
| Account settings | Display name, username, and application password can be changed from **User Account Settings**. |
| Storage | All browser file operations are constrained to `STORAGE_DIR` (normally `/app/storage`). `Documents`, `Downloads`, and `.TrashFolder` are created automatically. |
| Browsing | Grid/list views, breadcrumbs, history, search/filtering, column sorting, multi-selection, keyboard navigation, and an item inspector. |
| File operations | Streaming uploads up to 2 GB per file, downloads, folder creation, rename/move, drag-and-drop relocation, ZIP creation/extraction, trash, empty trash, and restore-to-original-location. |
| Previewing | Images (including TIFF), text, Markdown, CSV, PDF, audio, and video. Other formats download directly. |
| Clipboard | Pasted images and text are converted to files and uploaded to the current directory. |
| Sharing | Public short links can package selected files into a streamed ZIP, optionally protected by a separate share password and limited by `SHARE_MAX_USES`. |
| Appearance | Server-persisted theme selection plus client-persisted light/dark mode and view preferences. |

The web client uses the authenticated `/api/files/*` routes. Files are accessed
directly from the mounted storage volume; there is no database or per-user
storage table. This distinction is important for the WebDAV authorization
boundary described below.

### WebDAV integration

WebDAV runs **inside the existing application container and Express
process**, not as a host service or a second externally exposed daemon. The
endpoint is:

```text
https://<your-cloudflare-hostname>/webdav
```

The Cloudflare Tunnel continues to target the container's existing HTTP origin
on port `8080`; public TLS is terminated by Cloudflare. No additional Docker
port or host installation is required.

Security and behavior:

* WebDAV uses HTTP Basic authentication over HTTPS and does not accept the
  application login password or the browser session cookie.
* Production DAV requests are rejected unless Express sees HTTPS directly or
  through Cloudflare's forwarded-protocol headers.
* A dedicated WebDAV password is set or replaced in **User Account Settings**,
  directly below **New Password (Optional)**. Only a salted password hash is
  persisted in `/app/config/config.json`.
* Saving account settings with an empty WebDAV password generates a random
  8-character password. The plaintext is shown once so it can be copied to the
  DAV client; only its bcrypt hash is persisted.
* The WebDAV username follows the configured application username, while the
  password remains independent.
* Authentication attempts are rate-limited using the same Cloudflare-aware
  client IP handling as the login flow.
* DAV paths are resolved against `/app/storage` and are checked for traversal
  and symbolic-link escapes. `/app/storage/.TrashFolder` is neither listed nor
  directly accessible. Application configuration, share metadata, TOTP data,
  and the application password hash are never exposed.
* The implementation supports the normal read/write client operations:
  `OPTIONS`, `PROPFIND`, `GET`, `HEAD`, `PUT`, `MKCOL`, `DELETE`, `COPY`,
  `MOVE`, `LOCK`, and `UNLOCK` (plus the property behavior required by the
  selected DAV implementation).
* Requests must preserve DAV methods and the `Authorization`, `Destination`,
  `Depth`, `If`, `Lock-Token`, and `Overwrite` headers through any Cloudflare
  configuration placed in front of the tunnel.

WebDAV provides full read/write access to the allowed storage tree, including
file uploads, edits, folder creation, copying, moving, locking, and deletion.
WebDAV deletion is a direct filesystem deletion and does not use WebVault's
browser-only Trash workflow.

### Connecting a BOOX device

In the BOOX WebDAV account screen, use:

* **WebDAV website:** `https://<your-cloudflare-hostname>/webdav/`
* **Account:** the username shown in WebVault's User Account Settings
* **Password:** the dedicated WebDAV password from User Account Settings

The trailing slash in the WebDAV website is recommended for compatibility.
BOOX can browse and download files exposed by a DAV provider and can upload
supported document formats such as EPUB and PDF. WebVault does not require a
separate host port or Cloudflare configuration beyond the existing HTTPS
tunnel to port `8080`.

---

## 🚀 Quickstart: Deploying with Docker

### Prerequisite
Ensure [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) are installed on your host machine.

### Step 1: Clone and Configure Environment
Copy the env template file to `.env` in the root folder:
```bash
cp .env.example .env
```
Open `.env` and supply secure, unique configuration values:
- `JWT_SECRET`: A long cryptographically strong random string (e.g. 64 chars).
- `APP_USER`: A custom administration username.
- `APP_PASSWORD_HASH`: Salted bcrypt hash of your preferred administrator password.

- `SHARE_SECRET`: A long cryptographically strong random string (e.g. 64 chars). Used to encrypt the bundle files for sharing
- `SHARE_MAX_USES`: How many times can a generated share link be reused

### Step 2: Launch Container Topology
Start the multi-stage Docker build and run services in detached daemon mode:
```bash
docker-compose up -d --build
```
*Docker will compile React assets into Vite production folders, compile the Express server, link ports, mount volumes, and spin up services.*

### Step 3: Access and Configure 2FA
1. Open your browser and navigate to **`http://localhost:8080`**.
2. Log in using your configured username and password.
3. On first login, scan the displayed setup **QR Code** using Google Authenticator or your password manager.
4. Input the 6-digit TOTP verification code to grant full session access.

---

## 💾 Volume Persistence
WebVault maps two host directories to ensure all files and configurations survive updates and container rebuilds:
- **`./storage` (Mapped to `/app/storage`):** Your files, directories, documents, downloads, and trash.
- **`./config` (Mapped to `/app/config`):** Your active TOTP secret configuration key (`config.json`) and custom visual settings config (`theme.json`).
