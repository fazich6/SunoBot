import { cn } from "@/lib/utils";
import Image from 'next/image';

export const SunoBotLogo = (props: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("flex items-center gap-2", props.className)}>
        <Image src="https://i.freeimage.host/2024/07/31/KXUNkKJ.png" alt="SunoBot Logo" width={140} height={32} />
    </div>
);

export const ThinkingIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 2v4" />
    <path d="m16.2 7.8 2.9-2.9" />
    <path d="M18 12h4" />
    <path d="m16.2 16.2 2.9 2.9" />
    <path d="M12 18v4" />
    <path d="m7.8 16.2-2.9 2.9" />
    <path d="M6 12H2" />
    <path d="m7.8 7.8-2.9-2.9" />
  </svg>
);


export const Volume2 = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);
