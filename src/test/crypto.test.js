import { describe, it, expect } from "vitest";
import { CryptoUtils } from "../utils/crypto";

describe("CryptoUtils", () => {
  const password = "my-secret-password";
  const plaintext = "Hello, Tokyo!";

  it("should encrypt and decrypt correctly", async () => {
    const encrypted = await CryptoUtils.encrypt(plaintext, password);
    expect(encrypted).toBeDefined();
    expect(typeof encrypted).toBe("string");
    expect(encrypted).not.toEqual(plaintext);

    const decrypted = await CryptoUtils.decrypt(encrypted, password);
    expect(decrypted).toEqual(plaintext);
  });

  it("should fail to decrypt with wrong password", async () => {
    const encrypted = await CryptoUtils.encrypt(plaintext, password);
    
    await expect(CryptoUtils.decrypt(encrypted, "wrong-password"))
      .rejects.toThrow();
  });

  it("should convert buffer to hex and back", () => {
    const buffer = new Uint8Array([72, 101, 108, 108, 111]).buffer;
    const hex = CryptoUtils.buffToHex(buffer);
    expect(hex).toBe("48656c6c6f");

    const back = CryptoUtils.hexToBuff(hex);
    expect(new Uint8Array(back)).toEqual(new Uint8Array(buffer));
  });
});
