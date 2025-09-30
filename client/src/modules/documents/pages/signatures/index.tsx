/**
 * Document Signatures Page
 * 
 * Manages digital signatures for documents with certificate management
 * and signature validation.
 */

import React, { useState } from 'react';
import { useLocation } from 'wouter';
import DocumentsModuleLayout from '../../components/common/DocumentsModuleLayout';
import SignatureBox from '../../components/signatures/SignatureBox';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Fingerprint, 
  FileText, 
  Shield, 
  Key, 
  FileCheck, 
  Download, 
  UploadCloud, 
  Award as Certificate, 
  PlusCircle, 
  CheckCircle, 
  XCircle, 
  User,
  Clock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Sample signature certificates
const signatureCertificates = [
  {
    id: 'cert-001',
    name: 'Certificat calificat',
    issuer: 'Trans Sped',
    serialNumber: 'AB123456789XYZ',
    validFrom: '2024-02-15T00:00:00Z',
    validTo: '2026-02-14T23:59:59Z',
    type: 'qualified',
    status: 'active',
    createdAt: '2024-02-15T10:30:00Z',
    lastUsed: '2025-04-01T15:45:00Z',
  },
  {
    id: 'cert-002',
    name: 'Certificat semnătură digitală',
    issuer: 'DigiSign',
    serialNumber: 'DS987654321ZYX',
    validFrom: '2023-10-05T00:00:00Z',
    validTo: '2025-10-04T23:59:59Z',
    type: 'digital',
    status: 'active',
    createdAt: '2023-10-07T09:15:00Z',
    lastUsed: '2025-03-25T11:20:00Z',
  }
];

// Sample signed documents
const signedDocuments = [
  {
    id: 'sig-doc-001',
    documentId: 'doc-001',
    documentName: 'Contract de colaborare Firma ABC',
    signedAt: '2025-03-18T14:45:00Z',
    signedBy: 'Alexandru Popescu',
    certificateId: 'cert-001',
    certificateIssuer: 'Trans Sped',
    status: 'valid',
    timestamp: '2025-03-18T14:45:12Z',
  },
  {
    id: 'sig-doc-002',
    documentId: 'doc-007',
    documentName: 'Adresă către Ministerul Finanțelor',
    signedAt: '2025-02-25T14:30:00Z',
    signedBy: 'Alexandru Popescu',
    certificateId: 'cert-001',
    certificateIssuer: 'Trans Sped',
    status: 'valid',
    timestamp: '2025-02-25T14:32:05Z',
  },
  {
    id: 'sig-doc-003',
    documentId: 'doc-012',
    documentName: 'Contract de servicii IT',
    signedAt: '2025-01-15T10:15:00Z',
    signedBy: 'Mihai Ionescu',
    certificateId: 'cert-002',
    certificateIssuer: 'DigiSign',
    status: 'valid',
    timestamp: '2025-01-15T10:17:22Z',
  }
];

// Sample pending signatures
const pendingSignatures = [
  {
    id: 'pending-001',
    documentId: 'doc-015',
    documentName: 'Ofertă servicii consultanță',
    requestedAt: '2025-04-10T09:30:00Z',
    requestedBy: 'Maria Ionescu',
    requestedFrom: 'Alexandru Popescu',
    expiresAt: '2025-04-17T09:30:00Z',
    status: 'pending',
  },
  {
    id: 'pending-002',
    documentId: 'doc-016',
    documentName: 'Acord de confidențialitate',
    requestedAt: '2025-04-08T14:15:00Z',
    requestedBy: 'Alexandra Dumitrescu',
    requestedFrom: 'Alexandru Popescu',
    expiresAt: '2025-04-15T14:15:00Z',
    status: 'pending',
  }
];

/**
 * Document Signatures Page Component
 */
