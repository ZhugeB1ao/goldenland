import dotenv from 'dotenv'
import { getPayload } from 'payload'

dotenv.config()

const rt = (text: string) => ({
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text, detail: 0, format: 0, mode: 'normal', style: '', version: 1 }],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  },
})

const investorData = [
  { name: 'Vingroup', description: 'Tập đoàn Vingroup - Nhà phát triển BĐS hàng đầu Việt Nam', website: 'https://vingroup.net', phone: '1800 8123', email: 'cskh@vingroup.net', address: '458 Minh Khai, Hà Nội', isActive: true },
  { name: 'Novaland', description: 'Tập đoàn Novaland - Phát triển khu đô thị cao cấp', website: 'https://novaland.com.vn', phone: '1800 6878', email: 'info@novaland.com.vn', address: '65 Võ Thị Sáu, Q.1, TP.HCM', isActive: true },
  { name: 'Sun Group', description: 'Tập đoàn Sun Group - Đầu tư BĐS nghỉ dưỡng và giải trí', website: 'https://sungroup.com.vn', phone: '1800 1508', email: 'info@sungroup.com.vn', address: 'Bà Nà Hills, Đà Nẵng', isActive: true },
  { name: 'Hưng Thịnh Corp', description: 'Tập đoàn Hưng Thịnh - Phát triển nhà ở đô thị', website: 'https://hungthinhcorp.com.vn', phone: '1800 6655', email: 'info@hungthinhcorp.com.vn', address: '99 Nguyễn Thị Thập, Q.7, TP.HCM', isActive: true },
  { name: 'Nam Long Group', description: 'Tập đoàn Nam Long - Nhà ở vừa túi tiền', website: 'https://namlonggroup.com', phone: '1800 6055', email: 'info@namlonggroup.com', address: '11 Tân Thuận Tây, Q.7, TP.HCM', isActive: true },
  { name: 'Masterise Homes', description: 'Masterise Homes - BĐS hạng sang và cao cấp', website: 'https://masterisehomes.com', phone: '1800 6001', email: 'contact@masterisehomes.com', address: 'Landmark 81, Q. Bình Thạnh, TP.HCM', isActive: true },
]

