import Link from "next/link";
import { APP_NAME } from "@/constants";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export function Logo({ size = "md", showText = true, className = "" }: LogoProps) {
  const sizes = {
    sm: { icon: 24, text: "text-lg" },
    md: { icon: 32, text: "text-xl" },
    lg: { icon: 40, text: "text-2xl" },
  };

  const { icon, text } = sizes[size];

  return (
    <Link href="/" className={`flex items-center gap-2.5 group ${className}`}>
      <div className="relative">
        <svg
          width={icon}
          height={icon}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-300 group-hover:scale-110"
        >
          {/* Road / base shape */}
          <rect
            x="2"
            y="26"
            width="36"
            height="4"
            rx="2"
            className="fill-primary/20"
          />
          {/* Car body */}
          <path
            d="M8 26c0-2 1-3 2-4l4-6c1-1.5 2.5-2 4-2h4c1.5 0 3 .5 4 2l4 6c1 1 2 2 2 4v2c0 1-1 2-2 2H10c-1 0-2-1-2-2v-2z"
            className="fill-primary"
          />
          {/* Windshield */}
          <path
            d="M14 16l-3 6h18l-3-6c-.7-1-1.8-1.5-3-1.5h-6c-1.2 0-2.3.5-3 1.5z"
            className="fill-primary-foreground/20"
          />
          {/* Front wheel */}
          <circle cx="13" cy="28" r="3.5" className="fill-foreground/80" />
          <circle cx="13" cy="28" r="1.5" className="fill-background" />
          {/* Rear wheel */}
          <circle cx="27" cy="28" r="3.5" className="fill-foreground/80" />
          <circle cx="27" cy="28" r="1.5" className="fill-background" />
          {/* Headlight */}
          <rect
            x="30"
            y="23"
            width="3"
            height="2"
            rx="1"
            className="fill-[hsl(var(--gold))]"
          />
          {/* Speed lines */}
          <line x1="1" y1="20" x2="5" y2="20" stroke="hsl(var(--gold))" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
          <line x1="0" y1="23" x2="4" y2="23" stroke="hsl(var(--gold))" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        </svg>
      </div>
      {showText && (
        <span className={`${text} font-display font-bold tracking-tight`}>
          {APP_NAME}
        </span>
      )}
    </Link>
  );
}
