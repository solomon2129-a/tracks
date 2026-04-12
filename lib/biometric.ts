const CRED_KEY = (uid: string) => `tracksy_biometric_${uid}`;

function bufToBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function base64ToBuf(b64: string): ArrayBuffer {
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  return bytes.buffer.slice(0) as ArrayBuffer;
}

export function isBiometricSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    !!window.PublicKeyCredential &&
    typeof navigator.credentials?.create === "function"
  );
}

export function isBiometricEnrolled(userId: string): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(CRED_KEY(userId));
}

/** Register Face ID / Touch ID for this user. Returns true on success. */
export async function registerBiometric(userId: string, userEmail: string): Promise<boolean> {
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const uid = new TextEncoder().encode(userId);

    const cred = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: "Tracksy", id: window.location.hostname },
        user: { id: uid, name: userEmail, displayName: "Tracksy" },
        pubKeyCredParams: [{ type: "public-key", alg: -7 }],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
        },
        timeout: 60000,
      },
    }) as PublicKeyCredential | null;

    if (!cred) return false;
    localStorage.setItem(CRED_KEY(userId), bufToBase64(cred.rawId));
    return true;
  } catch {
    return false;
  }
}

/** Authenticate with Face ID / Touch ID. Returns true if biometric passed. */
export async function authenticateBiometric(userId: string): Promise<boolean> {
  const stored = localStorage.getItem(CRED_KEY(userId));
  if (!stored) return false;

  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        rpId: window.location.hostname,
        allowCredentials: [{ type: "public-key", id: base64ToBuf(stored) }],
        userVerification: "required",
        timeout: 60000,
      },
    }) as PublicKeyCredential | null;

    return !!assertion;
  } catch {
    return false;
  }
}

export function removeBiometric(userId: string): void {
  localStorage.removeItem(CRED_KEY(userId));
}
