import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { llmService } from '@/services/llmService';
import { taskGenerationService } from '@/services/taskGenerationService';
import { LLMConfig } from '@/types/llm';
import { useToast } from '@/hooks/use-toast';

export function LLMDebugger() {
  const [config, setConfig] = useState<LLMConfig>({
    provider: 'openai',
    apiKey: '',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 1000,
  });
  
  const [systemPrompt, setSystemPrompt] = useState(taskGenerationService.getSystemPrompt());
  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState('');
  const [testing, setTesting] = useState(false);
  const [usage, setUsage] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const savedConfig = localStorage.getItem('llm-config');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      setConfig(parsed);
      llmService.setConfig(parsed);
    }
  }, []);

  const handleConfigChange = (key: keyof LLMConfig, value: any) => {
    // Apply sensible defaults when switching providers
    if (key === 'provider' && value === 'dmxapi') {
      const newConfig: LLMConfig = {
        ...config,
        provider: 'dmxapi',
        model: 'gpt-5-mini',
        baseUrl: config.baseUrl || 'https://api.dmxapi.cn/v1/chat/completions',
      } as LLMConfig;
      setConfig(newConfig);
      return;
    }

    const newConfig = { ...config, [key]: value } as LLMConfig;
    setConfig(newConfig);
  };

  const saveConfig = () => {
    if (!config.apiKey) {
      toast({
        title: "错误",
        description: "请输入API Key",
        variant: "destructive",
      });
      return;
    }

    llmService.setConfig(config);
    localStorage.setItem('llm-config', JSON.stringify(config));
    toast({
      title: "成功",
      description: "LLM配置已保存",
    });
  };

  const saveSystemPrompt = () => {
    taskGenerationService.setSystemPrompt(systemPrompt);
    localStorage.setItem('system-prompt', systemPrompt);
    toast({
      title: "成功",
      description: "系统提示已保存",
    });
  };

  const resetSystemPrompt = () => {
    const defaultPrompt = taskGenerationService.getDefaultSystemPrompt();
    setSystemPrompt(defaultPrompt);
    taskGenerationService.setSystemPrompt(defaultPrompt);
    localStorage.removeItem('system-prompt');
    toast({
      title: "重置完成",
      description: "系统提示已重置为默认值",
    });
  };

  const testPrompt = async () => {
    if (!testInput.trim()) {
      toast({
        title: "错误",
        description: "请输入测试内容",
        variant: "destructive",
      });
      return;
    }

    if (!llmService.getConfig()) {
      toast({
        title: "错误",
        description: "请先配置并保存LLM设置",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    try {
      const result = await taskGenerationService.testPrompt(testInput, systemPrompt);
      setTestOutput(result.response);
      setUsage(result.usage);
      toast({
        title: "测试成功",
        description: "已获取LLM响应",
      });
    } catch (error) {
      console.error('Test failed:', error);
      toast({
        title: "测试失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">LLM调试器</h1>
        <Badge variant="outline">开发工具</Badge>
      </div>

      <Tabs defaultValue="config" className="space-y-4">
        <TabsList>
          <TabsTrigger value="config">LLM配置</TabsTrigger>
          <TabsTrigger value="prompt">系统提示</TabsTrigger>
          <TabsTrigger value="test">测试调试</TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>LLM服务配置</CardTitle>
              <CardDescription>
                配置不同的LLM服务商API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="provider">服务商</Label>
                  <Select
                    value={config.provider}
                    onValueChange={(value: any) => handleConfigChange('provider', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="claude">Claude (Anthropic)</SelectItem>
                      <SelectItem value="gemini">Gemini (Google)</SelectItem>
                      <SelectItem value="custom">自定义API</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">模型</Label>
                  <Input
                    id="model"
                    value={config.model}
                    onChange={(e) => handleConfigChange('model', e.target.value)}
                    placeholder="例如: gpt-5-mini"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => handleConfigChange('apiKey', e.target.value)}
                  placeholder="输入你的API Key"
                />
              </div>

              {config.provider === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="baseUrl">API地址</Label>
                  <Input
                    id="baseUrl"
                    value={config.baseUrl || ''}
                    onChange={(e) => handleConfigChange('baseUrl', e.target.value)}
                    placeholder="https://api.example.com/v1/chat/completions"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature</Label>
                  <Input
                    id="temperature"
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={config.temperature || 0.7}
                    onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxTokens">最大Token数</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    min="1"
                    max="4000"
                    value={config.maxTokens || 1000}
                    onChange={(e) => handleConfigChange('maxTokens', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <Button onClick={saveConfig} className="w-full">
                保存配置
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prompt">
          <Card>
            <CardHeader>
              <CardTitle>系统提示配置</CardTitle>
              <CardDescription>
                自定义任务生成的系统提示，影响AI的输出风格和格式
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="systemPrompt">系统提示</Label>
                <Textarea
                  id="systemPrompt"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={saveSystemPrompt}>
                  保存提示
                </Button>
                <Button variant="outline" onClick={resetSystemPrompt}>
                  重置为默认
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle>提示测试</CardTitle>
              <CardDescription>
                测试当前系统提示的效果
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="testInput">测试输入</Label>
                <Textarea
                  id="testInput"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder="输入要转换为任务的描述..."
                  rows={3}
                />
              </div>

              <Button onClick={testPrompt} disabled={testing} className="w-full">
                {testing ? '测试中...' : '测试提示'}
              </Button>

              {testOutput && (
                <div className="space-y-2">
                  <Label>LLM响应</Label>
                  <Textarea
                    value={testOutput}
                    readOnly
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>
              )}

              {usage && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Token使用情况</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">输入:</span> {usage.promptTokens}
                    </div>
                    <div>
                      <span className="text-muted-foreground">输出:</span> {usage.completionTokens}
                    </div>
                    <div>
                      <span className="text-muted-foreground">总计:</span> {usage.totalTokens}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}