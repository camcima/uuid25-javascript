"use strict";
/**
 * Uuid25: 25-digit case-insensitive UUID encoding
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Uuid25 = void 0;
const assert = (cond, msg) => {
    if (!cond) {
        throw new Error("Assertion failed: " + msg);
    }
};
const newParseError = () => new SyntaxError("could not parse a UUID string");
/**
 * The primary value type containing the Uuid25 representation of a UUID.
 *
 * This class wraps a string value to provide conversion methods from/to other
 * popular UUID textual representations.
 *
 * @example
 * ```javascript
 * import { Uuid25 } from "uuid25";
 *
 * // convert from/to string
 * const a = Uuid25.parse("8da942a4-1fbe-4ca6-852c-95c473229c7d");
 * console.assert(a.value === "8dx554y5rzerz1syhqsvsdw8t");
 * console.assert(a.toHyphenated() === "8da942a4-1fbe-4ca6-852c-95c473229c7d");
 *
 * // convert from/to 128-bit byte array
 * const b = Uuid25.fromBytes(new Uint8Array(16).fill(0xff));
 * console.assert(b.value === "f5lxx1zz5pnorynqglhzmsp33");
 * console.assert(b.toBytes().every((x) => x === 0xff));
 *
 * // convert from/to other popular textual representations
 * const c = [
 *   Uuid25.parse("e7a1d63b711744238988afcf12161878"),
 *   Uuid25.parse("e7a1d63b-7117-4423-8988-afcf12161878"),
 *   Uuid25.parse("{e7a1d63b-7117-4423-8988-afcf12161878}"),
 *   Uuid25.parse("urn:uuid:e7a1d63b-7117-4423-8988-afcf12161878"),
 * ];
 * console.assert(c.every((x) => x.value === "dpoadk8izg9y4tte7vy1xt94o"));
 *
 * const d = Uuid25.parse("dpoadk8izg9y4tte7vy1xt94o");
 * console.assert(d.toHex() === "e7a1d63b711744238988afcf12161878");
 * console.assert(d.toHyphenated() === "e7a1d63b-7117-4423-8988-afcf12161878");
 * console.assert(d.toBraced() === "{e7a1d63b-7117-4423-8988-afcf12161878}");
 * console.assert(d.toUrn() === "urn:uuid:e7a1d63b-7117-4423-8988-afcf12161878");
 * ```
 */
