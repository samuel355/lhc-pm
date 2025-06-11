import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { v5 as uuidv5 } from "uuid";

// Convert Clerk user ID to UUID format
function clerkIdToUuid(clerkId: string): string {
  // Use a namespace UUID for consistent generation
  const NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
  return uuidv5(clerkId, NAMESPACE);
}

export async function PATCH(request: NextRequest) {
  try {
    // only sysadmins allowed
    const me = await currentUser();
    if (!me || me.publicMetadata.role !== "sysadmin") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = request.url.split("/").pop();
    if (!userId) {
      return new NextResponse("User ID is required", { status: 400 });
    }

    const {
      firstName,
      lastName,
      role,
      position,
      department_id,
      department_head,
    } = await request.json();

    // 1) Update Supabase
    const supabase = await createClient(cookies());
    const supabaseId = clerkIdToUuid(userId);
    const { error: supabaseError } = await supabase
      .from("users")
      .update({
        full_name: `${firstName} ${lastName}`,
        role,
        position,
        department_id: department_id || null,
        department_head: department_head || false,
      })
      .eq("id", supabaseId);
    if (supabaseError) throw supabaseError;

    // 2) Update Clerk
    const clerk = await clerkClient();
    await clerk.users.updateUser(userId, {
      firstName,
      lastName,
      publicMetadata: { role, position, department_id, department_head },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error updating user:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}


export async function DELETE(request: NextRequest) {
  try {
    // only sysadmins allowed
    const me = await currentUser();
    if (!me || me.publicMetadata.role !== "sysadmin") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get userId from URL
    const url = new URL(request.url);
    const userId = url.pathname.split("/").pop();
    if (!userId) {
      return new NextResponse("User ID is required", { status:400 });
    }

    // 1) Delete from Supabase
    const supabase = await createClient(cookies());
    const supabaseId = clerkIdToUuid(userId);
    const { error: supabaseError } = await supabase
      .from("users")
      .delete()
      .eq("id", supabaseId);
    if (supabaseError) throw supabaseError;

    // 2) Delete from Clerk
    const clerk = await clerkClient();
    await clerk.users.deleteUser(userId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting user:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

