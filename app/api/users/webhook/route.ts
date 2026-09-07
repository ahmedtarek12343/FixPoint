import { prisma } from "@/lib/prisma";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req);

    // Do something with payload
    // For this guide, log payload to console
    const { id } = evt.data;
    const eventType = evt.type;
    if (eventType === "user.created") {
      await prisma.user.create({
        data: {
          clerkId: evt.data.id,
          email: evt.data.email_addresses[0].email_address,
          imageUrl: evt.data.image_url,
          name: `${evt.data.first_name || ""} ${evt.data.last_name || ""}`,
        },
      });
    }
    if (eventType === "user.updated") {
      await prisma.user.update({
        where: { clerkId: evt.data.id },
        data: {
          email: evt.data.email_addresses[0].email_address,
          name: `${evt.data.first_name || ""} ${evt.data.last_name || ""}`,
          imageUrl: evt.data.image_url,
        },
      });
    }

    if (eventType === "user.deleted") {
      if (!evt.data.id) {
        return new Response("Missing user ID", { status: 400 });
      }
      await prisma.user.delete({
        where: { clerkId: evt.data.id },
      });
    }
    return new Response("Webhook received", { status: 200 });
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error verifying webhook", { status: 400 });
  }
}
