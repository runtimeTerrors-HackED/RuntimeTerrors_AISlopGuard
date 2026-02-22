import { NavigationContainer } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useResolvedThemeMode } from "./src/hooks/useTheme";
import { RootNavigator } from "./src/navigation/RootNavigator";

const queryClient = new QueryClient();

export default function App() {
  const mode = useResolvedThemeMode();

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <StatusBar style={mode === "light" ? "dark" : "light"} />
          <RootNavigator />
        </NavigationContainer>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
