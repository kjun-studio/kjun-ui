import type { ComponentRef } from "react";
import type { TextInput, View } from "react-native";

// Written through ComponentRef so a ref holds the instance under both sets of React Native types:
// the classic ones, where the name TextInput is the instance class, and the strict ones (the default
// from 0.88), where it is the component and `ref.current.focus` would not exist.
/** What a ref to KjunInput or KjunTextarea holds: the text input instance (focus, blur, clear, isFocused). */
export type KjunTextInputHandle = ComponentRef<typeof TextInput>;
/** What a ref to a KJUN component drawn as a View holds: the host view instance (measure, focus). */
export type KjunViewHandle = ComponentRef<typeof View>;
