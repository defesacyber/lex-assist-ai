import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { 
  Bell, Check, CheckCheck, Clock, AlertTriangle,
  Calendar, FileText, Brain, Loader2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const notificationIcons: Record<string, any> = {
  deadline_alert: Clock,
  hearing_reminder: Calendar,
  analysis_complete: Brain,
  document_uploaded: FileText,
  system: Bell
};

function NotificationsContent() {
  const { data: notifications, isLoading, refetch } = trpc.notifications.list.useQuery({ limit: 50 });
  
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => refetch()
  });

  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      toast.success("Todas as notificações foram marcadas como lidas");
      refetch();
    }
  });

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-7 w-7 text-primary" />
            Notificações
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount}</Badge>
            )}
          </h1>
          <p className="text-muted-foreground">
            Acompanhe alertas de prazos, audiências e atualizações
          </p>
        </div>
        {unreadCount > 0 && (
          <Button 
            variant="outline" 
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
            className="gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : notifications && notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const Icon = notificationIcons[notification.notificationType] || Bell;
            const isUrgent = notification.notificationType === "deadline_alert" && 
                           notification.title.toLowerCase().includes("urgente");

            return (
              <Card 
                key={notification.id}
                className={cn(
                  "transition-all",
                  !notification.isRead && "border-primary/50 bg-primary/5",
                  isUrgent && !notification.isRead && "border-destructive/50 bg-destructive/5"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "p-2 rounded-lg shrink-0",
                      isUrgent ? "bg-destructive/10" : "bg-primary/10"
                    )}>
                      {isUrgent ? (
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                      ) : (
                        <Icon className={cn(
                          "h-5 w-5",
                          !notification.isRead ? "text-primary" : "text-muted-foreground"
                        )} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className={cn(
                            "font-medium",
                            !notification.isRead && "text-foreground",
                            notification.isRead && "text-muted-foreground"
                          )}>
                            {notification.title}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsReadMutation.mutate({ id: notification.id })}
                            className="shrink-0"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.createdAt), { 
                          locale: ptBR, 
                          addSuffix: true 
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma notificação</h3>
            <p className="text-muted-foreground">
              Você receberá alertas sobre prazos, audiências e atualizações aqui
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function Notifications() {
  return (
    <DashboardLayout>
      <NotificationsContent />
    </DashboardLayout>
  );
}
