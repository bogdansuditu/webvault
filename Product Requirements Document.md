## Product Requirements Document (PRD): **WebVault** (Working Title)

### 1. Executive Summary & Architecture Strategy

The goal of this project is to create a self-hosted, Dockerized file manager that looks, feels, and operates identically to macOS Finder.

To achieve **minimal work** while maintaining **best practices**, the core strategy is to avoid writing a custom file manager UI from scratch. Instead, we will use **elFinder** or **Vue File Manager**, wrapped in a modern web framework, backed by a production-ready authentication layer.

#### Recommended Tech Stack

* **Frontend UI:** **elFinder** (via a React/Vue wrapper) with a custom **macOS Monterrey/Sonoma CSS theme**. elFinder natively supports macOS-like list/grid views, drag-and-drop, context menus, hotkeys, multi-file selection, and zipping/unzipping.
* **Backend Backend/API:** **Node.js (Fastify or Express)**. It will handle the elFinder volume connector, authentication sessions, and clipboard API parsing.
* **Authentication & 2FA:** **Authelia** or **Nginx Proxy Manager + Forward Auth** (Zero-code approach), *OR* integrated Node.js using **Passport.js** + **otplib** (for Google Authenticator TOTP).
* **Deployment:** **Docker Compose** with a single data volume mapping.

---

### 2. User Journey & Expected Behavior

```
[ Login Screen: User/Pass + 2FA ] 
               │
               ▼
[ macOS Finder Dashboard Layout ]
 ├── Sidebar (Home, Trash, Volumes)
 ├── Toolbar (View toggle, New Folder, Zip, Upload)
 └── Main Content Area (Grid/List of Files)

```

#### 2.1 Authentication & Session Management

* **Step 1:** User navigates to the web app URL. If unauthenticated, they are presented with a clean, centralized login card.
* **Step 2:** User inputs `Username` and `Password`.
* **Step 3:** If credentials match, a 2FA prompt appears requesting a 6-digit Time-based One-Time Password (TOTP).
* **Step 4:** Upon successful validation, a secure, HTTP-only cookie session is established, redirecting the user to the Finder interface.

#### 2.2 The Finder Interface & File Operations

* **Layout:** A sidebar on the left (Favorites, System Volumes) and a main file viewing pane on the right supporting **Grid View** and **List View**.
* **Drag-and-Drop Move:** Users can drag one or multiple files/folders and drop them into a subfolder or onto a sidebar directory.
* **Archiving:** Selecting multiple files, right-clicking (context menu), and clicking **"Compress"** creates a `.zip` archive in the current directory.
* **Downloading:** Single click downloads the file. Multi-file selection and clicking "Download" automatically bundles them into a temporary zip for download.

#### 2.3 Upload Mechanics

* **Button Upload:** A toolbar icon (resembling the macOS upload/share icon or a simple `+` button) opens the native OS file picker. Multi-file selection is enabled.
* **Drag-and-Drop Upload:** Dragging files directly from the local machine's desktop/Finder/File Explorer and dropping them anywhere onto the main pane triggers an immediate background upload with a progress overlay.

#### 2.4 Advanced Clipboard Integration (Smart Paste)

* The application listens for global browser paste events (`CMD+V` / `CTRL+V`) when focused on the main workspace view.
* **Text Clipboard:** If the clipboard contains plain text, the app auto-generates a text file named `Clipboard_YYYYMMDD_HHMMSS.txt` containing the text asset.
* **Image Clipboard:** If the user takes a screenshot (copied to clipboard) and hits paste, the app intercepts the binary stream and writes a `Screenshot_YYYYMMDD_HHMMSS.png` directly to the active folder directory.

---

### 3. Functional Requirements

| ID | Feature | Description | Priority |
| --- | --- | --- | --- |
| **FR-1** | Docker Architecture | Must run entirely via `docker-compose`. Must expose a single configuration file and a local directory volume mapping (e.g., `- ./storage:/data`). | P0 |
| **FR-2** | 2FA Enrolment/Auth | Secure login using local config credentials + standard TOTP QR code enrollment on first login. | P0 |
| **FR-3** | Finder UI Parity | Grid layout, folder navigation, double-click to open, and keyboard short-cuts matching macOS. | P0 |
| **FR-4** | Archive Handling | Native zip extraction and zip creation capabilities via backend utilities. | P0 |
| **FR-5** | Drag-and-Drop Upload | Direct browser drop zones handling multiple files and nested directories. | P0 |
| **FR-6** | Smart Clipboard Paste | Intercept `paste` events. Auto-convert text to `.txt` and image payloads to `.png`. | P1 |
| **FR-7** | UI Component Theming | CSS variables enabling Dark Mode / Light Mode toggle to match macOS system preferences. | P1 |

---

### 4. Non-Functional Requirements

* **Security:** Passwords must be hashed using `bcrypt` or `argon2`. Session tokens must use `SameSite=Strict` and `HttpOnly` flags.
* **Performance:** Large file uploads (up to 2GB) must stream directly to disk without exhausting server RAM allocation.
* **Simplicity & Footprint:** Minimize custom components. Rely on standard browser APIs (like the Async Clipboard API) to keep the frontend bundle lightweight.

---

### 5. Implementation Guide & Component Re-use

To keep development minimal, you should utilize **elFinder**. It already provides 90% of the functionality you requested out of the box (including the exact zip, drag-and-drop, and file management rules).

#### Step 1: The UI Customization

You can use a highly-tailored open-source theme style or inject custom CSS into the elFinder instance to match the macOS aesthetic (rounded corners, specific icon sets, and brushed-aluminum/dark grey tones).

#### Step 2: Implementing the Clipboard Paste Feature (Custom Code)

You will need to attach a global event listener to the file workspace container. Here is the concise JavaScript pattern to achieve this:

```javascript
window.addEventListener('paste', async (e) => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    
    for (let item of items) {
        // Handle Images
        if (item.type.indexOf('image') !== -1) {
            const blob = item.getAsFile();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `Screenshot_${timestamp}.png`;
            
            // Trigger upload function to Backend
            uploadBlobToCurrentFolder(blob, filename);
        } 
        // Handle Text
        else if (item.type === 'text/plain') {
            item.getAsString(async (text) => {
                const blob = new Blob([text], { type: 'text/plain' });
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const filename = `Clipboard_${timestamp}.txt`;
                
                // Trigger upload function to Backend
                uploadBlobToCurrentFolder(blob, filename);
            });
        }
    }
});

```

#### Step 3: Target Docker Compose Topology

Your deployment setup will look like this, linking a simple web node to your local storage paths:

```yaml
version: '3.8'

services:
  finderweb:
    image: finderweb:latest
    build: .
    container_name: finderweb_app
    ports:
      - "8080:8080"
    environment:
      - JWT_SECRET=your_super_secret_key
      - APP_USER=admin
      - APP_PASSWORD_HASH=your_bcrypt_hash
      - TOTP_SECRET=your_generated_base32_secret
    volumes:
      - ./my_files:/app/storage
      - ./config:/app/config
    restart: unless-stopped

```