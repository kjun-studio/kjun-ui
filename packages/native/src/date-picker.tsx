import { FieldPressable, fieldTarget, useFieldSurface } from "./field-surface";
import { typeStyle, inputTypeStyle } from "./typography";
import { tokens,type InputSize } from "@kjun-ui/tokens";
import { useRef,useState } from "react";
import { Platform, View } from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { DsButton,DsIcon } from "./button";
import { KText } from "./internal";
import { FloatingPanel } from "./layers";
import { useKjunStyles } from "./provider";
import { useKjunField } from "./input";

function displayMonth(value: string) {
  const date = new Date(value + "T12:00:00");
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export interface DsDatePickerProps {
  value: string;
  min?: string;
  max?: string;
  placeholder?: string;
  size?: InputSize;
  disabled?: boolean;
  ariaLabel?: string;
  error?: boolean;
  onValueChange?: (v: string) => void;
  onChange?: (v: string) => void;
}
export function DsDatePicker({
  value,
  min,
  max,
  placeholder = "날짜 선택",
  size = "md",
  disabled = false,
  ariaLabel,
  error,
  onValueChange,
  onChange,
}: DsDatePickerProps) {
  const { colors } = useKjunStyles(),
    field = useKjunField(),
    [open, setOpen] = useState(false),
    [month, setMonth] = useState(() => displayMonth(value)),
    ref = useRef<View>(null),
    spec = tokens.input[size];
  const surface = useFieldSurface(size, { disabled, invalid: error || !!field?.error, open });
  const year = month.getFullYear(),
    m = month.getMonth(),
    first = new Date(year, m, 1).getDay(),
    count = new Date(year, m + 1, 0).getDate();
  const date = (day: number) =>
    `${year}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return (
    <>
      <View ref={ref} collapsable={false} {...fieldTarget(() => { setMonth(displayMonth(value)); setOpen(true); }, disabled)} style={{ minHeight: tokens.native.minimumTouchTarget, justifyContent: "center" }}>
        <FieldPressable
          {...surface.hover}
          onFocus={() => surface.setFocused(true)}
          onBlur={() => surface.setFocused(false)}
          hitSlop={{ top: surface.hit, bottom: surface.hit, left: 0, right: 0 }}
          nativeID={field?.id}
          accessibilityRole="button"
          accessibilityLabel={ariaLabel || field?.label || placeholder}
          accessibilityValue={{ text: value }}
          accessibilityHint={field?.error || field?.hint}
          accessibilityState={{ disabled, expanded: open && !disabled }}
          {...(Platform.OS === "web" ? {
            "aria-invalid": error || !!field?.error || undefined,
            "aria-describedby": field?.describedBy,
            "aria-required": field?.required || undefined,
          } : {})}
          disabled={disabled}
          onPress={() => {
            setMonth(displayMonth(value));
            setOpen(true);
          }}
          style={{
            ...surface.style,
            paddingHorizontal: spec.padding - tokens.border.controlWidth,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",

          }}
        >
          <KText
            numberOfLines={1}
            style={{
              flex: 1,
              marginRight: spec.affixGap,
              ...inputTypeStyle(size),
              color: disabled ? colors.textDisabled : value ? colors.text : colors.inputPlaceholder,
            }}
          >
            {value ? value.replace(/-/g, ". ") + "." : placeholder}
          </KText>
          <DsIcon
            name="calendar"
            size={spec.iconSize}
            color={surface.icon}
          />
        </FieldPressable>
      </View>
      <FloatingPanel
        open={open && !disabled}
        onOpenChange={setOpen}
        triggerRef={ref}
        // Field popups open on the field's start edge; a bare "bottom" now centers.
        placement="bottom-start"
        matchTriggerWidth
        minimumWidth={tokens.extensions.calendar.minimumWidth}
        ariaLabel="날짜 선택"
      >
        <View style={{ padding: tokens.dimension.value8 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <DsButton
              size="sm"
              variant="ghost"
              prefixIcon="chevron-left"
              ariaLabel="이전 달"
              onPress={() => setMonth(new Date(year, m - 1, 1))}
            />
            <KText>
              {year}년 {m + 1}월
            </KText>
            <DsButton
              size="sm"
              variant="ghost"
              prefixIcon="chevron-right"
              ariaLabel="다음 달"
              onPress={() => setMonth(new Date(year, m + 1, 1))}
            />
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
              <KText
                key={day}
                style={{
                  width: "14.2857%",
                  textAlign: "center",
                  paddingVertical: tokens.dimension.value8,
                  color: colors.textTertiary,
                }}
              >
                {day}
              </KText>
            ))}
            {Array.from({ length: first }, (_, i) => (
              <View key={"empty" + i} style={{ width: "14.2857%" }} />
            ))}
            {Array.from({ length: count }, (_, i) => {
              const v = date(i + 1),
                blocked = !!((min && v < min) || (max && v > max));
              return (
                <Pressable
                  key={v}
                  accessibilityRole="button"
                  accessibilityLabel={v}
                  accessibilityState={{
                    selected: v === value,
                    disabled: blocked,
                  }}
                  disabled={blocked}
                  onPress={() => {
                    onValueChange?.(v);
                    onChange?.(v);
                    setOpen(false);
                  }}
                  style={{
                    width: "14.2857%",
                    minHeight: tokens.native.minimumTouchTarget,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: tokens.radius.radius6,
                    backgroundColor: v === value ? colors.brand : undefined,
                    opacity: blocked ? tokens.states.opacity.disabledStrong : 1,
                  }}
                >
                  <KText
                    style={{
                      color: v === value ? colors.onBrand : colors.text,
                    }}
                  >
                    {i + 1}
                  </KText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </FloatingPanel>
    </>
  );
}
