import { Webhook } from "svix";
import { headers } from "next/headers";
import { clerkClient, WebhookEvent } from "@clerk/nextjs/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || "");

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", {
      status: 400,
    });
  }

  const supabase = await createClient(cookies());

  // Handle the webhook
  const eventType = evt.type;
  console.log("eventType ->", eventType);

  if (eventType === "user.created") {
    const { id, email_addresses, first_name, last_name, public_metadata } =
      evt.data;
    const email = email_addresses[0]?.email_address;
    const clerk = await clerkClient();
    if(email === 'samueloseiboatenglistowell57@gmail.com'){
      await clerk.users.updateUser(id, {
        publicMetadata: {
          role: 'sysadmin'
        }
      })
    }
    console.log("clerk -data ->", evt.data);

    if (!email) {
      return new Response("No email found", { status: 400 });
    }

    // Create user in Supabase
    const { error } = await supabase.from("users").insert({
      email,
      full_name: `${first_name} ${last_name}`,
      role: public_metadata.role || "member",
      position: public_metadata.position || null,
      department_id: public_metadata.department_id || null,
      clerk_id: id,
    });

    if (error) {
      console.error("Error creating user in Supabase:", error);
      return new Response("Error creating user in Supabase", { status: 500 });
    }
  }

  return new Response("", { status: 200 });
}
