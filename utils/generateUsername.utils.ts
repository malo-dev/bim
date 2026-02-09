export function generateUsername(prefix = "user", length = 5): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let randomStr = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    randomStr += chars[randomIndex];
  }
  return `${prefix}_${randomStr}`;
}
