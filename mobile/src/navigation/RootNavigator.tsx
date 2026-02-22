import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BlacklistScreen } from "../screens/BlacklistScreen";
import { CreatorBiasesScreen } from "../screens/CreatorBiasesScreen";
import { HistoryScreen } from "../screens/HistoryScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { ResultScreen } from "../screens/ResultScreen";
import { darkColors, lightColors } from "../constants/theme";
import { useResolvedThemeMode } from "../hooks/useTheme";
import { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const mode = useResolvedThemeMode();
  const colors = mode === "light" ? lightColors : darkColors;

  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerBackButtonDisplayMode: "minimal",
        headerTitleAlign: "center",
        headerTitleStyle: {
          fontWeight: "600",
          fontSize: 17,
          color: colors.text,
        },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Result" component={ResultScreen} options={{ title: "Scan Result" }} />
      <Stack.Screen name="History" component={HistoryScreen} options={{ title: "History" }} />
      <Stack.Screen name="Blacklist" component={BlacklistScreen} options={{ title: "Blocked Creators" }} />
      <Stack.Screen
        name="CreatorBiases"
        component={CreatorBiasesScreen}
        options={{ title: "Creator Biases" }}
      />
    </Stack.Navigator>
  );
}
