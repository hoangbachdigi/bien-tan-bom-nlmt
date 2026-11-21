const SOLAR_PANELS_DB = [
    // === HÃNG JINKO SOLAR 2 MẶT KÍNH (23 MÃ: 530W - 635W) ===
    { brand: "Jinko Solar", name: "Jinko Solar 530W (JKM530M-72HL4-BDVP)", power: 530, imp: 13.09, vmp: 40.49, voc: 48.99, priceWp: 2800 },
    { brand: "Jinko Solar", name: "Jinko Solar 535W (JKM535M-72HL4-BDVP)", power: 535, imp: 13.17, vmp: 40.63, voc: 49.13, priceWp: 2820 },
    { brand: "Jinko Solar", name: "Jinko Solar 540W (JKM540M-72HL4-BDVP)", power: 540, imp: 13.25, vmp: 40.76, voc: 49.26, priceWp: 2840 },
    { brand: "Jinko Solar", name: "Jinko Solar 545W (JKM545M-72HL4-BDVP)", power: 545, imp: 13.33, vmp: 40.89, voc: 49.39, priceWp: 2860 },
    { brand: "Jinko Solar", name: "Jinko Solar 550W (JKM550M-72HL4-BDVP)", power: 550, imp: 13.41, vmp: 41.02, voc: 49.52, priceWp: 2880 },
    { brand: "Jinko Solar", name: "Jinko Solar 560W (JKM560N-72HL4-BDV)", power: 560, imp: 13.35, vmp: 41.95, voc: 50.67, priceWp: 2900 },
    { brand: "Jinko Solar", name: "Jinko Solar 565W (JKM565N-72HL4-BDV)", power: 565, imp: 13.41, vmp: 42.14, voc: 50.87, priceWp: 2910 },
    { brand: "Jinko Solar", name: "Jinko Solar 570W (JKM570N-72HL4-BDV)", power: 570, imp: 13.48, vmp: 42.29, voc: 51.07, priceWp: 2920 },
    { brand: "Jinko Solar", name: "Jinko Solar 575W (JKM575N-72HL4-BDV)", power: 575, imp: 13.55, vmp: 42.44, voc: 51.27, priceWp: 2930 },
    { brand: "Jinko Solar", name: "Jinko Solar 580W (JKM580N-72HL4-BDV)", power: 580, imp: 13.22, vmp: 43.88, voc: 52.50, priceWp: 2950 },
    { brand: "Jinko Solar", name: "Jinko Solar 590W 156-cell (JKM590N-78HL4-BDV)", power: 590, imp: 13.14, vmp: 44.91, voc: 54.76, priceWp: 2965 },
    { brand: "Jinko Solar", name: "Jinko Solar 595W 156-cell (JKM595N-78HL4-BDV)", power: 595, imp: 13.20, vmp: 45.08, voc: 54.90, priceWp: 2970 },
    { brand: "Jinko Solar", name: "Jinko Solar 600W 132-cell (JKM600N-66HL4M-BDV)", power: 600, imp: 14.89, vmp: 40.30, voc: 48.43, priceWp: 2970 },
    { brand: "Jinko Solar", name: "Jinko Solar 600W 156-cell (JKM600N-78HL4-BDV)", power: 600, imp: 13.26, vmp: 45.25, voc: 55.03, priceWp: 2975 },
    { brand: "Jinko Solar", name: "Jinko Solar 605W 132-cell (JKM605N-66HL4M-BDV)", power: 605, imp: 14.95, vmp: 40.47, voc: 48.61, priceWp: 2980 },
    { brand: "Jinko Solar", name: "Jinko Solar 605W 156-cell (JKM605N-78HL4-BDV)", power: 605, imp: 13.32, vmp: 45.42, voc: 55.17, priceWp: 2985 },
    { brand: "Jinko Solar", name: "Jinko Solar 610W 132-cell (JKM610N-66HL4M-BDV)", power: 610, imp: 15.01, vmp: 40.64, voc: 48.79, priceWp: 2990 },
    { brand: "Jinko Solar", name: "Jinko Solar 610W 156-cell (JKM610N-78HL4-BDV)", power: 610, imp: 13.38, vmp: 45.60, voc: 55.31, priceWp: 2995 },
    { brand: "Jinko Solar", name: "Jinko Solar 615W (JKM615N-66HL4M-BDV)", power: 615, imp: 15.07, vmp: 40.81, voc: 48.97, priceWp: 3000 },
    { brand: "Jinko Solar", name: "Jinko Solar 620W (JKM620N-66HL4M-BDV)", power: 620, imp: 15.22, vmp: 40.74, voc: 49.08, priceWp: 3010 },
    { brand: "Jinko Solar", name: "Jinko Solar 625W (JKM625N-66HL4M-BDV)", power: 625, imp: 15.29, vmp: 40.90, voc: 49.28, priceWp: 3020 },
    { brand: "Jinko Solar", name: "Jinko Solar 630W (JKM630N-66HL4M-BDV)", power: 630, imp: 15.36, vmp: 41.02, voc: 49.48, priceWp: 3060 },
    { brand: "Jinko Solar", name: "Jinko Solar 635W (JKM635N-66HL4M-BDV)", power: 635, imp: 15.42, vmp: 41.18, voc: 49.68, priceWp: 3090 },

    // === HÃNG ASTRONERGY 2 MẶT KÍNH (6 MÃ: 570W - 595W) ===
    { brand: "Astronergy", name: "Astronergy 570W (CHSM72N(DG)/F-BH-570)", power: 570, imp: 13.33, vmp: 42.77, voc: 50.90, priceWp: 2820 },
    { brand: "Astronergy", name: "Astronergy 575W (CHSM72N(DG)/F-BH-575)", power: 575, imp: 13.39, vmp: 42.94, voc: 51.10, priceWp: 2830 },
    { brand: "Astronergy", name: "Astronergy 580W (CHSM72N(DG)/F-BH-580)", power: 580, imp: 13.45, vmp: 43.11, voc: 51.30, priceWp: 2840 },
    { brand: "Astronergy", name: "Astronergy 585W (CHSM72N(DG)/F-BH-585)", power: 585, imp: 13.52, vmp: 43.27, voc: 51.50, priceWp: 2850 },
    { brand: "Astronergy", name: "Astronergy 590W (CHSM72N(DG)/F-BH-590)", power: 590, imp: 13.58, vmp: 43.45, voc: 51.70, priceWp: 2860 },
    { brand: "Astronergy", name: "Astronergy 595W (CHSM72N/F-BH-595)", power: 595, imp: 13.46, vmp: 44.21, voc: 52.81, priceWp: 2880 },

    // === HÃNG TRINA SOLAR & TCL SOLAR 2 MẶT KÍNH (625W) ===
    { brand: "Trina Solar", name: "Trina Solar 625W (TSM-NEG19RC.20)", power: 625, imp: 15.06, vmp: 41.50, voc: 49.80, priceWp: 3020 },
    { brand: "TCL Solar", name: "TCL Solar 625W (TCL-625-132-210R)", power: 625, imp: 15.26, vmp: 40.98, voc: 49.30, priceWp: 2980 }
];

