export type DCSellItemParams = {
  itemId: number;
  characterInventoryId: string;
  quantity: number;
};

export type DCSellItemResponse = {
  success: boolean;
  message?: string;
  error?: string;
  details?: {
    baseValue: number;
    boost: number;
    boostedValue: number;
    totalValue: number;
  };
};
