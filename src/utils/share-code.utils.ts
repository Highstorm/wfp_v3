const SHARE_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const SHARE_CODE_LENGTH = 8;

/** Generate a random alphanumeric share code. */
export function generateShareCode(): string {
  let result = "";
  for (let i = 0; i < SHARE_CODE_LENGTH; i++) {
    result += SHARE_CODE_CHARS.charAt(
      Math.floor(Math.random() * SHARE_CODE_CHARS.length)
    );
  }
  return result;
}
