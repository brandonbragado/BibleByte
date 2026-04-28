import { StyleSheet, Text, TextInput, View } from "react-native";
import type {
  KeyboardTypeOptions,
  NativeSyntheticEvent,
  ReturnKeyTypeOptions,
  StyleProp,
  TextInputSubmitEditingEventData,
  ViewStyle
} from "react-native";
import { uiTheme } from "@biblebites/ui";

type InputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  hint?: string;
  errorText?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoComplete?: "email" | "password" | "name" | "off";
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: (event: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => void;
  blurOnSubmit?: boolean;
  editable?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Input({
  value,
  onChangeText,
  placeholder,
  label,
  hint,
  errorText,
  secureTextEntry,
  keyboardType,
  autoCapitalize = "none",
  autoComplete,
  returnKeyType,
  onSubmitEditing,
  blurOnSubmit,
  editable = true,
  style
}: InputProps) {
  return (
    <View style={[styles.wrap, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        blurOnSubmit={blurOnSubmit}
        editable={editable}
        placeholderTextColor={uiTheme.colors.sage}
        style={[styles.input, errorText ? styles.inputError : null]}
      />
      {errorText ? <Text style={styles.error}>{errorText}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: uiTheme.spacing.xxs
  },
  label: {
    color: uiTheme.colors.olive,
    fontSize: uiTheme.typography.bodySmall,
    fontWeight: uiTheme.fontWeight.semibold,
    letterSpacing: uiTheme.typography.letterSpacing.wide
  },
  input: {
    minHeight: 50,
    paddingHorizontal: uiTheme.spacing.md,
    borderRadius: uiTheme.radius.md,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    backgroundColor: uiTheme.colors.parchment,
    color: uiTheme.colors.ink,
    fontSize: uiTheme.typography.body
  },
  inputError: {
    borderColor: uiTheme.colors.danger
  },
  hint: {
    color: uiTheme.colors.sage,
    fontSize: uiTheme.typography.caption
  },
  error: {
    color: uiTheme.colors.danger,
    fontSize: uiTheme.typography.caption
  }
});
