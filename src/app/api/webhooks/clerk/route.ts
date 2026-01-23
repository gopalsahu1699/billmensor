import { headers } from "next/headers";
import { Webhook } from "svix";
import { NextResponse } from "next/server";
import type { WebhookEvent } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  const payload = await req.text();
  const headerPayload = await headers();

  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse("Missing Svix headers", { status: 400 });
  }

  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return new NextResponse("Webhook secret missing", { status: 500 });
  }

  const wh = new Webhook(secret);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  const { type, data } = evt;

  console.log("Clerk webhook event:", type);

  // 🔽 Example handlers
  if (type === "user.created") {
    console.log("New user:", data.id);
  }

  if (type === "user.updated") {
    console.log("Updated user:", data.id);
  }

  return NextResponse.json({ received: true });
}
