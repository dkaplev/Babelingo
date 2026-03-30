import { Font } from '@/constants/Typography';
import { Text, TextProps } from './Themed';

export function MonoText(props: TextProps) {
  return <Text {...props} style={[props.style, { fontFamily: Font.body }]} />;
}
