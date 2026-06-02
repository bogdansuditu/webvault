import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import unzipper from 'unzipper';
import { STORAGE_DIR, CONFIG_DIR } from './config.js';

// Resolve and sanitize paths to ensure they stay within the storage root
export function resolveSafePath(relativePath: string = ''): string {
  // Normalize and resolve the absolute path
  const absoluteStorageRoot = path.resolve(STORAGE_DIR);
  const resolvedPath = path.resolve(absoluteStorageRoot, relativePath.replace(/^\/+/, ''));

  // Double-check directory traversal
  if (!resolvedPath.startsWith(absoluteStorageRoot)) {
    throw new Error('Access Denied: Path Traversal Attempt Blocked');
  }

  // Auto-create storage root if it doesn't exist
  if (!fs.existsSync(absoluteStorageRoot)) {
    fs.mkdirSync(absoluteStorageRoot, { recursive: true });
  }

  // Auto-create .TrashFolder directory inside storage if not exists
  const trashPath = path.join(absoluteStorageRoot, '.TrashFolder');
  if (!fs.existsSync(trashPath)) {
    fs.mkdirSync(trashPath, { recursive: true });
  }

  // Auto-create default directories if not exist
  const docsPath = path.join(absoluteStorageRoot, 'Documents');
  if (!fs.existsSync(docsPath)) {
    fs.mkdirSync(docsPath, { recursive: true });
  }

  const downloadsPath = path.join(absoluteStorageRoot, 'Downloads');
  if (!fs.existsSync(downloadsPath)) {
    fs.mkdirSync(downloadsPath, { recursive: true });
  }

  return resolvedPath;
}

export interface FileItem {
  name: string;
  relativePath: string;
  isDirectory: boolean;
  size: number;
  mtime: Date;
  birthtime: Date;
  mimeType?: string;
  hasTrashOrigin?: boolean;
}

// Map extensions to visual groups / mime types
function getMimeType(filename: string, isDirectory: boolean): string {
  if (isDirectory) return 'directory';
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.png':
    case '.jpg':
    case '.jpeg':
    case '.gif':
    case '.webp':
    case '.svg':
    case '.heic':
    case '.tiff':
    case '.tif':
      return 'image';
    case '.pdf':
      return 'pdf';
    case '.txt':
    case '.md':
    case '.csv':
    case '.json':
    case '.js':
    case '.ts':
    case '.html':
    case '.css':
    case '.yaml':
    case '.yml':
      return 'text';
    case '.mp3':
    case '.wav':
    case '.ogg':
    case '.m4a':
    case '.flac':
    case '.aac':
      return 'audio';
    case '.mp4':
    case '.mov':
    case '.avi':
    case '.mkv':
    case '.webm':
      return 'video';
    case '.zip':
    case '.tar':
    case '.gz':
    case '.rar':
    case '.7z':
      return 'archive';
    default:
      return 'file';
  }
}

// List all files/folders in directory
export async function listDirectory(relativePath: string): Promise<FileItem[]> {
  const safePath = resolveSafePath(relativePath);
  
  if (!fs.existsSync(safePath)) {
    throw new Error('Directory does not exist');
  }

  const stat = fs.statSync(safePath);
  if (!stat.isDirectory()) {
    throw new Error('Path is not a directory');
  }

  const files = fs.readdirSync(safePath);
  const items: FileItem[] = [];
  const origins = loadTrashOrigins();

  for (const file of files) {
    // Hide system files and the Trash directory in default listings
    if (file.startsWith('.') && file !== '.TrashFolder') {
      continue;
    }
    
    // In the root, we show '.TrashFolder' as 'Trash', but otherwise don't show it as a normal subfolder
    if (file === '.TrashFolder' && relativePath !== '') {
      continue;
    }

    try {
      const itemPath = path.join(safePath, file);
      const itemStat = fs.statSync(itemPath);
      const itemRelativePath = path.relative(resolveSafePath(''), itemPath);

      items.push({
        name: file === '.TrashFolder' ? 'Trash' : file,
        relativePath: itemRelativePath,
        isDirectory: itemStat.isDirectory(),
        size: itemStat.size,
        mtime: itemStat.mtime,
        birthtime: itemStat.birthtime,
        mimeType: getMimeType(file, itemStat.isDirectory()),
        hasTrashOrigin: !!origins[itemRelativePath]
      });
    } catch (e) {
      // Skip problematic files
      console.warn(`Could not read stat for ${file}:`, e);
    }
  }

  return items;
}

