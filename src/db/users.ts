import { eq } from 'drizzle-orm';
import { db } from './index.ts';
import { roles, units, users } from './schema.ts';

export async function getOrCreateUser(uid: string, email: string, displayName?: string) {
  try {
    const existing = await db.select().from(users).where(eq(users.uid, uid)).limit(1);

    if (existing.length > 0) {
      const updated = await db
        .update(users)
        .set({
          email,
          displayName: displayName || existing[0].displayName,
          lastLoginAt: new Date(),
        })
        .where(eq(users.uid, uid))
        .returning();
      return updated[0];
    }

    // Check count of users to assign SUPER_ADMIN to the first user or guznajih@gmail.com
    const allUsers = await db.select().from(users);
    const superAdminRole = await db.select().from(roles).where(eq(roles.name, 'SUPER_ADMIN')).limit(1);
    const bendaharaRole = await db.select().from(roles).where(eq(roles.name, 'BENDAHARA')).limit(1);

    let assignedRoleId = superAdminRole[0]?.id;
    if (allUsers.length > 0 && email !== 'guznajih@gmail.com') {
      assignedRoleId = bendaharaRole[0]?.id || superAdminRole[0]?.id;
    }

    const inserted = await db
      .insert(users)
      .values({
        uid,
        email,
        displayName: displayName || email.split('@')[0],
        roleId: assignedRoleId,
        isActive: true,
        lastLoginAt: new Date(),
      })
      .returning();

    return inserted[0];
  } catch (error) {
    console.error('Database query failed in getOrCreateUser:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function getUserByUid(uid: string) {
  try {
    const res = await db
      .select({
        id: users.id,
        uid: users.uid,
        email: users.email,
        displayName: users.displayName,
        roleId: users.roleId,
        unitId: users.unitId,
        isActive: users.isActive,
        roleName: roles.name,
        roleDesc: roles.description,
        unitName: units.name,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .leftJoin(units, eq(users.unitId, units.id))
      .where(eq(users.uid, uid))
      .limit(1);

    return res[0] || null;
  } catch (error) {
    console.error('Database query failed in getUserByUid:', error);
    throw new Error('Database query failed.', { cause: error });
  }
}

export async function getUserById(id: number) {
  try {
    const res = await db
      .select({
        id: users.id,
        uid: users.uid,
        email: users.email,
        displayName: users.displayName,
        roleId: users.roleId,
        unitId: users.unitId,
        isActive: users.isActive,
        roleName: roles.name,
        roleDesc: roles.description,
        unitName: units.name,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .leftJoin(units, eq(users.unitId, units.id))
      .where(eq(users.id, id))
      .limit(1);

    return res[0] || null;
  } catch (error) {
    console.error('Database query failed in getUserById:', error);
    throw new Error('Database query failed.', { cause: error });
  }
}

export async function getAllUsers() {
  try {
    return await db
      .select({
        id: users.id,
        uid: users.uid,
        email: users.email,
        displayName: users.displayName,
        roleId: users.roleId,
        unitId: users.unitId,
        isActive: users.isActive,
        roleName: roles.name,
        unitName: units.name,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .leftJoin(units, eq(users.unitId, units.id))
      .orderBy(users.id);
  } catch (error) {
    console.error('Database query failed in getAllUsers:', error);
    throw new Error('Database query failed.', { cause: error });
  }
}

export async function updateUserRoleAndUnit(id: number, roleId: number, unitId: number | null, isActive?: boolean) {
  try {
    const updateData: any = { roleId, unitId };
    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }
    const updated = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return updated[0];
  } catch (error) {
    console.error('Database query failed in updateUserRoleAndUnit:', error);
    throw new Error('Database query failed.', { cause: error });
  }
}
