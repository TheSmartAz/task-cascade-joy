import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface VoiceInputProps {
  onVoiceInput: (text: string) => void;
  className?: string;
}

export function VoiceInput({ onVoiceInput, className }: VoiceInputProps) {
  const [recording, setRecording] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const { toast } = useToast();

  // 初始化语音识别
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'zh-CN';

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript || interimTranscript);

        if (finalTranscript) {
          onVoiceInput(finalTranscript);
          setTranscript('');
          stopRecording();
          toast({
            title: "语音识别成功",
            description: "正在通过AI处理语音内容...",
          });
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        stopRecording();
        toast({
          title: "语音识别失败",
          description: "请检查麦克风权限或重试",
          variant: "destructive",
        });
      };

      recognition.onend = () => {
        stopRecording();
      };

      setRecognition(recognition);
    }
  }, [onVoiceInput, toast]);

  // 音频可视化
  const startAudioVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateAudioLevel = () => {
        if (analyserRef.current && recording) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          setAudioLevel(average / 255);
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };
      
      updateAudioLevel();
    } catch (error) {
      console.error('Audio visualization failed:', error);
    }
  };

  const startRecording = () => {
    if (!recognition) {
      toast({
        title: "不支持语音识别",
        description: "您的浏览器不支持语音识别功能",
        variant: "destructive",
      });
      return;
    }

    setRecording(true);
    setTranscript('');
    recognition.start();
    startAudioVisualization();
    
    toast({
      title: "开始录音",
      description: "请说话，我正在听...",
    });
  };

  const stopRecording = () => {
    setRecording(false);
    setAudioLevel(0);
    
    if (recognition) {
      recognition.stop();
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const toggleRecording = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Button
        variant={recording ? "default" : "outline"}
        size="icon"
        onClick={toggleRecording}
        className={cn(
          "relative overflow-hidden transition-all duration-300",
          recording && "bg-red-500 hover:bg-red-600 text-white shadow-lg scale-105"
        )}
      >
        {recording ? (
          <MicOff className="h-5 w-5" />
        ) : (
          <Mic className="h-5 w-5" />
        )}
        
        {/* 音频可视化效果 */}
        {recording && (
          <div 
            className="absolute inset-0 bg-white/20 transition-opacity duration-75"
            style={{ opacity: audioLevel }}
          />
        )}
      </Button>

      {/* 录音状态卡片 */}
      {recording && (
        <Card className="absolute top-full mt-2 left-0 right-0 z-50 animate-in slide-in-from-top-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <Volume2 className="h-4 w-4 text-muted-foreground" />
              </div>
              
              {/* 音频波形可视化 */}
              <div className="flex items-center gap-1 flex-1">
                {Array.from({ length: 20 }, (_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-primary/50 rounded-full transition-all duration-150"
                    style={{
                      height: `${Math.max(4, (Math.sin(Date.now() / 200 + i) + 1) * audioLevel * 20)}px`,
                    }}
                  />
                ))}
              </div>
            </div>
            
            {transcript && (
              <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                <span className="text-muted-foreground">识别中: </span>
                <span className="text-foreground">{transcript}</span>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground mt-2">
              正在聆听您的语音，说完后会自动创建任务...
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}