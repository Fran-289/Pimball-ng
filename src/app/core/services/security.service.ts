import { Injectable } from '@angular/core';

/**
 * SecurityService — Servicio centralizado de seguridad para Pinball NG.
 *
 * Proporciona:
 * - Sanitización de strings (anti-XSS)
 * - Validación de rangos numéricos
 * - Generación de IDs criptográficamente seguros
 * - Checksums de integridad para detectar manipulación de localStorage
 * - Validación de estructura de backups antes de restaurar
 * - Validación de data URLs (imágenes)
 */

// Checksum key stored separately — not a crypto secret, but a tamper-detection layer.
const CHECKSUM_SUFFIX = '_checksum';

@Injectable({
  providedIn: 'root'
})
export class SecurityService {

  // ─── STRING SANITIZATION ──────────────────────────────────────────

  /**
   * Sanitiza un string eliminando HTML tags y limitando su longitud.
   * Angular ya escapa interpolaciones {{ }}, pero esto protege contra
   * datos inyectados vía backup/localStorage directo.
   */
  sanitizeString(value: unknown, maxLength: number = 500): string {
    if (value === null || value === undefined) return '';
    let str = String(value);
    // Strip HTML tags
    str = str.replace(/<[^>]*>/g, '');
    // Remove potentially dangerous patterns
    str = str.replace(/javascript:/gi, '');
    str = str.replace(/on\w+\s*=/gi, '');
    str = str.replace(/data:text\/html/gi, '');
    // Trim to max length
    if (str.length > maxLength) {
      str = str.substring(0, maxLength);
    }
    return str.trim();
  }

  // ─── NUMBER VALIDATION ────────────────────────────────────────────

  /**
   * Valida y clampea un número dentro de un rango válido.
   */
  sanitizeNumber(value: unknown, min: number = 0, max: number = 999999999): number {
    const num = Number(value);
    if (isNaN(num) || !isFinite(num)) return min;
    return Math.max(min, Math.min(max, num));
  }

  // ─── SECURE ID GENERATION ────────────────────────────────────────

  /**
   * Genera un ID único usando crypto.randomUUID() (criptográficamente seguro).
   * Fallback a crypto.getRandomValues() si randomUUID no está disponible.
   */
  generateSecureId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    // Fallback: generate a UUID v4 pattern with crypto.getRandomValues
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 1
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  // ─── DATA URL VALIDATION ──────────────────────────────────────────

  /**
   * Valida que una data URL sea realmente una imagen.
   * Previene inyección de data:text/html u otros tipos peligrosos.
   */
  sanitizeDataUrl(url: unknown): string {
    if (!url || typeof url !== 'string') return '';

    // Allow regular URLs for default assets
    if (url === 'mascot.png' || url === 'logo.png' || url === 'developer.jpg') {
      return url;
    }

    // If it's a data URL, validate it's an image type
    if (url.startsWith('data:')) {
      const validImagePrefixes = [
        'data:image/jpeg',
        'data:image/jpg',
        'data:image/png',
        'data:image/gif',
        'data:image/webp',
        'data:image/svg+xml',
        'data:image/bmp'
      ];
      const isValidImage = validImagePrefixes.some(prefix =>
        url.toLowerCase().startsWith(prefix)
      );
      if (!isValidImage) {
        console.warn('[SecurityService] Data URL bloqueada — tipo MIME no es imagen:', url.substring(0, 50));
        return '';
      }
      return url;
    }

    // If it's a relative path (e.g., assets), allow it
    if (!url.includes(':') || url.startsWith('http://localhost') || url.startsWith('https://')) {
      return url;
    }

    // Block everything else
    console.warn('[SecurityService] URL bloqueada:', url.substring(0, 50));
    return '';
  }

  // ─── CHECKSUM / INTEGRITY ─────────────────────────────────────────

