import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { 
  Plus, Search, Filter, MoreVertical, FileText, 
  Brain, Calendar, Trash2, Edit, Eye
} from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const categoryLabels: Record<string, string> = {
  civil: "Cível",
  trabalhista: "Trabalhista",
  criminal: "Criminal",
  tributario: "Tributário",
  familia: "Família",
  consumidor: "Consumidor",
  previdenciario: "Previdenciário",
  administrativo: "Administrativo",
  empresarial: "Empresarial",
  outro: "Outro"
};

const statusLabels: Record<string, string> = {
  active: "Ativo",
  closed: "Encerrado",
  archived: "Arquivado",
  pending: "Pendente"
};

function CasesContent() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: cases, isLoading, refetch } = trpc.cases.list.useQuery();
  const deleteMutation = trpc.cases.delete.useMutation({
    onSuccess: () => refetch()
  });

  const filteredCases = cases?.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
                         c.caseNumber?.toLowerCase().includes(search.toLowerCase()) ||
                         c.clientName?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || c.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meus Casos</h1>
          <p className="text-muted-foreground">
            Gerencie todos os seus processos e casos jurídicos
          </p>
        </div>
        <Link href="/cases/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Caso
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, número ou cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cases List */}
      {filteredCases && filteredCases.length > 0 ? (
        <div className="grid gap-4">
          {filteredCases.map((caseItem) => (
            <Card key={caseItem.id} className="card-hover">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10 shrink-0">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg">{caseItem.title}</h3>
                        <Badge variant={
                          caseItem.status === 'active' ? 'default' :
                          caseItem.status === 'closed' ? 'secondary' :
                          'outline'
                        }>
                          {statusLabels[caseItem.status] || caseItem.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        {caseItem.caseNumber && (
                          <span>Nº {caseItem.caseNumber}</span>
                        )}
                        <span>{categoryLabels[caseItem.category] || caseItem.category}</span>
                        <span>{caseItem.jurisdiction}</span>
                        {caseItem.clientName && (
                          <span>Cliente: {caseItem.clientName}</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                        {caseItem.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/analysis?caseId=${caseItem.id}`}>
                      <Button variant="outline" size="sm" className="gap-1">
                        <Brain className="h-4 w-4" />
                        <span className="hidden sm:inline">Analisar</span>
                      </Button>
                    </Link>
                    <Link href={`/cases/${caseItem.id}`}>
                      <Button variant="outline" size="sm" className="gap-1">
                        <Eye className="h-4 w-4" />
                        <span className="hidden sm:inline">Ver</span>
                      </Button>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <Link href={`/cases/${caseItem.id}/edit`}>
                          <DropdownMenuItem className="cursor-pointer">
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                        </Link>
                        <Link href={`/simulator?caseId=${caseItem.id}`}>
                          <DropdownMenuItem className="cursor-pointer">
                            <Calendar className="h-4 w-4 mr-2" />
                            Simular Audiência
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem 
                          className="cursor-pointer text-destructive focus:text-destructive"
                          onClick={() => {
                            if (confirm('Tem certeza que deseja excluir este caso?')) {
                              deleteMutation.mutate({ id: caseItem.id });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">Nenhum caso encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {search || categoryFilter !== "all" || statusFilter !== "all"
                ? "Tente ajustar os filtros de busca"
                : "Comece cadastrando seu primeiro caso"}
            </p>
            <Link href="/cases/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Criar Novo Caso
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function Cases() {
  return (
    <DashboardLayout>
      <CasesContent />
    </DashboardLayout>
  );
}
