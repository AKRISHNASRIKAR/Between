import type { QuizOption } from "@lovenotes/contracts";
import { View } from "react-native";
import { Check, layout, PressableScale, palette, radius, space, Text } from "@/design-system";
import { useThemeSubscription } from "@/design-system/theme/ThemeProvider";
import { OptionRow } from "./OptionRow";

/** One question, two clearly separate picks. Full-width options keep long answers readable. */
export function ChoiceGrid({
  options,
  choice,
  guess,
  partnerName,
  disabled,
  field,
  onFieldChange,
  onPick,
}: {
  options: QuizOption[];
  choice: string | null;
  guess: string | null;
  partnerName: string;
  disabled: boolean;
  field: "choice" | "guess";
  onFieldChange: (field: "choice" | "guess") => void;
  onPick: (field: "choice" | "guess", value: string) => void;
}) {
  useThemeSubscription();
  return (
    <View style={{ gap: space[5] }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[2] }}>
        {(["choice", "guess"] as const).map((key, i) => {
          const selected = key === field;
          const value = key === "choice" ? choice : guess;
          const option = options.find((item) => item.id === value);
          return (
            <PressableScale
              key={key}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel={`${key === "choice" ? "Your answer" : `Your prediction for ${partnerName}`}: ${option?.label ?? "Not chosen"}. Tap to edit.`}
              accessibilityState={{ selected, disabled }}
              onPress={() => onFieldChange(key)}
              style={{
                flex: 1,
                minWidth: space[20] + space[10],
                gap: space[2],
                padding: space[3],
                minHeight: layout.minTouch,
                backgroundColor: selected ? palette["action-soft"] : palette.paper,
                borderWidth: 1,
                borderColor: selected ? palette.action : palette.line,
                borderRadius: radius.md,
                borderCurve: "continuous",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: space[2] }}>
                <Text variant="caption" color="ink-secondary" style={{ flex: 1 }}>
                  {i + 1} · {key === "choice" ? "Your answer" : `Guess for ${partnerName}`}
                </Text>
                {value ? <Check size={16} color={palette.action} weight="bold" /> : null}
              </View>
              <View style={{ flex: 1, gap: space[1] }}>
                <Text variant="body-sm-strong" color={selected ? "on-action-soft" : "ink"}>
                  {option?.label ?? (key === "choice" ? "What feels like you?" : "What would they pick?")}
                </Text>
              </View>
            </PressableScale>
          );
        })}
      </View>
      <View
        style={{ gap: space[3] }}
        accessibilityRole="radiogroup"
        accessibilityLabel={field === "choice" ? "Your answer" : `Your guess for ${partnerName}`}
      >
        <Text variant="body-sm-strong" color="ink-secondary">
          {field === "choice" ? "Choose for yourself" : `Predict ${partnerName}’s pick`}
        </Text>
        {options.map((option) => (
          <OptionRow
            key={`${field}-${option.id}`}
            label={option.label}
            glyph={option.glyph}
            selected={(field === "choice" ? choice : guess) === option.id}
            disabled={disabled}
            onPress={() => onPick(field, option.id)}
          />
        ))}
      </View>
    </View>
  );
}
