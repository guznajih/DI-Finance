import fs from 'fs';
import path from 'path';
import { db } from '../db/index.ts';
import { auditLogs } from '../db/schema.ts';
import { eq, desc } from 'drizzle-orm';

export type SecurityEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'PASSWORD_CHANGED'
  | 'PERMISSION_CHANGED'
  | 'ROLE_CHANGED'
  | 'SESSION_EXPIRED'
  | 'PERIOD_CLOSED'
  | 'PERIOD_REOPENED'
  | 'BACKUP'
  | 'RESTORE';

export type SecuritySeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface SecurityEventRecord {
  id: string;
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  user: {
    id?: number | null;
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
  ipAddress?: string;
  details: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const EVENTS_FILE = path.join(DATA_DIR, 'security_events.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Strip any sensitive credentials before logging
function sanitizeMetadata(data?: Record<string, any>): Record<string, any> {
  if (!data || typeof data !== 'object') return {};
  const clean: Record<string, any> = {};
  const SENSITIVE_KEYS = ['password', 'secret', 'token', 'apikey', 'api_key', 'privatekey', 'bearer', 'authorization'];

  for (const [key, val] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some((s) => lowerKey.includes(s))) {
      clean[key] = '[REDACTED]';
    } else if (typeof val === 'object' && val !== null) {
      clean[key] = sanitizeMetadata(val);
    } else {
      clean[key] = val;
    }
  }
  return clean;
}

function loadEvents(): SecurityEventRecord[] {
  ensureDataDir();
  if (fs.existsSync(EVENTS_FILE)) {
    try {
      const raw = fs.readFileSync(EVENTS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      console.warn('Failed to parse security_events.json:', e);
    }
  }
  return [];
}

function saveEvents(events: SecurityEventRecord[]) {
  ensureDataDir();
  try {
    // Keep last 1000 events in file
    const trimmed = events.slice(0, 1000);
    fs.writeFileSync(EVENTS_FILE, JSON.stringify(trimmed, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Failed to save security_events.json:', e);
  }
}

export async function recordSecurityEvent(params: {
  eventType: SecurityEventType;
  severity?: SecuritySeverity;
  user?: any;
  ipAddress?: string;
  details: string;
  metadata?: Record<string, any>;
}): Promise<SecurityEventRecord> {
  const now = new Date();
  const id = `SEC-${now.getTime()}-${Math.floor(Math.random() * 1000)}`;
  const cleanMeta = sanitizeMetadata(params.metadata);

  const u = params.user || {};
  const record: SecurityEventRecord = {
    id,
    eventType: params.eventType,
    severity: params.severity || 'INFO',
    user: {
      id: u.id || null,
      name: u.displayName || u.name || (u.email ? u.email.split('@')[0] : 'Sistem'),
      email: u.email || '',
      role: u.roleName || u.role || 'GUEST',
    },
    ipAddress: params.ipAddress || '',
    details: params.details,
    metadata: cleanMeta,
    timestamp: now.toISOString(),
  };

  // 1. Save in local JSON file
  const list = loadEvents();
  list.unshift(record);
  saveEvents(list);

  // 2. Persist in PostgreSQL audit_logs table
  try {
    await db.insert(auditLogs).values({
      userId: record.user.id || null,
      userEmail: record.user.email || null,
      action: record.eventType,
      entityType: 'SECURITY_EVENT',
      entityId: id,
      details: JSON.stringify({
        severity: record.severity,
        summary: record.details,
        userName: record.user.name,
        userRole: record.user.role,
        metadata: cleanMeta,
      }),
      ipAddress: record.ipAddress || '',
    });
  } catch (err) {
    console.warn('Failed to insert security event into database:', err);
  }

  return record;
}

export async function getSecurityEvents(filters?: {
  eventType?: string;
  severity?: string;
  searchQuery?: string;
  limit?: number;
}): Promise<SecurityEventRecord[]> {
  let list = loadEvents();

  // If local list is empty, sync from audit_logs
  if (list.length === 0) {
    try {
      const dbLogs = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.entityType, 'SECURITY_EVENT'))
        .orderBy(desc(auditLogs.id))
        .limit(filters?.limit || 100);

      list = dbLogs.map((log) => {
        let meta: any = null;
        try {
          if (log.details && (log.details.startsWith('{') || log.details.startsWith('['))) {
            meta = JSON.parse(log.details);
          }
        } catch {
          meta = null;
        }

        return {
          id: log.entityId || `SEC-${log.id}`,
          eventType: log.action as SecurityEventType,
          severity: meta?.severity || 'INFO',
          user: {
            id: log.userId,
            name: meta?.userName || log.userEmail?.split('@')[0] || 'Sistem',
            email: log.userEmail || '',
            role: meta?.userRole || 'PENGGUNA',
          },
          ipAddress: log.ipAddress || '',
          details: meta?.summary || log.details || '',
          metadata: meta?.metadata || {},
          timestamp: log.createdAt ? log.createdAt.toISOString() : new Date().toISOString(),
        };
      });
      saveEvents(list);
    } catch (e) {
      console.warn('Failed to sync security events from db:', e);
    }
  }

  if (filters?.eventType) {
    list = list.filter((e) => e.eventType.toUpperCase() === filters.eventType?.toUpperCase());
  }
  if (filters?.severity) {
    list = list.filter((e) => e.severity === filters.severity);
  }
  if (filters?.searchQuery) {
    const q = filters.searchQuery.toLowerCase();
    list = list.filter(
      (e) =>
        e.details?.toLowerCase().includes(q) ||
        e.user?.name?.toLowerCase().includes(q) ||
        e.user?.email?.toLowerCase().includes(q) ||
        e.eventType?.toLowerCase().includes(q)
    );
  }

  return list.slice(0, filters?.limit || 150);
}