class Uuid25 {
    /**
     * Creates an instance from the inner string primitive.
     *
     * @param value The underlying string value of the object in the 25-digit
     *        Base36 textual representation.
     */
    constructor(value) {
        this.value = value;
    }
    /**
     * Returns the underlying string value whenever the Object-to-primitive
     * coercion occurs.
     *
     * @param _hint Ignored.
     */
    [Symbol.toPrimitive](_hint) {
        return this.value;
    }
    /**
     * Returns the underlying string value whenever the Object-to-primitive
     * coercion occurs.
     */
    valueOf() {
        return this.value;
    }
    /**
     * Returns the underlying string value when converting `this` into a string.
     */
    toString() {
        return this.value;
    }
    /** Serializes `this` as the underlying string primitive. */
    toJSON() {
        return this.value;
    }
    /** Returns true if `this.value` equals to `other.value`. */
    equals(other) {
        return this.value === other.value;
    }
    /**
     * Creates an instance from an array of Base36 digit values.
     *
     * @category Conversion-from
     */
    static fromDigitValues(digitValues) {
        assert(digitValues.length === 25, "invalid length of digit value array");
        const digits = "0123456789abcdefghijklmnopqrstuvwxyz";
        let buffer = "";
        for (const e of digitValues) {
            assert(e < digits.length, "invalid digit value");
            buffer += digits.charAt(e);
        }
        assert(buffer <= Uuid25.MAX, "128-bit overflow");
        return new Uuid25(buffer);
    }
    /**
     * Creates an instance from a 16-byte UUID binary representation.
     *
     * @category Conversion-from
     */
    static fromBytes(uuidBytes) {
        if (uuidBytes.length !== 16) {
            throw new TypeError("the length of byte array must be 16");
        }
        return Uuid25.fromDigitValues(convertBase(uuidBytes, 256, 36, 25));
    }
    /**
     * Converts `this` into the 16-byte binary representation of a UUID.
     *
     * @category Conversion-to
     */
    toBytes() {
        const src = decodeDigitChars(this.value, 36);
        return convertBase(src, 36, 256, 16);
    }
    /**
     * Creates an instance from a UUID string representation.
     *
     * This method accepts the following formats:
     *
     * - 25-digit Base36 Uuid25 format: `3ud3gtvgolimgu9lah6aie99o`
     * - 26-character Crockford Base32 format: `3UD3GTVGOLIMGU9LAH6AIE99O`
     * - 32-digit hexadecimal format without hyphens: `40eb9860cf3e45e2a90eb82236ac806c`
     * - 8-4-4-4-12 hyphenated format: `40eb9860-cf3e-45e2-a90e-b82236ac806c`
     * - Hyphenated format with surrounding braces: `{40eb9860-cf3e-45e2-a90e-b82236ac806c}`
     * - RFC 4122 URN format: `urn:uuid:40eb9860-cf3e-45e2-a90e-b82236ac806c`
     *
     * @throws `SyntaxError` if the argument is not a valid UUID string.
     * @category Conversion-from
     */
    static parse(uuidString) {
        switch (uuidString.length) {
            case 25:
                return Uuid25.parseUuid25(uuidString);
            case 26:
                return Uuid25.parseCrockford(uuidString);
            case 32:
                return Uuid25.parseHex(uuidString);
            case 36:
                return Uuid25.parseHyphenated(uuidString);
            case 38:
                return Uuid25.parseBraced(uuidString);
            case 45:
                return Uuid25.parseUrn(uuidString);
            default:
                throw newParseError();
        }
    }
    /**
     * Creates an instance from the 25-digit Base36 Uuid25 format:
     * `3ud3gtvgolimgu9lah6aie99o`.
     *
     * @throws `SyntaxError` if the argument is not in the specified format.
     * @category Conversion-from
     */
    static parseUuid25(uuidString) {
        if (/^[0-9a-z]{25}$/i.test(uuidString)) {
            const value = uuidString.toLowerCase();
            if (value <= Uuid25.MAX) {
                return new Uuid25(value);
            }
        }
        throw newParseError();
    }
    /**
     * Creates an instance from the hexadecimal representation without checking
     * the syntax.
     *
     * @throws `SyntaxError` if the argument is `undefined`.
     * @category Conversion-from
     */
    static parseHexImpl(uuidString) {
        if (uuidString === undefined) {
            throw newParseError();
        }
        const src = decodeDigitChars(uuidString, 16);
        return Uuid25.fromDigitValues(convertBase(src, 16, 36, 25));
    }
    /**
     * Creates an instance from the 32-digit hexadecimal format without hyphens:
     * `40eb9860cf3e45e2a90eb82236ac806c`.
     *
     * @throws `SyntaxError` if the argument is not in the specified format.
     * @category Conversion-from
     */
    static parseHex(uuidString) {
        return Uuid25.parseHexImpl(/^[0-9a-f]{32}$/i.test(uuidString) ? uuidString : undefined);
    }
    /**
     * Creates an instance from the 8-4-4-4-12 hyphenated format:
     * `40eb9860-cf3e-45e2-a90e-b82236ac806c`.
     *
     * @throws `SyntaxError` if the argument is not in the specified format.
     * @category Conversion-from
     */
    static parseHyphenated(uuidString) {
        return Uuid25.parseHexImpl(/^([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})$/i
            .exec(uuidString)
            ?.slice(1, 6)
            .join(""));
    }
    /**
     * Creates an instance from the hyphenated format with surrounding braces:
     * `{40eb9860-cf3e-45e2-a90e-b82236ac806c}`.
     *
     * @throws `SyntaxError` if the argument is not in the specified format.
     * @category Conversion-from
     */
    static parseBraced(uuidString) {
        return Uuid25.parseHexImpl(/^\{([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})\}$/i
            .exec(uuidString)
            ?.slice(1, 6)
            .join(""));
    }
    /**
     * Creates an instance from the RFC 4122 URN format:
     * `urn:uuid:40eb9860-cf3e-45e2-a90e-b82236ac806c`.
     *
     * @throws `SyntaxError` if the argument is not in the specified format.
     * @category Conversion-from
     */
    static parseUrn(uuidString) {
        return Uuid25.parseHexImpl(/^urn:uuid:([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})$/i
            .exec(uuidString)
            ?.slice(1, 6)
            .join(""));
    }
    /**
     * Creates an instance from the 26-character Crockford Base32 format.
     *
     * Crockford Base32 uses the alphabet: 0-9, A-H, J-K, M-N, P-T, V-Z
     * (excluding I, L, O, U). This method is case-insensitive and tolerates
     * the excluded characters by mapping them to similar-looking valid characters
     * (I/i/L/l -> 1, O/o -> 0) per the Crockford specification.
     *
     * @throws `SyntaxError` if the argument is not in the specified format.
     * @category Conversion-from
     */
    static parseCrockford(uuidString) {
        if (!/^[0-9A-Za-z]{26}$/.test(uuidString)) {
            throw newParseError();
        }
        const src = decodeCrockfordChars(uuidString);
        return Uuid25.fromDigitValues(convertBase(src, 32, 36, 25));
    }
    /**
     * Formats `this` in the 32-digit hexadecimal format without hyphens:
     * `40eb9860cf3e45e2a90eb82236ac806c`.
     *
     * @category Conversion-to
     */
    toHex() {
        const src = decodeDigitChars(this.value, 36);
        const digitValues = convertBase(src, 36, 16, 32);
        const digits = "0123456789abcdef";
        let buffer = "";
        for (const e of digitValues) {
            buffer += digits.charAt(e);
        }
        return buffer;
    }
    /**
     * Formats `this` in the 8-4-4-4-12 hyphenated format:
     * `40eb9860-cf3e-45e2-a90e-b82236ac806c`.
     *
     * @category Conversion-to
     */
    toHyphenated() {
        return /^([0-9a-f]{8})([0-9a-f]{4})([0-9a-f]{4})([0-9a-f]{4})([0-9a-f]{12})$/
            .exec(this.toHex())
            .slice(1, 6)
            .join("-");
    }
    /**
     * Formats `this` in the hyphenated format with surrounding braces:
     * `{40eb9860-cf3e-45e2-a90e-b82236ac806c}`.
     *
     * @category Conversion-to
     */
    toBraced() {
        return "{" + this.toHyphenated() + "}";
    }
    /**
     * Formats `this` in the RFC 4122 URN format:
     * `urn:uuid:40eb9860-cf3e-45e2-a90e-b82236ac806c`.
     *
     * @category Conversion-to
     */
    toUrn() {
        return "urn:uuid:" + this.toHyphenated();
    }
    /**
     * Formats `this` in the Crockford Base32 format (26 characters).
     *
     * Crockford Base32 uses the alphabet: 0-9, A-H, J-K, M-N, P-T, V-Z
     * (excluding I, L, O, U to avoid confusion with similar-looking characters).
     *
     * @category Conversion-to
     */
    toCrockford() {
        const src = decodeDigitChars(this.value, 36);
        const digitValues = convertBase(src, 36, 32, 26);
        const digits = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
        let buffer = "";
        for (const e of digitValues) {
            buffer += digits.charAt(e);
        }
        return buffer;
    }
}
exports.Uuid25 = Uuid25;
/**
 * The maximum value of 128-bit unsigned integer (2^128 - 1) in the Base36
 * representation.
 */
