const SOLAR_PANELS_DB = [
    { name: "Jinko Solar 580W (JKM580N-72HL4-BDV)", power: 580, imp: 13.22, vmp: 43.88, voc: 52.50, priceWp: 2950 },
    { name: "Astronergy 595W (CHSM72N/F-BH-595)", power: 595, imp: 13.46, vmp: 44.21, voc: 52.81, priceWp: 2880 },
    { name: "Jinko Solar 625W (JKM625N-66HL4M-BDV)", power: 625, imp: 15.29, vmp: 40.90, voc: 49.28, priceWp: 3020 },
    { name: "Jinko Solar 630W (JKM630N-66HL4M-BDV)", power: 630, imp: 15.36, vmp: 41.02, voc: 49.48, priceWp: 3050 }
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
        title: "Biến Tần Bơm NLMT Voltique YK500-15KW-T4 (15kW - Max 950V)",
        img: "https://unsplash.com",
        specs: "Model: Voltique YK500-15KW-T4 | Công suất định mức: 15kW (20HP) - Dòng ra 32A/37A | Ngưỡng chịu áp DC tối đa lên đến 950VDC | Đấu nối linh hoạt chuỗi pin dài không lo báo lỗi quá áp sáng sớm | Chuyên trị bơm 11kW (15HP) đẩy cao | Bảo hành chính hãng 24 tháng"
    },
    {
        title: "Tấm Pin Năng Lượng Mặt Trời Jinko Solar 580W (JKM580N-72HL4-BDV)",
        img: "https://unsplash.com",
        specs: "Công suất cực đại (Pmax): 580W | Điện áp làm việc (Vmp): 43.88V — Dòng làm việc (Imp): 13.22A | Điện áp hở mạch (Voc): 52.50V — Dòng ngắn mạch (Isc): 13.95A | Công nghệ N-Type TOPCon 2 mặt kính cường lực | Hàng chính hãng sản xuất tại Việt Nam | Bảo hành vật lý 12 năm, hiệu suất 25 năm"
    },
    {
        title: "Tấm Pin Năng Lượng Mặt Trời Astronergy 595W (CHSM72N/F-BH-595)",
        img: "https://unsplash.com",
        specs: "Công suất cực đại (Pmax): 595W (Hai mặt kính Bifacial) | Điện áp làm việc (Vmp): 44.21V — Dòng làm việc (Imp): 13.46A | Điện áp hở mạch (Voc): 52.81V — Dòng ngắn mạch (Isc): 14.20A | Công nghệ tế bào N-Type TOPCon hiệu suất cao | Khung nhôm chịu lực gió bão 3600Pa | Bảo hành vật lý 12 năm, hiệu suất 25 năm"
    },
    {
        title: "Tấm Pin Năng Lượng Mặt Trời Jinko Solar 625W (JKM625N-66HL4M-BDV)",
        img: "https://unsplash.com",
        specs: "Công suất cực đại (Pmax): 625W | Điện áp làm việc (Vmp): 40.90V — Dòng làm việc (Imp): 15.29A | Điện áp hở mạch (Voc): 49.28V — Dòng ngắn mạch (Isc): 16.14A | Dòng pin công suất lớn tối ưu cho hệ bơm 1 chuỗi | Hàng chính hãng sản xuất tại Việt Nam | Bảo hành vật lý 12 năm, hiệu suất 25 năm"
    },
    {
        title: "Tấm Pin Năng Lượng Mặt Trời Jinko Solar 630W (JKM630N-66HL4M-BDV)",
        img: "https://unsplash.com",
        specs: "Công suất cực đại (Pmax): 630W | Điện áp làm việc (Vmp): 41.02V — Dòng làm việc (Imp): 15.36A | Điện áp hở mạch (Voc): 49.48V — Dòng ngắn mạch (Isc): 16.20A | Công nghệ N-Type TOPCon 2 mặt kính siêu bền | Suy giảm công suất cực thấp dưới 0.4%/năm | Bảo hành vật lý 12 năm, hiệu suất 25 năm"
    }
];
const MOCK_ERRORS = [
    { brand: "PowerS", code: "E.OC1", desc: "Quá dòng trong quá trình tăng tốc động cơ", fix: "Tăng thời gian tăng tốc (F0.11), kiểm tra kẹt cánh bơm hoặc chạm chập dây cáp động lực." },
    { brand: "PowerS", code: "E.OC2", desc: "Quá dòng trong quá trình giảm tốc", fix: "Tăng thời gian giảm tốc hoặc chuyển sang chế độ dừng tự do (Coast to stop)." },
    { brand: "PowerS", code: "E.OC3", desc: "Quá dòng khi chạy ở tốc độ ổn định", fix: "Kiểm tra tải bơm có bị kẹt rác/cát không, kiểm tra điện áp giàn pin có bị sụt đột ngột." },
    { brand: "PowerS", code: "E.OU1", desc: "Quá áp DC Bus khi tăng tốc", fix: "Kiểm tra tổng điện áp hở mạch Voc của chuỗi pin, giảm bớt số tấm pin nối tiếp." },
    { brand: "PowerS", code: "E.LU", desc: "Thấp áp DC Bus (Yếu nắng hoặc sụt áp nguồn)", fix: "Trạng thái bình thường khi trời mây mù, biến tần sẽ tự chạy lại khi nắng lên." },
    { brand: "PowerS", code: "E.OH1", desc: "Quá nhiệt module tản nhiệt IGBT", fix: "Vệ sinh bụi bẩn quạt làm mát, kiểm tra thông gió tủ điện ngoài trời." },
    { brand: "PowerS", code: "E.OL1", desc: "Quá tải động cơ máy bơm", fix: "Kiểm tra dòng định mức motor cài đặt trong biến tần, kiểm tra kẹt cơ khí bơm." },
    { brand: "PowerS", code: "E.SPI", desc: "Mất pha đầu vào (Khi chạy nguồn lưới AC)", fix: "Kiểm tra lại CB nguồn và các đầu cốt dây pha R, S, T cấp vào biến tần." },
    { brand: "Voltique", code: "Err02", desc: "Quá dòng khi tăng tốc (Overcurrent during acceleration)", fix: "Kéo dài thời gian tăng tốc, kiểm tra cách điện dây cáp thả giếng khoan." },
    { brand: "Voltique", code: "Err05", desc: "Quá áp khi tăng tốc (Overvoltage during acceleration)", fix: "Đo lại điện áp hở mạch DC từ giàn pin, đảm bảo không vượt quá 950V." },
    { brand: "Voltique", code: "Err09", desc: "Cảnh báo thấp áp mạch trung gian DC", fix: "Kiểm tra cầu chì DC, CB DC từ giàn pin xuống hoặc đợi cường độ nắng tăng lên." },
    { brand: "Voltique", code: "Err10", desc: "Quá tải biến tần (Inverter overload)", fix: "Chọn công suất biến tần lớn hơn công suất bơm 1–2 cấp, giảm tải đầu ra." },
    { brand: "Voltique", code: "Err11", desc: "Quá tải motor bơm (Motor overload)", fix: "Kiểm tra thông số dòng định mức motor, kiểm tra mực nước giếng và đường ống." },
    { brand: "Voltique", code: "Err13", desc: "Mất pha ngõ ra (Output phase loss)", fix: "Kiểm tra dây cáp từ biến tần xuống bơm có bị đứt ngầm hoặc lỏng tiếp điểm không." },
    { brand: "Voltique", code: "Err14", desc: "Nhiệt độ tản nhiệt quá cao", fix: "Che nắng trực tiếp cho tủ điện, kiểm tra quạt gió bên trong biến tần." },
    { brand: "Voltique", code: "Err42", desc: "Cảnh báo chạy khô / cạn nước (Dry run protection)", fix: "Kiểm tra mực nước giếng khoan/hồ chứa, đợi mực nước hồi phục rồi khởi động lại." },
    { brand: "SAJ", code: "E01", desc: "Bảo vệ quá dòng tức thời phần cứng", fix: "Ngắt nguồn kiểm tra chạm chập pha U, V, W và cách điện cuộn dây máy bơm." },
    { brand: "SAJ", code: "E04", desc: "Quá áp thanh cái DC (DC Bus Overvoltage)", fix: "Giảm số lượng tấm pin mắc nối tiếp trong mỗi chuỗi (String)." },
    { brand: "SAJ", code: "E06", desc: "Thấp áp đầu vào DC (Undervoltage)", fix: "Kiểm tra kết nối jack MC4 trên mái hoặc đợi ánh nắng ổn định." },
    { brand: "SAJ", code: "E08", desc: "Quá nhiệt bộ tản nhiệt công suất", fix: "Kiểm tra quạt tản nhiệt và nhiệt độ môi trường bên trong vỏ tủ điện." },
    { brand: "SAJ", code: "E11", desc: "Quá tải động cơ bơm nước", fix: "Kiểm tra kẹt rác buồng bơm, kiểm tra lại thông số dòng định mức cài đặt." },
    { brand: "SAJ", code: "E14", desc: "Lỗi mất pha đầu ra động cơ", fix: "Kiểm tra mối nối cáp ngầm chống nước tại đầu bơm hỏa tiễn." },
    { brand: "SAJ", code: "A01", desc: "Cảnh báo yếu nắng (Weak light sleep)", fix: "Biến tần tự động tạm dừng bảo vệ bơm khi bức xạ thấp, không phải lỗi hỏng." },
    { brand: "SAJ", code: "A02", desc: "Cảnh báo giếng cạn nước (Dry run)", fix: "Hệ thống tự dừng chống cháy bơm khi hết nước, tự chạy lại sau thời gian trễ." }
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
