import React, { useEffect, useRef } from 'react';

export interface ContextMenuItem {
  label?: string;
  onClick: () => void;
  separator?: boolean;
  tagColors?: { color: string; active: boolean }[];
  onTagClick?: (color: string) => void;
}

interface ContextMenuProps {
  x: number;
  y: number;
  visible: boolean;
  items: ContextMenuItem[];
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, visible, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [visible, onClose]);

  if (!visible) return null;

  // Reposition if menu overflows window boundaries
  const menuWidth = 190;
  const menuHeight = items.length * 30; // Approx
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  const adjustedX = x + menuWidth > screenWidth ? screenWidth - menuWidth - 10 : x;
  const adjustedY = y + menuHeight > screenHeight ? screenHeight - menuHeight - 10 : y;

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{
        top: `${adjustedY}px`,
        left: `${adjustedX}px`,
      }}
    >
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          {item.separator ? (
            <div className="context-separator" />
          ) : item.tagColors ? (
            <div className="context-tag-picker" aria-label="Tags">
              {item.tagColors.map(tag => (
                <button
                  key={tag.color}
                  className={`tag-choice tag-${tag.color} ${tag.active ? 'active' : ''}`}
                  aria-label={`${tag.active ? 'Remove' : 'Add'} ${tag.color} tag`}
                  onClick={(event) => {
                    event.stopPropagation();
                    item.onTagClick?.(tag.color);
                  }}
                >{tag.active ? '✓' : ''}</button>
              ))}
            </div>
          ) : (
            <div
              className="context-item"
              onClick={() => {
                item.onClick();
                onClose();
              }}
            >
              {item.label}
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
