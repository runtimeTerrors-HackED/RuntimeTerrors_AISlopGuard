import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HistoryScreen } from "../screens/HistoryScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { ResultScreen } from "../screens/ResultScreen";
import { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: { backgroundColor: "#10172a" },
        headerTintColor: "#f8fafc",
        contentStyle: { backgroundColor: "#020617" },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: "AI Content Guardian" }} />
      <Stack.Screen name="Result" component={ResultScreen} options={{ title: "Scan Result" }} />
      <Stack.Screen name="History" component={HistoryScreen} options={{ title: "Scan History" }} />
    </Stack.Navigator>
  );
}
