"use client";

import { useState } from "react";
import { Play, Sprout } from "lucide-react";
import { cld } from "@/lib/cloudinary";
import { isVideo } from "../format";
import type { MediaItem } from "../types";

export default function Gallery({ media, alt }: { media: MediaItem[]; alt: string }) {
  const [i, setI] = useState(0);

  if (!media.length) {
    return (
      <div className="grid aspect-[4/3] place-items-center rounded-3xl bg-grove-soft text-grove/40">
        <Sprout className="size-14" aria-hidden="true" />
      </div>
    );
  }

  const cur = media[Math.min(i, media.length - 1)];

  return (
    <div>
      <div className="aspect-[4/3] overflow-hidden rounded-3xl border border-line bg-grove-soft">
        {isVideo(cur) ? (
          <video key={cur.id} src={cur.url} controls className="size-full bg-black object-contain" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- Cloudinary already serves resized, auto-format images
          <img src={cld(cur.url, 1000)} alt={alt} className="size-full object-cover" />
        )}
      </div>

      {media.length > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {media.map((m, idx) => (
            <li key={m.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setI(idx)}
                aria-label={`${idx + 1} / ${media.length}`}
                aria-current={idx === i}
                className={`block h-16 w-20 overflow-hidden rounded-xl border-2 transition-colors ${
                  idx === i ? "border-grove" : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                {isVideo(m) ? (
                  <span className="grid size-full place-items-center bg-ink text-paper">
                    <Play className="size-4" aria-hidden="true" />
                  </span>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cld(m.url, 160)} alt="" className="size-full object-cover" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
