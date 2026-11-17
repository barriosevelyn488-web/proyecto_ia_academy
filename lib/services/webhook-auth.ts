import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

export function verifyBearerSecret(request: NextRequest, expectedSecret: string): boolean {
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const left = Buffer.from(supplied);
  const right = Buffer.from(expectedSecret);
  return left.length === right.length && timingSafeEqual(left, right);
}
