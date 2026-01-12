"use server";
import { cookies } from "next/headers";

export async function getCookieinPage(cookieName: string): Promise<string> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(cookieName);
  const value = cookie?.value ?? "";
  return value ?? "none"; // Retorna "none" si no se encuentra el cookie
}

export async function getCookie(name: string): Promise<string | null> {
  const cookieStore = await cookies();
  const match = cookieStore.get(name);
  return match?.value ?? null;
}
