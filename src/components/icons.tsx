import { cn } from "@/lib/utils";
import Image from "next/image";

export const SunoBotLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <div className="flex items-center gap-2">
    <div className="bg-primary p-1.5 rounded-lg">
      <MicIconWhite {...props} className="h-5 w-5" />
    </div>
    <div className="grid">
      <div className="flex items-baseline">
        <span className="font-headline font-bold text-xl text-foreground leading-none">Suno</span>
        <span className="font-headline font-bold text-xl text-primary leading-none">Bot</span>
      </div>
      <div className="font-urdu text-sm text-right -mt-1 text-muted-foreground" dir="rtl">
        <span>سنو</span><span className="text-primary/80">بوٹ</span>
      </div>
    </div>
  </div>
);

export const MicIconWhite = (props: React.SVGProps<SVGSVGElement>) => (
    <Image
      src="https://i.postimg.cc/ZnZZcsJ1/freepik-assistant-1757879489052-copy.png"
      alt="SunoBot Logo"
      width={24}
      height={24}
      className={cn("invert brightness-0", props.className)}
    />
)

export const SoundWave = (props: React.SVGProps<SVGSVGElement>) => (
  <div className="flex items-center justify-center gap-1 h-6" aria-hidden="true" >
    <div className="sound-wave-bar w-1 h-3/5 bg-current rounded-full" />
    <div className="sound-wave-bar w-1 h-full bg-current rounded-full" />
    <div className="sound-wave-bar w-1 h-3/5 bg-current rounded-full" />
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
