const CryptoJS = require("crypto-js");
const pako = require("pako");




function encodeBase64(input) {
  const compressed = compressAndEncode(input);
  const orgStr = compressed;

  let saltedStr =
    orgStr.substring(0, 10) + randomString(5) + orgStr.substring(10);
  saltedStr = randomString(5) + saltedStr + randomString(5);
  saltedStr = saltedStr.replace(/\n/g, "");

  return urlEncodeString(saltedStr);
}
function compressAndEncode(input) {
  try {
    const compressed = pako.gzip(input, { to: "uint8array" });
    const base64 = btoa(String.fromCharCode(...compressed));
    return base64;
  } catch (e) {
    console.error("Compression failed:", e);
    return null;
  }
}
function urlEncodeString(input) {
  try {
    return encodeURIComponent(input);
  } catch (e) {
    return input;
  }
}
function randomString(len) {
  const abc = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < len; i++) {
    result += abc[Math.floor(Math.random() * abc.length)];
  }
  return result;
}

function decodeBase64(input2) {

  if (!input2) return null;
  try {
    const tmpStr = input2.substring(5, input2.length - 5);
    const tmpStr2 = tmpStr.substring(0, 10) + tmpStr.substring(15);

    const byteArray = base64ToByteArray(tmpStr2);

    const result = extract(byteArray);

    return urlDecodeString(result);
  } catch (e) {
    return null;
  }
}

function urlDecodeString(input2) {
  try {
    return decodeURIComponent(input2);
  } catch (e) {
    return input2;
  }
}

function base64ToByteArray(base64) {
  // Chuyển chuỗi base64 thành chuỗi nhị phân
  const binaryString = Buffer.from(base64, "base64").toString("binary");
  // console.log("binaryString", binaryString);

  // Tạo Uint8Array từ chuỗi nhị phân
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}


function extract(compressed) {
  if (!compressed || compressed.length === 0) return "";

  try {
    if (isCompressed(compressed)) {
      const decompressed = pako.inflate(compressed);
      return new TextDecoder("utf-8").decode(decompressed);
    } else {
      return new TextDecoder("utf-8").decode(compressed);
    }
  } catch (e) {
    return "";
  }
}
function isCompressed(data) {
  return data[0] === 0x1f && data[1] === 0x8b;
}


module.exports = {
  encodeBase64,
  decodeBase64,
};