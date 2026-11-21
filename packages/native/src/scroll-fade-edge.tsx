import { tokens } from "@kjun-ui/tokens";
import { useId } from "react";
import { View, type ColorValue } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

/**
 * One fading edge over a scroller, shared by KjunScrollFade and an overflowing KjunTabs: the scroller's background
 * colour runs from solid at the edge to clear, tokens.extensions.scrollFade.width wide.
 */
export function ScrollFadeEdge({ edge, horizontal, color }: { edge: "start" | "end"; horizontal: boolean; color: ColorValue }) {
  const id = "kjun-scroll-fade-" + useId().replace(/:/g, "") + edge, width = tokens.extensions.scrollFade.width;
  return (
    <View style={{ pointerEvents: "none", position: "absolute", ...(horizontal
      ? { top: 0, bottom: 0, width, ...(edge === "start" ? { left: 0 } : { right: 0 }) }
      : { left: 0, right: 0, height: width, ...(edge === "start" ? { top: 0 } : { bottom: 0 }) }) }}>
      <Svg width="100%" height="100%">
        <Defs><LinearGradient id={id} x1="0%" y1="0%" x2={horizontal ? "100%" : "0%"} y2={horizontal ? "0%" : "100%"}>
          <Stop offset="0" stopColor={color} stopOpacity={edge === "start" ? 1 : 0} />
          <Stop offset="1" stopColor={color} stopOpacity={edge === "start" ? 0 : 1} />
        </LinearGradient></Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
