function base64ToHex(str: string) {
  const raw = atob(str);
  let result = "";
  for (let i = 0; i < raw.length; i++) {
    const hex = raw.charCodeAt(i).toString(16);
    result += hex.length === 2 ? hex : "0" + hex;
  }
  return "0x" + result.toUpperCase();
}

function hexToBase64(hexString: string): string {
  // Remove the "0x" prefix if present
  const cleanedHex = hexString.startsWith("0x")
    ? hexString.slice(2)
    : hexString;

  // Convert the hex string to a raw binary string
  let raw = "";
  for (let i = 0; i < cleanedHex.length; i += 2) {
    raw += String.fromCharCode(parseInt(cleanedHex.substr(i, 2), 16));
  }

  // Encode the raw binary string to Base64
  return btoa(raw);
}

export { base64ToHex, hexToBase64 };
