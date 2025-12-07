import { clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";
const twMerge = extendTailwindMerge({
  prefix: "",
});
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
