/**
 * Utility to read and optimize images from file inputs or drag-and-drop
 * Resizes large photos to a web-friendly dimension and JPEG/WebP format
 * to prevent localStorage or browser memory exhaustion.
 */

export function readFileAsDataUrl(
  file: File,
  maxDimension = 1600,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error(`Файл «${file.name}» не является изображением`));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Ошибка чтения файла «${file.name}»`));
    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      if (!rawDataUrl) {
        return reject(new Error(`Файл «${file.name}» пуст`));
      }

      // If already small (< 250 KB), no heavy compression needed
      if (file.size < 250 * 1024) {
        return resolve(rawDataUrl);
      }

      const img = new Image();
      img.onerror = () => resolve(rawDataUrl); // fallback
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return resolve(rawDataUrl);
          }

          ctx.drawImage(img, 0, 0, width, height);
          const mimeType = file.type === 'image/png' ? 'image/jpeg' : file.type;
          const optimized = canvas.toDataURL(mimeType, quality);
          resolve(optimized);
        } catch {
          resolve(rawDataUrl);
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export async function readMultipleImagesAsDataUrls(
  files: FileList | File[]
): Promise<string[]> {
  const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
  const results: string[] = [];

  for (const file of fileArray) {
    try {
      const dataUrl = await readFileAsDataUrl(file);
      results.push(dataUrl);
    } catch (err) {
      console.warn('Failed to process image file:', file.name, err);
    }
  }

  return results;
}
