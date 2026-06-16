"use client";

import React from "react";
import {
  HomeRegular,
  HomeFilled,
  AddSquareRegular,
  AddSquareFilled,
  BoxRegular,
  BoxFilled,
  StoreMicrosoftRegular,
  StoreMicrosoftFilled,
  ChatRegular,
  ChatFilled,
  VideoRegular,
  VideoFilled,
  ColorRegular,
  ColorFilled,
  HandshakeRegular,
  HandshakeFilled,
  WalletRegular,
  WalletFilled,
  ArrowTrendingRegular,
  ArrowTrendingFilled,
  StarRegular,
  StarFilled,
  ShieldCheckmarkRegular,
  ShieldCheckmarkFilled,
  SettingsRegular,
  SettingsFilled,
  SignOutRegular,
  ChevronLeftRegular,
  ChevronRightRegular,
  ChevronDownRegular,
  ChevronUpRegular,
  NavigationRegular,
  EditRegular,
  CheckmarkRegular,
  CopyRegular,
  ShareRegular,
  SearchRegular,
  DismissRegular,
  ClockRegular,
  LockClosedRegular,
  FlashRegular,
  SubtractRegular,
  AddRegular,
  EyeRegular,
  DeleteRegular,
  ArrowLeftRegular,
  ArrowRightRegular,
  CallRegular,
  ImageRegular,
  PlayRegular,
  TagRegular,
  DocumentRegular,
  PersonRegular,
  MailRegular,
  GlobeRegular,
  CheckmarkCircleRegular,
  FlagRegular,
  AlertRegular,
  CameraRegular,
  OptionsRegular,
  ArrowTrendingDownRegular,
  VehicleTruckProfileRegular,
} from "@fluentui/react-icons";

type IconEntry = {
  regular: React.ComponentType<{ style?: React.CSSProperties; className?: string }>;
  filled?: React.ComponentType<{ style?: React.CSSProperties; className?: string }>;
};

const ICON_MAP: Record<string, IconEntry> = {
  home: { regular: HomeRegular, filled: HomeFilled },
  plus: { regular: AddRegular },
  addSquare: { regular: AddSquareRegular, filled: AddSquareFilled },
  package: { regular: BoxRegular, filled: BoxFilled },
  store: { regular: StoreMicrosoftRegular, filled: StoreMicrosoftFilled },
  message: { regular: ChatRegular, filled: ChatFilled },
  video: { regular: VideoRegular, filled: VideoFilled },
  palette: { regular: ColorRegular, filled: ColorFilled },
  bargain: { regular: HandshakeRegular, filled: HandshakeFilled },
  handshake: { regular: HandshakeRegular, filled: HandshakeFilled },
  wallet: { regular: WalletRegular, filled: WalletFilled },
  trendingUp: { regular: ArrowTrendingRegular, filled: ArrowTrendingFilled },
  trendingDown: { regular: ArrowTrendingDownRegular },
  star: { regular: StarRegular, filled: StarFilled },
  shieldCheck: { regular: ShieldCheckmarkRegular, filled: ShieldCheckmarkFilled },
  settings: { regular: SettingsRegular, filled: SettingsFilled },
  logout: { regular: SignOutRegular },
  chevronLeft: { regular: ChevronLeftRegular },
  chevronRight: { regular: ChevronRightRegular },
  chevronDown: { regular: ChevronDownRegular },
  chevronUp: { regular: ChevronUpRegular },
  menu: { regular: NavigationRegular },
  edit: { regular: EditRegular },
  check: { regular: CheckmarkRegular },
  badgeCheck: { regular: CheckmarkCircleRegular },
  copy: { regular: CopyRegular },
  share: { regular: ShareRegular },
  search: { regular: SearchRegular },
  x: { regular: DismissRegular },
  clock: { regular: ClockRegular },
  lock: { regular: LockClosedRegular },
  zap: { regular: FlashRegular },
  minus: { regular: SubtractRegular },
  eye: { regular: EyeRegular },
  trash: { regular: DeleteRegular },
  arrowLeft: { regular: ArrowLeftRegular },
  arrowRight: { regular: ArrowRightRegular },
  phone: { regular: CallRegular },
  image: { regular: ImageRegular },
  camera: { regular: CameraRegular },
  play: { regular: PlayRegular },
  tag: { regular: TagRegular },
  file: { regular: DocumentRegular },
  user: { regular: PersonRegular },
  mail: { regular: MailRegular },
  globe: { regular: GlobeRegular },
  flag: { regular: FlagRegular },
  bell: { regular: AlertRegular },
  sliders: { regular: OptionsRegular },
  truck: { regular: VehicleTruckProfileRegular },
  layout: { regular: NavigationRegular },
  kanban: { regular: OptionsRegular },
};

export interface SellerIconProps {
  name: string;
  size?: number;
  color?: string;
  filled?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export function SellerIcon({
  name,
  size = 20,
  color,
  filled = false,
  style,
  className,
}: SellerIconProps) {
  const entry = ICON_MAP[name];
  if (!entry) {
    return null;
  }

  const Component = filled && entry.filled ? entry.filled : entry.regular;
  const mergedStyle: React.CSSProperties = {
    width: size,
    height: size,
    fontSize: size,
    color: color ?? "currentColor",
    flexShrink: 0,
    ...style,
  };

  return <Component style={mergedStyle} className={className} />;
}
