// Thông tin liên hệ & thanh toán dùng chung toàn site – chỉnh sửa tại một nơi duy nhất.
export const CONTACT = {
  hotline: "0332 184 247",
  hotlineHref: "tel:0332184247",
  zaloDisplay: "0332 184 247",
  zaloUrl: "https://zalo.me/0332184247",
  area: "Quy Nhơn, Gia Lai",
  fanpageUrl: "https://www.facebook.com/cleanlink.quynhon",
  fanpageDisplay: "facebook.com/cleanlink.quynhon",
} as const;

// Thông tin tài khoản nhận thanh toán (VietQR – Vietcombank).
export const BANK_ACCOUNT = {
  bankName: "Vietcombank",
  branch: "PGD Diêu Trì",
  bankDisplay: "Vietcombank (PGD Diêu Trì)",
  // Ảnh mã QR tĩnh – đặt file tại public/images/vietcombank-qr.png
  qrImage: "/images/vietcombank-qr.png",
  // Mã ngân hàng theo chuẩn VietQR (img.vietqr.io), dùng làm QR dự phòng khi thiếu ảnh tĩnh
  bankCode: "VCB",
  // Mã BIN Napas của Vietcombank (tương đương bankCode "VCB")
  bankBin: "970436",
  // Hệ thống liên kết hiển thị trên mã QR
  network: "VietQR / Napas 247",
  serviceName: "Dich Vu CleanLink",
  accountName: "BUI QUOC ANH",
  accountNumber: "000933218424702",
} as const;

export function buildVietQrUrl(amount: number, addInfo: string) {
  const params = new URLSearchParams({
    amount: String(amount),
    addInfo,
    accountName: BANK_ACCOUNT.accountName,
  });
  return `https://img.vietqr.io/image/${BANK_ACCOUNT.bankCode}-${BANK_ACCOUNT.accountNumber}-compact2.png?${params.toString()}`;
}

