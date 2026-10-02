/** Saves text as a file through a Blob and a temporary a[download] link (T-015, SR-19). */
export function downloadTextFile(fileName: string, text: string, mimeType: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: mimeType }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  // Revoked after the click has been handled, so the browser has started the download.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
