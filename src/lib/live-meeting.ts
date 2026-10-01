import { createHash, randomBytes } from "node:crypto";

export type MeetingStatus = "scheduled" | "live" | "completed" | "cancelled";

export function createMeetingReference() {
  return `LM-${new Date().getUTCFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export function createInviteToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashInviteToken(token) };
}

export function hashInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function canTransitionMeeting(from: MeetingStatus, to: MeetingStatus) {
  if (from === to) return true;
  return (
    (from === "scheduled" && (to === "live" || to === "cancelled")) ||
    (from === "live" && (to === "completed" || to === "cancelled"))
  );
}

export function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}
