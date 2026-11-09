/* Icônes au trait de la maquette BIM NEXT (viewBox 24×24). */
import React from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";

export type BimIconName =
  | "back" | "arrow" | "plus" | "minus" | "bell" | "eye" | "eyeOff"
  | "recharge" | "transfer" | "scan" | "qr" | "drop" | "flame" | "pump" | "taxi"
  | "home" | "user" | "pin" | "phone" | "check" | "lock" | "wifiOff" | "mail"
  | "chevron" | "logout" | "box" | "settings" | "help" | "bike" | "car" | "shield" | "clock"
  | "flash" | "search" | "info" | "message" | "star" | "seat" | "bolt" | "route" | "tag" | "sparkle"
  | "palette" | "doc" | "wallet" | "download" | "heart" | "close" | "trash" | "warning"
  | "camera" | "pencil" | "briefcase" | "arrowUp" | "arrowDown" | "users" | "chart" | "book" | "globe" | "copy" | "share" | "send" | "calendar" | "gift" | "play" | "link";

type P = { name: BimIconName; size?: number; color?: string; strokeWidth?: number; filled?: boolean };

export function BimIcon({ name, size = 22, color = "#FFFFFF", strokeWidth = 1.8, filled }: P) {
  const sp = { stroke: color, strokeWidth, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  const body = (() => {
    switch (name) {
      case "back": return <><Path d="M19 12H5" {...sp} /><Path d="M11 6l-6 6 6 6" {...sp} /></>;
      case "arrow": return <><Path d="M5 12h14" {...sp} /><Path d="M13 6l6 6-6 6" {...sp} /></>;
      case "plus": return <Path d="M12 5v14M5 12h14" {...sp} />;
      case "minus": return <Path d="M5 12h14" {...sp} />;
      case "close": return <Path d="M6 6l12 12M18 6L6 18" {...sp} />;
      case "bell": return <><Path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" {...sp} /><Path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" {...sp} /></>;
      case "eye": return <><Path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" {...sp} /><Circle cx={12} cy={12} r={3} {...sp} /></>;
      case "eyeOff": return <><Path d="M3 3l18 18" {...sp} /><Path d="M10.6 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2" {...sp} /><Path d="M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7c1.8 0 3.4-.5 4.8-1.3" {...sp} /><Path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" {...sp} /></>;
      case "recharge": return <><Circle cx={12} cy={12} r={9} {...sp} /><Path d="M12 8v8M8 12h8" {...sp} /></>;
      case "transfer": return <><Path d="M4 8h14l-4-4" {...sp} /><Path d="M20 16H6l4 4" {...sp} /></>;
      case "scan": return <><Path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" {...sp} /><Path d="M4 12h16" {...sp} /></>;
      case "qr": return <><Rect x={3} y={3} width={7} height={7} rx={1} {...sp} /><Rect x={14} y={3} width={7} height={7} rx={1} {...sp} /><Rect x={3} y={14} width={7} height={7} rx={1} {...sp} /><Path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3" {...sp} /></>;
      case "drop": return <Path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" {...sp} />;
      case "flame": return <Path d="M12 22c4 0 7-2.7 7-7 0-3.5-2.5-6-4-8-.5 2-1.5 3-3 3 0-3-1-5-3-7 0 4-4 6.5-4 11 0 4.3 3 8 7 8z" {...sp} />;
      case "pump": return <><Path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16" {...sp} /><Path d="M3 21h12" {...sp} /><Path d="M14 9h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V8l-3-3" {...sp} /></>;
      case "taxi": return <><Path d="M5 17h14v-5l-2-5H7l-2 5z" {...sp} /><Path d="M5 12h14" {...sp} /><Circle cx={8} cy={17} r={2} {...sp} /><Circle cx={16} cy={17} r={2} {...sp} /><Path d="M10 4h4" {...sp} /></>;
      case "home": return filled
        ? <Path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" fill={color} />
        : <Path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" {...sp} />;
      case "user": return <><Circle cx={12} cy={8} r={4} {...sp} fill={filled ? color : "none"} /><Path d="M4 21c0-4 4-6 8-6s8 2 8 6" {...sp} /></>;
      case "pin": return <><Path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z" {...sp} /><Circle cx={12} cy={9} r={2.5} {...sp} /></>;
      case "phone": return <Path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" {...sp} />;
      case "check": return <Path d="M5 12.5l4.5 4.5L19 7.5" {...sp} />;
      case "lock": return <><Rect x={5} y={11} width={14} height={10} rx={2} {...sp} /><Path d="M8 11V7a4 4 0 0 1 8 0v4" {...sp} /></>;
      case "wifiOff": return <><Path d="M2 2l20 20" {...sp} /><Path d="M8.5 16.5a5 5 0 0 1 7 0" {...sp} /><Path d="M5 12.9a10 10 0 0 1 5.2-2.8" {...sp} /><Path d="M12 20h.01" {...sp} /></>;
      case "mail": return <><Rect x={3} y={5} width={18} height={14} rx={2} {...sp} /><Path d="M3 7l9 6 9-6" {...sp} /></>;
      case "chevron": return <Path d="M9 6l6 6-6 6" {...sp} />;
      case "logout": return <><Path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" {...sp} /><Path d="M10 17l-5-5 5-5" {...sp} /><Path d="M5 12h11" {...sp} /></>;
      case "box": return <Path d="M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8" {...sp} />;
      case "settings": return <><Circle cx={12} cy={12} r={3} {...sp} /><Path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1" {...sp} /></>;
      case "help": return <><Circle cx={12} cy={12} r={9} {...sp} /><Path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01" {...sp} /></>;
      case "bike": return <><Circle cx={6} cy={17} r={3} {...sp} /><Circle cx={18} cy={17} r={3} {...sp} /><Path d="M6 17l4-8h5l3 8M10 9l2 8" {...sp} /></>;
      case "car": return <><Path d="M5 17h14v-5l-2-5H7l-2 5zM5 12h14M8 17v2M16 17v2" {...sp} /></>;
      case "shield": return <><Path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" {...sp} /><Path d="M9 12l2 2 4-4" {...sp} /></>;
      case "clock": return <><Circle cx={12} cy={12} r={9} {...sp} /><Path d="M12 7v5l3 2" {...sp} /></>;
      case "flash": return <Path d="M13 2L4 14h7l-1 8 9-12h-7z" {...sp} fill={filled ? color : "none"} />;
      case "search": return <><Circle cx={11} cy={11} r={7} {...sp} /><Path d="M20 20l-4-4" {...sp} /></>;
      case "camera": return <><Path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" {...sp} /><Circle cx={12} cy={13.5} r={3.5} {...sp} /></>;
      case "pencil": return <><Path d="M4 20h4L19 9l-4-4L4 16v4z" {...sp} /><Path d="M13.5 6.5l4 4" {...sp} /></>;
      case "briefcase": return <><Rect x={3} y={7} width={18} height={13} rx={2} {...sp} /><Path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 13h18" {...sp} /></>;
      case "arrowUp": return <Path d="M12 19V5M6 11l6-6 6 6" {...sp} />;
      case "arrowDown": return <Path d="M12 5v14M6 13l6 6 6-6" {...sp} />;
      case "users": return <><Circle cx={9} cy={8} r={3.2} {...sp} /><Path d="M3 19c.6-3 3-4.8 6-4.8s5.4 1.8 6 4.8" {...sp} /><Path d="M16 4.8a3.2 3.2 0 0 1 0 6.3M18 14.6c1.6.6 2.7 2.1 3 4.4" {...sp} /></>;
      case "chart": return <><Path d="M4 20V4M4 20h16" {...sp} /><Path d="M8 16v-4M12 16V8M16 16v-6" {...sp} /></>;
      case "book": return <><Path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5z" {...sp} /><Path d="M19 19v2H6M8 7h7" {...sp} /></>;
      case "globe": return <><Circle cx={12} cy={12} r={9} {...sp} /><Path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" {...sp} /></>;
      case "copy": return <><Rect x={8} y={8} width={12} height={12} rx={2} {...sp} /><Path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" {...sp} /></>;
      case "share": return <><Circle cx={6} cy={12} r={2.5} {...sp} /><Circle cx={18} cy={6} r={2.5} {...sp} /><Circle cx={18} cy={18} r={2.5} {...sp} /><Path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6" {...sp} /></>;
      case "send": return <Path d="M21 3L10 14M21 3l-7 18-4-7-7-4 18-7z" {...sp} />;
      case "calendar": return <><Rect x={3} y={5} width={18} height={16} rx={2} {...sp} /><Path d="M3 10h18M8 3v4M16 3v4" {...sp} /></>;
      case "gift": return <><Rect x={3} y={9} width={18} height={12} rx={1.5} {...sp} /><Path d="M12 9v12M3 13h18M12 9S10 4 7.5 5.5 9 9 12 9zM12 9s2-5 4.5-3.5S15 9 12 9z" {...sp} /></>;
      case "play": return <><Circle cx={12} cy={12} r={9} {...sp} /><Path d="M10 8.5v7l6-3.5-6-3.5z" {...sp} /></>;
      case "link": return <><Path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" {...sp} /><Path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" {...sp} /></>;
      case "warning": return <><Path d="M12 3.5 2.8 19.5a1 1 0 0 0 .9 1.5h16.6a1 1 0 0 0 .9-1.5L12 3.5z" {...sp} /><Path d="M12 10v4.5M12 17.5h.01" {...sp} /></>;
      case "info": return <><Circle cx={12} cy={12} r={9} {...sp} /><Path d="M12 11v5M12 8h.01" {...sp} /></>;
      case "message": return <Path d="M4 5h16v11H8l-4 4z" {...sp} />;
      case "star": return <Path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z" {...sp} fill={filled ? color : "none"} />;
      case "sparkle": return <Path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z" {...sp} />;
      case "seat": return <><Circle cx={9} cy={7} r={3} {...sp} /><Path d="M3 21v-2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v2M16 4a3 3 0 0 1 0 6M21 21v-2a5 5 0 0 0-3-4.6" {...sp} /></>;
      case "bolt": return <Path d="M13 2L4 14h7l-1 8 9-12h-7z" {...sp} />;
      case "route": return <><Circle cx={6} cy={18} r={2} {...sp} /><Circle cx={18} cy={6} r={2} {...sp} /><Path d="M8 18h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7" {...sp} /></>;
      case "tag": return <Path d="M20 12l-8 8-9-9V3h8zM7.5 7.5h.01" {...sp} />;
      case "palette": return <><Path d="M12 3a9 9 0 1 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.4A4.6 4.6 0 0 0 21 9.8C21 6 17 3 12 3z" {...sp} /><Circle cx={7.5} cy={11} r={1} {...sp} /><Circle cx={10} cy={7} r={1} {...sp} /><Circle cx={15} cy={7.5} r={1} {...sp} /></>;
      case "doc": return <><Path d="M6 3h8l5 5v13H6z" {...sp} /><Path d="M14 3v5h5M9 13h6M9 17h6" {...sp} /></>;
      case "wallet": return <><Rect x={3} y={6} width={18} height={14} rx={3} {...sp} /><Path d="M16 13h2M3 10h18M6 6l9-3 2 3" {...sp} /></>;
      case "download": return <Path d="M12 4v11M7 10l5 5 5-5M5 20h14" {...sp} />;
      case "heart": return <Path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" {...sp} />;
      case "trash": return <Path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" {...sp} />;
    }
  })();
  return <Svg width={size} height={size} viewBox="0 0 24 24">{body}</Svg>;
}
