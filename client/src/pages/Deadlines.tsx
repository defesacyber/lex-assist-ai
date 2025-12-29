import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { 
  Clock, Plus, CalendarIcon, AlertTriangle, CheckCircle2,
  Trash2, Filter, Loader2
} from "lucide-react";
import { useState } from "react";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const deadlineTypes = [
  { value: "contestacao", label: "Contestação" },
  { value: "recurso", label: "Recurso" },
  { value: "manifestacao", label: "Manifestação" },
  { value: "audiencia", label: "Audiência" },
  { value: "pericia", label: "Perícia" },
  { value: "cumprimento", label: "Cumprimento de Sentença" },
  { value: "embargo", label: "Embargos" },
  { value: "outro", label: "Outro" }
];

function DeadlinesContent() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formData, setFormData] = useState({
    caseId: "",
    title: "",
    description: "",
    deadlineType: "",
    startDate: new Date(),
    dueDate: new Date(),
    daysCount: 15,
    isBusinessDays: true
  });

  const { data: deadlines, isLoading, refetch } = trpc.deadlines.list.useQuery();
  const { data: cases } = trpc.cases.list.useQuery();
  
  const createMutation = trpc.deadlines.create.useMutation({
    onSuccess: () => {
      toast.success("Prazo adicionado com sucesso!");
      setIsDialogOpen(false);
      refetch();
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao criar prazo: " + error.message);
    }
  });

  const completeMutation = trpc.deadlines.complete.useMutation({
    onSuccess: () => {
      toast.success("Prazo marcado como concluído!");
      refetch();
    }
  });

  const deleteMutation = trpc.deadlines.delete.useMutation({
    onSuccess: () => {
      toast.success("Prazo excluído!");
      refetch();
    }
  });

  const resetForm = () => {
    setFormData({
      caseId: "",
      title: "",
      description: "",
      deadlineType: "",
      startDate: new Date(),
      dueDate: new Date(),
      daysCount: 15,
      isBusinessDays: true
    });
  };

  const handleSubmit = () => {
    if (!formData.caseId || !formData.title || !formData.deadlineType) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    createMutation.mutate({
      caseId: Number(formData.caseId),
      title: formData.title,
      description: formData.description || undefined,
      deadlineType: formData.deadlineType as any,
      startDate: formData.startDate.getTime(),
      dueDate: formData.dueDate.getTime(),
      daysCount: formData.daysCount,
      isBusinessDays: formData.isBusinessDays
    });
  };

  const filteredDeadlines = deadlines?.filter(d => {
    if (statusFilter === "all") return true;
    return d.status === statusFilter;
  });

  const getDeadlineStatus = (deadline: any) => {
    if (deadline.status === "completed") return { label: "Concluído", class: "status-completed" };
    const daysLeft = differenceInDays(new Date(deadline.dueDate), new Date());
    if (daysLeft < 0) return { label: "Vencido", class: "status-overdue" };
    if (daysLeft <= 3) return { label: "Urgente", class: "status-overdue" };
    if (daysLeft <= 7) return { label: "Próximo", class: "status-pending" };
    return { label: "No prazo", class: "status-active" };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Clock className="h-7 w-7 text-primary" />
            Controle de Prazos
          </h1>
          <p className="text-muted-foreground">
            Gerencie todos os prazos processuais dos seus casos
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Prazo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Adicionar Prazo</DialogTitle>
              <DialogDescription>
                Cadastre um novo prazo processual
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Caso *</Label>
                <Select 
                  value={formData.caseId} 
                  onValueChange={(v) => setFormData({ ...formData, caseId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o caso" />
                  </SelectTrigger>
                  <SelectContent>
                    {cases?.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Título *</Label>
                <Input
                  placeholder="Ex: Prazo para contestação"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Tipo de Prazo *</Label>
                <Select 
                  value={formData.deadlineType} 
                  onValueChange={(v) => setFormData({ ...formData, deadlineType: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {deadlineTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Data Início</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.startDate, "dd/MM/yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.startDate}
                        onSelect={(date) => date && setFormData({ ...formData, startDate: date })}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-2">
                  <Label>Data Vencimento</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.dueDate, "dd/MM/yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.dueDate}
                        onSelect={(date) => date && setFormData({ ...formData, dueDate: date })}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="businessDays"
                  checked={formData.isBusinessDays}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, isBusinessDays: checked as boolean })
                  }
                />
                <Label htmlFor="businessDays" className="text-sm">
                  Contagem em dias úteis
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Salvar Prazo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="completed">Concluídos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Deadlines List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredDeadlines && filteredDeadlines.length > 0 ? (
        <div className="grid gap-4">
          {filteredDeadlines.map((deadline) => {
            const status = getDeadlineStatus(deadline);
            const daysLeft = differenceInDays(new Date(deadline.dueDate), new Date());
            const isCompleted = deadline.status === "completed";
            
            return (
              <Card 
                key={deadline.id} 
                className={cn(
                  "card-hover",
                  isCompleted && "opacity-60",
                  daysLeft < 0 && !isCompleted && "border-destructive/50"
                )}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "p-3 rounded-lg shrink-0",
                        isCompleted ? "bg-green-100 dark:bg-green-900/30" :
                        daysLeft < 0 ? "bg-red-100 dark:bg-red-900/30" :
                        daysLeft <= 3 ? "bg-orange-100 dark:bg-orange-900/30" :
                        "bg-primary/10"
                      )}>
                        {isCompleted ? (
                          <CheckCircle2 className="h-6 w-6 text-green-600" />
                        ) : daysLeft <= 3 ? (
                          <AlertTriangle className="h-6 w-6 text-orange-600" />
                        ) : (
                          <Clock className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={cn(
                            "font-semibold text-lg",
                            isCompleted && "line-through"
                          )}>
                            {deadline.title}
                          </h3>
                          <Badge className={status.class}>
                            {status.label}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span>
                            {deadlineTypes.find(t => t.value === deadline.deadlineType)?.label || deadline.deadlineType}
                          </span>
                          <span>
                            Vencimento: {format(new Date(deadline.dueDate), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                          {!isCompleted && (
                            <span className={daysLeft < 0 ? "text-destructive font-medium" : ""}>
                              {daysLeft < 0 
                                ? `Vencido há ${Math.abs(daysLeft)} dias`
                                : formatDistanceToNow(new Date(deadline.dueDate), { locale: ptBR, addSuffix: true })
                              }
                            </span>
                          )}
                        </div>
                        {deadline.confidenceScore && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">
                              Score de Confiança:
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {deadline.confidenceScore}%
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!isCompleted && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => completeMutation.mutate({ id: deadline.id })}
                          disabled={completeMutation.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Concluir
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          if (confirm("Tem certeza que deseja excluir este prazo?")) {
                            deleteMutation.mutate({ id: deadline.id });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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
            <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">Nenhum prazo cadastrado</h3>
            <p className="text-muted-foreground mb-4">
              Adicione prazos para manter o controle dos seus processos
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Prazo
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function Deadlines() {
  return (
    <DashboardLayout>
      <DeadlinesContent />
    </DashboardLayout>
  );
}
