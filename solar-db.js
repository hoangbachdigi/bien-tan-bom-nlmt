const SOLAR_PANELS_DB = [
    { name: "LONGi Hi-MO 6 580W (LR5-72HTH-580M)", power: 580, voc: 52.21, vmp: 44.06, imp: 13.17, priceWp: 2950 },
    { name: "LONGi Hi-MO 7 610W 2 mặt kính (LR7-72HGD-610M)", power: 610, voc: 52.45, vmp: 44.40, imp: 13.74, priceWp: 3000 },
    { name: "LONGi Hi-MO 7 620W 2 mặt kính (LR7-72HGD-620M)", power: 620, voc: 52.75, vmp: 44.70, imp: 13.87, priceWp: 3050 },
    { name: "Jinko Tiger Neo 580W (JKM580N-72HL4-V)", power: 580, voc: 52.31, vmp: 43.35, imp: 13.38, priceWp: 2950 },
    { name: "Jinko Tiger Neo 585W (JKM585N-72HL4-V)", power: 585, voc: 52.47, vmp: 43.53, imp: 13.44, priceWp: 2950 },
    { name: "Jinko Tiger Neo 610W (132-cell - JKM610N-66HL4M)", power: 610, voc: 48.68, vmp: 40.56, imp: 15.04, priceWp: 2980 },
    { name: "Jinko Tiger Neo 610W (156-cell - JKM610N-78HL4)", power: 610, voc: 55.31, vmp: 45.90, imp: 13.29, priceWp: 2980 },
    { name: "Jinko Tiger Neo 625W (JKM625N-78HL4-BDV)", power: 625, voc: 55.73, vmp: 46.33, imp: 13.49, priceWp: 3020 },
    { name: "TCL Solar G12R 605W (HSM-ND66-GR605)", power: 605, voc: 48.40, vmp: 40.30, imp: 15.01, priceWp: 2750 },
    { name: "TCL Solar G12R 620W (HSM-ND66-GR620)", power: 620, voc: 48.90, vmp: 40.80, imp: 15.20, priceWp: 2780 },
    { name: "TCL Solar G12R 630W (HSM-ND66-GR630)", power: 630, voc: 49.20, vmp: 41.10, imp: 15.33, priceWp: 2800 },
    { name: "TCL Solar T-Class 650W (HSM-ND66-650)", power: 650, voc: 49.80, vmp: 41.65, imp: 15.61, priceWp: 2850 },
    { name: "Astronergy Astro N5 580W (CHSM72N(DG)/F-BH-580)", power: 580, voc: 51.62, vmp: 43.15, imp: 13.44, priceWp: 2850 },
    { name: "Astronergy Astro N7 610W (CHSM66RN(DG)/F-BH-610)", power: 610, voc: 48.55, vmp: 40.42, imp: 15.09, priceWp: 2900 },
    { name: "Astronergy Astro N7 625W (CHSM66RN(DG)/F-BH-625)", power: 625, voc: 49.02, vmp: 40.88, imp: 15.29, priceWp: 2920 },
    { name: "Astronergy Astro N8 700W (CHSM66N(DG)/F-BH-700)", power: 700, voc: 48.60, vmp: 40.50, imp: 17.28, priceWp: 2950 },
    { name: "Astronergy Astro N8 710W (CHSM66N(DG)/F-BH-710)", power: 710, voc: 48.90, vmp: 40.80, imp: 17.40, priceWp: 2980 },
    { name: "Trina Vertex N 610W (TSM-NEG19RC.20-610)", power: 610, voc: 48.70, vmp: 40.50, imp: 15.06, priceWp: 2950 },
    { name: "Trina Vertex N 620W (TSM-NEG19RC.20-620)", power: 620, voc: 49.00, vmp: 40.80, imp: 15.20, priceWp: 2980 },
    { name: "Trina Vertex N G12 700W (TSM-NEG21C.20-700)", power: 700, voc: 48.60, vmp: 40.50, imp: 17.29, priceWp: 3000 },
    { name: "Trina Vertex N G12 710W (TSM-NEG21C.20-710)", power: 710, voc: 48.90, vmp: 40.80, imp: 17.40, priceWp: 3050 },
    { name: "Canadian TOPBiHiKu6 580W (CS6W-580TB-AG)", power: 580, voc: 52.20, vmp: 43.30, imp: 13.40, priceWp: 2950 },
    { name: "Canadian TOPBiHiKu6 610W (CS6.1-72TB-610)", power: 610, voc: 52.60, vmp: 44.10, imp: 13.84, priceWp: 2980 },
    { name: "Canadian TOPBiHiKu7 700W (CS7N-700TB-AG)", power: 700, voc: 48.70, vmp: 40.60, imp: 17.25, priceWp: 3020 },
    { name: "Canadian TOPBiHiKu7 710W (CS7N-710TB-AG)", power: 710, voc: 49.00, vmp: 40.90, imp: 17.37, priceWp: 3050 },
    { name: "Risen TOPCon 605W (RSM132-8-605BHDG)", power: 605, voc: 48.45, vmp: 40.35, imp: 14.99, priceWp: 2780 },
    { name: "Risen Hyper-ion HJT 700W (RSM132-8-700BHDG)", power: 700, voc: 49.90, vmp: 41.60, imp: 16.83, priceWp: 2850 },
    { name: "Risen Hyper-ion HJT 710W (RSM132-8-710BHDG)", power: 710, voc: 50.15, vmp: 41.85, imp: 16.97, priceWp: 2880 },
    { name: "Risen Hyper-ion HJT 715W (RSM132-8-715BHDG)", power: 715, voc: 50.30, vmp: 42.00, imp: 17.03, priceWp: 2900 },
    { name: "AIKO Comet 1N72 610W ABC (AIKO-A610-MAH72Mw)", power: 610, voc: 54.20, vmp: 45.10, imp: 13.53, priceWp: 3450 },
    { name: "AIKO Comet 1N72 620W ABC (AIKO-A620-MAH72Mw)", power: 620, voc: 54.40, vmp: 45.30, imp: 13.69, priceWp: 3500 },
    { name: "AIKO Stellar 650W ABC (AIKO-G650-MCH72Dw)", power: 650, voc: 54.65, vmp: 45.55, imp: 14.27, priceWp: 3550 },
    { name: "JA Solar DeepBlue 4.0 580W (JAM72D40-580/MB)", power: 580, voc: 51.30, vmp: 42.85, imp: 13.54, priceWp: 2920 },
    { name: "JA Solar DeepBlue 4.0 610W (JAM66D45-610/LB)", power: 610, voc: 48.50, vmp: 40.35, imp: 15.12, priceWp: 2950 },
    { name: "JA Solar DeepBlue 4.0 630W (JAM66D45-630/LB)", power: 630, voc: 49.10, vmp: 40.90, imp: 15.40, priceWp: 2980 },
    { name: "JA Solar DeepBlue 4.0 650W (JAM78D40-650/MB)", power: 650, voc: 56.10, vmp: 46.95, imp: 13.85, priceWp: 3020 }
];
const SOLAR_INVERTERS_DB = [
    { name: "PowerS SG800-004GB-4T (4.0kW - 3P 380V)", kw: 4, phase: "3 pha 380V", iOut: 10, vdcMax: 900, mpptMin: 486, idcMax: 20, price: 5800000 },
    { name: "PowerS SG800-5K5GB-4T (5.5kW - 3P 380V)", kw: 5.5, phase: "3 pha 380V", iOut: 13, vdcMax: 900, mpptMin: 486, idcMax: 25, price: 6900000 },
    { name: "PowerS SG800-7K5GB-4T (7.5kW - 3P 380V)", kw: 7.5, phase: "3 pha 380V", iOut: 17, vdcMax: 900, mpptMin: 486, idcMax: 30, price: 8200000 },
    { name: "PowerS SG800-011GB-4T (11kW - 3P 380V)", kw: 11, phase: "3 pha 380V", iOut: 25, vdcMax: 900, mpptMin: 486, idcMax: 40, price: 10500000 },
    { name: "PowerS SG800-015GB-4T (15kW - 3P 380V)", kw: 15, phase: "3 pha 380V", iOut: 32, vdcMax: 900, mpptMin: 486, idcMax: 50, price: 13200000 },
    { name: "PowerS SG800-018GB-4T (18.5kW - 3P 380V)", kw: 18.5, phase: "3 pha 380V", iOut: 37, vdcMax: 900, mpptMin: 486, idcMax: 60, price: 15900000 },
    { name: "PowerS SG800-022GB-4T (22kW - 3P 380V)", kw: 22, phase: "3 pha 380V", iOut: 45, vdcMax: 900, mpptMin: 486, idcMax: 72, price: 18500000 },
    { name: "PowerS SG800-030G-4T (30kW - 3P 380V)", kw: 30, phase: "3 pha 380V", iOut: 60, vdcMax: 900, mpptMin: 486, idcMax: 92, price: 24000000 },
    { name: "SAJ PDS33-2S2R2B-EH (2.2kW - 1P 220V)", kw: 2.2, phase: "1 pha 220V", iOut: 9.6, vdcMax: 450, mpptMin: 275, idcMax: 18, price: 5900000 },
    { name: "SAJ PDS33-4T2R2B-EH (2.2kW - 3P 380V)", kw: 2.2, phase: "3 pha 380V", iOut: 5.1, vdcMax: 900, mpptMin: 500, idcMax: 15, price: 6500000 },
    { name: "SAJ PDS33-4T004B-EH (4.0kW - 3P 380V)", kw: 4, phase: "3 pha 380V", iOut: 9, vdcMax: 900, mpptMin: 500, idcMax: 20, price: 7800000 },
    { name: "SAJ PDS33-4T5R5B-EH (5.5kW - 3P 380V)", kw: 5.5, phase: "3 pha 380V", iOut: 13, vdcMax: 900, mpptMin: 500, idcMax: 25, price: 9200000 },
    { name: "SAJ PDS33-4T7R5B-EH (7.5kW - 3P 380V)", kw: 7.5, phase: "3 pha 380V", iOut: 17, vdcMax: 900, mpptMin: 500, idcMax: 32, price: 11200000 },
    { name: "SAJ PDS33-4T011B-EH (11kW - 3P 380V)", kw: 11, phase: "3 pha 380V", iOut: 25, vdcMax: 900, mpptMin: 500, idcMax: 42, price: 14500000 },
    { name: "SAJ PDS33-4T015B-EH (15kW - 3P 380V)", kw: 15, phase: "3 pha 380V", iOut: 32, vdcMax: 900, mpptMin: 500, idcMax: 55, price: 17800000 },
    { name: "SAJ PDS33-4T18R5B-EH (18.5kW - 3P 380V)", kw: 18.5, phase: "3 pha 380V", iOut: 37, vdcMax: 900, mpptMin: 500, idcMax: 65, price: 21200000 },
    { name: "SAJ PDS33-4T022B-EH (22kW - 3P 380V)", kw: 22, phase: "3 pha 380V", iOut: 45, vdcMax: 900, mpptMin: 500, idcMax: 78, price: 24800000 },
    { name: "SAJ PDS33-4T030B-EH (30kW - 3P 380V)", kw: 30, phase: "3 pha 380V", iOut: 60, vdcMax: 900, mpptMin: 500, idcMax: 98, price: 31500000 },
    { name: "Voltique YK500-T4-5R5G (5.5kW - 3P 380V)", kw: 5.5, phase: "3 pha 380V", iOut: 13, vdcMax: 950, mpptMin: 350, idcMax: 25, price: 7500000 },
    { name: "Voltique YK500-T4-7R5G (7.5kW - 3P 380V)", kw: 7.5, phase: "3 pha 380V", iOut: 17, vdcMax: 950, mpptMin: 350, idcMax: 32, price: 8900000 },
    { name: "Voltique YK500-T4-011G (11kW - 3P 380V)", kw: 11, phase: "3 pha 380V", iOut: 25, vdcMax: 950, mpptMin: 350, idcMax: 42, price: 11500000 },
    { name: "Voltique YK500-T4-015G (15kW - 3P 380V)", kw: 15, phase: "3 pha 380V", iOut: 32, vdcMax: 950, mpptMin: 350, idcMax: 52, price: 14200000 },
    { name: "Voltique YK500-T4-18R5G (18.5kW - 3P 380V)", kw: 18.5, phase: "3 pha 380V", iOut: 37, vdcMax: 950, mpptMin: 350, idcMax: 62, price: 17100000 },
    { name: "Voltique YK500-T4-022G (22kW - 3P 380V)", kw: 22, phase: "3 pha 380V", iOut: 45, vdcMax: 950, mpptMin: 350, idcMax: 75, price: 19800000 },
    { name: "Voltique YK500-T4-030G (30kW - 3P 380V)", kw: 30, phase: "3 pha 380V", iOut: 60, vdcMax: 950, mpptMin: 350, idcMax: 95, price: 25800000 },
    { name: "INVT GD100-2R2G-SS2-PV (2.2kW - 1P 220V)", kw: 2.2, phase: "1 pha 220V", iOut: 10, vdcMax: 450, mpptMin: 250, idcMax: 18, price: 4900000 },
    { name: "INVT GD100-5R5G-4-PV (5.5kW - 3P 380V)", kw: 5.5, phase: "3 pha 380V", iOut: 13, vdcMax: 800, mpptMin: 350, idcMax: 25, price: 7600000 },
    { name: "INVT GD100-7R5G-4-PV (7.5kW - 3P 380V)", kw: 7.5, phase: "3 pha 380V", iOut: 17, vdcMax: 800, mpptMin: 350, idcMax: 30, price: 9100000 },
    { name: "INVT GD100-011G-4-PV (11kW - 3P 380V)", kw: 11, phase: "3 pha 380V", iOut: 25, vdcMax: 800, mpptMin: 350, idcMax: 40, price: 11800000 },
    { name: "INVT GD100-015G-4-PV (15kW - 3P 380V)", kw: 15, phase: "3 pha 380V", iOut: 32, vdcMax: 800, mpptMin: 350, idcMax: 50, price: 14600000 },
    { name: "INVT GD100-022G-4-PV (22kW - 3P 380V)", kw: 22, phase: "3 pha 380V", iOut: 45, vdcMax: 800, mpptMin: 350, idcMax: 70, price: 20200000 },
    { name: "INVT GD100-030G-4-PV (30kW - 3P 380V)", kw: 30, phase: "3 pha 380V", iOut: 60, vdcMax: 800, mpptMin: 350, idcMax: 90, price: 26500000 }
];
const MOCK_PRODUCTS = Array.from({ length: 24 }, (_, i) => {
    const idx = i + 1;
    const isPanel = idx % 3 === 0;
    const isPump = idx % 3 === 2;
    if (isPanel) {
        return {
            title: `Tấm Pin Năng Lượng Mặt Trời Công Suất Cao Mẫu #${idx}`,
            img: "https://unsplash.com",
            specs: "Công nghệ tế bào quang điện N-Type TOPCon thế hệ mới | Hiệu suất chuyển đổi module đạt trên 22.5% | Chịu tải trọng gió bão 2400Pa và tuyết 5400Pa | Kính cường lực 2 mặt chống phản xạ ánh sáng | Suy giảm công suất cực thấp dưới 0.4% mỗi năm | Hoạt động ổn định trong điều kiện bức xạ yếu | Khung hợp kim nhôm anodized chống ăn mòn muối biển | Hộp đấu nối đạt chuẩn chống bụi nước IP68 | Bảo hành vật lý 12 năm chính hãng | Bảo hành hiệu suất tuyến tính 25 năm"
        };
    } else if (isPump) {
        return {
            title: `Máy Bơm Hỏa Tiễn & Bơm Trục Đứng Chuyên Dụng #${idx}`,
            img: "https://unsplash.com",
            specs: "Thân bơm chế tạo từ Inox 304 chống gỉ sét tuyệt đối | Cánh bơm đa tầng chịu áp lực cột áp đẩy cao vượt trội | Động cơ dây đồng 100% tản nhiệt bằng dầu/nước | Tích hợp van một chiều chống tụt áp đường ống | Hoạt động tương thích hoàn hảo với biến tần năng lượng mặt trời | Lưu lượng ổn định phục vụ tưới sầu riêng, cà phê đồi dốc | Chịu được hàm lượng cát nhỏ trong giếng khoan sâu | Trục động cơ bằng thép không gỉ siêu bền | Tiết kiệm điện năng và vận hành êm ái | Bảo hành kỹ thuật 12 tháng"
        };
    }
    return {
        title: `Biến Tần Bơm Năng Lượng Mặt Trời Chuyên Dụng #${idx}`,
        img: "https://unsplash.com",
        specs: "Tích hợp thuật toán dò điểm công suất cực đại MPPT đạt 99.5% | Tự động khởi động khi có nắng và ngủ đông khi mây mù | Hỗ trợ chuyển đổi linh hoạt giữa điện mặt trời DC và điện lưới AC | Bảo vệ toàn diện: chạy khô, mất pha, quá áp, quá dòng, ngắn mạch | Dải điện áp hoạt động DC rộng từ 250V đến 900V | Tự động điều chỉnh tần số bơm theo cường độ bức xạ mặt trời | Màn hình bàn phím LED dễ dàng theo dõi và cài đặt thông số | Hệ thống tản nhiệt nhôm đúc nguyên khối kèm quạt làm mát | Hỗ trợ giám sát và điều khiển từ xa qua module mở rộng | Bảo hành chính hãng 24 tháng"
    };
});
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
    { brand: "Voltique", code: "Err05", desc: "Quá áp khi tăng tốc (Overvoltage during acceleration)", fix: "Đo lại điện áp hở mạch DC từ giàn pin, đảm bảo không vượt quá 900V." },
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
        content: "Nhiều anh em thợ khi đấu nối giàn pin chỉ nhìn vào điện áp định mức ghi trên tem mà quên mất hiệu ứng nhiệt độ. Vào buổi sáng sớm trời lạnh tại vùng cao, điện áp hở mạch Voc của tấm pin có thể tăng thêm 10% so với tiêu chuẩn. Vì vậy, công thức an toàn bắt buộc là: Tổng Voc x 1.1 phải luôn nhỏ hơn điện áp DC tối đa (Vdc_max) của biến tần."
    },
    {
        title: "Tại sao hệ thống bơm nước đẩy đồi dốc không cần lắp thêm điện trở hãm ngoài?",
        date: "08/11/2026",
        content: "Điện trở hãm ngoài chỉ dùng cho các tải có quán tính quay lớn như băng tải, cẩu trục hoặc máy ly tâm tốc độ cao để tiêu tán năng lượng trả ngược khi phanh gấp. Đối với hệ thống bơm nước đẩy lên dốc cao, ngay khi ngắt điện, áp lực cột nước đè ngược xuống cánh bơm kết hợp lực ma sát sẽ làm motor dừng quay gần như tức thì. Bạn chỉ cần cài chế độ dừng tự do (Coast to stop) trên biến tần là hoàn toàn an toàn và tiết kiệm chi phí."
    }
];
