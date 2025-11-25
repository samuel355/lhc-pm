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
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || "")

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
    const { id, email_addresses, first_name, last_name, public_metadata, username } = evt.data;
    const email = email_addresses[0]?.email_address;
    const clerk = await clerkClient();
    let fullname;
    if(first_name === null && last_name === null ){
      fullname = username
    }

    console.log(evt.data)

    console.log("Processing user creation for:", email);

    if (!email) {
      return new Response("No email found", { status: 400 });
    }

    // Determine role and metadata
    const isCTO = email === 'samueloseiboatenglistowell57@gmail.com';
    const userRole = isCTO ? 'sysadmin' : (public_metadata?.role || 'member');
    
    // Handle department_id - convert empty string to null for UUID field
    let departmentId = public_metadata?.department_id;
    if (departmentId === "" || !departmentId) {
      departmentId = null; // Use null instead of empty string for UUID fields
    }

    // Default public metadata for all users
    const defaultPublicMetadata = {
      role: userRole,
      position: public_metadata?.position || "",
      department_id: departmentId, // Use the processed department_id
      department_head: public_metadata?.department_head || false
    };

    console.log("Final metadata to be set:", defaultPublicMetadata);

    // Update Clerk user with consistent public metadata
    try {
      await clerk.users.updateUser(id, {
        publicMetadata: defaultPublicMetadata
      });
      console.log("Updated Clerk public metadata for user:", email);
    } catch (clerkError) {
      console.error("Error updating Clerk metadata:", clerkError);
      // Continue with Supabase creation even if Clerk update fails
    }

    // Create user in Supabase - use null for empty department_id
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        email,
        full_name: fullname,
        role: userRole,
        position: defaultPublicMetadata.position || null, // Use null for empty strings if needed
        department_id: departmentId, // This will be null for empty values
        clerk_id: id,
      })
      .select()
      .single();
    
    

    if (insertError) {
      console.error("Error creating user in Supabase:", insertError);
      console.error("Insert error details:", JSON.stringify(insertError, null, 2));
      return new Response("Error creating user in Supabase", { status: 500 });
    }

    console.log("Successfully created user in Supabase:", newUser);
    console.log("User creation process completed successfully");
    return new Response("User Created", {status: 201});
  }

  // Handle user deletion from Clerk
  if (eventType === "user.deleted") {
    const { id } = evt.data;
    
    if (!id) {
      return new Response("No user ID found", { status: 400 });
    }

    // Delete user from Supabase using clerk_id
    const { error } = await supabase
      .from("users")
      .delete()
      .eq("clerk_id", id);

    if (error) {
      console.error("Error deleting user from Supabase:", error);
      return new Response("Error deleting user from Supabase", { status: 500 });
    }

    console.log(`User with clerk_id ${id} deleted from Supabase`);
  }

  return new Response("", { status: 200 });
}