export type Source = "İŞKUR" | "Kariyer Kapısı" | "Resmî Gazete" | "Kamu İlanları";
export type Notice = {
  id: string; title: string; institution: string; source: Source;
  city?: string | null; position?: string | null; quota?: number | null;
  education?: string | null; kpss?: string | null; published_at?: string | null;
  application_start?: string | null; application_end?: string | null;
  url: string; summary?: string | null; tags?: string[] | null;
  is_new?: boolean;
};