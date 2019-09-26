
export function HasSymbol(obj: object, smb: symbol): boolean {
  // (smb in obj)
  return obj[smb] !== void 0; // required due to core-js adding every Symbols to Object.prototype
}


