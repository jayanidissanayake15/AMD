// Declare CSS module support for TypeScript compilation
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

// Global TypeScript overrides for Lucide Icons in React Native
declare module 'lucide-react-native' {
  import { ComponentType } from 'react';
  import { SvgProps } from 'react-native-svg';

  export interface LucideProps extends SvgProps {
    size?: number | string;
    color?: string;
    fill?: string;
    style?: any;
  }

  export type LucideIcon = ComponentType<LucideProps>;

  export const Heart: LucideIcon;
  export const Send: LucideIcon;
  export const Trash2: LucideIcon;
  export const LifeBuoy: LucideIcon;
  export const X: LucideIcon;
  export const Plus: LucideIcon;
  export const BookOpen: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const Filter: LucideIcon;
  export const Calendar: LucideIcon;
  export const CheckSquare: LucideIcon;
  export const Square: LucideIcon;
  export const TrendingUp: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const Sparkles: LucideIcon;
  export const User: LucideIcon;
  export const Key: LucideIcon;
  export const ShieldAlert: LucideIcon;
  export const LogOut: LucideIcon;
  export const Database: LucideIcon;
  export const Cpu: LucideIcon;
  export const PhoneCall: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const Lock: LucideIcon;
  export const Delete: LucideIcon;
  export const ArrowLeft: LucideIcon;
  export const Check: LucideIcon;
  export const Star: LucideIcon;
  export const LayoutDashboard: LucideIcon;
  export const BookHeart: LucideIcon;
  export const Settings: LucideIcon;
  export const MessageCircle: LucideIcon;
  export const Mail: LucideIcon;
  export const Eye: LucideIcon;
  export const EyeOff: LucideIcon;
}
