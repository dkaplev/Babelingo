import { ArcadeMenuPrompt } from '@/components/ArcadeMenuPrompt';

type Props = {
  onPress: () => void;
};

export function PressStartPrompt(props: Props) {
  return (
    <ArcadeMenuPrompt
      {...props}
      headline="Tap to play"
      tagline="Any crew size · one phone"
      accessibilityLabel="Start game"
    />
  );
}
