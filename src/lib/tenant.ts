import type { Institution } from "@/data/types";

/**
 * Kuruma özel kurulum.
 * Aynı kod, derleme sırasında VITE_TENANT ortam değişkeniyle tek bir kuruma ait,
 * örnek veri içermeyen bir sürüm olarak yayınlanır. Değişken yoksa çok kurumlu demo açılır.
 */
export interface Tenant {
  id: string;
  institution: Institution;
  /** Tarayıcıda saklanan verinin anahtarı: demo verisiyle karışmasın diye ayrı */
  storageKey: string;
}

// Kurum kurulumları özel depolarda tutulur; bu demo deposunda tanım yok
const TENANTS: Record<string, Tenant> = {};

export const TENANT: Tenant | null = TENANTS[import.meta.env.VITE_TENANT ?? ""] ?? null;
