import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore
import UTIF from 'utif';

interface TiffPreviewProps {
  url: string;
  name: string;
}

export const TiffPreview: React.FC<TiffPreviewProps> = ({ url, name }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const loadAndRenderTiff = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        
        if (!active) return;

        // Decode the TIFF directories (IFD)
        const ifds = UTIF.decode(arrayBuffer);
        if (!ifds || ifds.length === 0) {
          throw new Error("Unable to decode TIFF directories: file might be corrupted or in an unsupported format.");
        }

        // Get the first page directory and decode its pixel data
        const page = ifds[0];
        UTIF.decodeImage(arrayBuffer, page);

        // Convert the decoded image to a standard 8-bit RGBA array
        const rgba = UTIF.toRGBA8(page);

        if (!active) return;

        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = page.width;
          canvas.height = page.height;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const imageData = ctx.createImageData(page.width, page.height);
            imageData.data.set(new Uint8ClampedArray(rgba));
            ctx.putImageData(imageData, 0, 0);
          }
        }
        setLoading(false);
      } catch (err: any) {
        console.error("TIFF rendering failed:", err);
        if (active) {
          setError(err.message || "Failed to decode TIFF image.");
          setLoading(false);
        }
      }
    };

    loadAndRenderTiff();

    return () => {
      active = false;
    };
  }, [url]);

  return (
    <div 
      style={{ 
        display: 'flex', 
        flex: 1, 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '30px',
        width: '100%',
        height: '100%',
        position: 'relative'
      }}
    >
      {loading && (
        <div style={{ color: 'var(--text-secondary)' }}>
          Decoding TIFF image stream...
        </div>
      )}
      
      {error && (
        <div style={{ color: '#ff453a', textAlign: 'center', fontSize: '13px' }}>
          ⚠️ {error}
        </div>
      )}

      <canvas 
        ref={canvasRef}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          borderRadius: '8px',
          boxShadow: loading || error ? 'none' : '0 15px 35px rgba(0,0,0,0.25)',
          objectFit: 'contain',
          display: loading || error ? 'none' : 'block'
        }} 
      />
    </div>
  );
};
