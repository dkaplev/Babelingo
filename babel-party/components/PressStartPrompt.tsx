import { ArcadeMenuPrompt } from '@/components/ArcadeMenuPrompt';

type Props = {
  onPress: () => void;
};

export function PressStartPrompt(props: Props) {
  return (
    <ArcadeMenuPrompt
      {...props}
      headline="▶ PRESS START"
      tagline="ANY CREW SIZE · ONE PHONE"
      accessibilityLabel="Start game"
    />
  );
}
