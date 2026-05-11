# 🚂 Railway Analytics Dashboard

Enterprise darajasidagi temir yo'l logistika tahlili tizimi. Poyezdlar harakati, yuklar tahlili, anomaliyalarni aniqlash va real-time monitoring imkoniyatlari.

## 📋 Loyiha Tuzilmasi

```
├── app/
│   ├── layout.tsx          # Root layout (dark theme, fonts)
│   ├── page.tsx            # Asosiy dashboard sahifasi
│   └── globals.css         # Global styles va tema ranglari
├── components/
│   └── dashboard/
│       ├── dashboard-header.tsx    # Header, notifications, settings
│       ├── file-uploader.tsx       # Excel fayl yuklash komponenti
│       ├── filter-panel.tsx        # ✨ Filtrlar paneli (sana, stansiya, yuk turi, kompaniya)
│       ├── kpi-cards.tsx           # KPI ko'rsatkichlar kartochkalari
│       ├── analytics-charts.tsx    # Grafiklar (Recharts)
│       ├── anomalies-panel.tsx     # Anomaliyalar paneli
│       ├── trains-table.tsx        # Poyezdlar ro'yxati jadvali
│       └── company-stats.tsx       # Kompaniyalar statistikasi
├── lib/
│   ├── types.ts           # TypeScript tiplar va interfeyslar
│   ├── excel-parser.ts    # Excel fayllarni o'qish va parse qilish
│   ├── analytics.ts       # Analitika va anomaliya aniqlash algoritmlari
│   ├── data-context.tsx   # Global state management (React Context)
│   └── utils.ts           # Yordamchi funksiyalar
└── README.md              # Ushbu fayl
```

## 🎯 Asosiy Funksiyalar

### 1. Excel Fayl Yuklash
- `.xlsx`, `.xls`, `.csv` formatlarini qo'llab-quvvatlash
- Drag & drop interfeys
- Avtomatik varaq turi aniqlash (mahalliy/tranzit)
- Demo ma'lumotlar bilan ishlash imkoniyati

### 2. Ma'lumotlar Turlari

#### Mahalliy Poyezdlar (LocalTrain)
- Bir stikdan boshqa stikga yuborilayotgan poyezdlar
- Formatlash sanasi va vaqti
- Yuklash stansiyasi, sдача stansiyasi
- Masofa, yuk turi, jo'natuvchi/qabul qiluvchi

#### Tranzit Poyezdlar (TransitTrain)
- Bir stikdan kirib boshqa stikdan chiqayotgan poyezdlar
- Qabul va sдача stansiyalari
- Stiklar orasidagi masofa

### 3. Filtrlar Tizimi va Ko'rinishlar ✨ (Yangi!)

Poyezdlar va ma'lumotlarni quyidagilar bo'yicha filtrlash:
- **Global Ko'rinish (Tabs)** — Barcha poyezdlar, Faqat Mahalliy poyezdlar, Faqat Tranzit poyezdlar (Endi butun dashbord shu tanlovga moslashadi)
- **Sana oralig'i** — Boshlanish va tugash sanasi
- **Stansiya** — Yuklash yoki qabul stansiyasi
- **Yuk turi** — Yuk kategoriyasi bo'yicha
- **Kompaniya** — Jo'natuvchi yoki qabul qiluvchi kompaniya
- **Faqat anomaliyalar** — Faqat muammoli poyezdlarni ko'rsatish
- Bir tugma bilan barcha ma'lumotlarni tozalash (Endi yanada qulay va ko'zga tashlanadigan qilingan)

### 4. Analitika Funksiyalari

#### KPI Ko'rsatkichlari
- Jami poyezdlar va vagonlar soni
- O'z vaqtida yetkazish foizi
- O'rtacha harakat tezligi
- Umumiy bosib o'tilgan masofa
- Aniqlangan anomaliyalar soni

#### Anomaliya Aniqlash
1. **O'tib Ketish Anomaliyasi** - Keyinroq kirgan poyezd oldin yetib borgan holatlar
2. **To'xtash Anomaliyasi** - Kutilganidan ko'proq vaqt sarflangan holatlar
3. **Kechikish Tahlili** - Jadval bo'yicha kechikishlar tahlili

### 4. Vizualizatsiya

#### Grafiklar (Recharts)
- Kunlik dinamika (Area Chart)
- Kechikishlar trendi (Line Chart)
- O'z vaqtida yetkazish % (Area Chart)
- Yuk turlari taqsimoti (Pie Chart)
- Stansiyalar bo'yicha trafik (Bar Chart)
- Marshrut samaradorligi (Bar Chart)

