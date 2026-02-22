import { ScanResponse } from "../types/api";

export type RootStackParamList = {
  Home: undefined;
  Result: { result: ScanResponse; contentUrl?: string };
  History: undefined;
  Blacklist: undefined;
  CreatorBiases: undefined;
};
