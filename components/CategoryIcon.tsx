import React from "react";

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const s = (p: IconProps) => ({
  width: p.size ?? 20,
  height: p.size ?? 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: p.color ?? "currentColor",
  strokeWidth: p.strokeWidth ?? 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export function FoodIcon(p: IconProps) {
  return (
    <svg {...s(p)}>
      <path d="M3 2v6a3 3 0 006 0V2" /><line x1="6" y1="8" x2="6" y2="22" />
      <path d="M20.88 18.09A5 5 0 0018 9h-2.91A14.94 14.94 0 0016 16a5 5 0 004.88 2.09z" />
    </svg>
  );
}

export function GroceriesIcon(p: IconProps) {
  return (
    <svg {...s(p)}>
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
    </svg>
  );
}

export function TransportIcon(p: IconProps) {
  return (
    <svg {...s(p)}>
      <rect x="1" y="3" width="15" height="13" rx="2" />
      <path d="M16 8h4l3 5v3h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

export function TravelIcon(p: IconProps) {
  return (
    <svg {...s(p)}>
      <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
    </svg>
  );
}

export function BillsIcon(p: IconProps) {
  return (
    <svg {...s(p)}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="15" y2="17" />
    </svg>
  );
}

export function ShoppingIcon(p: IconProps) {
  return (
    <svg {...s(p)}>
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  );
}

export function HealthIcon(p: IconProps) {
  return (
    <svg {...s(p)}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

export function EntertainmentIcon(p: IconProps) {
  return (
    <svg {...s(p)}>
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
      <line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="2" y1="7" x2="7" y2="7" /><line x1="2" y1="17" x2="7" y2="17" />
      <line x1="17" y1="17" x2="22" y2="17" /><line x1="17" y1="7" x2="22" y2="7" />
    </svg>
  );
}

export function CigaretteIcon(p: IconProps) {
  return (
    <svg {...s(p)}>
      <line x1="2" y1="15" x2="16" y2="15" /><line x1="2" y1="19" x2="16" y2="19" />
      <line x1="20" y1="15" x2="22" y2="15" /><line x1="20" y1="19" x2="22" y2="19" />
      <path d="M16.5 15a3 3 0 000-6M17 3l-1 6" />
    </svg>
  );
}

export function LifestyleIcon(p: IconProps) {
  return (
    <svg {...s(p)}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export function WorkIcon(p: IconProps) {
  return (
    <svg {...s(p)}>
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
      <line x1="12" y1="12" x2="12" y2="16" /><line x1="10" y1="14" x2="14" y2="14" />
    </svg>
  );
}

export function ProjectIcon(p: IconProps) {
  return (
    <svg {...s(p)}>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

export function FriendsIcon(p: IconProps) {
  return (
    <svg {...s(p)}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

export function BusinessIcon(p: IconProps) {
  return (
    <svg {...s(p)}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

export function GiftIcon(p: IconProps) {
  return (
    <svg {...s(p)}>
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
    </svg>
  );
}

export function OtherIcon(p: IconProps) {
  return (
    <svg {...s(p)}>
      <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
    </svg>
  );
}

const ICON_MAP: Record<string, (p: IconProps) => React.ReactElement> = {
  Food: FoodIcon,
  Groceries: GroceriesIcon,
  Transport: TransportIcon,
  Travel: TravelIcon,
  Bills: BillsIcon,
  Shopping: ShoppingIcon,
  Health: HealthIcon,
  Entertainment: EntertainmentIcon,
  Cigarettes: CigaretteIcon,
  Lifestyle: LifestyleIcon,
  Work: WorkIcon,
  Project: ProjectIcon,
  Friends: FriendsIcon,
  Business: BusinessIcon,
  Gift: GiftIcon,
  Other: OtherIcon,
};

interface CategoryIconProps extends IconProps {
  category: string;
}

export default function CategoryIcon({ category, ...rest }: CategoryIconProps) {
  const Icon = ICON_MAP[category] ?? OtherIcon;
  return <Icon {...rest} />;
}