Uuid25.MAX = "f5lxx1zz5pnorynqglhzmsp33";
/** Converts a digit value array in `srcBase` to that in `dstBase`. */
const convertBase = (src, srcBase, dstBase, dstSize) => {
    assert(2 <= srcBase && srcBase <= 256 && 2 <= dstBase && dstBase <= 256, "invalid base");
    // determine the number of `src` digits to read for each outer loop
    let wordLen = 1;
    let wordBase = srcBase;
    while (wordBase <= Number.MAX_SAFE_INTEGER / (srcBase * dstBase)) {
        wordLen++;
        wordBase *= srcBase;
    }
    const dst = new Uint8Array(dstSize);
    const srcSize = src.length;
    if (srcSize === 0) {
        return dst;
    }
    else {
        assert(dstSize > 0, "too small dst");
    }
    let dstUsed = dstSize - 1; // storage to memorize range of `dst` filled
    // read `wordLen` digits from `src` for each outer loop
    let wordHead = srcSize % wordLen;
    if (wordHead > 0) {
        wordHead -= wordLen;
    }
    for (; wordHead < srcSize; wordHead += wordLen) {
        let carry = 0;
        for (let i = wordHead < 0 ? 0 : wordHead; i < wordHead + wordLen; i++) {
            assert(src[i] < srcBase, "invalid src digit");
            carry = carry * srcBase + src[i];
        }
        // fill in `dst` from right to left, while carrying up prior result to left
        for (let i = dstSize - 1; i >= 0; i--) {
            carry += dst[i] * wordBase;
            const quo = Math.trunc(carry / dstBase);
            dst[i] = carry - quo * dstBase; // remainder
            carry = quo;
            // break inner loop when `carry` and remaining `dst` digits are all zero
            if (carry === 0 && i <= dstUsed) {
                dstUsed = i;
                break;
            }
        }
        assert(carry === 0, "too small dst");
    }
    return dst;
};
/** Converts from a string of digit characters to an array of digit values. */
const decodeDigitChars = (digitChars, base) => {
    // O(1) map from ASCII code points to Base36 digit values
    const DECODE_MAP = [
        0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f,
        0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f,
        0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f,
        0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f,
        0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x7f, 0x7f,
        0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f, 0x10,
        0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x1b, 0x1c,
        0x1d, 0x1e, 0x1f, 0x20, 0x21, 0x22, 0x23, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f,
        0x7f, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f, 0x10, 0x11, 0x12, 0x13, 0x14,
        0x15, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20,
        0x21, 0x22, 0x23, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f,
    ];
    assert(2 <= base && base <= 36, "invalid base");
    const len = digitChars.length;
    const digitValues = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        digitValues[i] = DECODE_MAP[digitChars.charCodeAt(i)] ?? 0x7f;
        assert(digitValues[i] < base, "invalid digit character");
    }
    return digitValues;
};
/** Converts from a string of Crockford Base32 characters to an array of digit values. */
const decodeCrockfordChars = (digitChars) => {
    // Crockford Base32 alphabet: 0123456789ABCDEFGHJKMNPQRSTVWXYZ
    // Mapping table for ASCII code points to Crockford Base32 digit values
    // Also handles lowercase and common mistaken characters (i->1, l->1, o->0, u->v)
    const CROCKFORD_DECODE_MAP = new Uint8Array(128).fill(0x7f);
    // 0-9 map to values 0-9
    for (let i = 0; i <= 9; i++) {
        CROCKFORD_DECODE_MAP[48 + i] = i; // '0'-'9'
    }
    // A-H map to values 10-17 (uppercase and lowercase)
    for (let i = 0; i < 8; i++) {
        CROCKFORD_DECODE_MAP[65 + i] = 10 + i; // 'A'-'H'
        CROCKFORD_DECODE_MAP[97 + i] = 10 + i; // 'a'-'h'
    }
    // J-K map to values 18-19 (skipping I)
    CROCKFORD_DECODE_MAP[74] = 18; // 'J'
    CROCKFORD_DECODE_MAP[106] = 18; // 'j'
    CROCKFORD_DECODE_MAP[75] = 19; // 'K'
    CROCKFORD_DECODE_MAP[107] = 19; // 'k'
    // M-N map to values 20-21 (skipping L)
    CROCKFORD_DECODE_MAP[77] = 20; // 'M'
    CROCKFORD_DECODE_MAP[109] = 20; // 'm'
    CROCKFORD_DECODE_MAP[78] = 21; // 'N'
    CROCKFORD_DECODE_MAP[110] = 21; // 'n'
    // P-T map to values 22-26 (skipping O)
    for (let i = 0; i < 5; i++) {
        CROCKFORD_DECODE_MAP[80 + i] = 22 + i; // 'P'-'T'
        CROCKFORD_DECODE_MAP[112 + i] = 22 + i; // 'p'-'t'
    }
    // V-Z map to values 27-31 (skipping U)
    for (let i = 0; i < 5; i++) {
        CROCKFORD_DECODE_MAP[86 + i] = 27 + i; // 'V'-'Z'
        CROCKFORD_DECODE_MAP[118 + i] = 27 + i; // 'v'-'z'
    }
    // Handle common mistakes per Crockford spec
    CROCKFORD_DECODE_MAP[73] = 1; // 'I' -> 1
    CROCKFORD_DECODE_MAP[105] = 1; // 'i' -> 1
    CROCKFORD_DECODE_MAP[76] = 1; // 'L' -> 1
    CROCKFORD_DECODE_MAP[108] = 1; // 'l' -> 1
    CROCKFORD_DECODE_MAP[79] = 0; // 'O' -> 0
    CROCKFORD_DECODE_MAP[111] = 0; // 'o' -> 0
    const len = digitChars.length;
    const digitValues = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        const code = digitChars.charCodeAt(i);
        digitValues[i] = code < 128 ? CROCKFORD_DECODE_MAP[code] : 0x7f;
        assert(digitValues[i] < 32, "invalid Crockford Base32 character");
    }
    return digitValues;
};
