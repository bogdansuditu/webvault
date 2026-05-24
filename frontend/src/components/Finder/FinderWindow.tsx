import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderIcon, FileIcon, ImageIcon, PDFIcon, AudioIcon, VideoIcon, ArchiveIcon, TrashIcon,
  SearchIcon, GridIcon, ListIcon, NewFolderIcon, UploadIcon, InfoIcon, 
  ChevronLeftIcon, ChevronRightIcon, SunIcon, MoonIcon, PowerIcon
} from '../../assets/icons';
import { ContextMenu, ContextMenuItem } from '../ContextMenu/ContextMenu';

interface FileItem {
  name: string;
  relativePath: string;
  isDirectory: boolean;
  size: number;
  mtime: string;
  birthtime: string;
  mimeType: string;
}

interface FinderWindowProps {
  apiBase: string;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  user: string;
  setUser: (username: string) => void;
  displayName: string;
  setDisplayName: (name: string) => void;
  themeData?: any;
  activeTheme?: string;
  onSelectTheme?: (themeKey: string) => Promise<void>;
}

export const FinderWindow: React.FC<FinderWindowProps> = ({ 
  apiBase, onLogout, isDarkMode, onToggleTheme,
  user, setUser, displayName, setDisplayName,
  themeData, activeTheme, onSelectTheme
}) => {
  // Navigation Path History
  const [currentPath, setCurrentPath] = useState('');
  const [pathHistory, setPathHistory] = useState<string[]>(['']);
  const [historyIndex, setHistoryIndex] = useState(0);

  // User Account Settings States
  const [userMenuVisible, setUserMenuVisible] = useState(false);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [editUsername, setEditUsername] = useState(user);
  const [editDisplayName, setEditDisplayName] = useState(displayName);
  const [editPassword, setEditPassword] = useState('');
  const [editError, setEditError] = useState('');

  // Selection Tracking State
  const [lastSelectedItem, setLastSelectedItem] = useState<FileItem | null>(null);

  // Lightbox File Previewer States
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewingFile, setViewingFile] = useState<FileItem | null>(null);
  const [viewerTextContent, setViewerTextContent] = useState('');
  const [viewerLoading, setViewerLoading] = useState(false);

  // Files List
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<FileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    const saved = localStorage.getItem('webvault_view_mode');
    return (saved === 'grid' || saved === 'list') ? saved : 'grid';
  });
  const [showDetails, setShowDetails] = useState<boolean>(() => {
    const saved = localStorage.getItem('webvault_show_details');
    return saved === 'true';
  });
  const [loading, setLoading] = useState(false);

  // Sync visual preferences to localStorage
  useEffect(() => {
    localStorage.setItem('webvault_view_mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem('webvault_show_details', String(showDetails));
  }, [showDetails]);

  // Drag and Drop (External Local Files)
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Drag and Drop (Internal Moves)
  const [draggedItem, setDraggedItem] = useState<FileItem | null>(null);
  const [dragOverBreadcrumb, setDragOverBreadcrumb] = useState<string | null>(null);
  const [dragOverParent, setDragOverParent] = useState(false);

  // Custom Notifications / Upload Progress
  const [notification, setNotification] = useState<{ message: string; progress?: number } | null>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; visible: boolean; items: ContextMenuItem[] }>({
    x: 0,
    y: 0,
    visible: false,
    items: []
  });

  // Modal Dialog States
  const [activeModal, setActiveModal] = useState<'create_folder' | 'rename' | 'confirm_delete' | 'compress' | null>(null);
  const [modalInput, setModalInput] = useState('');
  const [targetFile, setTargetFile] = useState<FileItem | null>(null);

  // Clipboard Paste Helper ref
  const workspaceRef = useRef<HTMLDivElement>(null);

  // Fetch directory listing
  const fetchDirectory = async (path: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/files/list?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setFiles(data.items);
      } else {
        console.error('Failed to fetch folder list:', data.error);
        setFiles([]);
      }
    } catch (e) {
      console.error('Error fetching listing:', e);
      setFiles([]);
    } finally {
      setLoading(false);
      setSelectedItems([]);
    }
  };

  // Trigger fetch when currentPath changes
  useEffect(() => {
    fetchDirectory(currentPath);
  }, [currentPath]);

  // Navigate to a specific path
  const navigateTo = (newPath: string) => {
    // Prevent navigating beyond Trash when inside Trash
    const normalized = newPath === 'Trash' ? '.TrashFolder' : newPath;
    
    // Add to history and update index
    const nextHistory = pathHistory.slice(0, historyIndex + 1);
    nextHistory.push(normalized);
    setPathHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
    
    setCurrentPath(normalized);
  };

  const navBack = () => {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      setHistoryIndex(nextIndex);
      setCurrentPath(pathHistory[nextIndex]);
    }
  };

  const navForward = () => {
    if (historyIndex < pathHistory.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setCurrentPath(pathHistory[nextIndex]);
    }
  };

  // Selection handlers
  const handleItemClick = (e: React.MouseEvent, item: FileItem) => {
    e.stopPropagation();
    
    if (e.shiftKey && lastSelectedItem && files.some(f => f.relativePath === lastSelectedItem.relativePath)) {
      // Shift + Click -> Range select
      const startIndex = files.findIndex(f => f.relativePath === lastSelectedItem.relativePath);
      const endIndex = files.findIndex(f => f.relativePath === item.relativePath);
      
      const start = Math.min(startIndex, endIndex);
      const end = Math.max(startIndex, endIndex);
      
      const rangeSelection = files.slice(start, end + 1);
      setSelectedItems(rangeSelection);
    } else if (e.metaKey || e.ctrlKey) {
      // CMD/Ctrl + Click -> Toggle Selection
      if (selectedItems.some(i => i.relativePath === item.relativePath)) {
        setSelectedItems(selectedItems.filter(i => i.relativePath !== item.relativePath));
      } else {
        setSelectedItems([...selectedItems, item]);
      }
      setLastSelectedItem(item);
    } else {
      // Normal Click -> Single Selection
      setSelectedItems([item]);
      setLastSelectedItem(item);
    }
  };

  const handleWorkspaceClick = () => {
    setSelectedItems([]);
    setContextMenu({ ...contextMenu, visible: false });
  };

  const handleDoubleClick = async (item: FileItem) => {
    if (item.isDirectory) {
      navigateTo(item.relativePath);
    } else if (item.mimeType === 'image' || item.mimeType === 'text') {
      setViewingFile(item);
      setViewerVisible(true);
      if (item.mimeType === 'text') {
        setViewerLoading(true);
        try {
          const res = await fetch(`${apiBase}/api/files/download?path=${encodeURIComponent(item.relativePath)}`);
          const text = await res.text();
          setViewerTextContent(text);
        } catch (err) {
          setViewerTextContent('Failed to load text content.');
        } finally {
          setViewerLoading(false);
        }
      }
    } else {
      // Direct Download file for other types
      triggerDownload([item]);
    }
  };

  // Helper file icons mapper
  const renderIcon = (mimeType: string, size = 32) => {
    switch (mimeType) {
      case 'directory': return <FolderIcon size={size} />;
      case 'image': return <ImageIcon size={size} />;
      case 'pdf': return <PDFIcon size={size} />;
      case 'audio': return <AudioIcon size={size} />;
      case 'video': return <VideoIcon size={size} />;
      case 'archive': return <ArchiveIcon size={size} />;
      case 'trash': return <TrashIcon size={size} />;
      default: return <FileIcon size={size} />;
    }
  };

  // File Operations Handlers
  const triggerDownload = (items: FileItem[]) => {
    if (items.length === 0) return;
    
    if (items.length === 1) {
      // Single file download
      window.open(`${apiBase}/api/files/download?path=${encodeURIComponent(items[0].relativePath)}`, '_blank');
    } else {
      // Multi-file zip stream download
      const paths = items.map(i => i.relativePath);
      window.open(`${apiBase}/api/files/download?paths=${encodeURIComponent(JSON.stringify(paths))}`, '_blank');
    }
  };

  const triggerUpload = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.onchange = async () => {
      if (fileInput.files) {
        await uploadFiles(fileInput.files);
      }
    };
    fileInput.click();
  };

  const uploadFiles = async (fileList: FileList | File[]) => {
    const formData = new FormData();
    for (let i = 0; i < fileList.length; i++) {
      formData.append('files', fileList[i]);
    }

    setNotification({ message: 'Uploading assets...', progress: 10 });
    
    try {
      const res = await fetch(`${apiBase}/api/files/upload?path=${encodeURIComponent(currentPath)}`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotification({ message: 'Upload completed successfully!', progress: 100 });
        setTimeout(() => setNotification(null), 2500);
        fetchDirectory(currentPath);
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (err: any) {
      setNotification({ message: `Upload failed: ${err.message}` });
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const executeCreateFolder = async () => {
    if (!modalInput.trim()) return;
    try {
      const res = await fetch(`${apiBase}/api/files/create-folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: currentPath, name: modalInput.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchDirectory(currentPath);
      } else {
        alert(data.error || 'Failed to create folder');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActiveModal(null);
      setModalInput('');
    }
  };

  const executeRename = async () => {
    if (!modalInput.trim() || !targetFile) return;
    
    const parentPath = pathDirname(targetFile.relativePath);
    const newRelativePath = parentPath ? `${parentPath}/${modalInput.trim()}` : modalInput.trim();

    try {
      const res = await fetch(`${apiBase}/api/files/rename`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPath: targetFile.relativePath, newPath: newRelativePath })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchDirectory(currentPath);
      } else {
        alert(data.error || 'Failed to rename asset');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActiveModal(null);
      setModalInput('');
      setTargetFile(null);
    }
  };

  const executeDelete = async () => {
    const targets = selectedItems.length > 0 ? selectedItems : targetFile ? [targetFile] : [];
    if (targets.length === 0) return;

    try {
      const res = await fetch(`${apiBase}/api/files/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: targets.map(t => t.relativePath) })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchDirectory(currentPath);
      } else {
        alert(data.error || 'Failed to delete items');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActiveModal(null);
      setTargetFile(null);
    }
  };

  const executeEmptyTrash = async () => {
    if (!confirm('Are you sure you want to permanently empty all items in Trash?')) return;
    try {
      const res = await fetch(`${apiBase}/api/files/empty-trash`, { method: 'POST' });
      if (res.ok) {
        fetchDirectory(currentPath);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const executeCompress = async () => {
    if (!modalInput.trim()) return;
    const targets = selectedItems.length > 0 ? selectedItems : targetFile ? [targetFile] : [];
    if (targets.length === 0) return;

    try {
      const res = await fetch(`${apiBase}/api/files/compress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: currentPath,
          items: targets.map(t => t.relativePath),
          name: modalInput.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchDirectory(currentPath);
      } else {
        alert(data.error || 'Failed to archive items');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActiveModal(null);
      setModalInput('');
      setTargetFile(null);
    }
  };

  const executeDecompress = async (item: FileItem) => {
    setNotification({ message: 'Extracting archive content...' });
    try {
      const res = await fetch(`${apiBase}/api/files/decompress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: item.relativePath })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotification({ message: 'Extraction completed!' });
        setTimeout(() => setNotification(null), 2000);
        fetchDirectory(currentPath);
      } else {
        throw new Error(data.error || 'Extraction failed');
      }
    } catch (err: any) {
      setNotification({ message: `Extraction failed: ${err.message}` });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Save updated user credentials & display name
  const handleSaveUserSettings = async () => {
    if (!editDisplayName.trim()) {
      setEditError('Display Name is required.');
      return;
    }
    if (!editUsername.trim()) {
      setEditError('Username is required.');
      return;
    }
    if (editPassword && editPassword.length < 4) {
      setEditError('Password must be at least 4 characters.');
      return;
    }

    try {
      const res = await fetch(`${apiBase}/api/auth/update-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: editUsername.trim(),
          displayName: editDisplayName.trim(),
          password: editPassword ? editPassword : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update account');
      }

      setDisplayName(data.displayName);
      setUser(data.user);
      setUserModalVisible(false);
      setEditPassword('');
      setEditError('');
      setNotification({ message: 'Account details updated successfully!' });
      setTimeout(() => setNotification(null), 2500);
    } catch (err: any) {
      setEditError(err.message);
    }
  };

  // Close user profile dropdown on click away
  useEffect(() => {
    const closeMenu = () => {
      setUserMenuVisible(false);
    };
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  // Drag operations (External desktop file drops)
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const types = Array.from(e.dataTransfer.types || []);
    if (types.includes('Files')) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await uploadFiles(e.dataTransfer.files);
    }
  };

  // Helper function to perform bulk movement/relocation of items
  const moveItems = async (items: FileItem[], getDestPath: (item: FileItem) => string, isTrash = false) => {
    if (items.length === 0) return;

    setNotification({ message: isTrash ? `Trashing ${items.length} items...` : `Moving ${items.length} items...` });
    
    try {
      if (isTrash) {
        // Trash uses DELETE bulk API: POST /api/files/delete with { paths: [] }
        const res = await fetch(`${apiBase}/api/files/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paths: items.map(i => i.relativePath) })
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to move items to Trash');
        }
      } else {
        // Standard moves use RENAME API for each item in parallel
        const promises = items.map(async (item) => {
          const oldPath = item.relativePath;
          const newPath = getDestPath(item);
          const res = await fetch(`${apiBase}/api/files/rename`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ oldPath, newPath })
          });
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || `Failed to move ${item.name}`);
          }
        });
        await Promise.all(promises);
      }
      
      setNotification({ message: isTrash ? 'Items moved to Trash successfully!' : 'Items moved successfully!' });
      setTimeout(() => setNotification(null), 2000);
    } catch (err: any) {
      setNotification({ message: `Operation failed: ${err.message}` });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      fetchDirectory(currentPath);
      setDraggedItem(null);
    }
  };

  // Drag operations (Internal moves onto Breadcrumbs)
  const handleDropOnBreadcrumb = async (e: React.DragEvent, targetPath: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverBreadcrumb(null);
    if (!draggedItem) return;

    const itemsToMove = selectedItems.some(i => i.relativePath === draggedItem.relativePath)
      ? selectedItems
      : [draggedItem];

    // Filter out items that are already in the target directory or are ancestors of the target directory
    const validItems = itemsToMove.filter(item => {
      // Cannot move a folder into itself or its subfolders
      if (item.isDirectory && (targetPath === item.relativePath || targetPath.startsWith(item.relativePath + '/'))) {
        return false;
      }
      // Cannot move to its own current parent folder (no-op)
      const currentItemParent = pathDirname(item.relativePath);
      if (currentItemParent === targetPath) {
        return false;
      }
      return true;
    });

    if (validItems.length === 0) {
      setDraggedItem(null);
      return;
    }

    await moveItems(validItems, (item) => {
      return targetPath ? `${targetPath}/${item.name}` : item.name;
    });
  };

  // Drag operations (Internal moves onto Sidebar volumes/favorites)
  const handleDropOnSidebar = async (e: React.DragEvent, targetSidebarPath: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedItem) return;

    const normalizedTarget = targetSidebarPath === 'Trash' ? '.TrashFolder' : targetSidebarPath;
    const itemsToMove = selectedItems.some(i => i.relativePath === draggedItem.relativePath)
      ? selectedItems
      : [draggedItem];

    if (normalizedTarget === '.TrashFolder') {
      // Filter out items that are already in trash
      const validItems = itemsToMove.filter(item => !item.relativePath.startsWith('.TrashFolder'));
      if (validItems.length === 0) {
        setDraggedItem(null);
        return;
      }
      await moveItems(validItems, () => '', true);
      return;
    }

    // Standard moves via sidebar
    const validItems = itemsToMove.filter(item => {
      if (item.isDirectory && (normalizedTarget === item.relativePath || normalizedTarget.startsWith(item.relativePath + '/'))) {
        return false;
      }
      const currentItemParent = pathDirname(item.relativePath);
      if (currentItemParent === normalizedTarget) {
        return false;
      }
      return true;
    });

    if (validItems.length === 0) {
      setDraggedItem(null);
      return;
    }

    await moveItems(validItems, (item) => {
      return normalizedTarget ? `${normalizedTarget}/${item.name}` : item.name;
    });
  };

  // Drag operations (Internal item moves)
  const handleInternalDragStart = (e: React.DragEvent, item: FileItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleInternalDropOnFolder = async (e: React.DragEvent, targetFolder: FileItem) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedItem || !targetFolder.isDirectory) return;

    const itemsToMove = selectedItems.some(i => i.relativePath === draggedItem.relativePath)
      ? selectedItems
      : [draggedItem];

    const validItems = itemsToMove.filter(item => {
      // Cannot move onto itself
      if (item.relativePath === targetFolder.relativePath) return false;
      // Cannot move parent folder into subfolder
      if (item.isDirectory && targetFolder.relativePath.startsWith(item.relativePath + '/')) return false;
      // Cannot move to its own parent folder
      const currentItemParent = pathDirname(item.relativePath);
      if (currentItemParent === targetFolder.relativePath) return false;
      return true;
    });

    if (validItems.length === 0) {
      setDraggedItem(null);
      return;
    }

    await moveItems(validItems, (item) => {
      return `${targetFolder.relativePath}/${item.name}`;
    });
  };

  // Smart Clipboard Paste (`CMD+V` / `CTRL+V`) Interception
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (item.type.includes('image')) {
          const blob = item.getAsFile();
          if (blob) {
            const timestamp = formatTimestampFile();
            const fileObj = new File([blob], `Screenshot_${timestamp}.png`, { type: 'image/png' });
            setNotification({ message: 'Uploading pasted screenshot image...' });
            await uploadFiles([fileObj]);
          }
        } else if (item.type === 'text/plain') {
          item.getAsString(async (text) => {
            const blob = new Blob([text], { type: 'text/plain' });
            const words = text.trim().split(/\s+/);
            const firstWord = words[0] ? words[0].replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30) : 'Clipboard';
            const cleanFirstWord = firstWord || 'Clipboard';
            const timestamp = formatTimestampFile();
            const filename = `${cleanFirstWord}_${timestamp}.txt`;
            const fileObj = new File([blob], filename, { type: 'text/plain' });
            setNotification({ message: `Uploading pasted text '${cleanFirstWord}'...` });
            await uploadFiles([fileObj]);
          });
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [currentPath]);

  // Context Menu builder
  const handleContextMenu = (e: React.MouseEvent, item?: FileItem) => {
    e.preventDefault();
    e.stopPropagation();

    // If item clicked, highlight/select it
    let targets = selectedItems;
    if (item) {
      if (!selectedItems.some(i => i.relativePath === item.relativePath)) {
        targets = [item];
        setSelectedItems([item]);
      }
    } else {
      setSelectedItems([]);
      targets = [];
    }

    const menuItems: ContextMenuItem[] = [];

    if (targets.length === 1) {
      const single = targets[0];
      menuItems.push({
        label: 'Open',
        onClick: () => handleDoubleClick(single)
      });
      menuItems.push({
        label: 'Download',
        onClick: () => triggerDownload([single])
      });
      menuItems.push({
        label: 'Rename...',
        onClick: () => {
          setTargetFile(single);
          setModalInput(single.name);
          setActiveModal('rename');
        }
      });
      
      if (single.name.endsWith('.zip')) {
        menuItems.push({
          label: 'Decompress (Extract)',
          onClick: () => executeDecompress(single)
        });
      }

      menuItems.push({ separator: true, onClick: () => {} });
      menuItems.push({
        label: 'Compress (Zip)...',
        onClick: () => {
          setTargetFile(single);
          setModalInput(`${single.name.replace(/\.[^/.]+$/, '')}`);
          setActiveModal('compress');
        }
      });
      
      menuItems.push({
        label: 'Move to Trash',
        onClick: () => {
          setTargetFile(single);
          executeDelete();
        }
      });
    } else if (targets.length > 1) {
      menuItems.push({
        label: 'Download zip archive',
        onClick: () => triggerDownload(targets)
      });
      menuItems.push({
        label: 'Compress selected...',
        onClick: () => {
          setTargetFile(null);
          setModalInput('Archive');
          setActiveModal('compress');
        }
      });
      menuItems.push({
        label: 'Move all to Trash',
        onClick: () => executeDelete()
      });
    } else {
      // Empty workspace right-click menu
      menuItems.push({
        label: 'New Folder...',
        onClick: () => {
          setTargetFile(null);
          setModalInput('Untitled Folder');
          setActiveModal('create_folder');
        }
      });
      menuItems.push({
        label: 'Upload Files...',
        onClick: triggerUpload
      });
      
      if (currentPath.includes('.TrashFolder') || currentPath === 'Trash') {
        menuItems.push({
          label: 'Empty Trash',
          onClick: executeEmptyTrash
        });
      }
    }

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      visible: true,
      items: menuItems
    });
  };

  // Filter files by search
  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Render sidebar paths active state checker
  const isSidebarActive = (path: string) => {
    if (path === 'Trash' && currentPath.includes('.TrashFolder')) return true;
    return currentPath === path;
  };

  return (
    <div className="mac-window">
      {/* Finder Header: Titlebar & Toolbar */}
      <header className="window-header">
        <div className="title-row">
          <div className="window-controls">
            <button className="control-dot dot-red" title="Close" onClick={() => {}} />
            <button className="control-dot dot-yellow" title="Minimize" />
            <button className="control-dot dot-green" title="Maximize" />
          </div>
          <div className="window-title">
            {currentPath.includes('.TrashFolder') || currentPath === 'Trash' ? 'Trash' : currentPath ? pathBasename(currentPath) : 'WebVault Home'}
          </div>
        </div>

        <div className="toolbar-row">
          <div className="toolbar-left">
            <div className="nav-buttons">
              <button className="toolbar-btn" onClick={navBack} disabled={historyIndex === 0}>
                <ChevronLeftIcon size={14} />
              </button>
              <button className="toolbar-btn" onClick={navForward} disabled={historyIndex === pathHistory.length - 1}>
                <ChevronRightIcon size={14} />
              </button>
            </div>

            <div className="view-toggle">
              <button className={`toolbar-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>
                <GridIcon size={14} />
              </button>
              <button className={`toolbar-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
                <ListIcon size={14} />
              </button>
            </div>

            {/* Breadcrumb navigator */}
            <div className="breadcrumb-trail">
              <span 
                className="breadcrumb-item" 
                onClick={() => navigateTo('')}
                onDragOver={(e) => {
                  if (draggedItem && currentPath !== '') {
                    e.preventDefault();
                    setDragOverBreadcrumb('home');
                  }
                }}
                onDragLeave={() => setDragOverBreadcrumb(null)}
                onDrop={(e) => handleDropOnBreadcrumb(e, '')}
                style={{
                  background: dragOverBreadcrumb === 'home' ? 'rgba(10, 132, 255, 0.25)' : 'transparent',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  transition: 'background 0.15s ease'
                }}
              >
                Home
              </span>
              {currentPath && currentPath.split('/').map((segment, idx, arr) => {
                if (segment === '.TrashFolder') segment = 'Trash';
                const subPath = arr.slice(0, idx + 1).join('/');
                const isOver = dragOverBreadcrumb === subPath;
                return (
                  <React.Fragment key={idx}>
                    <span className="breadcrumb-separator">›</span>
                    <span 
                      className="breadcrumb-item" 
                      onClick={() => navigateTo(subPath)}
                      onDragOver={(e) => {
                        if (draggedItem && draggedItem.relativePath !== subPath && !subPath.startsWith(draggedItem.relativePath)) {
                          e.preventDefault();
                          setDragOverBreadcrumb(subPath);
                        }
                      }}
                      onDragLeave={() => setDragOverBreadcrumb(null)}
                      onDrop={(e) => handleDropOnBreadcrumb(e, subPath)}
                      style={{
                        background: isOver ? 'rgba(10, 132, 255, 0.25)' : 'transparent',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      {segment}
                    </span>
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          <div className="toolbar-right">
            {/* Empty Trash Button (Only in Trash directory) */}
            {(currentPath.includes('.TrashFolder') || currentPath === 'Trash') && (
              <button 
                className="empty-trash-btn" 
                onClick={executeEmptyTrash} 
                title="Empty Trash"
              >
                <TrashIcon size={14} />
                <span>Empty Trash</span>
              </button>
            )}


            <button className="toolbar-btn" onClick={() => {
              setTargetFile(null);
              setModalInput('Untitled Folder');
              setActiveModal('create_folder');
            }} title="New Folder">
              <NewFolderIcon size={16} />
            </button>

            <button className="toolbar-btn" onClick={triggerUpload} title="Upload">
              <UploadIcon size={16} />
            </button>

            <button className="toolbar-btn" onClick={() => setShowDetails(!showDetails)} disabled={selectedItems.length !== 1} title="Get Info">
              <InfoIcon size={16} />
            </button>

            <div className="search-bar">
              <SearchIcon size={12} />
              <input 
                type="text" 
                placeholder="Search" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <button 
              className="toolbar-btn" 
              onClick={(e) => {
                e.stopPropagation();
                setUserMenuVisible(!userMenuVisible);
              }}
              style={{
                background: 'var(--accent-light)',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold',
                color: 'var(--accent-color)',
                marginLeft: '8px',
                border: '1px solid var(--border-inner)',
                cursor: 'pointer'
              }}
              title="User Account Menu"
            >
              {displayName ? displayName.slice(0, 1).toUpperCase() : 'U'}
            </button>

            {userMenuVisible && (
              <div 
                className="context-menu" 
                style={{ 
                  top: '56px', 
                  right: '16px', 
                  width: '220px', 
                  padding: '12px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  borderRadius: '10px'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* User Info Header Card */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '8px', borderBottom: '1px solid var(--border-inner)' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px'
                  }}>
                    👤
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                    <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>{displayName}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>@{user}</span>
                  </div>
                </div>

                {/* Dropdown Items */}
                <div 
                  className="context-item" 
                  onClick={() => {
                    setEditUsername(user);
                    setEditDisplayName(displayName);
                    setEditPassword('');
                    setEditError('');
                    setUserModalVisible(true);
                    setUserMenuVisible(false);
                  }}
                  style={{ borderRadius: '5px' }}
                >
                  Change Account Details...
                </div>

                <div 
                  className="context-item" 
                  onClick={() => {
                    onToggleTheme();
                    setUserMenuVisible(false);
                  }}
                  style={{ borderRadius: '5px' }}
                >
                  Switch Theme Mode ({isDarkMode ? 'Light' : 'Dark'})
                </div>

                <div className="context-separator" />

                <div 
                  className="context-item" 
                  style={{ color: '#ff453a', borderRadius: '5px' }} 
                  onClick={() => {
                    onLogout();
                    setUserMenuVisible(false);
                  }}
                >
                  Log Out
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Split Body: Sidebar + File Workspace + Inspector details panel */}
      <div className="window-body">
        {/* Sidebar favorites list */}
        <aside className="window-sidebar">
          <div className="sidebar-section">
            <h4 className="sidebar-title">Favorites</h4>
            <div 
              className={`sidebar-item ${isSidebarActive('') ? 'active' : ''}`} 
              onClick={() => navigateTo('')}
              onDragOver={(e) => {
                if (draggedItem && currentPath !== '') {
                  e.preventDefault();
                }
              }}
              onDrop={(e) => handleDropOnSidebar(e, '')}
            >
              {renderIcon('directory', 16)}
              <span>Home</span>
            </div>
            <div 
              className={`sidebar-item ${isSidebarActive('Trash') ? 'active' : ''}`} 
              onClick={() => navigateTo('Trash')}
              onDragOver={(e) => {
                if (draggedItem && !draggedItem.relativePath.startsWith('.TrashFolder')) {
                  e.preventDefault();
                }
              }}
              onDrop={(e) => handleDropOnSidebar(e, 'Trash')}
            >
              <TrashIcon size={16} />
              <span>Trash</span>
            </div>
          </div>

          <div className="sidebar-section">
            <h4 className="sidebar-title">Volumes</h4>
            <div 
              className={`sidebar-item ${isSidebarActive('Documents') ? 'active' : ''}`} 
              onClick={() => navigateTo('Documents')}
              onDragOver={(e) => {
                if (draggedItem && draggedItem.relativePath !== 'Documents' && !draggedItem.relativePath.startsWith('Documents/')) {
                  e.preventDefault();
                }
              }}
              onDrop={(e) => handleDropOnSidebar(e, 'Documents')}
            >
              {renderIcon('directory', 16)}
              <span>Documents</span>
            </div>
            <div 
              className={`sidebar-item ${isSidebarActive('Downloads') ? 'active' : ''}`} 
              onClick={() => navigateTo('Downloads')}
              onDragOver={(e) => {
                if (draggedItem && draggedItem.relativePath !== 'Downloads' && !draggedItem.relativePath.startsWith('Downloads/')) {
                  e.preventDefault();
                }
              }}
              onDrop={(e) => handleDropOnSidebar(e, 'Downloads')}
            >
              {renderIcon('directory', 16)}
              <span>Downloads</span>
            </div>
          </div>
        </aside>

        {/* File manager workspace container */}
        <div 
          ref={workspaceRef}
          className="workspace-content"
          onClick={handleWorkspaceClick}
          onContextMenu={(e) => handleContextMenu(e)}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          tabIndex={0}
        >
          {isDragOver && (
            <div className="drag-over-overlay">
              Drop files here to upload to this directory
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              Loading WebVault filesystem...
            </div>
          ) : (filteredFiles.length === 0 && currentPath === '') || (filteredFiles.length === 0 && searchQuery) ? (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              {searchQuery ? 'No results found' : 'Folder is empty'}
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid-view">
              {/* Virtual Parent Folder Item */}
              {currentPath !== '' && !searchQuery && (
                <div
                  className={`grid-item parent-dir-item ${dragOverParent ? 'drag-over-active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItems([]);
                  }}
                  onDoubleClick={() => {
                    navigateTo(pathDirname(currentPath));
                  }}
                  onDragOver={(e) => {
                    if (draggedItem && !pathDirname(currentPath).startsWith(draggedItem.relativePath)) {
                      e.preventDefault();
                      setDragOverParent(true);
                    }
                  }}
                  onDragLeave={() => setDragOverParent(false)}
                  onDrop={(e) => {
                    setDragOverParent(false);
                    handleDropOnBreadcrumb(e, pathDirname(currentPath));
                  }}
                  style={{
                    opacity: 0.85,
                    background: dragOverParent ? 'rgba(10, 132, 255, 0.15)' : 'transparent',
                    border: dragOverParent ? '1.5px dashed var(--accent-color)' : '1px solid transparent',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div className="grid-icon-wrapper" style={{ position: 'relative' }}>
                    {renderIcon('directory', 42)}
                    <div style={{
                      position: 'absolute',
                      bottom: '0px',
                      right: '0px',
                      background: 'var(--accent-color)',
                      color: 'white',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                      ↑
                    </div>
                  </div>
                  <div className="grid-item-name" style={{ fontStyle: 'italic', fontWeight: 500 }}>..</div>
                </div>
              )}

              {filteredFiles.map((item) => {
                const isSelected = selectedItems.some(i => i.relativePath === item.relativePath);
                return (
                  <div
                    key={item.relativePath}
                    className={`grid-item ${isSelected ? 'selected' : ''}`}
                    onClick={(e) => handleItemClick(e, item)}
                    onDoubleClick={() => handleDoubleClick(item)}
                    onContextMenu={(e) => handleContextMenu(e, item)}
                    draggable
                    onDragStart={(e) => handleInternalDragStart(e, item)}
                    onDragOver={(e) => {
                      if (item.isDirectory && draggedItem && draggedItem.relativePath !== item.relativePath) {
                        e.preventDefault();
                      }
                    }}
                    onDrop={(e) => handleInternalDropOnFolder(e, item)}
                  >
                    <div className="grid-icon-wrapper">
                      {renderIcon(item.mimeType, 42)}
                    </div>
                    <div className="grid-item-name">{item.name}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View */
            <table className="list-view">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Size</th>
                  <th>Kind</th>
                  <th>Date Modified</th>
                </tr>
              </thead>
              <tbody>
                {/* Virtual Parent Folder Item */}
                {currentPath !== '' && !searchQuery && (
                  <tr
                    className={`list-item-row parent-dir-item ${dragOverParent ? 'drag-over-active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedItems([]);
                    }}
                    onDoubleClick={() => {
                      navigateTo(pathDirname(currentPath));
                    }}
                    onDragOver={(e) => {
                      if (draggedItem && !pathDirname(currentPath).startsWith(draggedItem.relativePath)) {
                        e.preventDefault();
                        setDragOverParent(true);
                      }
                    }}
                    onDragLeave={() => setDragOverParent(false)}
                    onDrop={(e) => {
                      setDragOverParent(false);
                      handleDropOnBreadcrumb(e, pathDirname(currentPath));
                    }}
                    style={{
                      opacity: 0.85,
                      background: dragOverParent ? 'rgba(10, 132, 255, 0.15)' : 'transparent',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <td>
                      <div className="list-file-name-cell">
                        <div style={{ position: 'relative', display: 'inline-flex' }}>
                          {renderIcon('directory', 16)}
                          <div style={{
                            position: 'absolute',
                            bottom: '-2px',
                            right: '-2px',
                            background: 'var(--accent-color)',
                            color: 'white',
                            borderRadius: '50%',
                            width: '10px',
                            height: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '7px',
                            fontWeight: 'bold'
                          }}>
                            ↑
                          </div>
                        </div>
                        <span style={{ fontStyle: 'italic', marginLeft: '8px', fontWeight: 500 }}>.. (Parent Folder)</span>
                      </div>
                    </td>
                    <td>--</td>
                    <td>Folder</td>
                    <td>--</td>
                  </tr>
                )}

                {filteredFiles.map((item) => {
                  const isSelected = selectedItems.some(i => i.relativePath === item.relativePath);
                  return (
                    <tr
                      key={item.relativePath}
                      className={`list-item-row ${isSelected ? 'selected' : ''}`}
                      onClick={(e) => handleItemClick(e, item)}
                      onDoubleClick={() => handleDoubleClick(item)}
                      onContextMenu={(e) => handleContextMenu(e, item)}
                      draggable
                      onDragStart={(e) => handleInternalDragStart(e, item)}
                      onDragOver={(e) => {
                        if (item.isDirectory && draggedItem && draggedItem.relativePath !== item.relativePath) {
                          e.preventDefault();
                        }
                      }}
                      onDrop={(e) => handleInternalDropOnFolder(e, item)}
                    >
                      <td>
                        <div className="list-file-name-cell">
                          {renderIcon(item.mimeType, 16)}
                          <span>{item.name}</span>
                        </div>
                      </td>
                      <td>{item.isDirectory ? '--' : formatBytes(item.size)}</td>
                      <td>{item.isDirectory ? 'Folder' : `${item.mimeType.toUpperCase()} file`}</td>
                      <td>{formatDate(item.mtime)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Finder Inspector Right Sidebar */}
        {showDetails && selectedItems.length === 1 && (
          <aside className="details-panel">
            <div className="details-header">
              <div className="details-icon-wrapper">
                {renderIcon(selectedItems[0].mimeType, 54)}
              </div>
              <div className="details-title">{selectedItems[0].name}</div>
            </div>
            <div className="details-rows">
              <div className="details-row">
                <span className="details-label">Kind</span>
                <span className="details-value">{selectedItems[0].isDirectory ? 'Folder' : `${selectedItems[0].mimeType.toUpperCase()} asset`}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Size</span>
                <span className="details-value">{selectedItems[0].isDirectory ? '--' : formatBytes(selectedItems[0].size)}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Location</span>
                <span className="details-value">/storage/{selectedItems[0].relativePath}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Created</span>
                <span className="details-value">{formatDate(selectedItems[0].birthtime)}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Modified</span>
                <span className="details-value">{formatDate(selectedItems[0].mtime)}</span>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Customizable Dialog Prompt Modals */}
      {activeModal === 'create_folder' && (
        <div className="modal-overlay">
          <div className="mac-dialog">
            <h3 className="dialog-title">New Folder</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Enter a name for the new folder:
            </p>
            <input
              type="text"
              className="dialog-input"
              value={modalInput}
              onChange={(e) => setModalInput(e.target.value)}
              autoFocus
            />
            <div className="dialog-buttons">
              <button className="dialog-btn btn-cancel" onClick={() => {
                setActiveModal(null);
                setTargetFile(null);
              }}>
                Cancel
              </button>
              <button 
                className="dialog-btn btn-confirm" 
                onClick={executeCreateFolder}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'compress' && (
        <div className="modal-overlay">
          <div className="mac-dialog">
            <h3 className="dialog-title">Compress Items</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Specify a name for the zip archive:
            </p>
            <input
              type="text"
              className="dialog-input"
              value={modalInput}
              onChange={(e) => setModalInput(e.target.value)}
              autoFocus
            />
            <div className="dialog-buttons">
              <button className="dialog-btn btn-cancel" onClick={() => {
                setActiveModal(null);
                setTargetFile(null);
              }}>
                Cancel
              </button>
              <button 
                className="dialog-btn btn-confirm" 
                onClick={executeCompress}
              >
                Compress
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'rename' && targetFile && (
        <div className="modal-overlay">
          <div className="mac-dialog">
            <h3 className="dialog-title">Rename Item</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Enter a new name for "{targetFile.name}":
            </p>
            <input
              type="text"
              className="dialog-input"
              value={modalInput}
              onChange={(e) => setModalInput(e.target.value)}
              autoFocus
            />
            <div className="dialog-buttons">
              <button className="dialog-btn btn-cancel" onClick={() => {
                setActiveModal(null);
                setTargetFile(null);
              }}>
                Cancel
              </button>
              <button className="dialog-btn btn-confirm" onClick={executeRename}>
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Settings Modal */}
      {userModalVisible && (
        <div className="modal-overlay">
          <div className="mac-dialog" style={{ width: '320px', gap: '15px' }}>
            <h3 className="dialog-title">User Account Settings</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="details-label" style={{ fontSize: '10px' }}>Display Name</span>
                <input
                  type="text"
                  className="dialog-input"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="details-label" style={{ fontSize: '10px' }}>Username</span>
                <input
                  type="text"
                  className="dialog-input"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="details-label" style={{ fontSize: '10px' }}>New Password (Optional)</span>
                <input
                  type="password"
                  className="dialog-input"
                  placeholder="Leave blank to keep current"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                />
              </div>

              {/* Dynamic Theme Selector Dropdown */}
              {themeData && themeData.themes && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span className="details-label" style={{ fontSize: '10px' }}>Active UI Theme</span>
                  <select
                    className="dialog-input"
                    value={activeTheme}
                    onChange={(e) => onSelectTheme && onSelectTheme(e.target.value)}
                    style={{
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-inner)',
                      borderRadius: '5px',
                      padding: '6px 10px',
                      fontSize: '12px',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      cursor: 'pointer',
                      width: '100%'
                    }}
                  >
                    {Object.entries(themeData.themes).map(([key, val]: any) => (
                      <option key={key} value={key} style={{ background: 'var(--card-bg)', color: 'var(--text-primary)' }}>
                        {val.name || key}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {editError && <div className="login-error" style={{ fontSize: '11px', textAlign: 'center' }}>{editError}</div>}

            <div className="dialog-buttons">
              <button 
                className="dialog-btn btn-cancel" 
                onClick={() => {
                  setUserModalVisible(false);
                  setEditError('');
                  setEditPassword('');
                }}
              >
                Cancel
              </button>
              <button 
                className="dialog-btn btn-confirm" 
                onClick={handleSaveUserSettings}
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Status Notification Layer */}
      {notification && (
        <div className="notification-toast">
          <div>{notification.message}</div>
          {notification.progress !== undefined && (
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${notification.progress}%` }} />
            </div>
          )}
        </div>
      )}

      {/* Lightbox File Previewer Modal */}
      {viewerVisible && viewingFile && (
        <div 
          className="modal-overlay" 
          onClick={() => {
            setViewerVisible(false);
            setViewingFile(null);
            setViewerTextContent('');
          }}
          style={{
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(15px)',
            WebkitBackdropFilter: 'blur(15px)'
          }}
        >
          <div 
            style={{
              position: 'relative',
              animation: 'dialogScale 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '15px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Text Preview Monospace Card */}
            {viewingFile.mimeType === 'text' && (
              <div 
                style={{
                  background: 'var(--card-bg)',
                  backdropFilter: 'var(--glass-blur)',
                  WebkitBackdropFilter: 'var(--glass-blur)',
                  border: 'var(--border-window)',
                  borderRadius: '12px',
                  padding: '24px',
                  width: '640px',
                  height: '480px',
                  maxWidth: '90vw',
                  maxHeight: '80vh',
                  overflowY: 'auto',
                  textAlign: 'left',
                  fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  color: 'var(--text-primary)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {viewerLoading ? (
                  <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                    Loading document content...
                  </div>
                ) : (
                  viewerTextContent
                )}
              </div>
            )}

            {/* Image Preview Screen */}
            {viewingFile.mimeType === 'image' && (
              <img 
                src={`${apiBase}/api/files/download?path=${encodeURIComponent(viewingFile.relativePath)}`} 
                alt={viewingFile.name} 
                style={{
                  maxWidth: '85vw',
                  maxHeight: '75vh',
                  borderRadius: '8px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                  objectFit: 'contain'
                }} 
              />
            )}

            {/* Control Info Bar */}
            <div 
              style={{
                background: 'rgba(30, 30, 30, 0.85)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                borderRadius: '20px',
                padding: '8px 20px',
                color: '#f5f5f7',
                fontSize: '12.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <span style={{ fontWeight: 500 }}>{viewingFile.name}</span>
              <span style={{ opacity: 0.35 }}>|</span>
              <button 
                onClick={() => triggerDownload([viewingFile])} 
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  color: 'var(--accent-color)', 
                  fontWeight: 600, 
                  cursor: 'pointer', 
                  outline: 'none',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}
              >
                Download
              </button>
              <span style={{ opacity: 0.35 }}>|</span>
              <button 
                onClick={() => {
                  setViewerVisible(false);
                  setViewingFile(null);
                  setViewerTextContent('');
                }} 
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  color: '#ff453a', 
                  fontWeight: 600, 
                  cursor: 'pointer', 
                  outline: 'none',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* custom right-click layer */}
      <ContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        visible={contextMenu.visible}
        items={contextMenu.items}
        onClose={() => setContextMenu({ ...contextMenu, visible: false })}
      />
    </div>
  );
};

// Utilities Functions
function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function pathBasename(pathStr: string): string {
  return pathStr.split('/').pop() || '';
}

function pathDirname(pathStr: string): string {
  const parts = pathStr.split('/');
  parts.pop();
  return parts.join('/');
}

function formatTimestampFile(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}
