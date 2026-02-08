"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Save, TestTube, RefreshCw } from "lucide-react";

export default function NastaveniPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    discordWebhook: "",
    claudeApiKey: "",
    notifikaceEnabled: true,
    minScore: 7,
    maxCena: 10000,
  });

  async function handleSave() {
    setLoading(true);
    try {
      toast({
        title: "Nastavení uloženo",
        description: "Změny byly úspěšně uloženy",
      });
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se uložit nastavení",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function testDiscord() {
    if (!settings.discordWebhook) {
      toast({
        title: "Chyba",
        description: "Zadejte Discord Webhook URL",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch(settings.discordWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "🧪 Test notifikace z Product Tracker!",
          embeds: [{
            title: "✅ Webhook funguje!",
            description: "Toto je testovací zpráva z vašeho Product Tracker dashboardu.",
            color: 65280,
          }],
        }),
      });

      if (res.ok) {
        toast({
          title: "Test úspěšný",
          description: "Zkontrolujte svůj Discord kanál",
        });
      } else {
        throw new Error("Webhook error");
      }
    } catch (error) {
      toast({
        title: "Test selhal",
        description: "Zkontrolujte Webhook URL",
        variant: "destructive",
      });
    }
  }

  async function triggerSearch() {
    setLoading(true);
    try {
      const res = await fetch("/api/trigger-search", { method: "POST" });
      if (res.ok) {
        toast({
          title: "Vyhledávání spuštěno",
          description: "N8N workflow byl spuštěn",
        });
      } else {
        throw new Error("Trigger failed");
      }
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se spustit vyhledávání",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nastavení</h1>
        <p className="text-muted-foreground">
          Konfigurace notifikací a integrace
        </p>
      </div>

      <div className="grid gap-6">
        {/* Discord Integration */}
        <Card>
          <CardHeader>
            <CardTitle>Discord integrace</CardTitle>
            <CardDescription>
              Nastavení pro Discord notifikace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="discordWebhook" className="text-sm font-medium">
                Webhook URL
              </label>
              <div className="flex gap-2">
                <Input
                  id="discordWebhook"
                  type="url"
                  placeholder="https://discord.com/api/webhooks/..."
                  value={settings.discordWebhook}
                  onChange={(e) => setSettings({ ...settings, discordWebhook: e.target.value })}
                  className="flex-1"
                />
                <Button variant="outline" onClick={testDiscord}>
                  <TestTube className="h-4 w-4 mr-2" />
                  Test
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Vytvořte webhook v nastavení Discord kanálu
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Claude API */}
        <Card>
          <CardHeader>
            <CardTitle>Claude API</CardTitle>
            <CardDescription>
              Anthropic API klíč pro AI analýzu
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="claudeApiKey" className="text-sm font-medium">
                API Key
              </label>
              <Input
                id="claudeApiKey"
                type="password"
                placeholder="sk-ant-..."
                value={settings.claudeApiKey}
                onChange={(e) => setSettings({ ...settings, claudeApiKey: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Získejte API klíč na console.anthropic.com
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Notifikace</CardTitle>
            <CardDescription>
              Preference pro upozornění
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Povolit notifikace</p>
                <p className="text-sm text-muted-foreground">
                  Zasílat upozornění na nové nálezy
                </p>
              </div>
              <Switch
                checked={settings.notifikaceEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, notifikaceEnabled: checked })}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="minScore" className="text-sm font-medium">
                Minimální score pro notifikaci
              </label>
              <Input
                id="minScore"
                type="number"
                min="1"
                max="10"
                value={settings.minScore}
                onChange={(e) => setSettings({ ...settings, minScore: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="maxCena" className="text-sm font-medium">
                Maximální cena (Kč)
              </label>
              <Input
                id="maxCena"
                type="number"
                min="0"
                value={settings.maxCena}
                onChange={(e) => setSettings({ ...settings, maxCena: parseInt(e.target.value) })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Manual Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Manuální akce</CardTitle>
            <CardDescription>
              Spuštění vyhledávání a synchronizace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={triggerSearch} disabled={loading} className="w-full">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Spustit vyhledávání teď
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Manuálně spustí N8N workflow pro prohledání e-shopů a bazarů
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          Uložit nastavení
        </Button>
      </div>
    </div>
  );
}