const SignaturesPage: React.FC = () => {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('my-signatures');
  const [currentSignature, setCurrentSignature] = useState<string | null>(null);
  const [signatureMode, setSignatureMode] = useState<'sign' | 'view' | null>(null);
  const [selectedDocumentName, setSelectedDocumentName] = useState<string | null>(null);
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ro-RO');
  };
  
  // Calculate days left for certificate validity
  const calculateDaysLeft = (validTo: string) => {
    const validToDate = new Date(validTo);
    const today = new Date();
    const diffTime = validToDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  
  // Handle signature save
  const handleSaveSignature = (signatureData: string) => {
    setCurrentSignature(signatureData);
    
    toast({
      title: "Semnătură salvată",
      description: "Semnătura dvs. a fost salvată cu succes",
    });
  };
  
  // Handle document sign
  const handleSignDocument = () => {
    toast({
      title: "Document semnat",
      description: `Documentul "${selectedDocumentName}" a fost semnat cu succes`,
    });
    
    setSignatureMode(null);
    setSelectedDocumentName(null);
  };
  
  // Handle upload certificate
  const handleUploadCertificate = () => {
    toast({
      title: "Certificat încărcat",
      description: "Certificatul dvs. a fost încărcat cu succes și este disponibil pentru semnături",
    });
  };
  
  // Handle certificate revoke
  const handleRevokeCertificate = (certificateId: string) => {
    toast({
      title: "Certificat revocat",
      description: "Certificatul a fost revocat și nu mai poate fi utilizat pentru semnături",
      variant: "destructive",
    });
  };
  
  // Start document signing
  const startSigningDocument = (documentId: string, documentName: string) => {
    setSignatureMode('sign');
    setSelectedDocumentName(documentName);
  };
  
  // Render the main content based on signature mode
  const renderContent = () => {
    if (signatureMode === 'sign' && selectedDocumentName) {
      return (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Semnează documentul</CardTitle>
              <CardDescription>
                Aplicați semnătura digitală pentru documentul "{selectedDocumentName}"
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-1/2">
                  <SignatureBox onSave={handleSaveSignature} />
                </div>
                
                <div className="w-full md:w-1/2">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Certificat semnătură</CardTitle>
                      <CardDescription>
                        Selectați certificatul digital pentru semnare
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {signatureCertificates.map((cert) => (
                          <div 
                            key={cert.id}
                            className="flex items-start p-3 rounded-md border hover:bg-muted cursor-pointer"
                            onClick={() => {}}
                          >
                            <div className="flex-shrink-0 mr-3 mt-1">
                              <Certificate className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-grow">
                              <div className="flex flex-col">
                                <span className="font-medium">{cert.name}</span>
                                <span className="text-sm text-muted-foreground">
                                  Emis de: {cert.issuer}
                                </span>
                                <div className="flex items-center mt-1 text-xs text-muted-foreground">
                                  <Shield className="h-3 w-3 mr-1" />
                                  <span>Valid până la: {formatDate(cert.validTo)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Previzualizare document</h3>
                <div className="border rounded-md p-2 bg-muted/20">
                  <div className="aspect-[3/4] bg-white flex items-center justify-center">
                    <FileText className="h-16 w-16 text-muted-foreground/20" />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline" onClick={() => {
                setSignatureMode(null);
                setSelectedDocumentName(null);
              }}>
                Anulează
              </Button>
              <Button 
                onClick={handleSignDocument} 
                disabled={!currentSignature}
              >
                <FileCheck className="h-4 w-4 mr-2" />
                Semnează documentul
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center mx-4 mt-4">
          <div>
            <h2 className="text-2xl font-bold">Semnături Digitale</h2>
            <p className="text-sm text-muted-foreground">
              Gestionați semnăturile și certificatele digitale
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleUploadCertificate}>
              <UploadCloud className="h-4 w-4 mr-2" />
              Încarcă certificat
            </Button>
            <Button onClick={() => setSignatureMode('sign')}>
              <Fingerprint className="h-4 w-4 mr-2" />
              Semnează document
            </Button>
          </div>
        </div>
        
        {/* Main content with tabs */}
        <div className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="my-signatures">Semnăturile mele</TabsTrigger>
              <TabsTrigger value="pending">În așteptare ({pendingSignatures.length})</TabsTrigger>
              <TabsTrigger value="certificates">Certificate</TabsTrigger>
            </TabsList>
            
            {/* My Signatures Tab */}
            <TabsContent value="my-signatures" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Documente semnate</CardTitle>
                  <CardDescription>
                    Lista documentelor semnate digital de dvs.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Document</TableHead>
                          <TableHead>Data semnării</TableHead>
                          <TableHead>Certificat</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Acțiuni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {signedDocuments.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-primary" />
                                <span className="font-medium">{doc.documentName}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {formatDate(doc.signedAt)}
                            </TableCell>
                            <TableCell>
                              {doc.certificateIssuer}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                {doc.status === 'valid' ? (
                                  <>
                                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                                    <span>Valid</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-4 w-4 text-destructive mr-1" />
                                    <span>Invalid</span>
                                  </>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => {}}>
                                <Download className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        
                        {signedDocuments.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-6">
                              <div className="flex flex-col items-center">
                                <FileCheck className="h-12 w-12 text-muted-foreground mb-2" />
                                <p className="text-muted-foreground">Nu aveți documente semnate</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Semnătură personală</CardTitle>
                  <CardDescription>
                    Semnătura dvs. vizuală ce va fi aplicată pe documente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-1/2">
                      <SignatureBox onSave={handleSaveSignature} />
                    </div>
                    
                    <div className="w-full md:w-1/2 space-y-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Semnătură activă</CardTitle>
                        </CardHeader>
                        <CardContent className="flex justify-center py-4">
                          {currentSignature ? (
                            <img 
                              src={currentSignature} 
                              alt="Semnătură curentă" 
                              className="max-h-[150px] border rounded-md p-2" 
                            />
                          ) : (
                            <div className="border rounded-md p-4 text-center text-muted-foreground bg-muted/20 w-full">
                              <Fingerprint className="h-10 w-10 mx-auto mb-2" />
                              <p>Nu aveți o semnătură activă</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                      
                      <div className="rounded-md border p-4 bg-muted/10">
                        <h3 className="font-medium mb-2">Informații semnătură electronică</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tip semnătură:</span>
                            <span className="font-medium">Electronică avansată</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Valabilitate:</span>
                            <span className="font-medium">Certificat calificat</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Conformitate:</span>
                            <span className="font-medium">eIDAS</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Pending Signatures Tab */}
            <TabsContent value="pending" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Semnături în așteptare</CardTitle>
                  <CardDescription>
                    Documente ce necesită semnătura dvs.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Document</TableHead>
                          <TableHead>Solicitat de</TableHead>
                          <TableHead>Data solicitării</TableHead>
                          <TableHead>Expiră</TableHead>
                          <TableHead className="text-right">Acțiuni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingSignatures.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-primary" />
                                <span className="font-medium">{doc.documentName}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5" />
                                <span>{doc.requestedBy}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {formatDate(doc.requestedAt)}
                            </TableCell>
                            <TableCell>
                              {formatDate(doc.expiresAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                size="sm"
                                onClick={() => startSigningDocument(doc.documentId, doc.documentName)}
                              >
                                <Fingerprint className="h-4 w-4 mr-1" />
                                Semnează
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        
                        {pendingSignatures.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-6">
                              <div className="flex flex-col items-center">
                                <CheckCircle className="h-12 w-12 text-muted-foreground mb-2" />
                                <p className="text-muted-foreground">Nu aveți semnături în așteptare</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Certificates Tab */}
            <TabsContent value="certificates" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle>Certificate digitale</CardTitle>
                    <CardDescription>
                      Certificate utilizate pentru semnături electronice
                    </CardDescription>
                  </div>
                  <Button onClick={handleUploadCertificate}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Adaugă certificat
                  </Button>
                </CardHeader>
                <CardContent>
                  {signatureCertificates.length > 0 ? (
                    <div className="space-y-4">
                      {signatureCertificates.map((cert) => {
                        const daysLeft = calculateDaysLeft(cert.validTo);
                        
                        return (
                          <Card key={cert.id}>
                            <CardHeader className="pb-2">
                              <div className="flex justify-between">
                                <div className="space-y-1">
                                  <CardTitle>{cert.name}</CardTitle>
                                  <CardDescription>
                                    Emis de {cert.issuer} • Serial: {cert.serialNumber}
                                  </CardDescription>
                                </div>
                                <Badge 
                                  variant={cert.status === 'active' ? 'default' : 'destructive'}
                                >
                                  {cert.status === 'active' ? 'Activ' : 'Revocat'}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="pb-2">
                              <div className="grid grid-cols-1 gap-1 md:grid-cols-3 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Valid de la:</span>{' '}
                                  <span className="font-medium">{formatDate(cert.validFrom)}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Valid până la:</span>{' '}
                                  <span className="font-medium">{formatDate(cert.validTo)}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Zile rămase:</span>{' '}
                                  <span className={`font-medium ${
                                    daysLeft < 30 ? 'text-amber-500' : 
                                    daysLeft < 7 ? 'text-destructive' : ''
                                  }`}>
                                    {daysLeft}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="mt-3 flex items-center">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Shield className={`h-3.5 w-3.5 ${
                                    cert.type === 'qualified' ? 'text-green-500' : 'text-amber-500'
                                  }`} />
                                  <span>
                                    {cert.type === 'qualified' ? 'Certificat calificat' : 'Certificat digital'}
                                  </span>
                                </div>
                                <div className="flex-1"></div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>Ultima utilizare: {formatDate(cert.lastUsed)}</span>
                                </div>
                              </div>
                            </CardContent>
                            <CardFooter className="justify-between">
                              <Button variant="outline" size="sm">
                                <Key className="h-3.5 w-3.5 mr-1" />
                                Reînnoire
                              </Button>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <XCircle className="h-3.5 w-3.5 mr-1" />
                                    Revocare
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Sunteți sigur?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Revocarea certificatului va face imposibilă utilizarea sa pentru
                                      semnături electronice. Această acțiune nu poate fi anulată.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Anulează</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleRevokeCertificate(cert.id)}
                                    >
                                      Revocă certificatul
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </CardFooter>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Certificate className="h-16 w-16 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">Nu aveți certificate</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Adăugați un certificat digital pentru a putea semna documente
                      </p>
                      <Button onClick={handleUploadCertificate}>
                        <UploadCloud className="h-4 w-4 mr-2" />
                        Încarcă certificat
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  };
  
  return (
    <DocumentsModuleLayout activeTab="signatures">
      {renderContent()}
    </DocumentsModuleLayout>
  );
};

export default SignaturesPage;