// See: https://github.com/vitejs/vite/issues/12366#issuecomment-2674191945
export function dataUrlToArrayBuffer(dataUrl: string) {
  const base64StartIndex = dataUrl.indexOf("base64,");
  if (base64StartIndex >= 0) {
    const base64 = dataUrl.slice(base64StartIndex + "base64,".length);
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
  const str = decodeURIComponent(dataUrl.slice(dataUrl.indexOf(",") + 1));
  const enc = new TextEncoder();
  const bytes = enc.encode(str);
  return bytes.buffer;
}
