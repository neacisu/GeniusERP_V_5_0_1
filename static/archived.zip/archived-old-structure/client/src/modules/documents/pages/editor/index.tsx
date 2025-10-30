/**
 * Document Editor Page
 * 
 * Interactive document editing functionality with templates, formatting,
 * and collaboration features.
 */

import React, { useState } from 'react';
import DocumentsModuleLayout from '../../components/common/DocumentsModuleLayout';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Save,
  FileText,
  Image,
  Download,
  Share,
  Settings,
  Users
} from 'lucide-react';

/**
 * Document Editor Page Component
 */
const EditorPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('edit');
  const [documentTitle, setDocumentTitle] = useState('Document nou - 11.04.2025');
  
  const handleSave = () => {
    toast({
      title: "Document salvat",
      description: "Modificările au fost salvate cu succes",
    });
  };
  
  const handleDownload = () => {
    toast({
      title: "Descărcare document",
      description: "Documentul va fi descărcat în curând",
    });
  };
  
  return (
    <DocumentsModuleLayout activeTab="editor">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center mx-4 mt-4">
          <div className="flex items-center space-x-4">
            <div>
              <h2 className="text-2xl font-bold">Editor Documente</h2>
              <p className="text-sm text-muted-foreground">
                Creați și editați documente cu formate complexe
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Salvează
            </Button>
          </div>
        </div>
        
        {/* Editor interface */}
        <div className="p-4">
          <div className="flex space-x-4 mb-4">
            <div className="flex-grow">
              <Input 
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                className="text-lg font-semibold"
              />
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4 mr-2" />
                Partajează
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Opțiuni
              </Button>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full max-w-md">
              <TabsTrigger value="edit">Editare</TabsTrigger>
              <TabsTrigger value="preview">Previzualizare</TabsTrigger>
              <TabsTrigger value="history">Istoric</TabsTrigger>
              <TabsTrigger value="settings">Setări</TabsTrigger>
            </TabsList>
            
            <TabsContent value="edit" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Editor document</span>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="h-4 w-4 mr-1" />
                      <span>2 utilizatori vizualizează</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-md p-4 min-h-[500px] bg-white">
                    <p className="text-center text-muted-foreground">
                      Editor documentar încorporat va fi afișat aici
                    </p>
                    <div className="flex items-center justify-center h-[400px]">
                      <FileText className="h-32 w-32 text-muted-foreground/20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="preview" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Previzualizare document</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-md p-8 min-h-[500px] bg-white">
                    <div className="max-w-3xl mx-auto">
                      <h1 className="text-2xl font-bold text-center mb-8">{documentTitle}</h1>
                      
                      <p className="mb-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula. Sed auctor neque eu tellus rhoncus ut eleifend nibh porttitor.</p>
                      
                      <h2 className="text-xl font-semibold mt-6 mb-3">1. Introducere</h2>
                      <p className="mb-4">Praesent dapibus, neque id cursus faucibus, tortor neque egestas augue, eu vulputate magna eros eu erat. Aliquam erat volutpat. Nam dui mi, tincidunt quis, accumsan porttitor, facilisis luctus, metus.</p>
                      
                      <h2 className="text-xl font-semibold mt-6 mb-3">2. Scopul documentului</h2>
                      <p className="mb-4">Phasellus ultrices nulla quis nibh. Quisque a lectus. Donec consectetuer ligula vulputate sem tristique cursus.</p>
                      <ul className="list-disc pl-6 mb-4">
                        <li className="mb-2">Nam nulla quam, gravida non, commodo a, sodales sit amet, nisi.</li>
                        <li className="mb-2">Pellentesque fermentum dolor. Aliquam quam lectus, facilisis auctor.</li>
                        <li className="mb-2">Sed adipiscing ornare risus. Morbi est est, blandit sit amet, sagittis vel.</li>
                      </ul>
                      
                      <h2 className="text-xl font-semibold mt-6 mb-3">3. Concluzii</h2>
                      <p>Sed dignissim lacinia nunc. Curabitur tortor. Pellentesque nibh. Aenean quam. In scelerisque sem at dolor. Maecenas mattis. Sed convallis tristique sem. Proin ut ligula vel nunc egestas porttitor.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="history" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Istoricul modificărilor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start p-3 rounded-md hover:bg-muted">
                      <div className="flex-shrink-0 mr-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="font-semibold text-primary">AP</span>
                        </div>
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">Alexandru Popescu</p>
                            <p className="text-sm text-muted-foreground">A modificat conținutul documentului</p>
                          </div>
                          <span className="text-sm text-muted-foreground">11.04.2025, 12:32</span>
                        </div>
                        <div className="mt-2 text-sm">
                          <Button variant="outline" size="sm">Vizualizare modificări</Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start p-3 rounded-md hover:bg-muted">
                      <div className="flex-shrink-0 mr-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="font-semibold text-primary">MI</span>
                        </div>
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">Maria Ionescu</p>
                            <p className="text-sm text-muted-foreground">A creat documentul</p>
                          </div>
                          <span className="text-sm text-muted-foreground">11.04.2025, 10:15</span>
                        </div>
                        <div className="mt-2 text-sm">
                          <Button variant="outline" size="sm">Vizualizare modificări</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="settings" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Setări document</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Generale</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="font-medium text-sm">Tip document</div>
                          <div className="flex items-center space-x-2 border rounded-md p-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span>Standard</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="font-medium text-sm">Format pagină</div>
                          <div className="flex items-center space-x-2 border rounded-md p-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span>A4</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="h-px bg-border my-4" />
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Permisiuni</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">Partajare</div>
                            <p className="text-sm text-muted-foreground">
                              Permite altor utilizatori să vizualizeze documentul
                            </p>
                          </div>
                          <div className="h-4 w-8 rounded-full bg-primary relative">
                            <span className="absolute h-3 w-3 rounded-full bg-white right-1 top-0.5"></span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">Editare colaborativă</div>
                            <p className="text-sm text-muted-foreground">
                              Permite altor utilizatori să editeze documentul
                            </p>
                          </div>
                          <div className="h-4 w-8 rounded-full bg-muted relative">
                            <span className="absolute h-3 w-3 rounded-full bg-white left-1 top-0.5"></span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">Blocare editare</div>
                            <p className="text-sm text-muted-foreground">
                              Blochează documentul pentru editare
                            </p>
                          </div>
                          <div className="h-4 w-8 rounded-full bg-muted relative">
                            <span className="absolute h-3 w-3 rounded-full bg-white left-1 top-0.5"></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DocumentsModuleLayout>
  );
};

export default EditorPage;