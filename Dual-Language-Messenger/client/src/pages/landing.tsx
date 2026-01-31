import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/hooks/use-language";
import { t } from "@/lib/i18n";
import { MessageCircle, Shield, Smartphone, Globe } from "lucide-react";

export default function LandingPage() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">{t('appName', language)}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === 'en' ? 'ru' : 'en')}
              data-testid="button-language-toggle"
            >
              <Globe className="w-4 h-4 mr-2" />
              {language === 'en' ? 'RU' : 'EN'}
            </Button>
            <a href="/api/login">
              <Button data-testid="button-login">{t('login', language)}</Button>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-6">
                <Shield className="w-4 h-4" />
                <span>{t('tagline', language)}</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
                {t('heroTitle', language)}
                <br />
                <span className="text-primary">{t('appName', language)}</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                {t('heroSubtitle', language)}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/api/login">
                  <Button size="lg" className="w-full sm:w-auto text-base px-8" data-testid="button-get-started">
                    {t('getStarted', language)}
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-card/50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
              {t('features', language)}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <Card className="p-6 hover-elevate">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <MessageCircle className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t('feature1Title', language)}</h3>
                <p className="text-muted-foreground text-sm">{t('feature1Desc', language)}</p>
              </Card>
              
              <Card className="p-6 hover-elevate">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t('feature2Title', language)}</h3>
                <p className="text-muted-foreground text-sm">{t('feature2Desc', language)}</p>
              </Card>
              
              <Card className="p-6 hover-elevate">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Smartphone className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t('feature3Title', language)}</h3>
                <p className="text-muted-foreground text-sm">{t('feature3Desc', language)}</p>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-6 border-t border-border">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} {t('appName', language)}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
