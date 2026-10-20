/** Serve a right-sized, auto-format copy instead of the full-size original. Non-Cloudinary URLs pass through. */
export function cld(url: string, width: number): string {
  const marker = "/upload/";
  const i = url.indexOf(marker);
  if (i === -1 || !url.includes("res.cloudinary.com")) return url;
  const rest = url.slice(i + marker.length);
  if (/^(?:[a-z]_[^/]+,?)+\//.test(rest)) return url; // already transformed
  return `${url.slice(0, i + marker.length)}f_auto,q_auto,w_${width}/${rest}`;
}
