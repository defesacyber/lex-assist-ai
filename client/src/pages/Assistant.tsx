import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { 
  Mic, MicOff, Play, Pause, Square, Upload, FileAudio,
  Loader2, AlertCircle, CheckCircle2, Clock, FileText,
  Download, RefreshCw
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Streamdown } from "streamdown";

function AssistantContent() {
  const [selectedHearingId, setSelectedHearingId] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [transcriptionText, setTranscriptionText] = useState("");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { data: hearings } = trpc.hearings.list.useQuery();
  const { data: existingTranscription, refetch: refetchTranscription } = trpc.transcription.getByHearing.useQuery(
    { hearingId: Number(selectedHearingId) },
    { enabled: !!selectedHearingId }
  );

  const transcribeMutation = trpc.transcription.transcribe.useMutation({
    onSuccess: (data) => {
      setTranscriptionText(data.text);
      toast.success("Transcrição concluída!");
      refetchTranscription();
    },
    onError: (error) => {
      toast.error("Erro na transcrição: " + error.message);
    }
  });

  const generateMinuteMutation = trpc.minutes.generate.useMutation({
    onSuccess: () => {
      toast.success("Minuta gerada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao gerar minuta: " + error.message);
    }
  });

  const { data: minute, refetch: refetchMinute } = trpc.minutes.getByHearing.useQuery(
    { hearingId: Number(selectedHearingId) },
    { enabled: !!selectedHearingId }
  );

  useEffect(() => {
    if (existingTranscription?.transcriptionText) {
      setTranscriptionText(existingTranscription.transcriptionText);
    }
  }, [existingTranscription]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setIsPaused(false);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast.success("Gravação iniciada");
    } catch (error) {
      toast.error("Erro ao acessar microfone. Verifique as permissões.");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        if (timerRef.current) clearInterval(timerRef.current);
      }
      setIsPaused(!isPaused);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) clearInterval(timerRef.current);
      toast.success("Gravação finalizada");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleUploadAndTranscribe = async () => {
    if (!audioBlob || !selectedHearingId) {
      toast.error("Selecione uma audiência e grave o áudio primeiro");
      return;
    }

    try {
      setUploadProgress(10);
      
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        const base64Content = base64Data.split(',')[1];
        
        setUploadProgress(30);
        
        // Upload to storage (simulated - in real app would use storagePut)
        const fileName = `hearing-${selectedHearingId}-${Date.now()}.webm`;
        
        // For demo, we'll use a data URL approach
        // In production, this would upload to S3
        setUploadProgress(60);
        
        // Start transcription
        transcribeMutation.mutate({
          hearingId: Number(selectedHearingId),
          audioUrl: base64Data // In production, this would be the S3 URL
        });
        
        setUploadProgress(100);
      };
    } catch (error) {
      toast.error("Erro ao processar áudio");
      setUploadProgress(0);
    }
  };

  const selectedHearing = hearings?.find(h => h.id === Number(selectedHearingId));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Mic className="h-7 w-7 text-primary" />
          Assistente de Audiência
        </h1>
        <p className="text-muted-foreground">
          Grave, transcreva e gere minutas automaticamente das suas audiências
        </p>
      </div>

      {/* Hearing Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Selecione a Audiência</CardTitle>
          <CardDescription>
            Escolha uma audiência agendada para iniciar a gravação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select 
            value={selectedHearingId} 
            onValueChange={(value) => {
              setSelectedHearingId(value);
              setTranscriptionText("");
              setAudioBlob(null);
              setAudioUrl(null);
              setRecordingTime(0);
            }}
          >
            <SelectTrigger className="w-full md:w-[400px]">
              <SelectValue placeholder="Selecione uma audiência..." />
            </SelectTrigger>
            <SelectContent>
              {hearings?.map((h) => (
                <SelectItem key={h.id} value={String(h.id)}>
                  {h.title} - {format(new Date(h.scheduledAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedHearing && (
            <div className="mt-4 p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-medium">{selectedHearing.title}</h4>
                <Badge variant={selectedHearing.isVirtual ? "default" : "outline"}>
                  {selectedHearing.isVirtual ? "Virtual" : "Presencial"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedHearing.hearingType} • {format(new Date(selectedHearing.scheduledAt), "PPP 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedHearingId && (
        <Tabs defaultValue="recording" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="recording" className="gap-2">
              <Mic className="h-4 w-4" />
              Gravação
            </TabsTrigger>
            <TabsTrigger value="transcription" className="gap-2">
              <FileText className="h-4 w-4" />
              Transcrição
            </TabsTrigger>
            <TabsTrigger value="minute" className="gap-2">
              <FileAudio className="h-4 w-4" />
              Minuta
            </TabsTrigger>
          </TabsList>

          {/* Recording Tab */}
          <TabsContent value="recording">
            <Card>
              <CardHeader>
                <CardTitle>Gravação de Áudio</CardTitle>
                <CardDescription>
                  Grave o áudio da audiência para transcrição automática
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Recording Controls */}
                <div className="flex flex-col items-center gap-6 py-8">
                  <div className={`
                    w-32 h-32 rounded-full flex items-center justify-center
                    ${isRecording ? 'bg-red-100 dark:bg-red-900/30 animate-pulse' : 'bg-muted'}
                  `}>
                    {isRecording ? (
                      <Mic className="h-16 w-16 text-red-500" />
                    ) : (
                      <MicOff className="h-16 w-16 text-muted-foreground" />
                    )}
                  </div>

                  <div className="text-4xl font-mono font-bold">
                    {formatTime(recordingTime)}
                  </div>

                  <div className="flex items-center gap-4">
                    {!isRecording ? (
                      <Button 
                        size="lg" 
                        onClick={startRecording}
                        className="gap-2"
                      >
                        <Play className="h-5 w-5" />
                        Iniciar Gravação
                      </Button>
                    ) : (
                      <>
                        <Button 
                          size="lg" 
                          variant="outline"
                          onClick={pauseRecording}
                          className="gap-2"
                        >
                          {isPaused ? (
                            <>
                              <Play className="h-5 w-5" />
                              Continuar
                            </>
                          ) : (
                            <>
                              <Pause className="h-5 w-5" />
                              Pausar
                            </>
                          )}
                        </Button>
                        <Button 
                          size="lg" 
                          variant="destructive"
                          onClick={stopRecording}
                          className="gap-2"
                        >
                          <Square className="h-5 w-5" />
                          Parar
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Audio Preview */}
                {audioUrl && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <h4 className="font-medium mb-2">Áudio Gravado</h4>
                      <audio controls src={audioUrl} className="w-full" />
                    </div>

                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Processando...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} />
                      </div>
                    )}

                    <Button 
                      onClick={handleUploadAndTranscribe}
                      disabled={transcribeMutation.isPending}
                      className="w-full gap-2"
                    >
                      {transcribeMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Transcrevendo...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Transcrever Áudio
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transcription Tab */}
          <TabsContent value="transcription">
            <Card>
              <CardHeader>
                <CardTitle>Transcrição da Audiência</CardTitle>
                <CardDescription>
                  Texto transcrito automaticamente do áudio gravado
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transcriptionText ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">Transcrição concluída</span>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 max-h-[500px] overflow-y-auto">
                      <p className="whitespace-pre-wrap text-sm">{transcriptionText}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="gap-2"
                        onClick={() => {
                          navigator.clipboard.writeText(transcriptionText);
                          toast.success("Transcrição copiada!");
                        }}
                      >
                        Copiar Texto
                      </Button>
                      <Button 
                        onClick={() => generateMinuteMutation.mutate({ hearingId: Number(selectedHearingId) })}
                        disabled={generateMinuteMutation.isPending}
                        className="gap-2"
                      >
                        {generateMinuteMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Gerando Minuta...
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4" />
                            Gerar Minuta
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma transcrição disponível</p>
                    <p className="text-sm mt-2">
                      Grave o áudio da audiência e clique em "Transcrever"
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Minute Tab */}
          <TabsContent value="minute">
            <Card>
              <CardHeader>
                <CardTitle>Minuta da Audiência</CardTitle>
                <CardDescription>
                  Resumo executivo e minuta de petição gerados automaticamente
                </CardDescription>
              </CardHeader>
              <CardContent>
                {minute ? (
                  <div className="space-y-6">
                    {/* Executive Summary */}
                    <div>
                      <h4 className="font-semibold mb-2">Resumo Executivo</h4>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <Streamdown>{minute.executiveSummary}</Streamdown>
                      </div>
                    </div>

                    {/* Key Points */}
                    <div>
                      <h4 className="font-semibold mb-2">Pontos-Chave</h4>
                      <ul className="space-y-2">
                        {minute.keyPoints?.map((point: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                            <span className="text-sm">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Petition Draft */}
                    <div>
                      <h4 className="font-semibold mb-2">Minuta de Petição</h4>
                      <div className="p-4 rounded-lg bg-muted/50 max-h-[400px] overflow-y-auto">
                        <Streamdown>{minute.petitionDraft}</Streamdown>
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div>
                      <h4 className="font-semibold mb-2">Recomendações</h4>
                      <ul className="space-y-2">
                        {minute.recommendations?.map((rec: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-primary mt-1 shrink-0" />
                            <span className="text-sm">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileAudio className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma minuta disponível</p>
                    <p className="text-sm mt-2">
                      Primeiro transcreva o áudio, depois gere a minuta
                    </p>
                    {transcriptionText && (
                      <Button 
                        onClick={() => generateMinuteMutation.mutate({ hearingId: Number(selectedHearingId) })}
                        disabled={generateMinuteMutation.isPending}
                        className="mt-4 gap-2"
                      >
                        {generateMinuteMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Gerando...
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4" />
                            Gerar Minuta Agora
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Empty State */}
      {!selectedHearingId && (
        <Card>
          <CardContent className="py-16 text-center">
            <Mic className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">Selecione uma audiência</h3>
            <p className="text-muted-foreground">
              Escolha uma audiência agendada para iniciar a gravação e transcrição
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function Assistant() {
  return (
    <DashboardLayout>
      <AssistantContent />
    </DashboardLayout>
  );
}