#### Jadvallar
- Poyezdlar ro'yxati (sort, filter, pagination)
- Kompaniyalar statistikasi
- Anomaliyalar ro'yxati

## 🛠 Texnologiyalar

- **Framework:** Next.js 15 (App Router)
- **UI/UX:** Premium Glassmorphism dizayn, Tailwind CSS, shadcn/ui
- **Fonts:** Outfit, JetBrains Mono
- **Charts:** Recharts
- **Excel:** xlsx (SheetJS)
- **Date:** date-fns
- **Icons:** Lucide React (Premium gradient variantlar bilan)
- **State:** React Context

## 📦 O'rnatish

```bash
# Dependensiyalarni o'rnatish
pnpm install

# Development server
pnpm dev

# Production build
pnpm build
```

## 🔧 Integratsiya Qilish

Ushbu loyihani mavjud loyihangizga qo'shish uchun:

1. `lib/` papkasidagi fayllarni ko'chiring:
   - `types.ts` - Tiparni qo'shing
   - `excel-parser.ts` - Excel parser
   - `analytics.ts` - Analitika funksiyalari
   - `data-context.tsx` - State management

2. `components/dashboard/` papkasini ko'chiring

3. Kerakli dependensiyalarni o'rnating:
   ```bash
   pnpm add xlsx recharts date-fns lucide-react
   ```

4. `DataProvider` bilan wrap qiling:
   ```tsx
   import { DataProvider } from '@/lib/data-context';
   
   export default function Layout({ children }) {
     return <DataProvider>{children}</DataProvider>;
   }
   ```

## 📊 Excel Fayl Formati

### Mahalliy Poyezdlar Varag'i (Sheet1 / Местные)
| # | Vagon | Yuklash st. | Yuk turi | Jo'natish st. | Jo'natuvchi | Qabul qiluvchi | Indeks | Form. sana | Form. vaqt | Yuklash sana | Masofa | Sдача st. | Sдача sana | Sдача vaqt |

### Tranzit Poyezdlar Varag'i (Sheet2 / Транзит)
| # | Vagon | Yuklash st. | Yuk turi | Jo'natish st. | Jo'natuvchi | Qabul qiluvchi | Indeks | Qabul st. | Qabul sana | Qabul vaqt | Masofa | Sдача st. | Sдача sana | Sдача vaqt |

## 🎨 Tema Sozlamalari

Tema ranglari `globals.css` faylida sozlanadi:
- `--background` - Asosiy fon rangi
- `--foreground` - Asosiy matn rangi
- `--primary` - Primary rang (ko'k)
- `--chart-1..5` - Grafik ranglari
- `--destructive` - Xatolik/ogohlantirish rangi

## 📝 API Hujjatlari

### Data Context Hook

```tsx
const {
  // Ma'lumotlar
  localTrains,        // LocalTrain[]
  transitTrains,      // TransitTrain[]
  
  // Computed
  kpis,               // KPIData | null
  delayAnalysis,      // DelayAnalysis[]
  overtakeAnomalies,  // OvertakeAnomaly[]
  stopAnomalies,      // StopAnomaly[]
  stationStats,       // StationStats[]
  dailyStats,         // DailyStats[]
  cargoTypeStats,     // CargoTypeStats[]
  companyStats,       // CompanyStats[]
  routeData,          // RouteData[]
  
  // Actions
  uploadFile,         // (file: File) => Promise<UploadResult>
  loadDemoData,       // () => void
  clearData,          // () => void
  
  // Status
  isLoading,          // boolean
  hasData,            // boolean
} = useData();
```

## 🔒 Xavfsizlik Eslatmalari

- Barcha ma'lumotlar faqat client-side da saqlanadi
- Server-ga hech qanday ma'lumot yuborilmaydi
- Sahifa yangilanganda ma'lumotlar yo'qoladi
- Production uchun backend qo'shish tavsiya etiladi

## 📈 Kelajakdagi Rejalar

- [x] ✅ **Filtrlar tizimi** — Sana, stansiya, yuk turi, kompaniya bo'yicha filtrlar
- [ ] Backend API integratsiyasi
- [ ] Ma'lumotlar bazasiga saqlash
- [ ] Real-time yangilanishlar (WebSocket)
- [ ] Eksport funksiyalari (PDF, Excel)
- [ ] Foydalanuvchi autentifikatsiyasi
- [ ] Ko'p tilli qo'llab-quvvatlash
- [ ] Mobil ilovalar

## 📄 Litsenziya

MIT License - Erkin foydalanish mumkin.

---

**Railway Analytics** — Enterprise darajasidagi temir yo'l logistika tahlili tizimi 🚂
