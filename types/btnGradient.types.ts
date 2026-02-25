export interface GradientButtonProps {
  title: string;
  onPress: () => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoad?: boolean;
  disabled?: boolean;
}