const SOLAR_INVERTERS_DB = [
    { brand: "Power S", name: "Power S SG800-7K5GB-4T (7.5kW - 17A - 3P 380V)", kw: 7.5, phase: "3 pha 380V", iOut: 17, vdcMax: 900, idcMax: 30, mpptMin: 550, mpptMax: 680, price: 8200000 },
    { brand: "Power S", name: "Power S SG800-011GB-4T (11kW - 25A - 3P 380V)", kw: 11, phase: "3 pha 380V", iOut: 25, vdcMax: 900, idcMax: 40, mpptMin: 550, mpptMax: 680, price: 10500000 },
    { brand: "Power S", name: "Power S SG800-015GB-4T (15kW - 32A - 3P 380V)", kw: 15, phase: "3 pha 380V", iOut: 32, vdcMax: 900, idcMax: 40, mpptMin: 550, mpptMax: 680, price: 13200000 },
    { brand: "Power S", name: "Power S SG800-022GB-4T (22kW - 45A - 3P 380V)", kw: 22, phase: "3 pha 380V", iOut: 45, vdcMax: 900, idcMax: 65, mpptMin: 550, mpptMax: 680, price: 18500000 },
    { brand: "SAJ", name: "SAJ PDS33-4T011B-EH (11kW - 25A - 3P 380V)", kw: 11, phase: "3 pha 380V", iOut: 25, vdcMax: 900, idcMax: 42, mpptMin: 550, mpptMax: 680, price: 14500000 },
    { brand: "SAJ", name: "SAJ PDS33-4T015B-EH (15kW - 32A - 3P 380V)", kw: 15, phase: "3 pha 380V", iOut: 32, vdcMax: 900, idcMax: 50, mpptMin: 550, mpptMax: 680, price: 17800000 },
    { brand: "SAJ", name: "SAJ SC10-4T011-EH (11kW - 25A - 3P 380V)", kw: 11, phase: "3 pha 380V", iOut: 25, vdcMax: 900, idcMax: 32, mpptMin: 550, mpptMax: 680, price: 13800000 },
    { brand: "SAJ", name: "SAJ SC10-4T022-EH (22kW - 45A - 3P 380V)", kw: 22, phase: "3 pha 380V", iOut: 45, vdcMax: 900, idcMax: 57.6, mpptMin: 550, mpptMax: 680, price: 24800000 },
    { brand: "Green Nova", name: "Green Nova AC600-5R5G-4 (5.5kW - 13A - 3P 380V)", kw: 5.5, phase: "3 pha 380V", iOut: 13, vdcMax: 950, idcMax: 25, mpptMin: 540, mpptMax: 720, price: 7300000 },
    { brand: "Green Nova", name: "Green Nova AC600-7R5G-4 (7.5kW - 17A - 3P 380V)", kw: 7.5, phase: "3 pha 380V", iOut: 17, vdcMax: 950, idcMax: 32, mpptMin: 540, mpptMax: 720, price: 8600000 },
    { brand: "Green Nova", name: "Green Nova AC600-011G-4 (11kW - 25A - 3P 380V)", kw: 11, phase: "3 pha 380V", iOut: 25, vdcMax: 950, idcMax: 42, mpptMin: 540, mpptMax: 720, price: 11200000 },
    { brand: "Voltique", name: "Voltique YK500-7.5KW-T4 (7.5kW - 17A - 3P 380V)", kw: 7.5, phase: "3 pha 380V", iOut: 17, vdcMax: 950, idcMax: 26, mpptMin: 540, mpptMax: 750, price: 8900000 },
    { brand: "Voltique", name: "Voltique YK500-15KW-T4 (15kW - 32A - 3P 380V)", kw: 15, phase: "3 pha 380V", iOut: 32, vdcMax: 950, idcMax: 52, mpptMin: 540, mpptMax: 750, price: 14200000 }
];
const MOCK_PRODUCTS = [
    {
        title: "Biến Tần Bơm NLMT Power S SG800-7K5GB-4T (7.5kW - 3P 380V)",
        img: "https://unsplash.com",
        specs: "Model: Power S SG800-7K5GB-4T | Công suất định mức: 7.5kW (10HP) - Dòng ra 17A | Điện áp đầu vào DC: 250V – 900VDC | Điện áp đầu vào/ra AC: 3 Pha 380V–440V | Thuật toán dò điểm công suất cực đại MPPT 99.5% | Bảo vệ chạy khô, mất pha, quá áp, quá dòng | Bảo hành chính hãng 24 tháng"
    },
    {
        title: "Biến Tần Bơm NLMT Power S SG800-011GB-4T (11kW - 3P 380V)",
        img: "https://unsplash.com",
        specs: "Model: Power S SG800-011GB-4T | Công suất định mức: 11kW (15HP) - Dòng ra 25A | Điện áp đầu vào DC: 250V – 900VDC | Điện áp đầu vào/ra AC: 3 Pha 380V–440V | Chuyên trị bơm hỏa tiễn 7.5kW (10HP) đẩy dốc cao | Tự động chạy khi có nắng và ngủ đông khi mây mù | Bảo hành chính hãng 24 tháng"
    },
    {
        title: "Biến Tần Bơm NLMT Power S SG800-015GB-4T (15kW - 3P 380V)",
        img: "https://unsplash.com",
        specs: "Model: Power S SG800-015GB-4T | Công suất định mức: 15kW (20HP) - Dòng ra 32A | Điện áp đầu vào DC: 250V – 900VDC | Điện áp đầu vào/ra AC: 3 Pha 380V–440V | Chuyên trị bơm hỏa tiễn 11kW (15HP) giếng sâu | Tản nhiệt nhôm đúc nguyên khối kèm quạt làm mát | Bảo hành chính hãng 24 tháng"
    },
    {
        title: "Biến Tần Bơm NLMT Power S SG800-022GB-4T (22kW - 3P 380V)",
        img: "https://unsplash.com",
        specs: "Model: Power S SG800-022GB-4T | Công suất định mức: 22kW (30HP) - Dòng ra 45A | Điện áp đầu vào DC: 250V – 900VDC | Điện áp đầu vào/ra AC: 3 Pha 380V–440V | Chuyên trị bơm công suất lớn 15kW – 18.5kW tưới đồi dốc | Hỗ trợ chuyển đổi linh hoạt nguồn Solar DC và lưới AC | Bảo hành chính hãng 24 tháng"
    },
    {
        title: "Biến Tần Bơm NLMT SAJ PDS33-4T011B-EH (11kW - 3P 380V)",
        img: "https://unsplash.com",
        specs: "Model: SAJ PDS33-4T011B-EH | Công suất định mức: 11kW (15HP) - Dòng ra 25A | Điện áp đầu vào DC: 220V – 900VDC | Điện áp đầu vào/ra AC: 3 Pha 380V–440V | Thương hiệu SAJ tiêu chuẩn công nghiệp độ bền vượt trội | Bảo vệ toàn diện quá áp, thấp áp, kẹt cánh bơm | Bảo hành chính hãng 24 tháng"
    },
    {
        title: "Biến Tần Bơm NLMT SAJ PDS33-4T015B-EH (15kW - 3P 380V)",
        img: "https://unsplash.com",
        specs: "Model: SAJ PDS33-4T015B-EH | Công suất định mức: 15kW (20HP) - Dòng ra 32A | Điện áp đầu vào DC: 220V – 900VDC | Điện áp đầu vào/ra AC: 3 Pha 380V–440V | Vận hành ổn định trong môi trường nhiệt độ cao Tây Nguyên | Tích hợp chức năng bảo vệ giếng cạn nước thông minh | Bảo hành chính hãng 24 tháng"
    },
    {
        title: "Biến Tần Bơm NLMT SAJ SC10-4T011-EH (11kW - 3P 380V)",
        img: "https://unsplash.com",
        specs: "Model: SAJ SC10-4T011-EH | Công suất định mức: 11kW (15HP) - Dòng ra Max 25A | Dải MPPT: 200V – 900VDC (Max 900VDC, Dòng PV Max 16A×2) | Dòng chuyên dụng Solar Pump Controller thế hệ mới của SAJ | Khởi động cực nhạy ngay từ sáng sớm nắng nhẹ | Bảo hành chính hãng 24 tháng"
    },
    {
        title: "Biến Tần Bơm NLMT SAJ SC10-4T022-EH (22kW - 3P 380V)",
        img: "https://unsplash.com",
        specs: "Model: SAJ SC10-4T022-EH | Công suất định mức: 22kW (30HP) - Dòng ra Max 45A | Dải MPPT: 200V – 900VDC (Max 900VDC, Dòng PV Max 14.4A×4) | Chuyên trị bơm công suất lớn tưới quy mô trang trại | Hỗ trợ giám sát từ xa và bảo vệ toàn diện động cơ | Bảo hành chính hãng 24 tháng"
    },
    {
        title: "Biến Tần Bơm NLMT Green Nova AC600-5R5G-4 (5.5kW - Max 950V)",
        img: "https://unsplash.com",
        specs: "Model: Green Nova AC600-5R5G-4 | Công suất định mức: 5.5kW (7.5HP) - Dòng ra 13A/17A | Điện áp đầu vào DC rộng: 250V – 950VDC | Chịu điện áp cao lên tới 950VDC an toàn tuyệt đối buổi sáng lạnh | Chuyên trị bơm 3kW – 4kW (4HP – 5.5HP) | Bảo hành chính hãng 24 tháng"
    },
    {
        title: "Biến Tần Bơm NLMT Green Nova AC600-7R5G-4 (7.5kW - Max 950V)",
        img: "https://unsplash.com",
        specs: "Model: Green Nova AC600-7R5G-4 | Công suất định mức: 7.5kW (10HP) - Dòng ra 17A/25A | Điện áp đầu vào DC rộng: 250V – 950VDC | Dải điện áp hoạt động cao giúp giảm số chuỗi đấu song song | Chuyên trị bơm hỏa tiễn 5.5kW (7.5HP) | Bảo hành chính hãng 24 tháng"
    },
    {
        title: "Biến Tần Bơm NLMT Green Nova AC600-011G-4 (11kW - Max 950V)",
        img: "https://unsplash.com",
        specs: "Model: Green Nova AC600-011G-4 | Công suất định mức: 11kW (15HP) - Dòng ra 25A/32A | Điện áp đầu vào DC rộng: 250V – 950VDC | Chuyên trị bơm hỏa tiễn 7.5kW (10HP) giếng sâu, đồi dốc | Vận hành êm ái, hiệu suất MPPT 99.5% | Bảo hành chính hãng 24 tháng"
    },
    {
        title: "Biến Tần Bơm NLMT Voltique YK500-7.5KW-T4 (7.5kW - Max 950V)",
        img: "https://unsplash.com",
        specs: "Model: Voltique YK500-7.5KW-T4 | Công suất định mức: 7.5kW (10HP) - Dòng ra 17A/25A | Ngưỡng chịu áp DC tối đa lên đến 950VDC | Chuyên trị bơm hỏa tiễn 5.5kW (7.5HP) giếng sâu, đồi dốc | Đấu nối linh hoạt chuỗi pin dài không lo báo lỗi quá áp sáng sớm | Bảo hành chính hãng 24 tháng"
    },
    {
        title: "Biến Tần Bơm NLMT Voltique YK500-15KW-T4 (15kW - Max 950V)",
        img: "https://unsplash.com",
        specs: "Model: Voltique YK500-15KW-T4 | Công suất định mức: 15kW (20HP) - Dòng ra 32A/37A | Ngưỡng chịu áp DC tối đa lên đến 950VDC | Đấu nối linh hoạt chuỗi pin dài không lo báo lỗi quá áp sáng sớm | Chuyên trị bơm 11kW (15HP) đẩy cao | Bảo hành chính hãng 24 tháng"
    },
    {
        title: "Tấm Pin Năng Lượng Mặt Trời Jinko Solar 530W–550W (Tiger Pro 72HC)",
        img: "https://unsplash.com",
        specs: "Dải công suất sẵn kho: 530W, 535W, 540W, 545W, 550W | Công nghệ Mono P-Type 2 mặt kính cường lực (Bifacial) | Điện áp làm việc Vmp: 40.49V – 41.02V | Điện áp hở mạch Voc: 48.99V – 49.52V | Bảo hành vật lý 12 năm, hiệu suất 30 năm"
    },
    {
        title: "Tấm Pin Năng Lượng Mặt Trời Astronergy 570W–595W (ASTRO N5)",
        img: "https://unsplash.com",
        specs: "Dải công suất sẵn kho: 570W, 575W, 580W, 585W, 590W, 595W | Công nghệ N-Type TOPCon 2 mặt kính cường lực | Điện áp làm việc Vmp: 42.77V – 44.21V | Điện áp hở mạch Voc: 50.90V – 52.81V | Bảo hành vật lý 15 năm, hiệu suất 30 năm"
    },
    {
        title: "Tấm Pin Năng Lượng Mặt Trời Jinko Solar 560W–585W (Tiger Neo / Eagle)",
        img: "https://unsplash.com",
        specs: "Dải công suất sẵn kho: 560W, 565W, 570W, 575W, 580W, 585W | Công nghệ N-Type TOPCon 2 mặt kính cường lực (Bifacial) | Điện áp hở mạch Voc: 50.67V – 52.70V | Hiệu suất cao tới 22.65%, chống suy giảm PID | Bảo hành vật lý 12 năm, hiệu suất 30 năm"
    },
    {
        title: "Tấm Pin Năng Lượng Mặt Trời Jinko Solar 600W–635W (Tiger Neo 66HL4M)",
        img: "https://unsplash.com",
        specs: "Dải công suất sẵn kho: 600W, 605W, 610W, 615W, 620W, 625W, 630W, 635W | Có đủ phiên bản 2 mặt kính (BDV) và 1 mặt kính (V) | Dòng làm việc Imp cao ~15.0A – 15.36A tối ưu cho hệ bơm 1 chuỗi | Bảo hành vật lý 12 năm, hiệu suất 30 năm"
    }
];

