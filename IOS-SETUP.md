# Đưa Little Play 2 lên iOS (TestFlight rồi App Store)

Không cần máy Mac: bản iOS được dựng bằng máy macOS trên GitHub Actions. Có hai workflow:

| Workflow | Cần tài khoản Apple? | Dùng để |
|---|---|---|
| **iOS check build** | Không | Kiểm tra dự án iOS còn dựng được sau mỗi lần sửa code |
| **iOS release (TestFlight / App Store)** | Có | Dựng bản ký số và đẩy lên App Store Connect (hiện trong TestFlight) |

## Việc bạn cần làm (một lần)

1. **Đăng ký Apple Developer Program** (99 USD/năm) tại https://developer.apple.com/programs/enroll/ bằng Apple ID. Apple duyệt mất từ vài giờ đến vài ngày. Đăng ký "Individual" thì không cần mã D-U-N-S.
2. **Tạo App ID.** Vào https://developer.apple.com/account/resources/identifiers → dấu **+** → *App IDs* → *App* → Bundle ID kiểu **Explicit** nhập `app.littleplay.steam`. Không cần bật thêm capability nào.
3. **Tạo bản ghi ứng dụng.** Vào https://appstoreconnect.apple.com → *Apps* → **+** → *New App*: nền tảng iOS, tên **Little Play 2: STEAM Learning** (nếu bị trùng tên thì thêm hậu tố), ngôn ngữ English (U.S.), Bundle ID chọn `app.littleplay.steam`, SKU tùy ý (ví dụ `littleplay1`).
4. **Tạo khóa API.** App Store Connect → *Users and Access* → *Integrations* → *App Store Connect API* → *Team Keys* → **+**, tên `github-ci`, quyền **App Manager**. Ghi lại **Key ID** và **Issuer ID** ở đầu trang, rồi bấm *Download* để tải file `AuthKey_XXXX.p8`. File này chỉ tải được **một lần**. Đừng đưa vào repo và đừng dán vào chat.
5. **Lấy Team ID.** https://developer.apple.com/account → *Membership details* → *Team ID* (10 ký tự).
6. **Lưu 4 secret vào GitHub** (chạy trong PowerShell, đường dẫn tới file `.p8` sửa cho đúng):

   ```powershell
   gh secret set APPLE_TEAM_ID --repo 6h30/little-play-2
   gh secret set ASC_KEY_ID --repo 6h30/little-play-2
   gh secret set ASC_ISSUER_ID --repo 6h30/little-play-2
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\Users\ADMIN\Downloads\AuthKey_XXXX.p8")) | gh secret set ASC_KEY_P8_BASE64 --repo 6h30/little-play-2
   ```

   Ba lệnh đầu sẽ hỏi giá trị, bạn gõ hoặc dán vào là xong.

## Dựng và đẩy bản đầu tiên

GitHub → *Actions* → **iOS release (TestFlight / App Store)** → *Run workflow*: điền version `1.0.0`, build number `1` (mỗi lần đẩy lại phải tăng build number). Sau vài phút bản dựng xuất hiện trong App Store Connect → *TestFlight* (Apple xử lý thêm khoảng 10–30 phút).

## TestFlight

- **Người kiểm thử nội bộ** (tối đa 100 người, phải được thêm vào nhóm *Users and Access*): dùng được ngay, không cần Apple duyệt.
- **Người kiểm thử bên ngoài** (tối đa 10.000, mời bằng email hoặc đường dẫn công khai): bản dựng đầu tiên cần Apple duyệt nhanh (thường dưới 1 ngày). Không có yêu cầu "12 người trong 14 ngày" như Google Play.

## Hồ sơ App Store (gửi duyệt)

- **Danh mục:** Education. **Độ tuổi:** bật *Made for Kids*, chọn nhóm **nhóm 5 tuổi trở xuống**.
- **Quyền riêng tư:** *Data Not Collected*. Địa chỉ chính sách: https://6h30.github.io/little-play-2/privacy.html
- **Ảnh chụp màn hình:** cần cỡ iPhone 6.9" (1320×2868) và iPad 13" (2064×2752).
- **Ghi chú cho người duyệt (App Review):** app chạy hoàn toàn ngoại tuyến, có giọng nói và âm thanh thật, không quảng cáo, không theo dõi, không liên kết ra ngoài. Khu vực phụ huynh được bảo vệ bằng phép nhập số bằng chữ mà trẻ nhỏ không làm được.
- **Khóa màn hình:** iOS không cho app tự khóa. App có hướng dẫn phụ huynh bật *Guided Access* trong khu vực phụ huynh.

## Nếu workflow lỗi

- *"A repository secret is missing"*: một trong 4 secret chưa lưu hoặc sai tên.
- Lỗi ký số / *No profiles*: kiểm tra App ID `app.littleplay.steam` đã tạo ở bước 2 và khóa API có quyền App Manager hoặc Admin.
- Lỗi *Xcode/SDK quá cũ*: Apple đòi dựng bằng Xcode mới nhất; đổi `runs-on` sang bản macOS mới hơn.
