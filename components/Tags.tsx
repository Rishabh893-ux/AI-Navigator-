import type { Tag } from "@/lib/content";

export default function Tags({ tags, className }: { tags: Tag[]; className: string }) {
  return (
    <div className={className}>
      {tags.map((t) => (
        <span key={t.label} className={`tag tag-${t.kind}`}>
          {t.label}
        </span>
      ))}
    </div>
  );
}
