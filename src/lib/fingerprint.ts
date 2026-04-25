export async function getFingerprint(): Promise<string> {
  const components: string[] = [];

  components.push(navigator.userAgent);
  components.push(navigator.language);
  components.push(screen.width + "x" + screen.height);
  components.push(screen.colorDepth.toString());
  components.push(new Date().getTimezoneOffset().toString());
  components.push(navigator.hardwareConcurrency?.toString() || "");
  components.push((navigator as { deviceMemory?: number }).deviceMemory?.toString() || "");

  // Canvas fingerprint
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("freepaint", 2, 15);
    components.push(canvas.toDataURL());
  } catch {
    // ignore
  }

  const raw = components.join("|");
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