// Create new folder
export function createFolder(parentRelativePath: string, folderName: string): string {
  const safeParent = resolveSafePath(parentRelativePath);
  
  // Clean folder name to remove directory characters
  const cleanName = folderName.replace(/[\/\\\x00-\x1f\x7f-\x9f]/g, '_');
  const newFolderPath = path.join(safeParent, cleanName);

  // Traversal double check
  if (!newFolderPath.startsWith(resolveSafePath(''))) {
    throw new Error('Access Denied: Path escapes root storage');
  }

  if (fs.existsSync(newFolderPath)) {
    throw new Error('Folder already exists');
  }

  fs.mkdirSync(newFolderPath, { recursive: true });
  return path.relative(resolveSafePath(''), newFolderPath);
}

// Rename or Move files/folders
export function renameOrMove(oldRelativePath: string, newRelativePath: string): string {
  const oldSafe = resolveSafePath(oldRelativePath);
  const newSafe = resolveSafePath(newRelativePath);

  if (!fs.existsSync(oldSafe)) {
    throw new Error('Source file or directory does not exist');
  }

  if (fs.existsSync(newSafe)) {
    throw new Error('Target name already exists');
  }

  fs.renameSync(oldSafe, newSafe);
  return path.relative(resolveSafePath(''), newSafe);
}

// Move to Trash (macOS Finder-like)
export function moveToTrash(itemRelativePath: string): string {
  const safeItem = resolveSafePath(itemRelativePath);
  const trashRoot = path.join(resolveSafePath(''), '.TrashFolder');

  if (!fs.existsSync(safeItem)) {
    throw new Error('Item does not exist');
  }

  // If already inside .Trash, do permanent delete instead
  if (safeItem.startsWith(trashRoot)) {
    return deletePermanently(itemRelativePath);
  }

  const name = path.basename(safeItem);
  let targetPath = path.join(trashRoot, name);

  // Avoid name collisions in Trash
  let counter = 1;
  const ext = path.extname(name);
  const base = path.basename(name, ext);
  while (fs.existsSync(targetPath)) {
    targetPath = path.join(trashRoot, `${base}_copy_${counter}${ext}`);
    counter++;
  }

  fs.renameSync(safeItem, targetPath);
  const trashRelative = path.relative(resolveSafePath(''), targetPath);

  // Save the original location mapping
  const origins = loadTrashOrigins();
  origins[trashRelative] = itemRelativePath;
  saveTrashOrigins(origins);

  return trashRelative;
}

// Delete permanently
export function deletePermanently(itemRelativePath: string): string {
  const safeItem = resolveSafePath(itemRelativePath);

  if (!fs.existsSync(safeItem)) {
    throw new Error('Item does not exist');
  }

  const stat = fs.statSync(safeItem);
  if (stat.isDirectory()) {
    fs.rmSync(safeItem, { recursive: true, force: true });
  } else {
    fs.unlinkSync(safeItem);
  }

  // Clean up stored mapping
  const origins = loadTrashOrigins();
  delete origins[itemRelativePath];
  saveTrashOrigins(origins);

  return itemRelativePath;
}