const projectData = [
  // TP. HỒ CHÍ MINH
  {
    name: 'Vinhomes Grand Park',
    description: rt('Khu đô thị thông minh tích hợp tiện ích đẳng cấp quốc tế tại TP. Thủ Đức với diện tích 271 ha, gồm công viên ánh sáng, trường học, bệnh viện và trung tâm thương mại nội khu.'),
    investorName: 'Vingroup',
    totalArea: 271, totalUnits: 10000, priceFrom: 2500, priceTo: 8000,
    propertyTypes: ['apartment', 'shophouse'],
    startDate: '2019-01-15', completionDate: '2025-06-30',
    provinceCode: '79', wardCode: '26734',
    address: 'Phường Long Bình, TP. Thủ Đức, TP. Hồ Chí Minh',
    latitude: 10.8372, longitude: 106.8339,
    zones: [
      { name: 'Rainbow', description: 'Khu căn hộ đầy màu sắc giai đoạn 1', totalUnits: 2000, status: 'sold_out' },
      { name: 'Origami', description: 'Phân khu phong cách Nhật Bản', totalUnits: 1800, status: 'sold_out' },
      { name: 'Sapphire', description: 'Khu căn hộ cao cấp view công viên', totalUnits: 2200, status: 'selling' },
      { name: 'The Beverly', description: 'Khu biệt lập phong cách Beverly Hills', totalUnits: 400, status: 'upcoming' },
    ],
    status: 'active', isFeatured: true,
    seoTitle: 'Vinhomes Grand Park - Đô thị thông minh Thủ Đức',
    seoDescription: 'Vinhomes Grand Park 271ha tại TP. Thủ Đức - khu đô thị tích hợp với tiện ích đẳng cấp quốc tế.',
  },
  {
    name: 'Masteri An Phú',
    description: rt('Căn hộ cao cấp tại An Phú, Quận 2 với thiết kế hiện đại, view sông thoáng đãng, kết nối thuận tiện qua cầu Thủ Thiêm và Đại lộ Đông Tây.'),
    investorName: 'Masterise Homes',
    totalArea: 3.5, totalUnits: 1500, priceFrom: 3800, priceTo: 9500,
    propertyTypes: ['apartment'],
    startDate: '2017-03-01', completionDate: '2020-12-31',
    provinceCode: '79', wardCode: '26794',
    address: 'Phường An Phú, TP. Thủ Đức, TP. Hồ Chí Minh',
    latitude: 10.7984, longitude: 106.7399,
    zones: [
      { name: 'Tower 1', description: 'Tòa tháp căn hộ hướng sông', totalUnits: 750, status: 'sold_out' },
      { name: 'Tower 2', description: 'Tòa tháp căn hộ hướng hồ', totalUnits: 750, status: 'sold_out' },
    ],
    status: 'active', isFeatured: true,
    seoTitle: 'Masteri An Phú - Căn hộ cao cấp Quận 2',
    seoDescription: 'Masteri An Phú - căn hộ cao cấp view sông tại Quận 2, kết nối thuận tiện trung tâm TP.HCM.',
  },
  {
    name: 'The Grand Manhattan',
    description: rt('Khu phức hợp căn hộ - thương mại - văn phòng hạng sang tại trung tâm Quận 1, TP. Hồ Chí Minh. Thiết kế lấy cảm hứng từ khu Manhattan nổi tiếng của New York.'),
    investorName: 'Novaland',
    totalArea: 1.2, totalUnits: 600, priceFrom: 8000, priceTo: 25000,
    propertyTypes: ['apartment', 'shophouse'],
    startDate: '2018-06-01', completionDate: '2022-09-30',
    provinceCode: '79', wardCode: '26734',
    address: 'Đường Cô Giang, Phường Cô Giang, Quận 1, TP. Hồ Chí Minh',
    latitude: 10.7590, longitude: 106.6975,
    zones: [
      { name: 'Sky Residences', description: 'Căn hộ tầng cao view toàn thành phố', totalUnits: 300, status: 'sold_out' },
      { name: 'Prime Suites', description: 'Căn hộ tiêu chuẩn khách sạn', totalUnits: 200, status: 'selling' },
      { name: 'Grand Shophouse', description: 'Shophouse thương mại tầng trệt', totalUnits: 100, status: 'selling' },
    ],
    status: 'active', isFeatured: true,
    seoTitle: 'The Grand Manhattan - Căn hộ hạng sang Quận 1',
    seoDescription: 'The Grand Manhattan - khu phức hợp căn hộ hạng sang tại trung tâm Quận 1, thiết kế chuẩn 5 sao.',
  },
  {
    name: 'Akari City',
    description: rt('Khu đô thị mặt trời mọc tại Bình Tân, TP. Hồ Chí Minh với 7.8 ha không gian xanh, hệ thống tiện ích Nhật Bản chuẩn quốc tế và mức giá hợp lý.'),
    investorName: 'Nam Long Group',
    totalArea: 8.5, totalUnits: 3200, priceFrom: 1800, priceTo: 4500,
    propertyTypes: ['apartment'],
    startDate: '2020-09-01', completionDate: '2025-03-31',
    provinceCode: '79', wardCode: '27553',
    address: 'Đường Võ Văn Kiệt, Phường An Lạc, Quận Bình Tân, TP. Hồ Chí Minh',
    latitude: 10.7380, longitude: 106.6111,
    zones: [
      { name: 'Gaia', description: 'Phân khu đầu tiên đã bàn giao', totalUnits: 800, status: 'sold_out' },
      { name: 'Maya', description: 'Phân khu thứ hai đang bán', totalUnits: 1200, status: 'selling' },
      { name: 'Zeus', description: 'Phân khu mới nhất sắp mở bán', totalUnits: 1200, status: 'upcoming' },
    ],
    status: 'active', isFeatured: false,
    seoTitle: 'Akari City - Khu đô thị Nhật Bản tại Bình Tân',
    seoDescription: 'Akari City - đô thị mặt trời mọc 8.5ha tại Bình Tân với tiện ích Nhật Bản và mức giá hợp lý.',
  },
  {
    name: 'Phú Mỹ Hưng Midtown',
    description: rt('Khu đô thị cao cấp tại Nam Sài Gòn, tiêu chuẩn quốc tế với trường học, bệnh viện, trung tâm thương mại và không gian sống xanh thoáng mát.'),
    investorName: 'Nam Long Group',
    totalArea: 26.8, totalUnits: 2500, priceFrom: 4500, priceTo: 12000,
    propertyTypes: ['apartment', 'villa', 'shophouse'],
    startDate: '2016-01-01', completionDate: '2022-06-30',
    provinceCode: '79', wardCode: '27343',
    address: 'Khu đô thị Phú Mỹ Hưng, Quận 7, TP. Hồ Chí Minh',
    latitude: 10.7321, longitude: 106.7128,
    zones: [
      { name: 'M1', description: 'Khu căn hộ hạng sang giai đoạn 1', totalUnits: 600, status: 'sold_out' },
      { name: 'M2', description: 'Khu biệt thự song lập', totalUnits: 200, status: 'sold_out' },
      { name: 'M3', description: 'Khu shophouse cao cấp', totalUnits: 150, status: 'selling' },
    ],
    status: 'active', isFeatured: false,
    seoTitle: 'Phú Mỹ Hưng Midtown - Tinh hoa Nam Sài Gòn',
    seoDescription: 'Phú Mỹ Hưng Midtown - khu đô thị cao cấp chuẩn quốc tế tại Nam Sài Gòn với tiện ích đẳng cấp.',
  },
  {
    name: 'Eaton Park',
    description: rt('Dự án căn hộ cao cấp tại Thủ Đức với chuỗi tiện ích nội khu theo phong cách resort, sân golf mini, hồ bơi tràn bờ và vườn nhiệt đới.'),
    investorName: 'Masterise Homes',
    totalArea: 4.1, totalUnits: 1800, priceFrom: 5500, priceTo: 14000,
    propertyTypes: ['apartment'],
    startDate: '2022-03-01', completionDate: '2026-12-31',
    provinceCode: '79', wardCode: '26734',
    address: 'Phường Thạnh Mỹ Lợi, TP. Thủ Đức, TP. Hồ Chí Minh',
    latitude: 10.7815, longitude: 106.7624,
    zones: [
      { name: 'Crescent', description: 'Tháp căn hộ hình vầng trăng view sông', totalUnits: 600, status: 'selling' },
      { name: 'Horizon', description: 'Tháp căn hộ tầm nhìn toàn cảnh', totalUnits: 600, status: 'selling' },
      { name: 'Infinity', description: 'Tháp căn hộ với hồ bơi vô cực sky', totalUnits: 600, status: 'upcoming' },
    ],
    status: 'active', isFeatured: true,
    seoTitle: 'Eaton Park - Căn hộ resort cao cấp TP. Thủ Đức',
    seoDescription: 'Eaton Park - căn hộ cao cấp phong cách resort với tiện ích đẳng cấp 5 sao tại TP. Thủ Đức.',
  },
  {
    name: 'Clarita Khang Điền',
    description: rt('Khu nhà ở liên kế và biệt thự tại Quận 9, TP. Hồ Chí Minh với hệ thống tiện ích cộng đồng hoàn chỉnh, an ninh 24/7 và không gian sống xanh.'),
    investorName: 'Hưng Thịnh Corp',
    totalArea: 10.2, totalUnits: 450, priceFrom: 6500, priceTo: 18000,
    propertyTypes: ['house', 'villa'],
    startDate: '2021-05-01', completionDate: '2024-06-30',
    provinceCode: '79', wardCode: '26794',
    address: 'Đường Liên Phường, Phường Phú Hữu, TP. Thủ Đức, TP. Hồ Chí Minh',
    latitude: 10.8149, longitude: 106.7766,
    zones: [
      { name: 'Khu A - Nhà liên kế', description: 'Nhà liên kế 1 trệt 2 lầu', totalUnits: 280, status: 'sold_out' },
      { name: 'Khu B - Biệt thự', description: 'Biệt thự đơn lập và song lập', totalUnits: 170, status: 'selling' },
    ],
    status: 'active', isFeatured: false,
    seoTitle: 'Clarita Khang Điền - Nhà phố biệt thự Thủ Đức',
    seoDescription: 'Clarita Khang Điền - khu nhà ở liên kế và biệt thự cao cấp tại TP. Thủ Đức với tiện ích đầy đủ.',
  },
  {
    name: 'D-Aqua Quận 8',
    description: rt('Khu căn hộ resort mặt sông tại Quận 8, TP. Hồ Chí Minh với hệ thống cảnh quan thiên nhiên, view kênh Đôi và phong cách sống xanh hiện đại.'),
    investorName: 'Hưng Thịnh Corp',
    totalArea: 5.6, totalUnits: 2200, priceFrom: 2200, priceTo: 5500,
    propertyTypes: ['apartment'],
    startDate: '2021-10-01', completionDate: '2025-09-30',
    provinceCode: '79', wardCode: '27217',
    address: 'Phường 7, Quận 8, TP. Hồ Chí Minh',
    latitude: 10.7423, longitude: 106.6709,
    zones: [
      { name: 'Khu 1', description: 'Căn hộ mặt sông tầng thấp', totalUnits: 700, status: 'sold_out' },
      { name: 'Khu 2', description: 'Căn hộ view kênh tầng trung', totalUnits: 800, status: 'selling' },
      { name: 'Khu 3', description: 'Căn hộ sky villa tầng cao', totalUnits: 700, status: 'upcoming' },
    ],
    status: 'active', isFeatured: false,
    seoTitle: 'D-Aqua Quận 8 - Căn hộ resort mặt sông',
    seoDescription: 'D-Aqua Quận 8 - căn hộ view kênh Đôi tại Quận 8 với phong cách resort xanh và mức giá hợp lý.',
  },

  // HÀ NỘI
  {
    name: 'Vinhomes Ocean Park 2',
    description: rt('Khu đô thị sinh thái thông minh tại Hưng Yên với biển hồ nước mặn nhân tạo 16 ha, resort tiêu chuẩn 5 sao và hệ sinh thái tiện ích hiện đại.'),
    investorName: 'Vingroup',
    totalArea: 460, totalUnits: 15000, priceFrom: 2000, priceTo: 9000,
    propertyTypes: ['apartment', 'villa', 'shophouse'],
    startDate: '2021-07-01', completionDate: '2027-12-31',
    provinceCode: '01', wardCode: '09271',
    address: 'Xã Nghĩa Trụ, Văn Giang, Hưng Yên',
    latitude: 20.9712, longitude: 105.9134,
    zones: [
      { name: 'The Zurich', description: 'Khu căn hộ cao cấp phong cách Thụy Sĩ', totalUnits: 3000, status: 'selling' },
      { name: 'The Orlando', description: 'Khu biệt thự resort', totalUnits: 500, status: 'selling' },
      { name: 'The Miami', description: 'Khu shophouse thương mại', totalUnits: 800, status: 'upcoming' },
      { name: 'The Canary', description: 'Phân khu mới nhất', totalUnits: 2000, status: 'upcoming' },
    ],
    status: 'active', isFeatured: true,
    seoTitle: 'Vinhomes Ocean Park 2 - Đô thị biển hồ Hưng Yên',
    seoDescription: 'Vinhomes Ocean Park 2 - đô thị sinh thái 460ha với biển hồ nước mặn nhân tạo tại Hưng Yên.',
  },
  {
    name: 'Masteri West Heights',
    description: rt('Tổ hợp căn hộ cao tầng phức hợp tại Smart City, Tây Hồ Tây, Hà Nội với hệ thống tiện ích thông minh, kết nối nhanh trục Nhật Tân - Nội Bài.'),
    investorName: 'Masterise Homes',
    totalArea: 6.8, totalUnits: 3500, priceFrom: 3500, priceTo: 10000,
    propertyTypes: ['apartment', 'shophouse'],
    startDate: '2020-12-01', completionDate: '2025-06-30',
    provinceCode: '01', wardCode: '00187',
    address: 'Khu Smart City, Tây Hồ Tây, Hà Nội',
    latitude: 21.0625, longitude: 105.7993,
    zones: [
      { name: 'S1.01', description: 'Tháp căn hộ đầu tiên của Smart City', totalUnits: 700, status: 'sold_out' },
      { name: 'S1.02', description: 'Tháp căn hộ thứ hai', totalUnits: 700, status: 'selling' },
      { name: 'S1.03', description: 'Tháp căn hộ thứ ba', totalUnits: 700, status: 'selling' },
      { name: 'S2', description: 'Phân khu thứ hai', totalUnits: 1400, status: 'upcoming' },
    ],
    status: 'active', isFeatured: true,
    seoTitle: 'Masteri West Heights - Căn hộ Smart City Tây Hồ',
    seoDescription: 'Masteri West Heights tại Smart City Tây Hồ Tây - căn hộ thông minh kết nối nhanh Nhật Tân - Nội Bài.',
  },
  {
    name: 'Sunshine City Hà Nội',
    description: rt('Khu đô thị phức hợp tại Ciputra, Tây Hồ với kiến trúc châu Âu độc đáo, hệ thống tiện ích khép kín và không gian xanh chiếm 40% tổng diện tích.'),
    investorName: 'Hưng Thịnh Corp',
    totalArea: 15.3, totalUnits: 4200, priceFrom: 2800, priceTo: 8500,
    propertyTypes: ['apartment', 'shophouse'],
    startDate: '2018-08-01', completionDate: '2023-12-31',
    provinceCode: '01', wardCode: '00175',
    address: 'Khu đô thị Ciputra, Phường Phú Thượng, Tây Hồ, Hà Nội',
    latitude: 21.0891, longitude: 105.8013,
    zones: [
      { name: 'S6', description: 'Tháp căn hộ 50 tầng cao nhất khu vực', totalUnits: 1000, status: 'sold_out' },
      { name: 'S7', description: 'Tháp căn hộ view Hồ Tây', totalUnits: 1000, status: 'sold_out' },
      { name: 'S8', description: 'Tháp căn hộ khu mới', totalUnits: 1200, status: 'selling' },
      { name: 'S9', description: 'Tháp sky villas cao cấp', totalUnits: 1000, status: 'upcoming' },
    ],
    status: 'active', isFeatured: false,
    seoTitle: 'Sunshine City Hà Nội - Đô thị châu Âu tại Tây Hồ',
    seoDescription: 'Sunshine City Hà Nội - khu đô thị 15ha phong cách châu Âu tại Ciputra với 40% không gian xanh.',
  },
  {
    name: 'Lumi Hanoi',
    description: rt('Tổ hợp căn hộ cao cấp tại Khu đô thị Tây Mỗ - Đại Mỗ, Nam Từ Liêm, Hà Nội với thiết kế xanh bền vững và chuỗi tiện ích thể thao cao cấp.'),
    investorName: 'Novaland',
    totalArea: 9.7, totalUnits: 2800, priceFrom: 2600, priceTo: 7000,
    propertyTypes: ['apartment'],
    startDate: '2022-01-01', completionDate: '2026-06-30',
    provinceCode: '01', wardCode: '00316',
    address: 'Phường Tây Mỗ, Nam Từ Liêm, Hà Nội',
    latitude: 20.9893, longitude: 105.7621,
    zones: [
      { name: 'Lumi Avenue', description: 'Khu căn hộ mặt đại lộ', totalUnits: 1400, status: 'selling' },
      { name: 'Lumi Park', description: 'Khu căn hộ mặt công viên', totalUnits: 1400, status: 'upcoming' },
    ],
    status: 'active', isFeatured: false,
    seoTitle: 'Lumi Hanoi - Căn hộ xanh Nam Từ Liêm',
    seoDescription: 'Lumi Hanoi - tổ hợp căn hộ xanh bền vững 9.7ha tại Tây Mỗ, Nam Từ Liêm với tiện ích thể thao cao cấp.',
  },
  {
    name: 'Imperia Smart City',
    description: rt('Đại đô thị thông minh 204 ha tại Tây Mỗ, Hà Nội với công nghệ IOT tích hợp, hệ thống an ninh AI và tiện ích thể thao đẳng cấp quốc tế.'),
    investorName: 'Masterise Homes',
    totalArea: 204, totalUnits: 12000, priceFrom: 2200, priceTo: 9500,
    propertyTypes: ['apartment', 'villa', 'shophouse'],
    startDate: '2019-10-01', completionDate: '2026-12-31',
    provinceCode: '01', wardCode: '00316',
    address: 'Đường Trần Hữu Dực, Tây Mỗ, Nam Từ Liêm, Hà Nội',
    latitude: 20.9824, longitude: 105.7702,
    zones: [
      { name: 'Tokyo', description: 'Phân khu phong cách Nhật Bản', totalUnits: 2000, status: 'sold_out' },
      { name: 'Milan', description: 'Phân khu phong cách Ý', totalUnits: 2500, status: 'selling' },
      { name: 'Paris', description: 'Phân khu phong cách Pháp', totalUnits: 2500, status: 'upcoming' },
      { name: 'London', description: 'Phân khu phong cách Anh', totalUnits: 2000, status: 'upcoming' },
    ],
    status: 'active', isFeatured: true,
    seoTitle: 'Imperia Smart City - Đại đô thị thông minh 204ha Hà Nội',
    seoDescription: 'Imperia Smart City 204ha tại Tây Mỗ - đại đô thị thông minh với công nghệ IOT và tiện ích quốc tế.',
  },
  {
    name: 'Vinhomes Riverside Legacy',
    description: rt('Khu đô thị sinh thái ven sông Đuống tại Long Biên, Hà Nội với 70% diện tích cây xanh mặt nước, biệt thự phong cách châu Âu cổ điển.'),
    investorName: 'Vingroup',
    totalArea: 185, totalUnits: 2000, priceFrom: 8000, priceTo: 35000,
    propertyTypes: ['villa', 'house', 'shophouse'],
    startDate: '2017-01-01', completionDate: '2023-06-30',
    provinceCode: '01', wardCode: '00454',
    address: 'Phường Phúc Lợi, Long Biên, Hà Nội',
    latitude: 21.0437, longitude: 105.9034,
    zones: [
      { name: 'Khu Đảo', description: 'Biệt thự hòn đảo giữa sông', totalUnits: 300, status: 'sold_out' },
      { name: 'Khu Bán Đảo', description: 'Biệt thự mặt hồ lớn', totalUnits: 500, status: 'sold_out' },
      { name: 'Khu Vườn Tùng', description: 'Biệt thự vườn cây xanh', totalUnits: 700, status: 'selling' },
      { name: 'Khu Cung Đình', description: 'Biệt thự phong cách cung đình', totalUnits: 500, status: 'upcoming' },
    ],
    status: 'active', isFeatured: false,
    seoTitle: 'Vinhomes Riverside Legacy - Biệt thự sinh thái ven sông',
    seoDescription: 'Vinhomes Riverside Legacy 185ha tại Long Biên - biệt thự sinh thái ven sông với 70% cây xanh mặt nước.',
  },

  // ĐÀ NẴNG
  {
    name: 'Sun Cosmo Residence',
    description: rt('Tổ hợp căn hộ - thương mại - văn phòng cao tầng tại trung tâm Đà Nẵng với tầm nhìn sông Hàn và biển Mỹ Khê, tiêu chuẩn thiết kế quốc tế.'),
    investorName: 'Sun Group',
    totalArea: 2.8, totalUnits: 1200, priceFrom: 2800, priceTo: 7500,
    propertyTypes: ['apartment', 'shophouse'],
    startDate: '2021-04-01', completionDate: '2025-12-31',
    provinceCode: '48', wardCode: '20194',
    address: 'Đường 2 Tháng 9, Phường Hải Châu 1, Quận Hải Châu, Đà Nẵng',
    latitude: 16.0679, longitude: 108.2104,
    zones: [
      { name: 'Tower A', description: 'Tháp căn hộ view sông Hàn', totalUnits: 400, status: 'selling' },
      { name: 'Tower B', description: 'Tháp căn hộ view biển', totalUnits: 400, status: 'selling' },
      { name: 'Podium', description: 'Tầng đế thương mại', totalUnits: 400, status: 'upcoming' },
    ],
    status: 'active', isFeatured: true,
    seoTitle: 'Sun Cosmo Residence - Căn hộ trung tâm Đà Nẵng',
    seoDescription: 'Sun Cosmo Residence tại Đà Nẵng - tổ hợp căn hộ cao cấp view sông Hàn và biển Mỹ Khê.',
  },
  {
    name: 'Danang Golden Bay',
    description: rt('Khu nghỉ dưỡng và căn hộ condotel tại bãi biển Non Nước, Đà Nẵng với cam kết lợi nhuận hấp dẫn và dịch vụ quản lý vận hành chuyên nghiệp.'),
    investorName: 'Hưng Thịnh Corp',
    totalArea: 8.4, totalUnits: 1800, priceFrom: 2500, priceTo: 9000,
    propertyTypes: ['condotel', 'apartment'],
    startDate: '2019-06-01', completionDate: '2024-03-31',
    provinceCode: '48', wardCode: '20263',
    address: 'Phường Mỹ An, Quận Ngũ Hành Sơn, Đà Nẵng',
    latitude: 16.0168, longitude: 108.2537,
    zones: [
      { name: 'Pearl Tower', description: 'Tháp căn hộ condotel 5 sao', totalUnits: 600, status: 'sold_out' },
      { name: 'Diamond Tower', description: 'Tháp condotel view biển', totalUnits: 600, status: 'selling' },
      { name: 'Ruby Villa', description: 'Biệt thự nghỉ dưỡng', totalUnits: 600, status: 'upcoming' },
    ],
    status: 'active', isFeatured: false,
    seoTitle: 'Danang Golden Bay - Condotel biển Non Nước',
    seoDescription: 'Danang Golden Bay - condotel nghỉ dưỡng tại biển Non Nước với cam kết lợi nhuận hấp dẫn.',
  },
  {
    name: 'Hội An Golden Sea',
    description: rt('Khu đô thị nghỉ dưỡng biển ven bờ biển Hội An với kiến trúc truyền thống phố cổ được tái hiện hiện đại, shopvilla và villa mặt biển tuyệt đẹp.'),
    investorName: 'Sun Group',
    totalArea: 22.5, totalUnits: 800, priceFrom: 5000, priceTo: 30000,
    propertyTypes: ['villa', 'shophouse', 'condotel'],
    startDate: '2020-11-01', completionDate: '2025-12-31',
    provinceCode: '49', wardCode: '20899',
    address: 'Xã Điện Dương, Điện Bàn, Quảng Nam',
    latitude: 15.9201, longitude: 108.3174,
    zones: [
      { name: 'Phố cổ', description: 'Shopvilla phong cách phố cổ Hội An', totalUnits: 300, status: 'selling' },
      { name: 'Mặt biển', description: 'Villa hạng sang mặt biển', totalUnits: 200, status: 'selling' },
      { name: 'Đảo xanh', description: 'Biệt thự nghỉ dưỡng nội khu', totalUnits: 300, status: 'upcoming' },
    ],
    status: 'active', isFeatured: true,
    seoTitle: 'Hội An Golden Sea - Shopvilla biển phong cách phố cổ',
    seoDescription: 'Hội An Golden Sea - khu nghỉ dưỡng 22.5ha ven biển với kiến trúc phố cổ Hội An được tái hiện đầy tinh tế.',
  },
  {
    name: 'Aria Đà Nẵng',
    description: rt('Tổ hợp căn hộ cao cấp trên vịnh Đà Nẵng với thiết kế mở, tận dụng tối đa tầm nhìn biển xanh và bầu trời trong lành, tiêu chuẩn resort 5 sao.'),
    investorName: 'Novaland',
    totalArea: 5.1, totalUnits: 900, priceFrom: 4500, priceTo: 12000,
    propertyTypes: ['apartment', 'condotel'],
    startDate: '2022-07-01', completionDate: '2026-06-30',
    provinceCode: '48', wardCode: '20224',
    address: 'Phường Phước Mỹ, Sơn Trà, Đà Nẵng',
    latitude: 16.0620, longitude: 108.2516,
    zones: [
      { name: 'Sky Villas', description: 'Căn hộ penthouse và sky villa', totalUnits: 200, status: 'selling' },
      { name: 'Sea View', description: 'Căn hộ view biển trực tiếp', totalUnits: 400, status: 'selling' },
      { name: 'City View', description: 'Căn hộ view thành phố', totalUnits: 300, status: 'upcoming' },
    ],
    status: 'active', isFeatured: false,
    seoTitle: 'Aria Đà Nẵng - Căn hộ resort 5 sao view vịnh',
    seoDescription: 'Aria Đà Nẵng - tổ hợp căn hộ 5 sao trên vịnh Đà Nẵng với tầm nhìn biển tuyệt đẹp chuẩn resort.',
  },

  // NHA TRANG - KHÁNH HÒA
  {
    name: 'Nha Trang Gateway',
    description: rt('Tổ hợp thương mại - căn hộ - condotel biển tại trung tâm Nha Trang với thiết kế cửa ngõ đô thị hiện đại, tích hợp trung tâm mua sắm và khách sạn 5 sao.'),
    investorName: 'Sun Group',
    totalArea: 4.5, totalUnits: 1500, priceFrom: 3500, priceTo: 11000,
    propertyTypes: ['apartment', 'condotel', 'shophouse'],
    startDate: '2020-03-01', completionDate: '2025-03-31',
    provinceCode: '56', wardCode: '22321',
    address: 'Phường Vĩnh Hòa, TP. Nha Trang, Tỉnh Khánh Hòa',
    latitude: 12.2690, longitude: 109.1947,
    zones: [
      { name: 'Gateway Tower A', description: 'Tháp condotel 5 sao mặt biển', totalUnits: 500, status: 'sold_out' },
      { name: 'Gateway Tower B', description: 'Tháp căn hộ cao cấp', totalUnits: 600, status: 'selling' },
      { name: 'Shophouse', description: 'Shophouse thương mại mặt đường', totalUnits: 400, status: 'upcoming' },
    ],
    status: 'active', isFeatured: true,
    seoTitle: 'Nha Trang Gateway - Condotel biển trung tâm Nha Trang',
    seoDescription: 'Nha Trang Gateway - tổ hợp thương mại biển 4.5ha tại trung tâm TP. Nha Trang với khách sạn 5 sao.',
  },
  {
    name: 'Cam Ranh Bay Hotels & Resorts',
    description: rt('Quần thể nghỉ dưỡng 5 sao tại bán đảo Cam Ranh với bãi biển riêng, villa trên đồi và condotel mang lại trải nghiệm nghỉ dưỡng đẳng cấp quốc tế.'),
    investorName: 'Sun Group',
    totalArea: 35.2, totalUnits: 600, priceFrom: 5500, priceTo: 25000,
    propertyTypes: ['condotel', 'villa'],
    startDate: '2018-09-01', completionDate: '2023-12-31',
    provinceCode: '56', wardCode: '22642',
    address: 'Bán đảo Cam Ranh, TP. Cam Ranh, Tỉnh Khánh Hòa',
    latitude: 11.9203, longitude: 109.1561,
    zones: [
      { name: 'Hillside Villas', description: 'Villa trên đồi view biển', totalUnits: 150, status: 'sold_out' },
      { name: 'Beachfront Condotel', description: 'Condotel mặt biển', totalUnits: 300, status: 'selling' },
      { name: 'Lagoon Villas', description: 'Villa bên đầm phá', totalUnits: 150, status: 'upcoming' },
    ],
    status: 'active', isFeatured: false,
    seoTitle: 'Cam Ranh Bay - Resort 5 sao bán đảo Cam Ranh',
    seoDescription: 'Cam Ranh Bay Hotels & Resorts - quần thể nghỉ dưỡng 35ha với bãi biển riêng tại bán đảo Cam Ranh.',
  },
  {
    name: 'Panorama Nha Trang',
    description: rt('Tổ hợp condotel - căn hộ nghỉ dưỡng view biển toàn cảnh tại Nha Trang với cam kết lợi nhuận 10%/năm và mô hình quản lý vận hành 5 sao.'),
    investorName: 'Hưng Thịnh Corp',
    totalArea: 3.2, totalUnits: 1000, priceFrom: 3000, priceTo: 8500,
    propertyTypes: ['condotel', 'apartment'],
    startDate: '2021-06-01', completionDate: '2025-06-30',
    provinceCode: '56', wardCode: '22309',
    address: 'Phường Lộc Thọ, TP. Nha Trang, Tỉnh Khánh Hòa',
    latitude: 12.2540, longitude: 109.1942,
    zones: [
      { name: 'North Tower', description: 'Tháp phía bắc view vịnh', totalUnits: 500, status: 'selling' },
      { name: 'South Tower', description: 'Tháp phía nam view biển', totalUnits: 500, status: 'upcoming' },
    ],
    status: 'active', isFeatured: false,
    seoTitle: 'Panorama Nha Trang - Condotel view biển toàn cảnh',
    seoDescription: 'Panorama Nha Trang - condotel nghỉ dưỡng 5 sao với cam kết lợi nhuận 10%/năm tại TP. Nha Trang.',
  },

  // BÌNH DƯƠNG
  {
    name: 'Phúc An City',
    description: rt('Khu đô thị kiểu mẫu tại Bàu Bàng, Bình Dương với quy hoạch bài bản, hạ tầng đồng bộ, đất nền và nhà phố thương mại phục vụ nhu cầu ở thực và đầu tư.'),
    investorName: 'Nam Long Group',
    totalArea: 40.5, totalUnits: 2500, priceFrom: 1200, priceTo: 4500,
    propertyTypes: ['land', 'house', 'shophouse'],
    startDate: '2020-04-01', completionDate: '2026-06-30',
    provinceCode: '74', wardCode: '25948',
    address: 'Xã Trừ Văn Thố, Bàu Bàng, Bình Dương',
    latitude: 11.1984, longitude: 106.6512,
    zones: [
      { name: 'Phân khu 1', description: 'Đất nền nhà ở thương mại', totalUnits: 800, status: 'sold_out' },
      { name: 'Phân khu 2', description: 'Nhà phố liên kế', totalUnits: 700, status: 'selling' },
      { name: 'Phân khu 3', description: 'Shophouse mặt đại lộ', totalUnits: 400, status: 'selling' },
      { name: 'Phân khu 4', description: 'Đất nền giai đoạn mới', totalUnits: 600, status: 'upcoming' },
    ],
    status: 'active', isFeatured: false,
    seoTitle: 'Phúc An City - Đô thị kiểu mẫu Bàu Bàng Bình Dương',
    seoDescription: 'Phúc An City 40.5ha tại Bàu Bàng Bình Dương - đất nền nhà phố hạ tầng đồng bộ giá hợp lý.',
  },
  {
    name: 'The Standard Bình Dương',
    description: rt('Căn hộ tiêu chuẩn quốc tế tại thành phố mới Bình Dương với mức giá hợp lý, thiết kế tối ưu công năng và kết nối thuận tiện đến Hồ Chí Minh.'),
    investorName: 'Hưng Thịnh Corp',
    totalArea: 6.2, totalUnits: 2800, priceFrom: 1600, priceTo: 3500,
    propertyTypes: ['apartment'],
    startDate: '2021-03-01', completionDate: '2024-09-30',
    provinceCode: '74', wardCode: '25831',
    address: 'Thành phố mới Bình Dương, Phường Hòa Phú, Thủ Dầu Một, Bình Dương',
    latitude: 11.0128, longitude: 106.6612,
    zones: [
      { name: 'Block A', description: 'Tháp căn hộ phía đông', totalUnits: 700, status: 'sold_out' },
      { name: 'Block B', description: 'Tháp căn hộ phía tây', totalUnits: 700, status: 'selling' },
      { name: 'Block C', description: 'Tháp căn hộ mới', totalUnits: 700, status: 'selling' },
      { name: 'Block D', description: 'Tháp căn hộ sắp ra mắt', totalUnits: 700, status: 'upcoming' },
    ],
    status: 'active', isFeatured: false,
    seoTitle: 'The Standard Bình Dương - Căn hộ chuẩn quốc tế giá hợp lý',
    seoDescription: 'The Standard Bình Dương - căn hộ tiêu chuẩn quốc tế 6.2ha tại TP. Bình Dương giá từ 1.6 tỷ.',
  },
  {
    name: 'Lovera Vista Bình Chánh',
    description: rt('Khu đô thị xanh Lovera Vista với chuỗi hồ sinh thái, vườn hoa cây cảnh nội khu và hệ thống tiện ích cộng đồng phong phú tại Bình Chánh, TP.HCM.'),
    investorName: 'Hưng Thịnh Corp',
    totalArea: 16.8, totalUnits: 2200, priceFrom: 1900, priceTo: 5500,
    propertyTypes: ['apartment', 'house'],
    startDate: '2020-08-01', completionDate: '2025-08-31',
    provinceCode: '74', wardCode: '25897',
    address: 'Xã Phong Phú, Huyện Bình Chánh, TP. Hồ Chí Minh',
    latitude: 10.7023, longitude: 106.6301,
    zones: [
      { name: 'Khu căn hộ Lotus', description: 'Khu căn hộ với hồ sen', totalUnits: 600, status: 'sold_out' },
      { name: 'Khu căn hộ Rose', description: 'Khu căn hộ với vườn hoa', totalUnits: 700, status: 'selling' },
      { name: 'Khu nhà phố', description: 'Nhà phố liên kế với sân vườn', totalUnits: 400, status: 'selling' },
      { name: 'Khu biệt thự', description: 'Biệt thự nội khu', totalUnits: 500, status: 'upcoming' },
    ],
    status: 'active', isFeatured: false,
    seoTitle: 'Lovera Vista - Đô thị xanh sinh thái Bình Chánh',
    seoDescription: 'Lovera Vista 16.8ha tại Bình Chánh - khu đô thị xanh với chuỗi hồ sinh thái và tiện ích phong phú.',
  },

  // ĐỒNG NAI
  {
    name: 'Aqua City Novaland',
    description: rt('Thành phố đảo xanh trên sông Đồng Nai với 70% mảng xanh mặt nước, cầu tàu du thuyền, hệ tiện ích resort 5 sao và hơn 600 héc ta quy hoạch bài bản.'),
    investorName: 'Novaland',
    totalArea: 1000, totalUnits: 20000, priceFrom: 2800, priceTo: 15000,
    propertyTypes: ['apartment', 'villa', 'house', 'shophouse'],
    startDate: '2019-05-01', completionDate: '2028-12-31',
    provinceCode: '75', wardCode: '26479',
    address: 'Xã Long Hưng, Biên Hòa, Đồng Nai',
    latitude: 10.9498, longitude: 106.9012,
    zones: [
      { name: 'The Sunrise', description: 'Khu căn hộ bình minh ven sông', totalUnits: 4000, status: 'selling' },
      { name: 'The Island', description: 'Khu biệt thự đảo xanh', totalUnits: 800, status: 'selling' },
      { name: 'The Marina', description: 'Khu cầu tàu du thuyền', totalUnits: 500, status: 'upcoming' },
      { name: 'Crystal Waters', description: 'Phân khu ven sông mới nhất', totalUnits: 3000, status: 'upcoming' },
    ],
    status: 'active', isFeatured: true,
    seoTitle: 'Aqua City Novaland - Thành phố đảo xanh sông Đồng Nai',
    seoDescription: 'Aqua City Novaland 1000ha trên sông Đồng Nai - thành phố xanh với 70% mảng xanh và tiện ích 5 sao.',
  },
  {
    name: 'Izumi City',
    description: rt('Khu đô thị Nhật Bản đầu tiên tại Việt Nam ở Biên Hòa với chuỗi tiện ích và kiến trúc thuần Nhật, trường học quốc tế và khu thương mại Nhật Bản chính hãng.'),
    investorName: 'Nam Long Group',
    totalArea: 170, totalUnits: 5000, priceFrom: 2500, priceTo: 12000,
    propertyTypes: ['apartment', 'house', 'shophouse'],
    startDate: '2020-01-01', completionDate: '2027-06-30',
    provinceCode: '75', wardCode: '26371',
    address: 'Phường Tân Hiệp, Biên Hòa, Đồng Nai',
    latitude: 10.9328, longitude: 106.8432,
    zones: [
      { name: 'Kotobuki', description: 'Khu căn hộ phong cách Nhật', totalUnits: 1200, status: 'sold_out' },
      { name: 'Hanami', description: 'Khu nhà phố hoa anh đào', totalUnits: 800, status: 'selling' },
      { name: 'Sakura', description: 'Khu biệt thự sakura', totalUnits: 600, status: 'selling' },
      { name: 'Fuji', description: 'Khu thương mại Nhật Bản', totalUnits: 400, status: 'upcoming' },
    ],
    status: 'active', isFeatured: false,
    seoTitle: 'Izumi City - Khu đô thị Nhật Bản tại Biên Hòa',
    seoDescription: 'Izumi City 170ha tại Biên Hòa - khu đô thị Nhật Bản với kiến trúc và tiện ích chuẩn Nhật đầu tiên tại VN.',
  },

  // BÀ RỊA - VŨNG TÀU
  {
    name: 'Mövenpick Waverly Phú Quốc',
    description: rt('Quần thể nghỉ dưỡng sinh thái tại Phú Quốc với thương hiệu Mövenpick quản lý vận hành, bãi biển riêng, bungalow trên cây và villa ven biển đẳng cấp.'),
    investorName: 'Sun Group',
    totalArea: 50, totalUnits: 400, priceFrom: 8000, priceTo: 45000,
    propertyTypes: ['villa', 'condotel'],
    startDate: '2020-10-01', completionDate: '2024-12-31',
    provinceCode: '68', wardCode: '28114',
    address: 'Xã Hàm Ninh, Phú Quốc, Kiên Giang',
    latitude: 10.1312, longitude: 104.0201,
    zones: [
      { name: 'Beachfront Villas', description: 'Villa mặt biển hạng sang', totalUnits: 100, status: 'sold_out' },
      { name: 'Garden Villas', description: 'Villa trong vườn nhiệt đới', totalUnits: 150, status: 'selling' },
      { name: 'Treehouse Bungalows', description: 'Nhà gỗ trên cây độc đáo', totalUnits: 50, status: 'selling' },
      { name: 'Sky Villas', description: 'Villa trên đỉnh đồi', totalUnits: 100, status: 'upcoming' },
    ],
    status: 'active', isFeatured: true,
    seoTitle: 'Mövenpick Waverly - Resort 5 sao Phú Quốc',
    seoDescription: 'Mövenpick Waverly Phú Quốc - quần thể nghỉ dưỡng 50ha với bãi biển riêng và villa cao cấp tại Phú Quốc.',
  },
  {
    name: 'Biên Hoa Vũng Tàu Wellness Resort',
    description: rt('Khu nghỉ dưỡng chăm sóc sức khỏe tại Hồ Tràm, Vũng Tàu kết hợp giữa thiên nhiên biển và dịch vụ spa cao cấp, golf course và villa nghỉ dưỡng dài ngày.'),
    investorName: 'Masterise Homes',
    totalArea: 65, totalUnits: 350, priceFrom: 6000, priceTo: 35000,
    propertyTypes: ['villa', 'condotel'],
    startDate: '2021-09-01', completionDate: '2025-12-31',
    provinceCode: '77', wardCode: '26398',
    address: 'Xã Phước Thuận, Xuyên Mộc, Bà Rịa - Vũng Tàu',
    latitude: 10.4523, longitude: 107.6934,
    zones: [
      { name: 'Wellness Villas', description: 'Villa spa chăm sóc sức khỏe', totalUnits: 120, status: 'selling' },
      { name: 'Golf Residences', description: 'Nhà ở sân golf', totalUnits: 130, status: 'selling' },
      { name: 'Beachside Condotel', description: 'Condotel nghỉ dưỡng mặt biển', totalUnits: 100, status: 'upcoming' },
    ],
    status: 'active', isFeatured: false,
    seoTitle: 'Hồ Tràm Wellness Resort - Nghỉ dưỡng sức khỏe Vũng Tàu',
    seoDescription: 'Hồ Tràm Wellness Resort 65ha tại Xuyên Mộc - khu nghỉ dưỡng sức khỏe biển với spa và golf cao cấp.',
  },

  // CÁC TỈNH KHÁC
  {
    name: 'TNR Grand Đà Lạt',
    description: rt('Tổ hợp khu dân cư và biệt thự cao cấp tại trung tâm thành phố Đà Lạt với khí hậu mát mẻ quanh năm, thiết kế châu Âu lãng mạn và tiện ích nghỉ dưỡng.'),
    investorName: 'Masterise Homes',
    totalArea: 12.4, totalUnits: 600, priceFrom: 4500, priceTo: 22000,
    propertyTypes: ['villa', 'house', 'apartment'],
    startDate: '2021-11-01', completionDate: '2025-06-30',
    provinceCode: '68', wardCode: '24691',
    address: 'Phường 3, TP. Đà Lạt, Tỉnh Lâm Đồng',
    latitude: 11.9465, longitude: 108.4419,
    zones: [
      { name: 'Khu biệt thự Pháp', description: 'Biệt thự phong cách Pháp cổ điển', totalUnits: 150, status: 'selling' },
      { name: 'Khu nhà phố Đà Lạt', description: 'Nhà phố kiểu Pháp', totalUnits: 250, status: 'selling' },
      { name: 'Khu căn hộ cao tầng', description: 'Căn hộ view đồi thông', totalUnits: 200, status: 'upcoming' },
    ],
    status: 'active', isFeatured: false,
    seoTitle: 'TNR Grand Đà Lạt - Biệt thự phong cách Pháp',
    seoDescription: 'TNR Grand Đà Lạt 12.4ha - khu dân cư biệt thự phong cách châu Âu tại trung tâm TP. Đà Lạt.',
  },
  {
    name: 'Sunneva Island Cần Thơ',
    description: rt('Đảo đô thị nghỉ dưỡng trên sông Cần Thơ với mô hình đảo xanh độc đáo, villa mặt sông và condotel phong cách đồng bằng hiện đại, kết nối đường thủy tiện lợi.'),
    investorName: 'Novaland',
    totalArea: 45.3, totalUnits: 1200, priceFrom: 2000, priceTo: 10000,
    propertyTypes: ['villa', 'apartment', 'condotel'],
    startDate: '2022-05-01', completionDate: '2027-12-31',
    provinceCode: '92', wardCode: '31072',
    address: 'Phường Phước Thới, Ô Môn, Cần Thơ',
    latitude: 10.0726, longitude: 105.7621,
    zones: [
      { name: 'Waterfront Villas', description: 'Villa mặt sông hạng sang', totalUnits: 200, status: 'selling' },
      { name: 'Garden Condotel', description: 'Condotel trong vườn nhiệt đới', totalUnits: 500, status: 'selling' },
      { name: 'Riverside Apartments', description: 'Căn hộ ven sông', totalUnits: 500, status: 'upcoming' },
    ],
    status: 'active', isFeatured: false,
    seoTitle: 'Sunneva Island Cần Thơ - Đảo đô thị nghỉ dưỡng sông',
    seoDescription: 'Sunneva Island 45ha trên sông Cần Thơ - đảo đô thị xanh với villa mặt sông và condotel nghỉ dưỡng.',
  },
  {
    name: 'Thanh Hóa Beach Resort',
    description: rt('Khu nghỉ dưỡng biển cao cấp tại Sầm Sơn với đường bờ biển dài 2km, khách sạn 5 sao, condotel và villa biển phục vụ du lịch nghỉ dưỡng miền Bắc.'),
    investorName: 'Sun Group',
    totalArea: 28.6, totalUnits: 800, priceFrom: 2800, priceTo: 16000,
    propertyTypes: ['condotel', 'villa'],
    startDate: '2019-12-01', completionDate: '2024-06-30',
    provinceCode: '38', wardCode: '16126',
    address: 'Phường Trường Sơn, TP. Sầm Sơn, Tỉnh Thanh Hóa',
    latitude: 19.7413, longitude: 105.9066,
    zones: [
      { name: 'Khách sạn 5 sao', description: 'Khách sạn nghỉ dưỡng 5 sao mặt biển', totalUnits: 200, status: 'sold_out' },
      { name: 'Condotel biển', description: 'Condotel cho thuê du lịch', totalUnits: 400, status: 'selling' },
      { name: 'Villa ven biển', description: 'Villa gia đình mặt biển', totalUnits: 200, status: 'upcoming' },
    ],
    status: 'active', isFeatured: false,
    seoTitle: 'Sầm Sơn Beach Resort - Nghỉ dưỡng biển Thanh Hóa',
    seoDescription: 'Thanh Hóa Beach Resort 28.6ha tại Sầm Sơn - khu nghỉ dưỡng biển 5 sao với 2km bờ biển riêng.',
  },
  {
    name: 'Hải Phòng Marina Bay',
    description: rt('Tổ hợp căn hộ - thương mại - văn phòng ven vịnh tại TP. Hải Phòng với tầm nhìn toàn cảnh cảng quốc tế, kết nối VSIP Hải Phòng và cầu Tân Vũ - Lạch Huyện.'),
    investorName: 'Masterise Homes',
    totalArea: 7.8, totalUnits: 2500, priceFrom: 2400, priceTo: 7800,
    propertyTypes: ['apartment', 'shophouse'],
    startDate: '2022-09-01', completionDate: '2026-12-31',
    provinceCode: '31', wardCode: '12892',
    address: 'Phường Máy Chai, Ngô Quyền, Hải Phòng',
    latitude: 20.8655, longitude: 106.6991,
    zones: [
      { name: 'Marina Tower 1', description: 'Tháp căn hộ view vịnh', totalUnits: 800, status: 'selling' },
      { name: 'Marina Tower 2', description: 'Tháp căn hộ view thành phố', totalUnits: 800, status: 'selling' },
      { name: 'Harbour Podium', description: 'Khu thương mại cảng', totalUnits: 900, status: 'upcoming' },
    ],
    status: 'active', isFeatured: false,
    seoTitle: 'Hải Phòng Marina Bay - Căn hộ view cảng quốc tế',
    seoDescription: 'Hải Phòng Marina Bay 7.8ha - tổ hợp căn hộ view vịnh kết nối cảng quốc tế và VSIP Hải Phòng.',
  },
  {
    name: 'VinCity Ocean Park',
    description: rt('Đại đô thị biển hồ nước mặn đầu tiên tại miền Bắc với 16 ha mặt nước trong xanh, resort 5 sao nội khu và hệ thống tiện ích tiêu chuẩn quốc tế Vinhomes.'),
    investorName: 'Vingroup',
    totalArea: 420, totalUnits: 18000, priceFrom: 1800, priceTo: 7500,
    propertyTypes: ['apartment', 'shophouse', 'house'],
    startDate: '2019-09-01', completionDate: '2026-06-30',
    provinceCode: '01', wardCode: '09211',
    address: 'Xã Đa Tốn, Gia Lâm, Hà Nội',
    latitude: 20.9825, longitude: 105.9421,
    zones: [
      { name: 'The Star', description: 'Phân khu căn hộ ngôi sao đầu tiên', totalUnits: 3000, status: 'sold_out' },
      { name: 'The Zurich', description: 'Phân khu phong cách Thụy Sĩ', totalUnits: 3500, status: 'sold_out' },
      { name: 'The Aqua', description: 'Phân khu ven biển hồ', totalUnits: 4000, status: 'selling' },
      { name: 'The Origami', description: 'Phân khu Nhật Bản', totalUnits: 3000, status: 'upcoming' },
    ],
    status: 'active', isFeatured: true,
    seoTitle: 'VinCity Ocean Park - Đại đô thị biển hồ Gia Lâm',
    seoDescription: 'VinCity Ocean Park 420ha tại Gia Lâm - đại đô thị biển hồ nước mặn đầu tiên miền Bắc, tiện ích 5 sao.',
  },
]