  /**
   * Genera un checksum simple para detectar manipulación de datos en localStorage.
   * Usa un hash basado en el contenido + una salt fija.
   * NO es criptografía fuerte, pero detecta ediciones manuales en DevTools.
   */
  async computeChecksum(data: string): Promise<string> {
    const salt = 'PinballNG_Integrity_2024';
    const payload = salt + data + salt;

    if (typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined') {
      const encoder = new TextEncoder();
      const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(payload));
      const hashArray = Array.from(new Uint8Array(buffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Fallback: simple hash for environments without SubtleCrypto
    return this.simpleHash(payload);
  }

  /**
   * Almacena datos en localStorage con un checksum de integridad.
   */
  async setWithChecksum(key: string, data: string): Promise<void> {
    localStorage.setItem(key, data);
    const checksum = await this.computeChecksum(data);
    localStorage.setItem(key + CHECKSUM_SUFFIX, checksum);
  }

  /**
   * Lee datos de localStorage y verifica su integridad.
   * Retorna { data, isValid }.
   */
  async getWithChecksum(key: string): Promise<{ data: string | null; isValid: boolean }> {
    const data = localStorage.getItem(key);
    if (data === null) {
      return { data: null, isValid: true }; // No data yet — considered valid
    }
    const storedChecksum = localStorage.getItem(key + CHECKSUM_SUFFIX);
    if (!storedChecksum) {
      // First time — no checksum yet (legacy data). Valid but should be re-saved.
      return { data, isValid: true };
    }
    const computedChecksum = await this.computeChecksum(data);
    return { data, isValid: computedChecksum === storedChecksum };
  }

  /**
   * Simple fallback hash (DJB2 variant) for environments without SubtleCrypto.
   */
  private simpleHash(str: string): string {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0xFFFFFFFF;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  // ─── BACKUP VALIDATION ────────────────────────────────────────────

  /**
   * Valida la estructura completa de un archivo de backup antes de restaurar.
   * Retorna un objeto con los datos sanitizados o null si es inválido.
   */
  validateBackupData(data: unknown): { valid: boolean; sanitized: Record<string, unknown[]> | null; errors: string[] } {
    const errors: string[] = [];

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return { valid: false, sanitized: null, errors: ['El archivo no contiene un objeto JSON válido.'] };
    }

    const backup = data as Record<string, unknown>;
    const sanitized: Record<string, unknown[]> = {};

    // Validate machines
    if (backup['machines'] !== undefined) {
      if (!Array.isArray(backup['machines'])) {
        errors.push('El campo "machines" no es un array válido.');
      } else {
        sanitized['machines'] = this.validateMachinesArray(backup['machines'] as unknown[], errors);
      }
    }

    // Validate locations
    if (backup['locations'] !== undefined) {
      if (!Array.isArray(backup['locations'])) {
        errors.push('El campo "locations" no es un array válido.');
      } else {
        sanitized['locations'] = this.validateLocationsArray(backup['locations'] as unknown[], errors);
      }
    }

    // Validate cuts
    if (backup['cuts'] !== undefined) {
      if (!Array.isArray(backup['cuts'])) {
        errors.push('El campo "cuts" no es un array válido.');
      } else {
        sanitized['cuts'] = this.validateCutsArray(backup['cuts'] as unknown[], errors);
      }
    }

    // Validate tickets
    if (backup['tickets'] !== undefined) {
      if (!Array.isArray(backup['tickets'])) {
        errors.push('El campo "tickets" no es un array válido.');
      } else {
        sanitized['tickets'] = this.validateTicketsArray(backup['tickets'] as unknown[], errors);
      }
    }

    // Validate user
    if (backup['user'] !== undefined) {
      if (!Array.isArray(backup['user'])) {
        errors.push('El campo "user" no es un array válido.');
      } else {
        sanitized['user'] = this.validateUserArray(backup['user'] as unknown[], errors);
      }
    }

    // AUDIT LOGS: Never overwrite from backup — security measure
    // Audit logs from backup are MERGED, not replaced (handled in backups.ts)
    if (backup['audit'] !== undefined) {
      if (!Array.isArray(backup['audit'])) {
        errors.push('El campo "audit" no es un array válido.');
      } else {
        sanitized['audit'] = this.validateAuditArray(backup['audit'] as unknown[], errors);
      }
    }

    const hasData = Object.keys(sanitized).length > 0;
    return {
      valid: hasData && errors.length === 0,
      sanitized: hasData ? sanitized : null,
      errors
    };
  }

  // ─── ARRAY VALIDATORS (per module) ────────────────────────────────

  private validateMachinesArray(arr: unknown[], errors: string[]): Record<string, unknown>[] {
    return arr.filter((item, i) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        errors.push(`machines[${i}]: No es un objeto válido.`);
        return false;
      }
      const m = item as Record<string, unknown>;
      if (!m['id'] || typeof m['id'] !== 'string') {
        errors.push(`machines[${i}]: Falta "id" válido.`);
        return false;
      }
      return true;
    }).map(item => {
      const m = item as Record<string, unknown>;
      return {
        ...m,
        id: this.sanitizeString(m['id'], 20),
        name: this.sanitizeString(m['name'], 100),
        type: this.sanitizeString(m['type'], 50),
        locationId: this.sanitizeString(m['locationId'], 50),
        status: this.validateEnum(String(m['status'] || ''), ['active', 'inactive', 'repair'], 'active'),
        notes: this.sanitizeString(m['notes'], 500),
        photo: this.sanitizeDataUrl(m['photo']),
        estimatedCost: this.sanitizeNumber(m['estimatedCost'], 0, 999999)
      };
    });
  }

