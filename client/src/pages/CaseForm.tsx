import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const categories = [
  { value: "civil", label: "Cível" },
  { value: "trabalhista", label: "Trabalhista" },
  { value: "criminal", label: "Criminal" },
  { value: "tributario", label: "Tributário" },
  { value: "familia", label: "Família" },
  { value: "consumidor", label: "Consumidor" },
  { value: "previdenciario", label: "Previdenciário" },
  { value: "administrativo", label: "Administrativo" },
  { value: "empresarial", label: "Empresarial" },
  { value: "outro", label: "Outro" }
];

const jurisdictions = [
  "1ª Instância - Justiça Estadual",
  "2ª Instância - Tribunal de Justiça",
  "1ª Instância - Justiça Federal",
  "2ª Instância - TRF",
  "Justiça do Trabalho - 1ª Instância",
  "Justiça do Trabalho - TRT",
  "TST",
  "STJ",
  "STF",
  "Juizado Especial Cível",
  "Juizado Especial Criminal",
  "Juizado Especial Federal"
];

type FormData = {
  title: string;
  caseNumber: string;
  category: string;
  jurisdiction: string;
  court: string;
  description: string;
  arguments: string;
  clientName: string;
  opposingParty: string;
};

function CaseFormContent() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const isEditing = params.id && params.id !== "new";
  
  const [formData, setFormData] = useState<FormData>({
    title: "",
    caseNumber: "",
    category: "",
    jurisdiction: "",
    court: "",
    description: "",
    arguments: "",
    clientName: "",
    opposingParty: ""
  });

  const { data: existingCase, isLoading: loadingCase } = trpc.cases.get.useQuery(
    { id: Number(params.id) },
    { enabled: !!isEditing }
  );

  const createMutation = trpc.cases.create.useMutation({
    onSuccess: (data) => {
      toast.success("Caso criado com sucesso!");
      setLocation(`/cases/${data.id}`);
    },
    onError: (error) => {
      toast.error("Erro ao criar caso: " + error.message);
    }
  });

  const updateMutation = trpc.cases.update.useMutation({
    onSuccess: () => {
      toast.success("Caso atualizado com sucesso!");
      setLocation(`/cases/${params.id}`);
    },
    onError: (error) => {
      toast.error("Erro ao atualizar caso: " + error.message);
    }
  });

  useEffect(() => {
    if (existingCase) {
      setFormData({
        title: existingCase.title,
        caseNumber: existingCase.caseNumber || "",
        category: existingCase.category,
        jurisdiction: existingCase.jurisdiction,
        court: existingCase.court || "",
        description: existingCase.description,
        arguments: existingCase.arguments || "",
        clientName: existingCase.clientName || "",
        opposingParty: existingCase.opposingParty || ""
      });
    }
  }, [existingCase]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.category || !formData.jurisdiction || !formData.description) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const data = {
      title: formData.title,
      caseNumber: formData.caseNumber || undefined,
      category: formData.category as any,
      jurisdiction: formData.jurisdiction,
      court: formData.court || undefined,
      description: formData.description,
      arguments: formData.arguments || undefined,
      clientName: formData.clientName || undefined,
      opposingParty: formData.opposingParty || undefined
    };

    if (isEditing) {
      updateMutation.mutate({ id: Number(params.id), data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isEditing && loadingCase) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/cases">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditing ? "Editar Caso" : "Novo Caso"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? "Atualize as informações do caso" : "Cadastre um novo processo ou caso jurídico"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>Dados principais do processo</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Título do Caso *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Ação de Indenização - João vs Empresa X"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="caseNumber">Número do Processo</Label>
                  <Input
                    id="caseNumber"
                    placeholder="0000000-00.0000.0.00.0000"
                    value={formData.caseNumber}
                    onChange={(e) => setFormData({ ...formData, caseNumber: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="jurisdiction">Jurisdição *</Label>
                  <Select 
                    value={formData.jurisdiction} 
                    onValueChange={(value) => setFormData({ ...formData, jurisdiction: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a jurisdição" />
                    </SelectTrigger>
                    <SelectContent>
                      {jurisdictions.map((jur) => (
                        <SelectItem key={jur} value={jur}>
                          {jur}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="court">Vara/Tribunal</Label>
                  <Input
                    id="court"
                    placeholder="Ex: 1ª Vara Cível de São Paulo"
                    value={formData.court}
                    onChange={(e) => setFormData({ ...formData, court: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parties */}
          <Card>
            <CardHeader>
              <CardTitle>Partes Envolvidas</CardTitle>
              <CardDescription>Informações sobre cliente e parte contrária</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="clientName">Nome do Cliente</Label>
                <Input
                  id="clientName"
                  placeholder="Nome completo do cliente"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="opposingParty">Parte Contrária</Label>
                <Input
                  id="opposingParty"
                  placeholder="Nome da parte contrária"
                  value={formData.opposingParty}
                  onChange={(e) => setFormData({ ...formData, opposingParty: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Case Details */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Caso</CardTitle>
              <CardDescription>Descrição completa para análise preditiva</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="description">Descrição dos Fatos *</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva detalhadamente os fatos do caso, incluindo datas, eventos relevantes e circunstâncias..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={6}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Quanto mais detalhada a descrição, melhor será a análise preditiva.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="arguments">Argumentos Legais</Label>
                <Textarea
                  id="arguments"
                  placeholder="Liste os principais argumentos jurídicos, fundamentos legais, jurisprudência aplicável..."
                  value={formData.arguments}
                  onChange={(e) => setFormData({ ...formData, arguments: e.target.value })}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Link href="/cases">
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isEditing ? "Atualizar Caso" : "Criar Caso"}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function CaseForm() {
  return (
    <DashboardLayout>
      <CaseFormContent />
    </DashboardLayout>
  );
}
