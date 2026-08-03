import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import * as z from "zod";

export const dynamic = 'force-dynamic';

const createUserSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["member", "admin", "sysadmin"]),
  position: z.string().optional(),
  department_id: z.string().nullable().optional(),
  department_head: z.boolean().optional(),
});

interface Department {
  name: string;
}

// Define the type for the raw result of Supabase queries with department joins
interface SupabaseJoinResult {
  id: string;
  clerk_id: string;
  department_id: string | null;
  department_head: boolean | null;
  departments: Department[] | null; // Supabase returns an array for joined data
}

interface SupabaseUser {
  id: string;
  clerk_id: string;
  department_id: string | null;
  department_head: boolean | null;
  departments: Department | null; // The desired transformed type for internal use
}

export async function GET() {
  try {
    const user = await currentUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get all users from Clerk
    const clerk = await clerkClient();
    const response = await clerk.users.getUserList();

    // Get all users with department info from Supabase
    const supabase = await createClient(cookies());
    const { data: supabaseUsersData, error } = await supabase.from("users")
      .select(`
        id,
        clerk_id,
        department_id,
        department_head,
        departments (
          name
        )
      `);

    if (error) throw error;

    // Explicitly map raw Supabase data to SupabaseUser type (transforming departments from array to object)
    const supabaseUsers: SupabaseUser[] = (
      (supabaseUsersData as SupabaseJoinResult[]) || []
    ).map((rawUser) => ({
      id: rawUser.id,
      clerk_id: rawUser.clerk_id,
      department_id: rawUser.department_id,
      department_head: rawUser.department_head,
      departments:
        rawUser.departments && rawUser.departments.length > 0
          ? rawUser.departments[0] // Extract the first (and likely only) Department object
          : null,
    }));

    // Create a map of Supabase user data by ID
    const supabaseUserMap = new Map(
      supabaseUsers?.map((u) => [u.clerk_id, u]) || []
    );

    // Transform the data to a simpler format
    const simplifiedUsers = await Promise.all(
      response.data.map(async (user) => {
        let supabaseUser = supabaseUserMap.get(user.id);

        // If Supabase user doesn't exist for this Clerk ID, create it
        if (!supabaseUser) {
          //console.log(`Creating new Supabase user for Clerk ID: ${user.id}`);
          const { data: rawNewSupabaseUser, error: insertError } =
            await supabase
              .from("users")
              .insert({
                clerk_id: user.id,
                email: user.emailAddresses[0]?.emailAddress || "",
                full_name: `${user.firstName || ""} ${user.lastName || ""}`,
                role: user.publicMetadata.role || "member",
                position: user.publicMetadata.position || "",
                department_id: null,
                department_head: false,
              })
              .select(
                `
              id,
              clerk_id,
              department_id,
              department_head,
              departments (
                name
              )
            `
              )
              .single();

          if (insertError) {
            if (
              insertError.code === "23505" &&
              insertError.message.includes("users_email_key")
            ) {
              console.warn(
                `Duplicate email detected for Clerk ID: ${user.id}. Attempting to update existing user.`
              );
              // Attempt to find the user by email and update their clerk_id
              const { data: rawExistingUserByEmail, error: fetchError } =
                await supabase
                  .from("users")
                  .select(
                    `
                  id,
                  clerk_id,
                  department_id,
                  department_head,
                  departments (
                    name
                  )
                `
                  )
                  .eq("email", user.emailAddresses[0]?.emailAddress || "")
                  .single();

              if (fetchError) {
                console.error(
                  "Error fetching existing user by email:",
                  fetchError
                );
              } else if (rawExistingUserByEmail) {
                // Transform rawExistingUserByEmail to SupabaseUser
                const existingSupabaseUser: SupabaseUser = {
                  id: rawExistingUserByEmail.id,
                  clerk_id: rawExistingUserByEmail.clerk_id,
                  department_id: rawExistingUserByEmail.department_id,
                  department_head: rawExistingUserByEmail.department_head,
                  departments:
                    rawExistingUserByEmail.departments &&
                    rawExistingUserByEmail.departments.length > 0
                      ? rawExistingUserByEmail.departments[0]
                      : null,
                };

                const { data: rawUpdatedUser, error: updateError } =
                  await supabase
                    .from("users")
                    .update({
                      clerk_id: user.id,
                      full_name: `${user.firstName || ""} ${
                        user.lastName || ""
                      }`,
                      position: user.publicMetadata.position || "",
                      role: user.publicMetadata.role || "member",
                    })
                    .eq("id", existingSupabaseUser.id) // Use transformed ID
                    .select(
                      `
                    id,
                    clerk_id,
                    department_id,
                    department_head,
                    departments (
                      name
                    )
                  `
                    )
                    .single();

                if (updateError) {
                  console.error(
                    "Error updating existing user with Clerk ID:",
                    updateError
                  );
                } else {
                  // Map the raw update result to SupabaseUser
                  supabaseUser = {
                    id: rawUpdatedUser.id,
                    clerk_id: rawUpdatedUser.clerk_id,
                    department_id: rawUpdatedUser.department_id,
                    department_head: rawUpdatedUser.department_head,
                    departments:
                      rawUpdatedUser.departments &&
                      rawUpdatedUser.departments.length > 0
                        ? rawUpdatedUser.departments[0]
                        : null,
                  };
                  console.log(
                    `Successfully updated existing user with Clerk ID for email: ${
                      user.emailAddresses[0]?.emailAddress || ""
                    }`
                  );
                }
              }
            } else {
              console.error("Error creating new Supabase user:", insertError);
              // If creation fails, we proceed without the Supabase user data for this entry.
            }
          } else {
            // Map the raw new user result to SupabaseUser
            supabaseUser = {
              id: rawNewSupabaseUser.id,
              clerk_id: rawNewSupabaseUser.clerk_id,
              department_id: rawNewSupabaseUser.department_id,
              department_head: rawNewSupabaseUser.department_head,
              departments:
                rawNewSupabaseUser.departments &&
                rawNewSupabaseUser.departments.length > 0
                  ? rawNewSupabaseUser.departments[0]
                  : null,
            };
          }
        }

        // console.log(
        //   "Processing user:",
        //   user.id,
        //   "Supabase data (transformed, before final return):",
        //   supabaseUser
        // );
        return {
          id: user.id,
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          username: user.username || "",
          email: user.emailAddresses[0]?.emailAddress || "",
          role: user.publicMetadata.role || "member",
          position: user.publicMetadata.position || "",
          department_id: supabaseUser?.department_id || null,
          department: supabaseUser?.departments?.name || null, // Access name from the Department object
          department_head: supabaseUser?.department_head || null,
        };
      })
    );

    // console.log(
    //   "Final simplified users data:",
    //   JSON.stringify(simplifiedUsers, null, 2)
    // );

    return NextResponse.json(simplifiedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const me = await currentUser();
    if (!me || me.publicMetadata.role !== "sysadmin") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const {
      email,
      password,
      firstName,
      lastName,
      role,
      position,
      department_id,
      department_head,
    } = parsed.data;

    const clerk = await clerkClient();

    let newClerkUser;
    try {
      newClerkUser = await clerk.users.createUser({
        emailAddress: [email],
        password,
        firstName,
        lastName,
        publicMetadata: {
          role,
          position: position || "",
          department_id: department_id || null,
          department_head: department_head || false,
        },
      });
    } catch (clerkError) {
      const message =
        (clerkError as { errors?: { message?: string; longMessage?: string }[] })
          .errors?.[0]?.longMessage ||
        (clerkError as { errors?: { message?: string }[] }).errors?.[0]?.message ||
        "Failed to create user in Clerk";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const supabase = await createClient(cookies());
    const { error: supabaseError } = await supabase.from("users").insert({
      clerk_id: newClerkUser.id,
      email,
      full_name: `${firstName} ${lastName}`,
      role,
      position: position || null,
      department_id: department_id || null,
      department_head: department_head || false,
    });

    if (supabaseError) {
      // Roll back the Clerk user so we don't end up with an account that
      // never syncs to Supabase.
      console.error("Error creating user in Supabase, rolling back Clerk user:", supabaseError);
      try {
        await clerk.users.deleteUser(newClerkUser.id);
      } catch (rollbackError) {
        console.error("Error rolling back Clerk user:", rollbackError);
      }
      return NextResponse.json(
        { error: "Failed to save user to the database" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: newClerkUser.id });
  } catch (error) {
    console.error("Error creating user:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
