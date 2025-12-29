import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  MessageSquare, Send, Bell, Clock, User, Shield, 
  Smartphone, ExternalLink, Copy, CheckCircle2, Loader2,
  HelpCircle
} from "lucide-react";
import { useOnboardingTour } from "@/components/OnboardingTour";

function SettingsContent() {
  const { user } = useAuth();
  const { startTour, resetTour } = useOnboardingTour();
  
  // Notification settings state
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState("");
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("07:00");
  const [telegramLinkCode, setTelegramLinkCode] = useState("");

  // Fetch notification settings
  const { data: notificationSettings, isLoading } = trpc.user.getNotificationSettings.useQuery();

  // Mutations
  const updateWhatsapp = trpc.user.updateWhatsappSettings.useMutation({
    onSuccess: () => toast.success("Configurações do WhatsApp salvas!"),
    onError: (err) => toast.error(err.message),
  });

  const updateTelegram = trpc.user.updateTelegramSettings.useMutation({
    onSuccess: () => toast.success("Configurações do Telegram salvas!"),
    onError: (err) => toast.error(err.message),
  });

  const updateQuietHours = trpc.user.updateQuietHours.useMutation({
    onSuccess: () => toast.success("Horário de silêncio atualizado!"),
    onError: (err) => toast.error(err.message),
  });

  const generateTelegramLink = trpc.user.generateTelegramLinkCode.useMutation({
    onSuccess: (data) => {
      setTelegramLinkCode(data.deepLink);
      toast.success("Link de vinculação gerado!");
    },
    onError: (err) => toast.error(err.message),
  });

  const sendTestNotification = trpc.user.sendTestNotification.useMutation({
    onSuccess: (data) => toast.success(data.message),
    onError: (err) => toast.error(err.message),
  });

  const resetOnboarding = trpc.user.resetOnboarding.useMutation({
    onSuccess: () => {
      toast.success("Tour resetado! Clique em 'Iniciar Tour' para ver novamente.");
    },
    onError: (err) => toast.error(err.message),
  });

  // Load settings when data arrives
  useEffect(() => {
    if (notificationSettings) {
      setWhatsappNumber(notificationSettings.whatsappNumber || "");
      setWhatsappEnabled(notificationSettings.whatsappEnabled || false);
      setTelegramChatId(notificationSettings.telegramChatId || "");
      setTelegramEnabled(notificationSettings.telegramEnabled || false);
      setQuietStart(notificationSettings.quietStart || "22:00");
      setQuietEnd(notificationSettings.quietEnd || "07:00");
    }
  }, [notificationSettings]);

  const handleSaveWhatsapp = () => {
    updateWhatsapp.mutate({
      whatsappNumber,
      whatsappEnabled,
    });
  };

  const handleSaveTelegram = () => {
    updateTelegram.mutate({
      telegramChatId,
      telegramEnabled,
    });
  };

  const handleSaveQuietHours = () => {
    updateQuietHours.mutate({
      quietStart,
      quietEnd,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Link copiado para a área de transferência!");
  };

  const formatPhoneNumber = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as Brazilian phone number
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas preferências e integrações
        </p>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="help" className="gap-2">
            <HelpCircle className="h-4 w-4" />
            Ajuda
          </TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          {/* WhatsApp Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">WhatsApp</CardTitle>
                  <CardDescription>
                    Receba alertas de prazos e audiências diretamente no WhatsApp
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Ativar notificações por WhatsApp</Label>
                  <p className="text-sm text-muted-foreground">
                    Receba alertas importantes no seu celular
                  </p>
                </div>
                <Switch
                  checked={whatsappEnabled}
                  onCheckedChange={setWhatsappEnabled}
                />
              </div>

              {whatsappEnabled && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp-number">Número do WhatsApp</Label>
                    <div className="flex gap-2">
                      <Input
                        id="whatsapp-number"
                        placeholder="(11) 99999-9999"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(formatPhoneNumber(e.target.value))}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        onClick={() => sendTestNotification.mutate({ channel: 'whatsapp' })}
                        disabled={!whatsappNumber || sendTestNotification.isPending}
                      >
                        {sendTestNotification.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Inclua o DDD. Ex: (11) 99999-9999
                    </p>
                  </div>

                  <Button onClick={handleSaveWhatsapp} disabled={updateWhatsapp.isPending}>
                    {updateWhatsapp.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    Salvar WhatsApp
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Telegram Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Send className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Telegram</CardTitle>
                  <CardDescription>
                    Receba alertas via Telegram Bot com comandos interativos
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Ativar notificações por Telegram</Label>
                  <p className="text-sm text-muted-foreground">
                    Conecte sua conta ao bot @LexAssistAIBot
                  </p>
                </div>
                <Switch
                  checked={telegramEnabled}
                  onCheckedChange={setTelegramEnabled}
                />
              </div>

              {telegramEnabled && (
                <>
                  <Separator />
                  
                  {/* Link Generation */}
                  <div className="space-y-3">
                    <Label>Vincular conta do Telegram</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => generateTelegramLink.mutate()}
                        disabled={generateTelegramLink.isPending}
                        className="gap-2"
                      >
                        {generateTelegramLink.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ExternalLink className="h-4 w-4" />
                        )}
                        Gerar Link de Vinculação
                      </Button>
                    </div>

                    {telegramLinkCode && (
                      <div className="p-3 bg-muted rounded-lg space-y-2">
                        <p className="text-sm font-medium">Link gerado:</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-xs bg-background p-2 rounded border truncate">
                            {telegramLinkCode}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(telegramLinkCode)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Clique no link ou abra no Telegram para vincular sua conta
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Manual Chat ID */}
                  <div className="space-y-2">
                    <Label htmlFor="telegram-chat-id">Chat ID (opcional)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="telegram-chat-id"
                        placeholder="123456789"
                        value={telegramChatId}
                        onChange={(e) => setTelegramChatId(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        onClick={() => sendTestNotification.mutate({ channel: 'telegram' })}
                        disabled={!telegramChatId || sendTestNotification.isPending}
                      >
                        {sendTestNotification.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Se preferir, insira seu Chat ID manualmente
                    </p>
                  </div>

                  <Button onClick={handleSaveTelegram} disabled={updateTelegram.isPending}>
                    {updateTelegram.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    Salvar Telegram
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quiet Hours */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Horário de Silêncio</CardTitle>
                  <CardDescription>
                    Defina um período para não receber notificações (exceto urgentes)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quiet-start">Início</Label>
                  <Input
                    id="quiet-start"
                    type="time"
                    value={quietStart}
                    onChange={(e) => setQuietStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quiet-end">Fim</Label>
                  <Input
                    id="quiet-end"
                    type="time"
                    value={quietEnd}
                    onChange={(e) => setQuietEnd(e.target.value)}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Durante este período, apenas notificações críticas (prazos vencendo em 24h) serão enviadas.
              </p>
              <Button onClick={handleSaveQuietHours} disabled={updateQuietHours.isPending}>
                {updateQuietHours.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Salvar Horário
              </Button>
            </CardContent>
          </Card>

          {/* Notification Types */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tipos de Notificação</CardTitle>
              <CardDescription>
                Alertas que você receberá via WhatsApp e Telegram
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="destructive">Crítico</Badge>
                    <span className="text-sm">Prazo vencendo em 24h</span>
                  </div>
                  <span className="text-sm text-muted-foreground">Sempre ativo</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-orange-500">Alto</Badge>
                    <span className="text-sm">Prazo vencendo em 3 dias</span>
                  </div>
                  <span className="text-sm text-muted-foreground">Respeita silêncio</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-yellow-500">Médio</Badge>
                    <span className="text-sm">Prazo vencendo em 7 dias</span>
                  </div>
                  <span className="text-sm text-muted-foreground">Respeita silêncio</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">Lembrete</Badge>
                    <span className="text-sm">Audiências agendadas</span>
                  </div>
                  <span className="text-sm text-muted-foreground">Respeita silêncio</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações do Perfil</CardTitle>
              <CardDescription>
                Seus dados de conta no LexAssist AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={user?.name || ""} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user?.email || ""} disabled />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Para alterar suas informações de perfil, acesse as configurações da sua conta Manus.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Segurança</CardTitle>
              <CardDescription>
                Configurações de segurança da sua conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Autenticação via Manus OAuth</p>
                  <p className="text-sm text-muted-foreground">
                    Sua conta está protegida pela autenticação segura do Manus
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Help Tab */}
        <TabsContent value="help" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tour Interativo</CardTitle>
              <CardDescription>
                Conheça todas as funcionalidades do LexAssist AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                O tour interativo apresenta as principais funcionalidades da plataforma.
                Você pode reiniciá-lo a qualquer momento.
              </p>
              <div className="flex gap-2">
                <Button onClick={startTour} className="gap-2">
                  <HelpCircle className="h-4 w-4" />
                  Iniciar Tour
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => resetOnboarding.mutate()}
                  disabled={resetOnboarding.isPending}
                >
                  {resetOnboarding.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Resetar Tour
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Suporte</CardTitle>
              <CardDescription>
                Precisa de ajuda? Entre em contato conosco
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Documentação</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Acesse guias e tutoriais completos
                  </p>
                  <Button variant="outline" size="sm" className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Ver Documentação
                  </Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Contato</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Fale com nossa equipe de suporte
                  </p>
                  <Button variant="outline" size="sm" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Abrir Chamado
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function Settings() {
  return (
    <DashboardLayout>
      <SettingsContent />
    </DashboardLayout>
  );
}