const MOCK_ERRORS = [
    // === HÃNG POWER S (SG600 / SG800 SERIES - TRỌN BỘ 30 MÃ LỖI & CẢNH BÁO) ===
    { brand: "PowerS", code: "A.SLP (81)", desc: "Chế độ ngủ đông (Yếu nắng / Thiếu áp)", fix: "1. Kiểm tra công suất dàn pin (cần >= 1.3 lần công suất bơm). 2. Kiểm tra áp Vmp (khuyến nghị >= 1.41 x áp AC bơm). 3. Tăng độ lợi MPPT tại PE-04, PE-05. 4. Kiểm tra ngưỡng áp ngủ đông PE-16." },
    { brand: "PowerS", code: "A.LFr (82)", desc: "Bảo vệ chạy tần số thấp", fix: "Tần số ngõ ra thấp hơn mức cài đặt tại PE-19. Hãy giảm giá trị cài đặt tại tham số PE-19 nếu cần thiết." },
    { brand: "PowerS", code: "A.LLd (83)", desc: "Bảo vệ chạy khô / non tải (Cạn nước)", fix: "Giảm giá trị cài đặt tại tham số PE-22 để tắt hoặc hạ ngưỡng cảnh báo chạy khô này." },
    { brand: "PowerS", code: "A.OLd (84)", desc: "Bảo vệ quá dòng / quá tải bơm", fix: "Tăng ngưỡng bảo vệ quá dòng tại tham số PE-25 (nếu cài quá thấp) hoặc cài về 0 để tắt." },
    { brand: "PowerS", code: "A.LPr (85)", desc: "Cảnh báo công suất đầu vào tối thiểu", fix: "Cài đặt ngưỡng bảo vệ công suất đầu vào tối thiểu tại tham số PE-28 xuống mức thấp hơn." },
    { brand: "PowerS", code: "A.FuL (86)", desc: "Cảnh báo đầy bồn / bể chứa nước", fix: "Kiểm tra phao báo mức xem bồn chứa nước đã đầy chưa." },
    { brand: "PowerS", code: "A.Prb (87)", desc: "Lỗi cảm biến tín hiệu tương tự (Analog)", fix: "Kiểm tra dây dẫn và đầu cảm biến xem có bị đứt/hỏng không, hoặc giảm giá trị cài đặt tại PE-35." },
    { brand: "PowerS", code: "Err.98", desc: "Hết thời gian vận hành của nhà phân phối", fix: "Liên hệ nhà phân phối thiết bị để cấp mã mở khóa thời gian." },
    { brand: "PowerS", code: "Err.99", desc: "Hết thời gian vận hành của nhà sản xuất", fix: "Liên hệ trực tiếp nhà sản xuất để được hỗ trợ mở khóa." },
    { brand: "PowerS", code: "Err01 / Er.OC1", desc: "Bảo vệ khối công suất (IGBT)", fix: "1. Loại trừ ngắn mạch ngõ ra. 2. Lắp thêm cuộn kháng đầu ra hoặc bộ lọc nếu dây motor quá dài. 3. Vệ sinh khe tản nhiệt. 4. Cắm chặt lại toàn bộ giắc cáp bên trong. 5. Liên hệ kỹ thuật kiểm tra bo mạch/IGBT." },
    { brand: "PowerS", code: "Err02 / Er.OC1", desc: "Quá dòng khi tăng tốc", fix: "1. Kiểm tra chạm vỏ/ngắn mạch motor. 2. Chạy dò thông số động cơ (Auto-tuning). 3. Tăng thời gian tăng tốc. 4. Chỉnh lại bù momen xoắn (Torque boost) hoặc đặc tuyến V/F. 5. Kiểm tra áp nguồn, giảm tải hoặc nâng cấp biến tần công suất lớn hơn." },
    { brand: "PowerS", code: "Err03 / Er.OC2", desc: "Quá dòng khi giảm tốc", fix: "1. Kiểm tra ngắn mạch ngõ ra/chạm đất. 2. Chạy Auto-tuning motor. 3. Tăng thời gian giảm tốc. 4. Kiểm tra điện áp nguồn ổn định. 5. Không đóng tải đột ngột lúc giảm tốc hoặc lắp thêm bộ hãm/điện trở xả." },
    { brand: "PowerS", code: "Err04 / Er.OC3", desc: "Quá dòng khi chạy ở tốc độ ổn định", fix: "1. Loại trừ ngắn mạch pha-pha/pha-đất ngõ ra. 2. Chạy Auto-tuning motor. 3. Kiểm tra sụt áp nguồn đột ngột. 4. Kiểm tra kẹt rác/cát buồng bơm. 5. Chọn biến tần công suất lớn hơn." },
    { brand: "PowerS", code: "Err05 / Er.OU1", desc: "Quá áp DC khi tăng tốc", fix: "1. Điều chỉnh điện áp đầu vào về dải cho phép. 2. Triệt tiêu ngoại lực kéo ngược motor hoặc lắp điện trở xả. 3. Tăng thời gian tăng tốc lên." },
    { brand: "PowerS", code: "Err06 / Er.OU2", desc: "Quá áp DC khi giảm tốc", fix: "1. Điều chỉnh điện áp đầu vào về dải bình thường. 2. Tăng thời gian giảm tốc hoặc chuyển sang chế độ dừng tự do (Coast to stop). 3. Lắp bộ hãm và điện trở xả nếu tải quán tính lớn." },
    { brand: "PowerS", code: "Err07 / Er.OU3", desc: "Quá áp DC khi chạy tốc độ ổn định", fix: "1. Hạ điện áp đầu vào về mức chuẩn (kiểm tra lại số tấm pin nối tiếp). 2. Triệt tiêu ngoại lực kéo motor từ bên ngoài." },
    { brand: "PowerS", code: "Err08 / Er.oHr", desc: "Lỗi nguồn cấp bo mạch điều khiển", fix: "Kiểm tra và điều chỉnh điện áp nguồn cấp vào biến tần về dải bình thường." },
    { brand: "PowerS", code: "Err09 / Er.LU1", desc: "Lỗi thấp áp DC Bus (Yếu nắng / Sụt áp)", fix: "1. Nhấn Reset xóa lỗi. 2. Kiểm tra điện áp giàn pin/lưới về dải bình thường. 3. Nếu vẫn lỗi khi đủ áp, kiểm tra cầu chỉnh lưu và điện trở nạp mềm." },
    { brand: "PowerS", code: "Err10 / Er.oL1", desc: "Quá tải biến tần", fix: "1. Giảm tải và kiểm tra kẹt cơ khí máy bơm. 2. Chọn biến tần công suất lớn hơn phù hợp với công suất bơm." },
    { brand: "PowerS", code: "Err11 / Er.oL2", desc: "Quá tải động cơ (Motor)", fix: "1. Cài đặt lại đúng tham số dòng định mức motor tại P9-01. 2. Kiểm tra kẹt cánh bơm. 3. Chọn biến tần công suất lớn hơn." },
    { brand: "PowerS", code: "Err12 / Er.ILF", desc: "Mất pha đầu vào (Nguồn lưới AC)", fix: "1. Kiểm tra CB và đường dây nguồn 3 pha R, S, T bên ngoài xem có mất pha/lỏng cốt không. 2. Kiểm tra bo kích, bo chống sét và bo điều khiển chính." },
    { brand: "PowerS", code: "Err13 / Er.oLF", desc: "Mất pha ngõ ra (Ra motor)", fix: "1. Kiểm tra dây cáp từ biến tần xuống bơm có bị đứt ngầm/lỏng mối nối không. 2. Đo kiểm tra cân bằng điện trở 3 cuộn dây motor. 3. Kiểm tra bo kích và IGBT." },
    { brand: "PowerS", code: "Err14 / Er.oH1", desc: "Quá nhiệt module IGBT", fix: "1. Che nắng, giảm nhiệt độ tủ điện ngoài trời. 2. Vệ sinh bụi bẩn khe tản nhiệt. 3. Thay quạt làm mát mới. 4. Kiểm tra cảm biến nhiệt IGBT." },
    { brand: "PowerS", code: "Err18 / Er.HAL", desc: "Lỗi mạch cảm biến dòng điện (Hall)", fix: "1. Thay thế cảm biến dòng Hall. 2. Thay bo mạch kích (Driving board)." },
    { brand: "PowerS", code: "Err19 / Er.TUn", desc: "Lỗi dò thông số động cơ (Auto-tuning)", fix: "Nhập chính xác các thông số ghi trên tem máy bơm (kW, V, A, Hz, RPM) vào biến tần rồi thực hiện lại." },
    { brand: "PowerS", code: "Err22 / Er.22", desc: "Lỗi phần cứng biến tần (Quá áp/Quá dòng cứng)", fix: "1. Kiểm tra và xử lý theo hướng dẫn lỗi quá áp. 2. Kiểm tra và xử lý theo hướng dẫn lỗi quá dòng." },
    { brand: "PowerS", code: "Err23 / Er.SGd", desc: "Lỗi chạm vỏ / ngắn mạch xuống đất", fix: "Đo kiểm tra cách điện (Megohm), thay dây cáp thả giếng bị tróc vỏ hoặc sửa chữa cuộn dây motor." },
    { brand: "PowerS", code: "Err26 (Runtime)", desc: "Đạt giới hạn thời gian chạy tích lũy", fix: "Thực hiện khởi tạo lại tham số (Parameter initialization) để xóa bộ đếm thời gian chạy." },
    { brand: "PowerS", code: "Err26 / Er.ort", desc: "Đạt giới hạn thời gian cấp nguồn tích lũy", fix: "Thực hiện khởi tạo lại tham số (Parameter initialization) để xóa bộ đếm thời gian cấp nguồn." },
    { brand: "PowerS", code: "Err30", desc: "Lỗi mất tải / đứt tải (Load missing)", fix: "Dòng chạy nhỏ hơn ngưỡng P9-64. Kiểm tra tình trạng tải bơm (gãy trục, tuột khớp nối hoặc bơm chạy không tải)." },
    // === HÃNG SAJ (PDS33 SERIES - TRỌN BỘ MÃ LỖI & CẢNH BÁO) ===
    { brand: "SAJ", code: "Err02", desc: "Quá dòng khi tăng tốc", fix: "1. Kiểm tra cách điện dây cáp đầu ra và động cơ bơm. 2. Tăng thời gian tăng tốc lên. 3. Thay thế biến tần có công suất lớn hơn." },
    { brand: "SAJ", code: "Err03", desc: "Quá dòng khi giảm tốc", fix: "1. Kiểm tra cách điện dây cáp đầu ra và động cơ bơm. 2. Tăng thời gian giảm tốc lên." },
    { brand: "SAJ", code: "Err04", desc: "Quá dòng khi chạy tốc độ ổn định", fix: "1. Kiểm tra cách điện dây cáp đầu ra và động cơ bơm. 2. Thay thế biến tần có công suất lớn hơn." },
    { brand: "SAJ", code: "Err05", desc: "Quá áp DC khi tăng tốc", fix: "1. Điều chỉnh điện áp đầu vào về mức chuẩn. 2. Tăng thời gian tăng tốc. 3. Lắp thêm bộ hãm (Brake unit) và điện trở xả." },
    { brand: "SAJ", code: "Err06", desc: "Quá áp DC khi giảm tốc", fix: "1. Điều chỉnh điện áp đầu vào về mức chuẩn. 2. Tăng thời gian giảm tốc. 3. Lắp thêm bộ hãm và điện trở xả." },
    { brand: "SAJ", code: "Err07", desc: "Quá áp DC khi chạy tốc độ ổn định", fix: "Điều chỉnh điện áp đầu vào về giá trị bình thường (kiểm tra lại số tấm pin mắc nối tiếp)." },
    { brand: "SAJ", code: "Err08", desc: "Quá tải điện trở nạp mềm (Buffer Resistor)", fix: "Điều chỉnh điện áp đầu vào về đúng dải làm việc tiêu chuẩn." },
    { brand: "SAJ", code: "Err09", desc: "Điện áp thanh cái DC Bus quá thấp", fix: "1. Điều chỉnh điện áp đầu vào về đúng dải cho phép. 2. Nếu vẫn lỗi, kiểm tra mạch đo áp DC Bus / điện trở nạp mềm / bo điều khiển / bo công suất." },
    { brand: "SAJ", code: "Err10", desc: "Quá tải biến tần (VFD Overload)", fix: "1. Giảm tải và kiểm tra kẹt cơ khí máy bơm. 2. Thay thế biến tần có công suất lớn hơn." },
    { brand: "SAJ", code: "Err11", desc: "Quá tải động cơ (Motor Overload)", fix: "1. Cài đặt lại chính xác các tham số bảo vệ motor FA.01 & FA.02. 2. Giảm tải và kiểm tra cơ khí động cơ bơm." },
    { brand: "SAJ", code: "Err12", desc: "Mất pha đầu vào (Nguồn AC)", fix: "1. Kiểm tra nguồn điện đầu vào và dây đấu nối. 2. Kiểm tra bo mạch điều khiển hoặc bo công suất." },
    { brand: "SAJ", code: "Err13", desc: "Mất pha ngõ ra (Ra motor)", fix: "1. Đo kiểm tra cuộn dây bên trong motor. 2. Kiểm tra lại toàn bộ dây đấu nối đầu ra. 3. Kiểm tra cân bằng cuộn dây motor và mạch ngõ ra. 4. Kiểm tra bo điều khiển/bo công suất." },
    { brand: "SAJ", code: "Err14", desc: "Quá nhiệt khối công suất IGBT", fix: "1. Hạ nhiệt độ môi trường / che nắng tủ điện. 2. Vệ sinh sạch sẽ khe tản nhiệt. 3. Thay quạt làm mát mới. 4. Kiểm tra cảm biến nhiệt IGBT." },
    { brand: "SAJ", code: "Err15", desc: "Lỗi ngoại vi qua chân kích số (DI)", fix: "Kiểm tra tín hiệu và công tắc/phao kết nối đưa vào chân kích số DI." },
    { brand: "SAJ", code: "Err16", desc: "Lỗi truyền thông (RS485)", fix: "1. Kiểm tra thiết bị điều khiển cấp trên. 2. Kiểm tra lại dây tín hiệu truyền thông RS485. 3. Cài đặt lại chính xác nhóm tham số FC." },
    { brand: "SAJ", code: "Err17", desc: "Lỗi khởi động từ mạch chính (Contactor)", fix: "Thay thế khởi động từ mạch chính (Contactor) hoặc liên hệ bộ phận hỗ trợ kỹ thuật." },
    { brand: "SAJ", code: "Err18", desc: "Lỗi mạch cảm biến dòng điện", fix: "Liên hệ bộ phận hỗ trợ kỹ thuật để kiểm tra mạch đo dòng và bo mạch điều khiển." },
    { brand: "SAJ", code: "Err19", desc: "Lỗi dò thông số động cơ (Auto-tuning)", fix: "Nhập chính xác các thông số theo tem nhãn máy bơm vào nhóm tham số F2 rồi thực hiện lại." },
    { brand: "SAJ", code: "Err21", desc: "Lỗi đọc / ghi tham số", fix: "Lỗi bo mạch điều khiển. Liên hệ bộ phận hỗ trợ kỹ thuật." },
    { brand: "SAJ", code: "Err22", desc: "Lỗi bộ nhớ EEPROM", fix: "Hỏng chip nhớ EEPROM. Liên hệ bộ phận hỗ trợ kỹ thuật." },
    { brand: "SAJ", code: "Err23", desc: "Động cơ chạm vỏ / ngắn mạch xuống đất", fix: "1. Đo kiểm tra cách điện của motor và dây cáp thả giếng. 2. Kiểm tra bo mạch điều khiển." },
    { brand: "SAJ", code: "Err24", desc: "Lỗi chạy khô bằng phần mềm (Dry Run)", fix: "1. Kiểm tra nguồn nước đầu vào (giếng khoan / bể hút). 2. Giảm giá trị cài đặt tại tham số FD.12 (khi FD.10 > 0)." },
    { brand: "SAJ", code: "Err26", desc: "Đạt giới hạn thời gian chạy tích lũy", fix: "Thực hiện xóa bộ đếm thời gian chạy (Clear the time record)." },
    { brand: "SAJ", code: "Err29", desc: "Đạt giới hạn thời gian cấp nguồn tích lũy", fix: "Thực hiện xóa bộ đếm thời gian cấp nguồn (Clear the time record)." },
    { brand: "SAJ", code: "Err31", desc: "Mất tín hiệu phản hồi PID", fix: "1. Kiểm tra nguồn tín hiệu cảm biến phản hồi PID. 2. Cài đặt lại chính xác tham số F9.25 & F9.26." },
    { brand: "SAJ", code: "Err40", desc: "Quá dòng tức thời từng chu kỳ (CBC)", fix: "1. Giảm tải và kiểm tra cơ khí máy bơm. 2. Thay thế biến tần có công suất lớn hơn." },
    { brand: "SAJ", code: "E098 / E099", desc: "Lỗi giao tiếp màn hình điều khiển (Keypad)", fix: "1. Tháo ra cắm chặt lại cáp kết nối mặt màn hình Keypad và bo điều khiển. 2. Thay mặt màn hình Keypad mới." },
    { brand: "SAJ", code: "Lou", desc: "Cảnh báo cạn nước bể hút (Low Level)", fix: "Kiểm tra mực nước giếng hoặc bể hút đầu vào xem có đang quá thấp không (phao/cảm biến báo cạn)." },
    { brand: "SAJ", code: "FULL", desc: "Cảnh báo đầy nước bể chứa (High Level)", fix: "Kiểm tra bồn chứa đầu ra xem nước đã đầy chưa (phao/cảm biến báo đầy)." },
    // === HÃNG GREEN NOVA (AC600 SERIES - TRỌN BỘ 21 MÃ LỖI) ===
    { brand: "Green Nova", code: "OU1", desc: "Lỗi IGBT pha U", fix: "1. Thời gian tăng tốc quá ngắn -> Tăng thời gian tăng tốc (Acc time). 2. Lỗi module IGBT -> Kiểm tra và thay module IGBT. 3. Nhiễu bên ngoài -> Kiểm tra nhiễu bên ngoài và loại bỏ. 4. Tiếp địa không đúng -> Kiểm tra nối đất." },
    { brand: "Green Nova", code: "OU2", desc: "Lỗi IGBT pha V", fix: "1. Tăng thời gian tăng tốc. 2. Thay module IGBT. 3. Kiểm tra thiết bị ngoại vi và loại bỏ nhiễu. 4. Kiểm tra nối đất." },
    { brand: "Green Nova", code: "OU3", desc: "Lỗi IGBT pha W", fix: "1. Tăng thời gian tăng tốc. 2. Thay module IGBT. 3. Kiểm tra thiết bị ngoại vi và loại bỏ nhiễu. 4. Kiểm tra nối đất." },
    { brand: "Green Nova", code: "OC1", desc: "Quá dòng khi tăng tốc", fix: "1. Thời gian tăng tốc quá ngắn -> Tăng thời gian tăng tốc. 2. Điện áp lưới quá thấp -> Kiểm tra điện áp đầu vào. 3. Công suất biến tần quá nhỏ -> Chọn biến tần công suất lớn hơn." },
    { brand: "Green Nova", code: "OC2", desc: "Quá dòng khi giảm tốc", fix: "1. Thời gian giảm tốc quá ngắn -> Tăng thời gian giảm tốc. 2. Mô-men quán tính tải quá lớn -> Lắp thêm điện trở hãm hoặc bộ tiêu tán năng lượng. 3. Công suất biến tần quá nhỏ -> Chọn biến tần công suất lớn hơn." },
    { brand: "Green Nova", code: "OC3", desc: "Quá dòng khi chạy ổn định", fix: "1. Tải thay đổi đột ngột -> Kiểm tra tải hoặc giảm dao động tải. 2. Điện áp lưới quá thấp -> Kiểm tra nguồn điện đầu vào. 3. Công suất biến tần quá nhỏ -> Chọn biến tần công suất lớn hơn." },
    { brand: "Green Nova", code: "OV1", desc: "Quá áp khi tăng tốc", fix: "1. Điện áp đầu vào bất thường -> Kiểm tra nguồn điện đầu vào. 2. Khởi động lại motor sau khi đột ngột dừng -> Tránh khởi động lại ngay sau khi dừng." },
    { brand: "Green Nova", code: "OV2", desc: "Quá áp khi giảm tốc", fix: "1. Thời gian giảm tốc quá ngắn -> Tăng thời gian giảm tốc. 2. Mô-men quán tính tải lớn -> Lắp thêm bộ tiêu tán năng lượng. 3. Điện áp đầu vào bất thường -> Kiểm tra nguồn điện đầu vào." },
    { brand: "Green Nova", code: "OV3", desc: "Quá áp khi chạy ổn định", fix: "1. Điện áp đầu vào thay đổi bất thường -> Lắp cuộn kháng đầu vào. 2. Mô-men quán tính tải lớn -> Lắp thêm bộ tiêu tán năng lượng phù hợp." },
    { brand: "Green Nova", code: "UV", desc: "Điện áp DC bus thấp", fix: "Điện áp lưới quá thấp -> Kiểm tra nguồn điện lưới đầu vào." },
    { brand: "Green Nova", code: "OL1", desc: "Quá tải motor", fix: "1. Điện áp nguồn cung cấp quá thấp -> Kiểm tra công suất nguồn cấp. 2. Dòng định mức motor cài đặt sai -> Cài lại dòng định mức của motor. 3. Tải khởi động hoặc dao động tải quá lớn -> Kiểm tra tải và điều chỉnh moment khởi động. 4. Công suất motor quá nhỏ -> Chọn motor phù hợp hơn." },
    { brand: "Green Nova", code: "OL2", desc: "Quá tải biến tần", fix: "1. Tốc độ tăng tốc quá nhanh -> Tăng thời gian tăng tốc (ACC). 2. Motor quay ngược bị reset đột ngột -> Tránh khởi động lại ngay sau khi dừng. 3. Điện áp nguồn cung cấp quá thấp -> Kiểm tra điện áp nguồn cung cấp. 4. Tải quá nặng -> Chọn biến tần có công suất lớn hơn." },
    { brand: "Green Nova", code: "SPI", desc: "Mất pha đầu vào", fix: "Mất hoặc dao động pha R, S, T -> Kiểm tra nguồn điện đầu vào." },
    { brand: "Green Nova", code: "SPO", desc: "Mất pha đầu ra", fix: "Mất pha U, V, W hoặc mất cân bằng nghiêm trọng giữa các pha tải -> 1. Kiểm tra mạch phân phối đầu ra. 2. Kiểm tra motor và cáp." },
    { brand: "Green Nova", code: "OH1", desc: "Quá nhiệt chỉnh lưu", fix: "1. Kiểm tra nguyên nhân quá dòng. 2. Phân phối lại tải. 3. Làm sạch hoặc thay quạt làm mát. 4. Giảm nhiệt độ môi trường. 5. Kiểm tra và siết chặt lại các kết nối." },
    { brand: "Green Nova", code: "OH2", desc: "Quá nhiệt IGBT", fix: "1. Nguồn phụ trợ bị lỗi hoặc điện áp điều khiển thấp -> Kiểm tra nguồn phụ trợ. 2. Cầu diode hoặc module công suất bị kích hoạt sai -> Liên hệ bảo hành hoặc dịch vụ kỹ thuật. 3. Bảng điều khiển bất thường -> Yêu cầu kiểm tra chuyên sâu tại hãng." },
    { brand: "Green Nova", code: "EF", desc: "Lỗi ngõ vào bên ngoài", fix: "Tín hiệu lỗi từ ngõ vào ngoài (S1) kích hoạt -> Kiểm tra tín hiệu ngõ vào của thiết bị bên ngoài." },
    { brand: "Green Nova", code: "CE", desc: "Lỗi truyền thông", fix: "1. Tốc độ baud cài đặt sai -> Cài đúng tốc độ baud. 2. Lỗi giao tiếp -> Nhấn STOP/RST để reset và liên hệ hỗ trợ. 3. Mất truyền thông trong thời gian dài -> Kiểm tra kết nối truyền thông." },
    { brand: "Green Nova", code: "IE", desc: "Lỗi phát hiện dòng", fix: "1. Kết nối bộ điều khiển không tốt, nguồn phụ trợ kém -> Kiểm tra và kết nối lại. 2. Nguồn phụ trợ hỏng / Linh kiện phần cứng hư / Mạch hiệu chỉnh bất thường -> Liên hệ bảo hành." },
    { brand: "Green Nova", code: "tE", desc: "Lỗi tự động nhận dạng motor (Autotuning)", fix: "1. Công suất motor không phù hợp với khả năng biến tần -> Chọn model biến tần phù hợp. 2. Tham số định mức motor cài sai -> Cài lại thông số định mức motor theo nhãn. 3. Sai lệch lớn giữa tham số tự nhận và giá trị chuẩn / Quá thời gian autotune -> Làm trống dữ liệu motor, kiểm tra dây nối và autotune lại." },
    { brand: "Green Nova", code: "EEP", desc: "Lỗi EEPROM", fix: "1. Lỗi khi ghi hoặc đọc tham số -> Nhấn STOP/RST để reset. 2. Hư hỏng EEPROM -> Liên hệ bảo hành." },
    { brand: "Green Nova", code: "PIDE", desc: "Lỗi phản hồi PID", fix: "1. Mất tín hiệu phản hồi PID -> Kiểm tra dây tín hiệu phản hồi PID. 2. Mất nguồn phản hồi PID -> Kiểm tra nguồn phản hồi PID." },
    { brand: "Green Nova", code: "bCE", desc: "Lỗi mạch hãm", fix: "1. Lỗi mạch hãm hoặc đứt ống dẫn hãm -> Kiểm tra bộ hãm và thay ống hãm nếu cần. 2. Điện trở hãm ngoài có giá trị quá thấp -> Tăng giá trị điện trở hãm." },
    { brand: "Green Nova", code: "END", desc: "Hết thời gian cài đặt thử nghiệm", fix: "Đã đến thời gian chạy thử -> Liên hệ bảo hành hoặc kỹ thuật viên." },
    { brand: "Green Nova", code: "OL3", desc: "Quá moment", fix: "1. Tăng thời gian tăng tốc (ACC). 2. Tránh khởi động lại ngay sau khi dừng. 3. Kiểm tra công suất nguồn cấp. 4. Chọn biến tần công suất lớn hơn. 5. Điều chỉnh Pb.11 đến giá trị phù hợp." }
        // === HÃNG LUMENTREE (HYBRID INVERTER - TRỌN BỘ 21 MÃ LỖI) ===
    { brand: "Lumentree", code: "E07", desc: "Lỗi mạch tăng áp DC-DC (DC-DC voltage boost failure)", fix: "1. Khởi động lại biến tần (Restart). 2. Liên hệ nhà cung cấp để được hỗ trợ kỹ thuật." },
    { brand: "Lumentree", code: "E10", desc: "Lỗi khối công suất (Power module fault)", fix: "Kiểm tra điện áp ắc quy / pin lưu trữ xem có nằm trong ngưỡng bình thường không." },
    { brand: "Lumentree", code: "E13", desc: "Lỗi chuyển đổi chế độ hoạt động (Mode change)", fix: "Xảy ra khi chuyển đổi chế độ Master/Slave (song song) hoặc chuyển giữa chế độ có pin lưu trữ và không pin lưu trữ. Hãy đợi ổn định hoặc khởi động lại máy." },
    { brand: "Lumentree", code: "E14", desc: "Quá tải dòng điện một chiều DC (DC current overload)", fix: "Kiểm tra biến dòng (Current transformer) trên bo mạch chính xem có bình thường không (mã linh kiện U5L18P025D15)." },
    { brand: "Lumentree", code: "E15", desc: "Kích hoạt bảo vệ ngắn mạch (Short circuit protecting)", fix: "1. Khởi động lại biến tần. 2. Kiểm tra tải đầu ra có bị chạm chập / ngắn mạch không, và kiểm tra các MOSFET trên bo mạch chính." },
    { brand: "Lumentree", code: "E16", desc: "Lỗi quá dòng xoay chiều AC phần cứng", fix: "1. Khởi động lại biến tần. 2. Kiểm tra các linh kiện công suất IGBT trên bo mạch chính xem có bị chập / thủng không." },
    { brand: "Lumentree", code: "E19", desc: "Lỗi tích hợp / giao tiếp phần cứng nội bộ", fix: "1. Khởi động lại biến tần. 2. Liên hệ nhà cung cấp để được hỗ trợ kỹ thuật." },
    { brand: "Lumentree", code: "E21", desc: "Quá dòng phần cứng phía PV hoặc mạch DC-DC", fix: "1. Khởi động lại máy. 2. Kiểm tra giắc đấu nối giàn pin PV và cáp pin lưu trữ. 3. Kiểm tra các linh kiện công suất IGBT và MOSFET trên bo mạch chính." },
    { brand: "Lumentree", code: "E25", desc: "Điện áp thanh cái DC Bus quá thấp khi kích hoạt pin lưu trữ", fix: "Kiểm tra cáp kết nối ắc quy / pin lưu trữ xem đã đấu đúng cực và siết chặt chưa, sau đó khởi động lại máy." },
    { brand: "Lumentree", code: "E31", desc: "Điện áp thanh cái DC Bus quá thấp (Chế độ không dùng pin)", fix: "Cảnh báo xảy ra khi chuyển đổi chế độ pin lưu trữ, hãy thử khởi động lại biến tần." },
    { brand: "Lumentree", code: "E35", desc: "Kích hoạt bảo vệ quá tải (Overload protection)", fix: "Tắt bớt các thiết bị tiêu thụ điện để giảm tải đầu ra." },
    { brand: "Lumentree", code: "E37", desc: "Dòng điện mạch DC-DC vượt ngưỡng (Đang kích hoạt pin)", fix: "Giảm bớt công suất tải tiêu thụ." },
    { brand: "Lumentree", code: "E39", desc: "Dòng điện mạch DC-DC vượt ngưỡng (Bảo vệ phần mềm)", fix: "Giảm bớt công suất tải tiêu thụ." },
    { brand: "Lumentree", code: "E40", desc: "Dòng điện chuyển đổi DC-DC quá lớn", fix: "Giảm bớt công suất tải tiêu thụ." },
    { brand: "Lumentree", code: "E45", desc: "Lỗi quá áp lưới điện AC (High voltage)", fix: "Kiểm tra điện áp lưới điện xem có vượt quá dải cho phép không (dải điện áp AC tiêu chuẩn 165V – 256V)." },
    { brand: "Lumentree", code: "E46", desc: "Lỗi thấp áp lưới điện AC (Low voltage)", fix: "Kiểm tra điện áp lưới điện xem có tụt thấp dưới ngưỡng cho phép không (dải điện áp AC tiêu chuẩn 165V – 256V)." },
    { brand: "Lumentree", code: "E47", desc: "Tần số lưới điện AC vượt ngưỡng cao (Over frequency)", fix: "Kiểm tra tần số lưới điện xem có nằm trong dải tiêu chuẩn cho phép không." },
    { brand: "Lumentree", code: "E48", desc: "Tần số lưới điện AC tụt ngưỡng thấp (Low frequency)", fix: "Kiểm tra tần số lưới điện xem có nằm trong dải tiêu chuẩn cho phép không." },
    { brand: "Lumentree", code: "E60", desc: "Kích hoạt bảo vệ quá nhiệt (Temperature protection)", fix: "1. Kiểm tra quạt làm mát xem có đang quay bình thường không. 2. Kiểm tra cảm biến nhiệt độ bên trong máy." },
    { brand: "Lumentree", code: "E61", desc: "Bảo vệ quá áp đầu vào (High voltage protection)", fix: "Kiểm tra điện áp đầu vào (PV / AC / Pin lưu trữ) đang vượt ngưỡng cao cho phép." },
    { brand: "Lumentree", code: "E62", desc: "Bảo vệ thấp áp đầu vào (Low voltage protection)", fix: "Kiểm tra điện áp đầu vào (PV / AC / Pin lưu trữ) đang tụt dưới ngưỡng thấp cho phép." }

];


