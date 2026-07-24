import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  buildMechanicTemporaryPassword,
  normalizePortalLoginEmail,
  pickAvailableMechanicLoginEmail,
} from "@/features/staff/mechanic-login";

export type MechanicPortalLoginCredentials = {
  email: string;
  temporaryPassword: string;
  userId: string;
};

type ProvisionResult =
  | { success: true; credentials: MechanicPortalLoginCredentials }
  | { success: false; message: string };

type LinkResult = { success: true; email: string } | { success: false; message: string };

async function listTakenAuthEmails() {
  const admin = getSupabaseAdminClient();
  const takenEmails = new Set<string>();
  let page = 1;

  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      throw new Error(error.message);
    }

    for (const user of data.users) {
      if (user.email) {
        takenEmails.add(normalizePortalLoginEmail(user.email));
      }
    }

    if (data.users.length < 200) {
      break;
    }

    page += 1;
  }

  return takenEmails;
}

async function findAuthUserByEmail(email: string) {
  const normalizedEmail = normalizePortalLoginEmail(email);
  const admin = getSupabaseAdminClient();
  let page = 1;

  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      throw new Error(error.message);
    }

    const match = data.users.find(
      (user) => user.email && normalizePortalLoginEmail(user.email) === normalizedEmail,
    );

    if (match) {
      return match;
    }

    if (data.users.length < 200) {
      break;
    }

    page += 1;
  }

  return null;
}

export async function provisionMechanicPortalLogin(input: {
  firstName: string;
  lastName: string;
}): Promise<ProvisionResult> {
  const temporaryPassword = buildMechanicTemporaryPassword(input.lastName);

  if (!temporaryPassword) {
    return {
      success: false,
      message: "Unable to generate a portal login from the staff last name.",
    };
  }

  let takenEmails: Set<string>;

  try {
    takenEmails = await listTakenAuthEmails();
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to verify existing portal login accounts.",
    };
  }

  const email = pickAvailableMechanicLoginEmail(
    input.firstName,
    input.lastName,
    takenEmails,
  );

  if (!email) {
    return {
      success: false,
      message:
        "All generated portal login usernames are already taken. Link an existing account manually on the staff edit page.",
    };
  }

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
  });

  if (error || !data.user) {
    return {
      success: false,
      message: error?.message ?? "Unable to create the mechanic portal login account.",
    };
  }

  return {
    success: true,
    credentials: {
      email,
      temporaryPassword,
      userId: data.user.id,
    },
  };
}

export async function linkExistingMechanicPortalLogin(input: {
  email: string;
  staffId: string;
}): Promise<LinkResult> {
  const normalizedEmail = normalizePortalLoginEmail(input.email);

  if (!normalizedEmail) {
    return {
      success: false,
      message: "Portal login username is required.",
    };
  }

  let authUser;

  try {
    authUser = await findAuthUserByEmail(normalizedEmail);
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unable to look up the portal login account.",
    };
  }

  if (!authUser) {
    return {
      success: false,
      message: "No portal login account was found for that username.",
    };
  }

  const admin = getSupabaseAdminClient();
  const { data: linkedStaff, error: linkedStaffError } = await admin
    .from("staff")
    .select("id, first_name, last_name")
    .eq("linked_user_id", authUser.id)
    .maybeSingle();

  if (linkedStaffError) {
    return {
      success: false,
      message: linkedStaffError.message,
    };
  }

  if (linkedStaff && linkedStaff.id !== input.staffId) {
    return {
      success: false,
      message: "That portal login is already linked to another staff record.",
    };
  }

  const { error: updateError } = await admin
    .from("staff")
    .update({ linked_user_id: authUser.id })
    .eq("id", input.staffId);

  if (updateError) {
    return {
      success: false,
      message: updateError.message,
    };
  }

  return {
    success: true,
    email: authUser.email ?? normalizedEmail,
  };
}

export async function getPortalLoginEmailForStaff(linkedUserId: string | null) {
  if (!linkedUserId) {
    return null;
  }

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(linkedUserId);

  if (error || !data.user?.email) {
    return null;
  }

  return data.user.email;
}

export async function deleteAuthUser(userId: string) {
  const admin = getSupabaseAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) {
    throw new Error(error.message);
  }
}