type InvestorDoc = { id: number; name: string }
type MediaDoc = { id: number }

async function downloadMedia(payload: any, seed: string, alt: string): Promise<number | null> {
  const url = `https://picsum.photos/seed/${seed}/1200/800`
  console.log(`  Downloading: ${url}`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`fetch failed: ${res.status} ${url}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  console.log(`  Uploading to S3: ${seed}.jpg (${buffer.byteLength} bytes)`)
  const doc = (await payload.create({
    collection: 'media',
    data: { alt },
    file: { data: buffer, mimetype: 'image/jpeg', name: `${seed}.jpg`, size: buffer.byteLength },
  })) as MediaDoc
  console.log(`  Media created: id=${doc.id}`)
  return doc.id
}

async function run() {
  const { default: config } = await import('../src/payload.config')
  const payload = await getPayload({ config })

  // ── 1. Upsert investors ──
  const investorMap = new Map<string, number>()
  for (const inv of investorData) {
    const existing = await payload.find({
      collection: 'investors',
      where: { name: { equals: inv.name } },
      limit: 1,
      depth: 0,
    })
    if (existing.docs.length > 0) {
      const doc = existing.docs[0] as InvestorDoc
      investorMap.set(inv.name, doc.id)
      console.log(`Investor exists: ${inv.name}`)
    } else {
      const created = (await payload.create({ collection: 'investors', data: inv })) as InvestorDoc
      investorMap.set(created.name, created.id)
      console.log(`Created investor: ${created.name}`)
    }
  }

  // ── 2. Seed projects with images ──
  const FORCE = process.env.FORCE === 'true'
  let created = 0
  let skipped = 0

  for (let i = 0; i < projectData.length; i++) {
    const { investorName, ...rest } = projectData[i]

    const existing = await payload.find({
      collection: 'projects',
      where: { name: { equals: rest.name } },
      limit: 1,
      depth: 1,
    })

    if (existing.docs.length > 0) {
      const existingDoc = existing.docs[0] as any

      if (!FORCE) {
        console.log(`Skip (exists): ${rest.name}`)
        skipped++
        continue
      }

      // FORCE=true: xóa project + media cũ rồi tạo lại
      const oldThumb = existingDoc.thumbnail?.id ?? existingDoc.thumbnail
      const oldImgs = (existingDoc.images ?? []).map((img: any) => img.image?.id ?? img.image)
      for (const mediaId of [oldThumb, ...oldImgs].filter(Boolean)) {
        await payload.delete({ collection: 'media', id: mediaId }).catch(() => {})
      }
      await payload.delete({ collection: 'projects', id: existingDoc.id })
      console.log(`Force reset: ${rest.name}`)
    }

    // Tạo mới (hoặc sau khi force reset)
    console.log(`[${i + 1}/${projectData.length}] Downloading images: ${rest.name}`)
    const thumbId = await downloadMedia(payload, `proj-${i}-thumb`, `Ảnh đại diện ${rest.name}`)
    const img1Id = await downloadMedia(payload, `proj-${i}-a`, `${rest.name} - phối cảnh tổng thể`)
    const img2Id = await downloadMedia(payload, `proj-${i}-b`, `${rest.name} - tiện ích nội khu`)
    const img3Id = await downloadMedia(payload, `proj-${i}-c`, `${rest.name} - mặt bằng dự án`)

    // Determine saleStatus based on completionDate
    const now = new Date()
    const completionDate = rest.completionDate ? new Date(rest.completionDate as string) : null
    const startDate = rest.startDate ? new Date(rest.startDate as string) : null
    let saleStatus: 'active' | 'upcoming' | 'completed' = 'active'
    if (completionDate && completionDate < now) {
      saleStatus = 'completed'
    } else if (startDate && startDate > now) {
      saleStatus = 'upcoming'
    }

    const investorId = investorMap.get(investorName)
    const data: Record<string, unknown> = { ...rest, saleStatus }
    if (investorId) data.investor = investorId
    if (thumbId) data.thumbnail = thumbId
    data.images = [
      ...(img1Id ? [{ image: img1Id, caption: `${rest.name} - phối cảnh tổng thể` }] : []),
      ...(img2Id ? [{ image: img2Id, caption: `${rest.name} - tiện ích nội khu` }] : []),
      ...(img3Id ? [{ image: img3Id, caption: `${rest.name} - mặt bằng dự án` }] : []),
    ]

    await payload.create({ collection: 'projects', data: data as any })
    console.log(`Created: ${rest.name}`)
    created++
  }

  console.log(`\nDone — ${created} projects created, ${skipped} skipped`)
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
