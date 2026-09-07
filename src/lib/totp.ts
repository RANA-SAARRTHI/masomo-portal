import * as OTPAuth from "otpauth";

export function generateSecret(): string {
  return new OTPAuth.Secret({ size: 20 }).base32;
}

export function makeTotp(secret: string, accountLabel: string) {
  return new OTPAuth.TOTP({
    issuer: "Masomo",
    label: accountLabel,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
}

// window: 1 allows the code from the previous/next 30s step, covering
// ordinary clock drift between the phone and server.
export function verifyTotp(secret: string, accountLabel: string, token: string): boolean {
  const totp = makeTotp(secret, accountLabel);
  const delta = totp.validate({ token: token.trim(), window: 1 });
  return delta !== null;
}

export function otpauthUri(secret: string, accountLabel: string): string {
  return makeTotp(secret, accountLabel).toString();
}
