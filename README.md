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
