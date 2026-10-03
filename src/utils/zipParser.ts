import JSZip from 'jszip';

export interface ExtractedZipResult {
  archiveName: string;
  images: {
    name: string;
    url: string;
    sizeBytes: number;
  }[];
  imageUrls: string[];
  extractedTextNotes?: string;
  totalImagesCount: number;
}

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'avif', 'svg']);

function getExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

function getMimeType(extension: string): string {
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'bmp':
      return 'image/bmp';
    case 'svg':
      return 'image/svg+xml';
    case 'avif':
      return 'image/avif';
    default:
      return 'image/jpeg';
  }
}

/**
 * Parses a ZIP archive containing property photos and optional text description notes.
 * Extracts every image individually as a data URL ready for instant display in apartment cards.
 */
export async function parseZipArchive(file: File): Promise<ExtractedZipResult> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);

  const imageEntries: { name: string; fileEntry: JSZip.JSZipObject }[] = [];
  let textNotes: string | undefined;

  // Iterate over files in the zip archive
  loadedZip.forEach((relativePath, entry) => {
    // Ignore directories and macOS metadata
    if (entry.dir || relativePath.startsWith('__MACOSX') || relativePath.includes('/.') || relativePath.startsWith('.')) {
      return;
    }

    const ext = getExtension(relativePath);

    if (IMAGE_EXTENSIONS.has(ext)) {
      imageEntries.push({ name: relativePath, fileEntry: entry });
    } else if (ext === 'txt' || ext === 'md' || ext === 'note') {
      // Keep first text note as possible property description
      if (!textNotes) {
        entry.async('text').then((content) => {
          textNotes = content;
        }).catch(() => {});
      }
    }
  });

  // Sort image entries naturally by filename (1.jpg, 2.jpg, 10.jpg)
  imageEntries.sort((a, b) => {
    const filenameA = a.name.split('/').pop() || a.name;
    const filenameB = b.name.split('/').pop() || b.name;
    return filenameA.localeCompare(filenameB, undefined, { numeric: true, sensitivity: 'base' });
  });

  // Extract all images in parallel
  const extractedImages: { name: string; url: string; sizeBytes: number }[] = [];

  for (const item of imageEntries) {
    try {
      const ext = getExtension(item.name);
      const mime = getMimeType(ext);
      const base64Data = await item.fileEntry.async('base64');
      const dataUrl = `data:${mime};base64,${base64Data}`;
      
      extractedImages.push({
        name: item.name.split('/').pop() || item.name,
        url: dataUrl,
        sizeBytes: Math.round(base64Data.length * 0.75),
      });
    } catch (e) {
      console.error(`Failed to extract image ${item.name} from zip:`, e);
    }
  }

  // If there was a text file, give it a moment to resolve or read it synchronously if not yet
  if (!textNotes) {
    for (const [relativePath, entry] of Object.entries(loadedZip.files)) {
      if (!entry.dir && (relativePath.endsWith('.txt') || relativePath.endsWith('.md'))) {
        try {
          textNotes = await entry.async('text');
          break;
        } catch {
          // ignore
        }
      }
    }
  }

  return {
    archiveName: file.name,
    images: extractedImages,
    imageUrls: extractedImages.map((img) => img.url),
    extractedTextNotes: textNotes?.trim(),
    totalImagesCount: extractedImages.length,
  };
}