  private validateLocationsArray(arr: unknown[], errors: string[]): Record<string, unknown>[] {
    return arr.filter((item, i) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        errors.push(`locations[${i}]: No es un objeto válido.`);
        return false;
      }
      const l = item as Record<string, unknown>;
      if (!l['id'] || !l['name']) {
        errors.push(`locations[${i}]: Falta "id" o "name".`);
        return false;
      }
      return true;
    }).map(item => {
      const l = item as Record<string, unknown>;
      return {
        id: this.sanitizeString(l['id'], 50),
        name: this.sanitizeString(l['name'], 100)
      };
    });
  }

  private validateCutsArray(arr: unknown[], errors: string[]): Record<string, unknown>[] {
    return arr.filter((item, i) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        errors.push(`cuts[${i}]: No es un objeto válido.`);
        return false;
      }
      const c = item as Record<string, unknown>;
      if (!c['id']) {
        errors.push(`cuts[${i}]: Falta "id".`);
        return false;
      }
      return true;
    }).map(item => {
      const c = item as Record<string, unknown>;
      return {
        ...c,
        id: this.sanitizeString(c['id'], 50),
        displayId: this.sanitizeString(c['displayId'], 20),
        locationId: this.sanitizeString(c['locationId'], 50),
        grossIncome: this.sanitizeNumber(c['grossIncome'], 0, 999999999),
        expenses: this.sanitizeNumber(c['expenses'], 0, 999999999),
        netIncome: this.sanitizeNumber(c['netIncome'], 0, 999999999),
        ownerPercentage: this.sanitizeNumber(c['ownerPercentage'], 0, 100),
        ownerProfit: this.sanitizeNumber(c['ownerProfit'], 0, 999999999),
        locationProfit: this.sanitizeNumber(c['locationProfit'], 0, 999999999),
        cancelReason: c['cancelReason'] ? this.sanitizeString(c['cancelReason'], 500) : undefined
      };
    });
  }

  private validateTicketsArray(arr: unknown[], errors: string[]): Record<string, unknown>[] {
    return arr.filter((item, i) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        errors.push(`tickets[${i}]: No es un objeto válido.`);
        return false;
      }
      const t = item as Record<string, unknown>;
      if (!t['id']) {
        errors.push(`tickets[${i}]: Falta "id".`);
        return false;
      }
      return true;
    }).map(item => {
      const t = item as Record<string, unknown>;
      return {
        ...t,
        id: this.sanitizeString(t['id'], 50),
        machineId: this.sanitizeString(t['machineId'], 20),
        title: this.sanitizeString(t['title'], 200),
        description: this.sanitizeString(t['description'], 1000),
        status: this.validateEnum(String(t['status'] || ''), ['open', 'in_progress', 'closed'], 'open'),
        priority: this.validateEnum(String(t['priority'] || ''), ['baja', 'media', 'alta', 'urgente'], 'media'),
        notes: Array.isArray(t['notes']) ? (t['notes'] as unknown[]).map(n => {
          if (n && typeof n === 'object' && !Array.isArray(n)) {
            const note = n as Record<string, unknown>;
            return { text: this.sanitizeString(note['text'], 500), date: note['date'] };
          }
          return null;
        }).filter(n => n !== null) : []
      };
    });
  }

  private validateUserArray(arr: unknown[], errors: string[]): Record<string, unknown>[] {
    return arr.filter((item, i) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        errors.push(`user[${i}]: No es un objeto válido.`);
        return false;
      }
      return true;
    }).map(item => {
      const u = item as Record<string, unknown>;
      return {
        name: this.sanitizeString(u['name'], 100),
        email: this.sanitizeString(u['email'], 200),
        photo: this.sanitizeDataUrl(u['photo'])
      };
    });
  }

  private validateAuditArray(arr: unknown[], errors: string[]): Record<string, unknown>[] {
    return arr.filter((item, i) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        errors.push(`audit[${i}]: No es un objeto válido.`);
        return false;
      }
      return true;
    }).map(item => {
      const a = item as Record<string, unknown>;
      return {
        id: this.sanitizeString(a['id'], 50),
        date: a['date'],
        action: this.sanitizeString(a['action'], 50),
        module: this.sanitizeString(a['module'], 50),
        details: this.sanitizeString(a['details'], 500),
        changes: Array.isArray(a['changes']) ? a['changes'] : undefined
      };
    });
  }

  // ─── UTILITY ──────────────────────────────────────────────────────

  private validateEnum(value: string, allowed: string[], defaultValue: string): string {
    return allowed.includes(value) ? value : defaultValue;
  }
}
