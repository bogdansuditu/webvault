import fs from 'fs';
import path from 'path';

// Define directories in container
export const STORAGE_DIR = process.env.STORAGE_DIR || '/app/storage';
export const CONFIG_DIR = process.env.CONFIG_DIR || '/app/config';
export const CONFIG_FILE_PATH = path.join(CONFIG_DIR, 'config.json');

export interface AppConfig {
  jwtSecret: string;
  appUser: string;
  appPasswordHash: string; // bcrypt hash
  totpSecret: string;
  displayName: string;
}

// Default values or env values
let activeConfig: AppConfig = {
  jwtSecret: process.env.JWT_SECRET || 'webvault-default-jwt-secret-key-change-me',
  appUser: process.env.APP_USER || 'admin',
  appPasswordHash: process.env.APP_PASSWORD_HASH || '', // We will expect this from env, or default to hash of 'admin' if empty
  totpSecret: process.env.TOTP_SECRET || '',
  displayName: process.env.APP_DISPLAY_NAME || 'Administrator',
};

// Fallback password hash if none provided: bcrypt hash of "admin"
const DEFAULT_ADMIN_HASH = '$2b$10$Omeni.3WNo8vvgfkNI44hOFFdCGX8Aw3R3ExsKULC09.7oLmTEyF.'; 

export function loadConfig(): AppConfig {
  // Try loading from config.json first (useful for persistent auto-generated TOTP secret)
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const data = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
      const json = JSON.parse(data);
      
      activeConfig.totpSecret = json.totpSecret || activeConfig.totpSecret;
      activeConfig.appUser = json.appUser || activeConfig.appUser;
      activeConfig.appPasswordHash = json.appPasswordHash || activeConfig.appPasswordHash;
      activeConfig.jwtSecret = json.jwtSecret || activeConfig.jwtSecret;
      activeConfig.displayName = json.displayName || activeConfig.displayName;
    }
  } catch (err) {
    console.error('Failed to read config.json:', err);
  }

  // Ensure password hash has a value
  if (!activeConfig.appPasswordHash) {
    activeConfig.appPasswordHash = DEFAULT_ADMIN_HASH;
  }

  return activeConfig;
}

export function saveConfig(updates: Partial<AppConfig>): void {
  activeConfig = { ...activeConfig, ...updates };

  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    fs.writeFileSync(
      CONFIG_FILE_PATH,
      JSON.stringify(
        {
          jwtSecret: activeConfig.jwtSecret,
          appUser: activeConfig.appUser,
          appPasswordHash: activeConfig.appPasswordHash,
          totpSecret: activeConfig.totpSecret,
          displayName: activeConfig.displayName,
        },
        null,
        2
      ),
      'utf-8'
    );
  } catch (err) {
    console.error('Failed to save config.json:', err);
  }
}
