import { GraduationCap, Hammer, LucideIcon, Search } from 'lucide-react';
import { ProgramContent } from './supabase';

const PROGRAM_ICONS: Record<ProgramContent['icon_name'], LucideIcon> = {
  search: Search,
  'graduation-cap': GraduationCap,
  hammer: Hammer,
};

export function getProgramIcon(iconName: ProgramContent['icon_name']) {
  return PROGRAM_ICONS[iconName];
}
