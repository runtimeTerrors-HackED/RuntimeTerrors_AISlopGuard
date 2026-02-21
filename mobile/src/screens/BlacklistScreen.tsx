import {useMutation, useQuery} from "@tanstack/react-query";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import {fetchHistory, getCreatorList, scanContent} from "../api/scan";
import { ScanResultCard } from "../components/ScanResultCard";
import { colors } from "../constants/theme";
import { useAppStore } from "../store/appStore";
import {useEffect} from "react";

export function BlacklistScreen() {
    const userFingerprint = useAppStore((state) => state.userFingerprint);
    const listMutation = useMutation({
        mutationFn: getCreatorList,
        onSuccess: (data) => {
            console.log(data);
        }
    });
    useEffect(() => {
        if (userFingerprint) {
            listMutation.mutate({ userFingerprint });
        }
    }, [userFingerprint]);
    //const historyQuery = useQuery({
    //queryKey: ["history", userFingerprint],
    //queryFn: () => getCreatorList(userFingerprint),
  return (
    <ScrollView>
        <Text style={styles.loadingText}>Loading history...</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 24,
  },
  loadingText: {
    color: colors.text,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
  },
  empty: {
    color: colors.subtext,
    fontSize: 14,
  },
});
