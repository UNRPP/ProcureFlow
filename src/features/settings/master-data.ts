export const editableMasterDataTables = [
  "departments",
  "budget_categories",
  "budget_sources",
  "procurement_types",
  "fiscal_years",
  "document_types",
] as const;

export type EditableMasterDataTable = (typeof editableMasterDataTables)[number];

export function isEditableMasterDataTable(
  value: string,
): value is EditableMasterDataTable {
  return editableMasterDataTables.includes(value as EditableMasterDataTable);
}
