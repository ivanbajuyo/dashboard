interface CsvImportData {
  labels: string[];
  data: number[];
  filename: string;
}

declare global {
  interface Window {
    __csvImportData?: CsvImportData;
  }
}

export {};
