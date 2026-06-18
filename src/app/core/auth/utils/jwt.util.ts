export type JwtPayload = Record<string, unknown>;

export function decodeJwtPayload(token: string | null): JwtPayload | null {
  if (!token) {
    return null;
  }

  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) {
      return null;
    }

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(''),
    );

    const parsed: unknown = JSON.parse(json);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function readStringClaim(payload: JwtPayload, key: string): string | null {
  const value = payload[key];
  return typeof value === 'string' ? value : null;
}

export function extractRoleFromPayload(payload: JwtPayload): string | null {
  const directRole = readStringClaim(payload, 'role') ?? readStringClaim(payload, 'Role');
  if (directRole) {
    return directRole;
  }

  const schemaRoleClaim = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
  if (typeof schemaRoleClaim === 'string') {
    return schemaRoleClaim;
  }

  if (Array.isArray(schemaRoleClaim)) {
    const firstRole = schemaRoleClaim.find((value): value is string => typeof value === 'string');
    return firstRole ?? null;
  }

  return null;
}

function isRecord(value: unknown): value is JwtPayload {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
