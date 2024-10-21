const buffer = new ArrayBuffer(2);
const dv = new DataView(buffer).setInt16(0, 500, true /* littleEndian */);

const value = new Int16Array(buffer)[0];
console.log(value);
console.log(value.toString(16));
