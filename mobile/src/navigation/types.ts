import { ScanResponse } from "../types/api";

export type RootStackParamList = {
  Home: undefined;
  Result: { result: ScanResponse };
  History: undefined;
};