const MOCK_KNOWLEDGE = [
    {
        title: "Kinh nghiệm chọn công suất biến tần bơm hỏa tiễn đẩy dốc cao ở Tây Nguyên",
        date: "15/11/2026",
        content: "Khi lắp đặt hệ thống bơm năng lượng mặt trời cho địa hình đồi dốc tại Đắk Lắk, Đắk Nông, dòng khởi động của bơm hỏa tiễn thả sâu rất lớn. Nguyên tắc vàng là luôn chọn biến tần có công suất lớn hơn công suất thực của motor từ 1 đến 2 cấp (hệ số tải 1.4). Ngoài ra, với chiều dài dây cáp thả giếng trên 60m, nên lắp thêm cuộn kháng đầu ra (Output Reactor) để triệt tiêu sóng hài và bảo vệ lớp cách điện cuộn dây động cơ."
    },
    {
        title: "Cách tính số tấm pin năng lượng mặt trời mắc nối tiếp (String) không lo quá áp buổi sáng",
        date: "12/11/2026",
        content: "Nhiều anh em thợ khi đấu nối giàn pin chỉ nhìn vào điện áp định mức ghi trên tem mà quên mất hiệu ứng nhiệt độ. Vào buổi sáng sớm trời lạnh tại vùng cao, điện áp hở mạch Voc của tấm pin có thể tăng thêm 5% so với tiêu chuẩn. Vì vậy, công thức an toàn bắt buộc là: Tổng Voc x 1.05 phải luôn nhỏ hơn điện áp DC tối đa (Vdc_max) của biến tần."
    },
    {
        title: "Tại sao hệ thống bơm nước đẩy đồi dốc không cần lắp thêm điện trở hãm ngoài?",
        date: "08/11/2026",
        content: "Điện trở hãm ngoài chỉ dùng cho các tải có quán tính quay lớn như băng tải, cẩu trục hoặc máy ly tâm tốc độ cao để tiêu tán năng lượng trả ngược khi phanh gấp. Đối với hệ thống bơm nước đẩy lên dốc cao, ngay khi ngắt điện, áp lực cột nước đè ngược xuống cánh bơm kết hợp lực ma sát sẽ làm motor dừng quay gần như tức thì. Bạn chỉ cần cài chế độ dừng tự do (Coast to stop) trên biến tần là hoàn toàn an toàn và tiết kiệm chi phí."
    }
];