// Empty Trash folder
export function emptyTrash(): void {
  const trashRoot = path.join(resolveSafePath(''), '.TrashFolder');
  if (fs.existsSync(trashRoot)) {
    const files = fs.readdirSync(trashRoot);
    for (const file of files) {
      const filePath = path.join(trashRoot, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        fs.rmSync(filePath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(filePath);
      }
    }
  }

  // Reset all origins mapping
  saveTrashOrigins({});
}

// Trash Origins mapping database
const TRASH_ORIGINS_FILE = path.join(CONFIG_DIR, 'trash_origins.json');

interface TrashOriginsRegistry {
  [trashPath: string]: string;
}

function loadTrashOrigins(): TrashOriginsRegistry {
  try {
    if (fs.existsSync(TRASH_ORIGINS_FILE)) {
      const data = fs.readFileSync(TRASH_ORIGINS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to read trash_origins.json:', err);
  }
  return {};
}

function saveTrashOrigins(origins: TrashOriginsRegistry): void {
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    fs.writeFileSync(TRASH_ORIGINS_FILE, JSON.stringify(origins, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save trash_origins.json:', err);
  }
}

// Put back item to its original location
export function putBack(itemRelativePath: string): string {
  const safeTrashItem = resolveSafePath(itemRelativePath);
  const trashRoot = path.join(resolveSafePath(''), '.TrashFolder');

  if (!safeTrashItem.startsWith(trashRoot)) {
    throw new Error('Item is not inside Trash');
  }

  if (!fs.existsSync(safeTrashItem)) {
    throw new Error('Item does not exist in Trash');
  }

  const origins = loadTrashOrigins();
  const originalRelativePath = origins[itemRelativePath];

  if (!originalRelativePath) {
    throw new Error('Original location not found for this item');
  }

  const destinationSafe = resolveSafePath(originalRelativePath);
  const destDir = path.dirname(destinationSafe);

  // Recreate destination directory if it was deleted
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Handle collision at destination
  let finalDest = destinationSafe;
  if (fs.existsSync(finalDest)) {
    const name = path.basename(destinationSafe);
    const ext = path.extname(name);
    const base = path.basename(name, ext);
    let counter = 1;
    while (fs.existsSync(finalDest)) {
      finalDest = path.join(destDir, `${base}_copy_${counter}${ext}`);
      counter++;
    }
  }

  fs.renameSync(safeTrashItem, finalDest);

  // Clean up registration mapping
  delete origins[itemRelativePath];
  saveTrashOrigins(origins);

  return path.relative(resolveSafePath(''), finalDest);
}

// Zip items into a .zip archive inside current folder
export function compressItems(parentRelativePath: string, items: string[], archiveName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const safeParent = resolveSafePath(parentRelativePath);
      let zipName = archiveName.endsWith('.zip') ? archiveName : `${archiveName}.zip`;
      let zipPath = path.join(safeParent, zipName);

      // Handle duplicate zip names
      let counter = 1;
      const base = path.basename(zipName, '.zip');
      while (fs.existsSync(zipPath)) {
        zipPath = path.join(safeParent, `${base}_${counter}.zip`);
        counter++;
      }

      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        resolve(path.relative(resolveSafePath(''), zipPath));
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);

      for (const item of items) {
        const itemSafe = resolveSafePath(item);
        if (!fs.existsSync(itemSafe)) continue;

        const stat = fs.statSync(itemSafe);
        const itemName = path.basename(itemSafe);

        if (stat.isDirectory()) {
          archive.directory(itemSafe, itemName);
        } else {
          archive.file(itemSafe, { name: itemName });
        }
      }

      archive.finalize();
    } catch (e) {
      reject(e);
    }
  });
}

// Extract a .zip archive
export function decompressItem(zipRelativePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const safeZipPath = resolveSafePath(zipRelativePath);
      if (!fs.existsSync(safeZipPath)) {
        return reject(new Error('Zip file not found'));
      }

      const parentDir = path.dirname(safeZipPath);
      const baseName = path.basename(safeZipPath, '.zip');
      let targetExtractPath = path.join(parentDir, baseName);

      // Avoid collision of extracted directory
      let counter = 1;
      while (fs.existsSync(targetExtractPath)) {
        targetExtractPath = path.join(parentDir, `${baseName}_extracted_${counter}`);
        counter++;
      }

      fs.createReadStream(safeZipPath)
        .pipe(unzipper.Extract({ path: targetExtractPath }))
        .on('close', () => {
          resolve(path.relative(resolveSafePath(''), targetExtractPath));
        })
        .on('error', (err) => {
          reject(err);
        });
    } catch (e) {
      reject(e);
    }
  });
}
