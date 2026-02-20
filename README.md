📑 Project: Logo-Linked Expense Tracker (Mobile)
Bu proje; şirket yöneticilerinin ve müdürlerinin yaptığı harcamaları (fiş/fatura) anında dijitalleştirerek Logo Tiger ERP sistemine "Gider Fişi" (Service Invoice/Expense Slip) olarak aktarmayı amaçlayan, yapay zeka destekli bir mobil otomasyon çözümüdür.

🚀 1) Ürün Hedefi ve Kapsam
Amaç
Kullanıcı fiş fotoğrafını çeker → Sistem OCR ile verileri ayıklar → Logo Tiger ile eşleşen masaj kalemlerini/projeleri önerir → Onaylanan veri Logo REST API / Object Post aracılığıyla doğrudan ERP'ye gider fişi olarak yazılır.

MVP Özellikleri (Must-Have)
Fiş Tarama: Expo Camera ile yüksek kaliteli çekim ve otomatik kırpma.

Akıllı OCR & Data Extraction: Fiş üzerindeki Toplam Tutar, Tarih, KDV, Vergi No ve Merchant (Satıcı) bilgisinin yakalanması.

Logo Tiger Senkronizasyonu:

Hizmet Kartları (Gider kalemleri) listeleme.

Cari Hesap/Kasa/Banka seçimi.

Gider Onay Ekranı: Çıkarılan verilerin Logo'ya gönderilmeden önce son kontrolü.

Durum Takibi: "Gönderildi", "Logo'da Hata Aldı", "Beklemede" statüleri.

📱 2) UX: Akıllı ve Hızlı Akış
Ekran 1 — "Hızlı Çekim"
Kamera arayüzü (Tek buton: "Fişi Tara").

Görüntü işleme (Netleştirme ve Perspektif düzeltme).

Yükleniyor... animasyonu sırasında OCR ve Logo API sorgusu.

Ekran 2 — "Veri Eşleme & Onay"
Görsel Kanıt: Çekilen fişin üstte küçük önizlemesi.

Form Alanları: * Tutar & Para Birimi (OCR'dan geldi).

Tarih (OCR'dan geldi).

Hizmet Seçimi: (Logo'dan gelen masraf merkezleri/hizmet kartları - AI destekli öneri).

Açıklama: (Örn: "Müşteri öğle yemeği").

CTA: "Logo'ya Aktar".

Ekran 3 — "Dashboard & Geçmiş"
Bu ayki toplam harcamalar.

Logo'ya başarıyla aktarılan son 10 işlem.

Aktarılamayan (Hatalı) kayıtlar için "Yeniden Dene" opsiyonu.

🏗️ 3) Sistem Mimarisi (Teknik Yapı)
Mobil Katman (Frontend)
Framework: Expo (React Native).

State Management: TanStack Query (Zustand veya Redux ile birlikte).

OCR: Google Vision API veya cihaz içi ML Kit (Expo modülleri).

Backend Katman (Bridge/Köprü)
Logo Tiger doğrudan dış dünyaya açık olmadığı için arada bir Node.js/NestJS köprü (Middleware) gereklidir:

Auth: JWT tabanlı kullanıcı doğrulama (Müdür/Yönetici rolleri).

DB (PostgreSQL/MongoDB): Fiş görsellerinin URL'leri, kullanıcı geçmişi ve Logo transfer logları.

File Storage: AWS S3 veya Firebase Storage (Fişlerin dijital arşivi için).

Logo Integration: * Logo REST Service üzerinden JSON post işlemleri.

Gerekli ise Logo Objects (L_CAPILIB) üzerinden DLL tetikleme.

🛠️ 4) Veritabanı Şeması (Taslak)
Receipts Table:

id: UUID

user_id: Foreign Key

image_url: String

amount: Decimal

date: DateTime

merchant_name: String

logo_status: Enum (Pending, Success, Failed)

logo_ref_no: String (Logo'daki kayıt numarası)

raw_ocr_data: JSONB (Yedek veri için)

📅 5) Yol Haritası (Roadmap)
[ ] Phase 1: Expo ile kamera ve temel UI tasarımı.

[ ] Phase 2: OCR entegrasyonu ve veri ayrıştırma algoritması (Regex/AI).

[ ] Phase 3: Node.js Backend ve DB kurulumu (Fişleri saklama).

[ ] Phase 4: Logo Tiger REST API entegrasyonu (Gider Fişi oluşturma).

[ ] Phase 5: Push Notifications (Harcama onaylandı/reddedildi bildirimleri).



# Starter Template with React Navigation

This is a minimal starter template for React Native apps using Expo and React Navigation.

It includes the following:

- Example [Native Stack](https://reactnavigation.org/docs/native-stack-navigator) with a nested [Bottom Tab](https://reactnavigation.org/docs/bottom-tab-navigator)
- Web support with [React Native for Web](https://necolas.github.io/react-native-web/)
- TypeScript support and configured for React Navigation
- Automatic [deep link](https://reactnavigation.org/docs/deep-linking) and [URL handling configuration](https://reactnavigation.org/docs/configuring-links)
- Theme support [based on system appearance](https://reactnavigation.org/docs/themes/#using-the-operating-system-preferences)
- Expo [Development Build](https://docs.expo.dev/develop/development-builds/introduction/) with [Continuous Native Generation](https://docs.expo.dev/workflow/continuous-native-generation/)

## Getting Started

1. Create a new project using this template:

   ```sh
   npx create-expo-app@latest --template react-navigation/template
   ```

2. Edit the `app.json` file to configure the `name`, `slug`, `scheme` and bundle identifiers (`ios.bundleIdentifier` and `android.bundleIdentifier`) for your app.

3. Edit the `src/App.tsx` file to start working on your app.

## Running the app

- Install the dependencies:

  ```sh
  npm install
  ```

- Start the development server:

  ```sh
  npm start
  ```

- Build and run iOS and Android development builds:

  ```sh
  npm run ios
  # or
  npm run android
  ```

- In the terminal running the development server, press `i` to open the iOS simulator, `a` to open the Android device or emulator, or `w` to open the web browser.

## Notes

This project uses a [development build](https://docs.expo.dev/develop/development-builds/introduction/) and cannot be run with [Expo Go](https://expo.dev/go). To run the app with Expo Go, edit the `package.json` file, remove the `expo-dev-client` package and `--dev-client` flag from the `start` script.

We highly recommend using the development builds for normal development and testing.

The `ios` and `android` folder are gitignored in the project by default as they are automatically generated during the build process ([Continuous Native Generation](https://docs.expo.dev/workflow/continuous-native-generation/)). This means that you should not edit these folders directly and use [config plugins](https://docs.expo.dev/config-plugins/) instead. However, if you need to edit these folders, you can remove them from the `.gitignore` file so that they are tracked by git.

## Resources

- [React Navigation documentation](https://reactnavigation.org/)
- [Expo documentation](https://docs.expo.dev/)

---

Demo assets are from [lucide.dev](https://lucide.dev/)
