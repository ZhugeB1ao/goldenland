-- Ward Code Migration 2025
-- 2026-05-25T15:31:44.995Z

-- HIGH CONFIDENCE (safe to run)
BEGIN;

-- [projects#1] Phường Long Bình → Phường Long Bình [json-multi-province-match]
UPDATE projects SET ward_code='26833', province_code='79', address='Phường Long Bình, Thành phố Hồ Chí Minh', updated_at=NOW() WHERE id=1;

-- [projects#2] Phường An Phú → Phường An Phú [json-multi-province-match]
UPDATE projects SET ward_code='25975', province_code='79', address='Phường An Phú, Thành phố Hồ Chí Minh', updated_at=NOW() WHERE id=2;

-- [projects#3] Phường Cô Giang → Phường Cầu Ông Lãnh [csv-exact-province]
UPDATE projects SET ward_code='26758', province_code='79', address='Đường Cô Giang, Phường Cầu Ông Lãnh, Thành phố Hồ Chí Minh', updated_at=NOW() WHERE id=3;

-- [projects#4] Phường An Lạc → Phường An Lạc [json-unique-same-province]
UPDATE projects SET ward_code='27460', province_code='79', address='Đường Võ Văn Kiệt, Phường An Lạc, Thành phố Hồ Chí Minh', updated_at=NOW() WHERE id=4;

-- [projects#6] Phường Thạnh Mỹ Lợi → Phường Cát Lái [csv-exact-province]
UPDATE projects SET ward_code='27112', province_code='79', address='Phường Cát Lái, Thành phố Hồ Chí Minh', updated_at=NOW() WHERE id=6;

-- [projects#7] Phường Phú Hữu → Phường Long Trường [csv-exact-province]
UPDATE projects SET ward_code='26860', province_code='79', address='Đường Liên Phường, Phường Long Trường, Thành phố Hồ Chí Minh', updated_at=NOW() WHERE id=7;

-- [projects#8] Phường 7 → Phường Gia Định [csv-exact-province]
UPDATE projects SET ward_code='26944', province_code='79', address='Phường Gia Định, Thành phố Hồ Chí Minh', updated_at=NOW() WHERE id=8;

-- [projects#9] Xã Nghĩa Trụ → Xã Nghĩa Trụ [json-unique-same-province]
UPDATE projects SET ward_code='12031', province_code='33', address='Xã Nghĩa Trụ, Tỉnh Hưng Yên', updated_at=NOW() WHERE id=9;

-- [projects#11] Phường Phú Thượng → Phường Phú Thượng [json-unique-same-province]
UPDATE projects SET ward_code='00091', province_code='01', address='Khu đô thị Ciputra, Phường Phú Thượng, Thành phố Hà Nội', updated_at=NOW() WHERE id=11;

-- [projects#12] Phường Tây Mỗ → Phường Tây Mỗ [json-unique-same-province]
UPDATE projects SET ward_code='00634', province_code='01', address='Phường Tây Mỗ, Thành phố Hà Nội', updated_at=NOW() WHERE id=12;

-- [projects#14] Phường Phúc Lợi → Phường Phúc Lợi [json-unique-same-province]
UPDATE projects SET ward_code='00136', province_code='01', address='Phường Phúc Lợi, Thành phố Hà Nội', updated_at=NOW() WHERE id=14;

-- [projects#16] Phường Mỹ An → Phường Ngũ Hành Sơn [csv-exact-province]
UPDATE projects SET ward_code='20285', province_code='48', address='Phường Ngũ Hành Sơn, Thành phố Đà Nẵng', updated_at=NOW() WHERE id=16;

-- [projects#18] Phường Phước Mỹ → Phường An Hải [csv-exact-province]
UPDATE projects SET ward_code='20275', province_code='48', address='Phường An Hải, Thành phố Đà Nẵng', updated_at=NOW() WHERE id=18;

-- [projects#19] Phường Vĩnh Hòa → Phường Bắc Nha Trang [csv-exact-province]
UPDATE projects SET ward_code='22333', province_code='56', address='Phường Bắc Nha Trang, Tỉnh Khánh Hòa', updated_at=NOW() WHERE id=19;

-- [projects#21] Phường Lộc Thọ → Phường Nha Trang [csv-exact-province]
UPDATE projects SET ward_code='22366', province_code='56', address='Phường Nha Trang, Tỉnh Khánh Hòa', updated_at=NOW() WHERE id=21;

-- [projects#22] Xã Trừ Văn Thố → Xã Trừ Văn Thố [json-unique-same-province]
UPDATE projects SET ward_code='25819', province_code='79', address='Xã Trừ Văn Thố, Thành phố Hồ Chí Minh', updated_at=NOW() WHERE id=22;

-- [projects#23] Phường Hòa Phú → Phường Bình Dương [csv-unique-known-merger]
UPDATE projects SET ward_code='25760', province_code='79', address='Thành phố mới Bình Dương, Phường Bình Dương, Thành phố Hồ Chí Minh', updated_at=NOW() WHERE id=23;

-- [projects#24] Xã Phong Phú → Xã Bình Hưng [csv-exact-province]
UPDATE projects SET ward_code='27619', province_code='79', address='Xã Bình Hưng, Thành phố Hồ Chí Minh', updated_at=NOW() WHERE id=24;

-- [projects#26] Phường Tân Hiệp → Phường Tân Hiệp [json-unique-known-merger]
UPDATE projects SET ward_code='25920', province_code='79', address='Phường Tân Hiệp, Thành phố Hồ Chí Minh', updated_at=NOW() WHERE id=26;

-- [projects#27] Xã Hàm Ninh → Đặc khu Phú Quốc [csv-exact-province]
UPDATE projects SET ward_code='31078', province_code='91', address='Đặc khu Phú Quốc, Tỉnh An Giang', updated_at=NOW() WHERE id=27;

-- [projects#28] Xã Phước Thuận → Xã Hồ Tràm [csv-exact-province]
UPDATE projects SET ward_code='26620', province_code='79', address='Xã Hồ Tràm, Thành phố Hồ Chí Minh', updated_at=NOW() WHERE id=28;

-- [projects#29] Phường 3 → Phường Xuân Hương - Đà Lạt [csv-exact-province]
UPDATE projects SET ward_code='24781', province_code='68', address='Phường Xuân Hương - Đà Lạt, Tỉnh Lâm Đồng', updated_at=NOW() WHERE id=29;

-- [projects#30] Phường Phước Thới → Phường Phước Thới [json-unique-same-province]
UPDATE projects SET ward_code='31162', province_code='92', address='Phường Phước Thới, Thành phố Cần Thơ', updated_at=NOW() WHERE id=30;

-- [projects#31] Phường Trường Sơn → Phường Sầm Sơn [csv-exact-province]
UPDATE projects SET ward_code='16531', province_code='38', address='Phường Sầm Sơn, Tỉnh Thanh Hóa', updated_at=NOW() WHERE id=31;

-- [projects#32] Phường Máy Chai → Phường Ngô Quyền [csv-exact-province]
UPDATE projects SET ward_code='11329', province_code='31', address='Phường Ngô Quyền, Thành phố Hải Phòng', updated_at=NOW() WHERE id=32;

-- [projects#33] Xã Đa Tốn → Xã Bát Tràng [csv-exact-province]
UPDATE projects SET ward_code='00577', province_code='01', address='Xã Bát Tràng, Thành phố Hà Nội', updated_at=NOW() WHERE id=33;

-- [properties#106] Phường 3 → Phường Xuân Hương - Đà Lạt [csv-exact-province]
UPDATE properties SET ward_code='24781', province_code='68', address='Trần Hưng Đạo, Phường Xuân Hương - Đà Lạt, Tỉnh Lâm Đồng', updated_at=NOW() WHERE id=106;

-- [properties#120] Phường Hòa Phú → Phường Bình Dương [csv-unique-known-merger]
UPDATE properties SET ward_code='25760', province_code='79', address='Điện Biên Phủ, Phường Bình Dương, Thành phố Hồ Chí Minh', updated_at=NOW() WHERE id=120;

-- [properties#123] Xã Trừ Văn Thố → Xã Trừ Văn Thố [json-unique-same-province]
UPDATE properties SET ward_code='25819', province_code='79', address='Nguyễn Trãi, Xã Trừ Văn Thố, Thành phố Hồ Chí Minh', updated_at=NOW() WHERE id=123;

-- [properties#128] Xã Trừ Văn Thố → Xã Trừ Văn Thố [json-unique-same-province]
UPDATE properties SET ward_code='25819', province_code='79', address='Võ Văn Kiệt, Xã Trừ Văn Thố, Thành phố Hồ Chí Minh', updated_at=NOW() WHERE id=128;

-- [properties#138] Xã Phước Thuận → Xã Hồ Tràm [csv-exact-province]
UPDATE properties SET ward_code='26620', province_code='79', address='Lê Duẩn, Xã Hồ Tràm, Thành phố Hồ Chí Minh', updated_at=NOW() WHERE id=138;

-- [properties#140] Phường Cô Giang → Phường Cầu Ông Lãnh [csv-exact-province]
UPDATE properties SET ward_code='26758', province_code='79', address='Võ Văn Kiệt, Phường Cầu Ông Lãnh, Thành phố Hồ Chí Minh', updated_at=NOW() WHERE id=140;

-- [properties#143] Xã Trừ Văn Thố → Xã Trừ Văn Thố [json-unique-same-province]
UPDATE properties SET ward_code='25819', province_code='79', address='Phan Đình Phùng, Xã Trừ Văn Thố, Thành phố Hồ Chí Minh', updated_at=NOW() WHERE id=143;

-- [properties#144] Phường Cô Giang → Phường Cầu Ông Lãnh [csv-exact-province]
UPDATE properties SET ward_code='26758', province_code='79', address='Trần Hưng Đạo, Phường Cầu Ông Lãnh, Thành phố Hồ Chí Minh', updated_at=NOW() WHERE id=144;

-- [properties#145] Xã Phong Phú → Xã Bình Hưng [csv-exact-province]
UPDATE properties SET ward_code='27619', province_code='79', address='Nguyễn Trãi, Xã Bình Hưng, Thành phố Hồ Chí Minh', updated_at=NOW() WHERE id=145;

-- [properties#154] Xã Trừ Văn Thố → Xã Trừ Văn Thố [json-unique-same-province]
UPDATE properties SET ward_code='25819', province_code='79', address='Hai Bà Trưng, Xã Trừ Văn Thố, Thành phố Hồ Chí Minh', updated_at=NOW() WHERE id=154;

-- [properties#163] Phường Cô Giang → Phường Cầu Ông Lãnh [csv-exact-province]
UPDATE properties SET ward_code='26758', province_code='79', address='Nguyễn Trãi, Phường Cầu Ông Lãnh, Thành phố Hồ Chí Minh', updated_at=NOW() WHERE id=163;

-- [properties#164] Phường Hòa Phú → Phường Bình Dương [csv-unique-known-merger]
UPDATE properties SET ward_code='25760', province_code='79', address='Quang Trung, Phường Bình Dương, Thành phố Hồ Chí Minh', updated_at=NOW() WHERE id=164;

-- [properties#165] Phường Cô Giang → Phường Cầu Ông Lãnh [csv-exact-province]
UPDATE properties SET ward_code='26758', province_code='79', address='Nguyễn Huệ, Phường Cầu Ông Lãnh, Thành phố Hồ Chí Minh', updated_at=NOW() WHERE id=165;

-- [properties#172] Phường Cô Giang → Phường Cầu Ông Lãnh [csv-exact-province]
UPDATE properties SET ward_code='26758', province_code='79', address='Quang Trung, Phường Cầu Ông Lãnh, Thành phố Hồ Chí Minh', updated_at=NOW() WHERE id=172;

-- [properties#175] Xã Trừ Văn Thố → Xã Trừ Văn Thố [json-unique-same-province]
UPDATE properties SET ward_code='25819', province_code='79', address='Nguyễn Thị Minh Khai, Xã Trừ Văn Thố, Thành phố Hồ Chí Minh', updated_at=NOW() WHERE id=175;

-- [properties#176] Xã Phước Thuận → Xã Hồ Tràm [csv-exact-province]
UPDATE properties SET ward_code='26620', province_code='79', address='Cách Mạng Tháng 8, Xã Hồ Tràm, Thành phố Hồ Chí Minh', updated_at=NOW() WHERE id=176;

-- [properties#185] Phường Hòa Phú → Phường Bình Dương [csv-unique-known-merger]
UPDATE properties SET ward_code='25760', province_code='79', address='Điện Biên Phủ, Phường Bình Dương, Thành phố Hồ Chí Minh', updated_at=NOW() WHERE id=185;

-- [properties#189] Phường Cô Giang → Phường Cầu Ông Lãnh [csv-exact-province]
UPDATE properties SET ward_code='26758', province_code='79', address='Phan Đình Phùng, Phường Cầu Ông Lãnh, Thành phố Hồ Chí Minh', updated_at=NOW() WHERE id=189;

-- [properties#195] Phường 3 → Phường Xuân Hương - Đà Lạt [csv-exact-province]
UPDATE properties SET ward_code='24781', province_code='68', address='Hai Bà Trưng, Phường Xuân Hương - Đà Lạt, Tỉnh Lâm Đồng', updated_at=NOW() WHERE id=195;

-- [properties#203] Xã Phong Phú → Xã Bình Hưng [csv-exact-province]
UPDATE properties SET ward_code='27619', province_code='79', address='Võ Văn Kiệt, Xã Bình Hưng, Thành phố Hồ Chí Minh', updated_at=NOW() WHERE id=203;

-- [properties#208] Xã Trừ Văn Thố → Xã Trừ Văn Thố [json-unique-same-province]
UPDATE properties SET ward_code='25819', province_code='79', address='Phạm Văn Đồng, Xã Trừ Văn Thố, Thành phố Hồ Chí Minh', updated_at=NOW() WHERE id=208;

-- [properties#209] Phường Cô Giang → Phường Cầu Ông Lãnh [csv-exact-province]
UPDATE properties SET ward_code='26758', province_code='79', address='Võ Văn Kiệt, Phường Cầu Ông Lãnh, Thành phố Hồ Chí Minh', updated_at=NOW() WHERE id=209;

-- [properties#217] Xã Trừ Văn Thố → Xã Trừ Văn Thố [json-unique-same-province]
UPDATE properties SET ward_code='25819', province_code='79', address='Nguyễn Huệ, Xã Trừ Văn Thố, Thành phố Hồ Chí Minh', updated_at=NOW() WHERE id=217;

-- [properties#219] Phường Nhị Chiểu → Phường Nhị Chiểu [json-unique-same-province]
UPDATE properties SET ward_code='10714', province_code='31', address='140 Quang Trung, Phường Nhị Chiểu, Thành phố Hải Phòng', updated_at=NOW() WHERE id=219;

-- [properties#225] Phường Cô Giang → Phường Cầu Ông Lãnh [csv-exact-province]
UPDATE properties SET ward_code='26758', province_code='79', address='Võ Văn Kiệt, Phường Cầu Ông Lãnh, Thành phố Hồ Chí Minh', updated_at=NOW() WHERE id=225;

-- [properties#227] Phường Cô Giang → Phường Cầu Ông Lãnh [csv-exact-province]
UPDATE properties SET ward_code='26758', province_code='79', address='Hoàng Diệu, Phường Cầu Ông Lãnh, Thành phố Hồ Chí Minh', updated_at=NOW() WHERE id=227;

-- [properties#228] Xã Phong Phú → Xã Bình Hưng [csv-exact-province]
UPDATE properties SET ward_code='27619', province_code='79', address='Điện Biên Phủ, Xã Bình Hưng, Thành phố Hồ Chí Minh', updated_at=NOW() WHERE id=228;

-- [properties#232] Xã Phong Phú → Xã Bình Hưng [csv-exact-province]
UPDATE properties SET ward_code='27619', province_code='79', address='Quang Trung, Xã Bình Hưng, Thành phố Hồ Chí Minh', updated_at=NOW() WHERE id=232;

-- [properties#237] Xã Phước Thuận → Xã Hồ Tràm [csv-exact-province]
UPDATE properties SET ward_code='26620', province_code='79', address='Hoàng Diệu, Xã Hồ Tràm, Thành phố Hồ Chí Minh', updated_at=NOW() WHERE id=237;

-- [properties#240] Phường Cô Giang → Phường Cầu Ông Lãnh [csv-exact-province]
UPDATE properties SET ward_code='26758', province_code='79', address='Cách Mạng Tháng 8, Phường Cầu Ông Lãnh, Thành phố Hồ Chí Minh', updated_at=NOW() WHERE id=240;

-- [properties#248] Xã Phong Phú → Xã Bình Hưng [csv-exact-province]
UPDATE properties SET ward_code='27619', province_code='79', address='Phan Đình Phùng, Xã Bình Hưng, Thành phố Hồ Chí Minh', updated_at=NOW() WHERE id=248;

-- [properties#254] Xã Phú Thành → Xã Phú Thành [json-unique-same-province]
UPDATE properties SET ward_code='28663', province_code='82', address='188 Cách Mạng Tháng 8, Xã Phú Thành, Tỉnh Đồng Tháp', updated_at=NOW() WHERE id=254;

-- [properties#258] Phường Đông Kinh → Phường Đông Kinh [json-unique-same-province]
UPDATE properties SET ward_code='05977', province_code='20', address='70 Nguyễn Trãi, Phường Đông Kinh, Tỉnh Lạng Sơn', updated_at=NOW() WHERE id=258;

COMMIT;

-- MEDIUM CONFIDENCE (review before applying)

-- ERRORS (manual fix)

-- [projects#10] code=00187 name="null"
-- Address: Khu Smart City, Tây Hồ Tây, Hà Nội

-- [projects#17] code=20899 name="Xã Điện Dương"
-- Address: Xã Điện Dương, Điện Bàn, Quảng Nam

-- [projects#20] code=22642 name="null"
-- Address: Bán đảo Cam Ranh, TP. Cam Ranh, Tỉnh Khánh Hòa

-- [projects#25] code=26479 name="Xã Long Hưng"
-- Address: Xã Long Hưng, Biên Hòa, Đồng Nai

-- [properties#149] code=25417 name="Xã Hàm Ninh"
-- Address: Võ Văn Kiệt, Xã Hàm Ninh, Tỉnh Lâm Đồng

-- [properties#191] code=22828 name="Xã Hàm Ninh"
-- Address: Điện Biên Phủ, Xã Hàm Ninh, Tỉnh Lâm Đồng

-- [properties#211] code=31679 name="Xã Hàm Ninh"
-- Address: Lê Lợi, Xã Hàm Ninh, Tỉnh Lâm Đồng

-- [properties#234] code=17569 name="Xã Hàm Ninh"
-- Address: Võ Văn Kiệt, Xã Hàm Ninh, Tỉnh Lâm Đồng

-- [properties#264] code=12073 name="Xã Hàm Ninh"
-- Address: Hai Bà Trưng, Xã Hàm Ninh, Tỉnh Lâm Đồng

-- [properties#268] code=28456 name="Xã Hàm Ninh"
-- Address: Lê Duẩn, Xã Hàm Ninh, Tỉnh Lâm Đồng

-- ============================================================
-- MANUAL FIXES (10 records không tự động map được)
-- Verified and applied manually
-- ============================================================
BEGIN;

-- [projects#10] "Khu Smart City, Tây Hồ Tây, Hà Nội"
-- Tây Hồ Tây nằm trong Phường Tây Hồ, HN
UPDATE projects SET ward_code='00103', province_code='01',
  address='Khu Smart City, Phường Tây Hồ, Thành phố Hà Nội', updated_at=NOW() WHERE id=10;

-- [projects#17] "Xã Điện Dương, Điện Bàn, Quảng Nam"
-- Quảng Nam sáp nhập vào Đà Nẵng. Xã Điện Dương → Phường Điện Bàn Đông
UPDATE projects SET ward_code='20579', province_code='48',
  address='Phường Điện Bàn Đông, Thành phố Đà Nẵng', updated_at=NOW() WHERE id=17;

-- [projects#20] "Bán đảo Cam Ranh, TP. Cam Ranh, Tỉnh Khánh Hòa"
-- Cam Ranh vẫn thuộc Khánh Hòa, dùng Phường Cam Ranh
UPDATE projects SET ward_code='22420', province_code='56',
  address='Bán đảo Cam Ranh, Phường Cam Ranh, Tỉnh Khánh Hòa', updated_at=NOW() WHERE id=20;

-- [projects#25] "Xã Long Hưng, Biên Hòa, Đồng Nai"
-- Xã Long Hưng Biên Hòa → Phường Long Hưng (26380), Đồng Nai
UPDATE projects SET ward_code='26380', province_code='75',
  address='Xã Long Hưng, Thành phố Biên Hòa, Tỉnh Đồng Nai', updated_at=NOW() WHERE id=25;

-- [properties#149,191,211,234,264,268] "Xã Hàm Ninh, Tỉnh Lâm Đồng"
-- Dữ liệu sai (Hàm Ninh là ở Phú Quốc, không phải Lâm Đồng)
-- Xóa ward_code vì không xác định được địa chỉ thực
UPDATE properties SET ward_code=NULL, updated_at=NOW() WHERE id IN (149, 191, 211, 234, 264, 268);

COMMIT;
