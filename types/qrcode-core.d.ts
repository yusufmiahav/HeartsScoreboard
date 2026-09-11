declare module 'qrcode/lib/core/qrcode' {
  interface QrModules {
    size: number;
    get(row: number, col: number): number;
  }

  interface QrCode {
    modules: QrModules;
  }

  export function create(
    data: string,
    options?: { errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H' }
  ): QrCode;
}
