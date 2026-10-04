type AssetIconProps = {
  category?: string;
  name?: string;
  size?: number;
};

export default function AssetIcon({
  category = "",
  name = "",
  size = 30,
}: AssetIconProps) {
  const type = `${category} ${name}`.toLowerCase();

  if (type.includes("laptop")) {
    return <LaptopIcon size={size} />;
  }

  if (type.includes("desktop")) {
    return <DesktopIcon size={size} />;
  }

  if (type.includes("monitor")) {
    return <MonitorIcon size={size} />;
  }

  if (
    type.includes("mouse") ||
    type.includes("mice")
  ) {
    return <MouseIcon size={size} />;
  }

  if (type.includes("keyboard")) {
    return <KeyboardIcon size={size} />;
  }

  if (
    type.includes("phone") ||
    type.includes("mobile") ||
    type.includes("iphone") ||
    type.includes("samsung")
  ) {
    return <PhoneIcon size={size} />;
  }

  if (
    type.includes("headphone") ||
    type.includes("headset")
  ) {
    return <HeadphonesIcon size={size} />;
  }

  if (type.includes("tablet") || type.includes("ipad")) {
    return <TabletIcon size={size} />;
  }

  if (
    type.includes("dock") ||
    type.includes("docking")
  ) {
    return <DockIcon size={size} />;
  }

  if (
    type.includes("charger") ||
    type.includes("adapter")
  ) {
    return <ChargerIcon size={size} />;
  }

  if (type.includes("printer")) {
    return <PrinterIcon size={size} />;
  }

  if (
    type.includes("webcam") ||
    type.includes("camera")
  ) {
    return <WebcamIcon size={size} />;
  }

  return <GenericAssetIcon size={size} />;
}

type IconProps = {
  size: number;
};

const common = {
  fill: "none",
  stroke: "#1473e6",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function LaptopIcon({ size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <rect
        x="4"
        y="4"
        width="16"
        height="12"
        rx="1.5"
        {...common}
      />
      <path d="M2 19H22" {...common} />
      <path d="M8 19L9 17H15L16 19" {...common} />
    </svg>
  );
}

function DesktopIcon({ size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <rect
        x="2.5"
        y="3"
        width="14"
        height="12"
        rx="1.5"
        {...common}
      />
      <path d="M9.5 15V19" {...common} />
      <path d="M6 19H13" {...common} />
      <rect
        x="18"
        y="5"
        width="4"
        height="14"
        rx="1"
        {...common}
      />
    </svg>
  );
}

function MonitorIcon({ size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <rect
        x="3"
        y="3"
        width="18"
        height="13"
        rx="2"
        {...common}
      />
      <path d="M12 16V20" {...common} />
      <path d="M8 20H16" {...common} />
    </svg>
  );
}

function MouseIcon({ size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <rect
        x="6"
        y="2"
        width="12"
        height="20"
        rx="6"
        {...common}
      />
      <path d="M12 2V8" {...common} />
      <path d="M6 9H18" {...common} />
    </svg>
  );
}

function KeyboardIcon({ size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <rect
        x="2"
        y="6"
        width="20"
        height="12"
        rx="2"
        {...common}
      />

      <path
        d="M5 10H6 M9 10H10 M13 10H14 M17 10H18"
        {...common}
      />

      <path d="M6 14H18" {...common} />
    </svg>
  );
}

function PhoneIcon({ size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <rect
        x="7"
        y="2"
        width="10"
        height="20"
        rx="2"
        {...common}
      />
      <path d="M10 5H14" {...common} />
      <circle
        cx="12"
        cy="18.5"
        r="0.8"
        fill="#1473e6"
      />
    </svg>
  );
}

function HeadphonesIcon({ size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path
        d="M4 14V11C4 6.6 7.6 3 12 3C16.4 3 20 6.6 20 11V14"
        {...common}
      />

      <rect
        x="3"
        y="13"
        width="4"
        height="7"
        rx="2"
        {...common}
      />

      <rect
        x="17"
        y="13"
        width="4"
        height="7"
        rx="2"
        {...common}
      />
    </svg>
  );
}

function TabletIcon({ size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <rect
        x="5"
        y="2"
        width="14"
        height="20"
        rx="2"
        {...common}
      />

      <circle
        cx="12"
        cy="18.5"
        r="0.8"
        fill="#1473e6"
      />
    </svg>
  );
}

function DockIcon({ size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <rect
        x="3"
        y="8"
        width="18"
        height="9"
        rx="2"
        {...common}
      />

      <circle
        cx="7"
        cy="12.5"
        r="1"
        {...common}
      />

      <path d="M11 12.5H18" {...common} />
      <path d="M7 17V20" {...common} />
      <path d="M17 17V20" {...common} />
    </svg>
  );
}

function ChargerIcon({ size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M9 2V7" {...common} />
      <path d="M15 2V7" {...common} />

      <rect
        x="6"
        y="7"
        width="12"
        height="8"
        rx="2"
        {...common}
      />

      <path d="M12 15V22" {...common} />
    </svg>
  );
}

function PrinterIcon({ size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M6 9V3H18V9" {...common} />

      <rect
        x="3"
        y="9"
        width="18"
        height="9"
        rx="2"
        {...common}
      />

      <rect
        x="6"
        y="14"
        width="12"
        height="7"
        {...common}
      />
    </svg>
  );
}

function WebcamIcon({ size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <circle
        cx="12"
        cy="10"
        r="6"
        {...common}
      />

      <circle
        cx="12"
        cy="10"
        r="2"
        {...common}
      />

      <path d="M12 16V19" {...common} />
      <path d="M8 21H16" {...common} />
    </svg>
  );
}

function GenericAssetIcon({ size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path
        d="M4 7L12 3L20 7V17L12 21L4 17V7Z"
        {...common}
      />

      <path d="M4 7L12 11L20 7" {...common} />
      <path d="M12 11V21" {...common} />
    </svg>
  );
}