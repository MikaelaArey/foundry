import crypto from "node:crypto";

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error("AUTH_SECRET is missing or too short. Set it in .env.");
  return s;
}

const key = () => crypto.createHash("sha256").update(secret()).digest();

/** Encrypts a short secret (like an OAuth token) for storage. */
export function encrypt(plain: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), data.toString("base64url")].join(".");
}

export function decrypt(stored: string) {
  const [v, iv, tag, data] = stored.split(".");
  if (v !== "v1" || !iv || !tag || !data) throw new Error("Unrecognized encrypted value");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
}

export const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");
export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString("base64url");
