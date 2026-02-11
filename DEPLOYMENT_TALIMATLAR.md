# Siteyi Dışarıya Açma Talimatları

Web sitenizi başkalarının erişimine açmak için iki ana yöntem vardır. Bilgisayarınızda **Ngrok** kurulumunu tamamladım, ancak kullanabilmek için bir token eklemeniz gerekiyor.

## 1. Yöntem: Geçici Erişim (Ngrok) - ÖNERİLEN
Bu yöntem en hızlısıdır. Bilgisayarınız açık olduğu sürece site erişilebilir olur.

1. **Hesap Oluşturun**: [Ngrok Dashboard](https://dashboard.ngrok.com/signup) adresinden ücretsiz bir hesap açın.
2. **Token Alın**: "Your Authtoken" bölümündeki kodu kopyalayın.
3. **Token'ı Kaydedin**: Aşağıdaki komutu terminale yapıştırın (TOKEN yerine kopyaladığınız kodu yazın):
   ```bash
   ngrok config add-authtoken SIZIN_TOKEN_KODUNUZ
   ```
4. **Siteyi Yayınlayın**:
   ```bash
   ngrok http 8000
   ```
   Ekranda çıkan `Forwarding` yanındaki `https://...ngrok-free.app` adresi sitenizin linkidir. Bu linki başkalarına gönderebilirsiniz.

---

## 2. Yöntem: Kalıcı Deployment (Render.com)
Sitenin siz bilgisayarı kapatsanız bile 7/24 çalışmasını istiyorsanız bu yöntemi kullanın. (Not: Veritabanı SQLite olduğu için her yeniden başlatmada veriler sıfırlanabilir. Kalıcı veri için PostgreSQL gerekir.)

1. Projeyi GitHub'a yükleyin.
2. [Render.com](https://render.com) hesabınıza girin.
3. **New +** -> **Web Service** seçin.
4. GitHub reponuzu bağlayın.
5. Ayarları şöyle yapın:
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. "Create Web Service" butonuna tıklayın.

*Gerekli `Procfile` dosyası sizin için oluşturulmuştur.*
