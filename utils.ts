import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind CSS class names safely, resolving conflicts intelligently.
 * Uses clsx for conditional logic + tailwind-merge to deduplicate conflicting utilities.
 *
 * @example
 * cn('px-4 py-2', isActive && 'bg-blue-500', 'text-white')
 * cn({ 'opacity-50': isDisabled }, 'rounded-lg')
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
