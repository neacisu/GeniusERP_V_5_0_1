/**
 * E-commerce Settings Page
 * 
 * This page allows configuring various settings for the e-commerce module,
 * including store settings, payment methods, shipping, taxes, and more.
 */

import React from 'react';
import { EcommerceModuleLayout } from '../../components/common/EcommerceModuleLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { 
  Settings, 
  CreditCard, 
  Store, 
  Truck, 
  PercentSquare, 
  Mail, 
  Smartphone, 
  Info, 
  User,
  Bell,
  Globe,
  ShieldCheck,
  PictureInPicture,
  Palette,
  Languages,
  Building2,
  DollarSign,
  CircleCheck,
  Save,
  Key,
  Coins,
  Tag,
  FileText,
  Eye
} from 'lucide-react';

// Form schema for store settings
const storeSettingsSchema = z.object({
  storeName: z.string().min(2, {
    message: "Numele magazinului trebuie să aibă cel puțin 2 caractere.",
  }),
  email: z.string().email({
    message: "Adresa de email trebuie să fie validă.",
  }),
  phone: z.string().min(10, {
    message: "Numărul de telefon trebuie să aibă cel puțin 10 caractere.",
  }),
  address: z.string().min(5, {
    message: "Adresa trebuie să aibă cel puțin 5 caractere.",
  }),
  city: z.string().min(2, {
    message: "Orașul trebuie să aibă cel puțin 2 caractere.",
  }),
  country: z.string().min(2, {
    message: "Țara trebuie să aibă cel puțin 2 caractere.",
  }),
  zipCode: z.string().min(4, {
    message: "Codul poștal trebuie să aibă cel puțin 4 caractere.",
  }),
  currency: z.string().min(1, {
    message: "Selectați o monedă.",
  }),
  timezone: z.string().min(1, {
    message: "Selectați un fus orar.",
  }),
});

// Form schema for payment settings
const paymentSettingsSchema = z.object({
  cardPaymentEnabled: z.boolean(),
  paypalEnabled: z.boolean(),
  bankTransferEnabled: z.boolean(),
  cashOnDeliveryEnabled: z.boolean(),
  stripePublicKey: z.string().optional(),
  stripeSecretKey: z.string().optional(),
  paypalClientId: z.string().optional(),
  paypalClientSecret: z.string().optional(),
  bankDetails: z.string().optional(),
});

export default function SettingsPage() {
  // Store settings form
  const storeSettingsForm = useForm<z.infer<typeof storeSettingsSchema>>({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues: {
      storeName: "ERP Online Shop",
      email: "shop@erp.ro",
      phone: "+40 722 123 456",
      address: "Strada Victoriei 25",
      city: "București",
      country: "România",
      zipCode: "010101",
      currency: "RON",
      timezone: "Europe/Bucharest",
    },
  });
  
  // Payment settings form
  const paymentSettingsForm = useForm<z.infer<typeof paymentSettingsSchema>>({
    resolver: zodResolver(paymentSettingsSchema),
    defaultValues: {
      cardPaymentEnabled: true,
      paypalEnabled: true,
      bankTransferEnabled: true,
      cashOnDeliveryEnabled: true,
      stripePublicKey: "pk_test_••••••••••••••••••••••••",
      stripeSecretKey: "sk_test_••••••••••••••••••••••••",
      paypalClientId: "••••••••••••••••••••••••",
      paypalClientSecret: "••••••••••••••••••••••••",
      bankDetails: "Banca: Example Bank\nIBAN: RO99EXPL0000000000000000\nBIC/SWIFT: EXPLROBU",
    },
  });
  
  // TAX settings
  const taxSettings = {
    tax1: {
      name: "TVA Standard",
      rate: 19,
      default: true,
      countries: ["România"],
    },
    tax2: {
      name: "TVA Redus",
      rate: 9,
      default: false,
      countries: ["România"],
    },
    tax3: {
      name: "TVA Super-redus",
      rate: 5,
      default: false,
      countries: ["România"],
    },
  };

  // Shipping methods
  const shippingMethods = [
    {
      id: "fan-courier",
      name: "Fan Courier",
      price: "15.00",
      estimatedDelivery: "1-2 zile lucrătoare",
      active: true,
    },
    {
      id: "cargus",
      name: "Cargus",
      price: "16.00",
      estimatedDelivery: "1-2 zile lucrătoare",
      active: true,
    },
    {
      id: "dhl",
      name: "DHL",
      price: "25.00",
      estimatedDelivery: "1-2 zile lucrătoare",
      active: true,
    },
    {
      id: "posta-romana",
      name: "Poșta Română",
      price: "10.00",
      estimatedDelivery: "3-5 zile lucrătoare",
      active: false,
    },
  ];
  
  const onSubmitStoreSettings = (values: z.infer<typeof storeSettingsSchema>) => {
    console.log(values);
    // In a real implementation, this would save the settings to the backend
  };
  
  const onSubmitPaymentSettings = (values: z.infer<typeof paymentSettingsSchema>) => {
    console.log(values);
    // In a real implementation, this would save the settings to the backend
  };
  
  return (
    <EcommerceModuleLayout activeTab="settings">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Setări E-commerce</h1>
            <p className="text-muted-foreground">Configurarea magazinului online și a opțiunilor asociate</p>
          </div>
        </div>
        
        <Tabs defaultValue="store" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="store" className="flex items-center">
              <Store className="h-4 w-4 mr-2" />
              Magazin
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center">
              <CreditCard className="h-4 w-4 mr-2" />
              Plată
            </TabsTrigger>
            <TabsTrigger value="shipping" className="flex items-center">
              <Truck className="h-4 w-4 mr-2" />
              Livrare
            </TabsTrigger>
            <TabsTrigger value="tax" className="flex items-center">
              <PercentSquare className="h-4 w-4 mr-2" />
              Taxe
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              Avansate
            </TabsTrigger>
          </TabsList>
          
          {/* Store Settings Tab */}
          <TabsContent value="store">
            <Card>
              <CardHeader>
                <CardTitle>Setări Generale Magazin</CardTitle>
                <CardDescription>
                  Configurați informațiile generale despre magazinul online
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...storeSettingsForm}>
                  <form className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Informații de Contact</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={storeSettingsForm.control}
                          name="storeName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nume Magazin</FormLabel>
                              <FormControl>
                                <Input placeholder="Numele magazinului dvs." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={storeSettingsForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Contact</FormLabel>
                              <FormControl>
                                <Input placeholder="contact@example.com" type="email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={storeSettingsForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefon Contact</FormLabel>
                              <FormControl>
                                <Input placeholder="+40 123 456 789" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Adresa Magazin</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={storeSettingsForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Adresă</FormLabel>
                              <FormControl>
                                <Input placeholder="Strada, număr" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={storeSettingsForm.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Oraș</FormLabel>
                              <FormControl>
                                <Input placeholder="Orașul" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={storeSettingsForm.control}
                          name="zipCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cod Poștal</FormLabel>
                              <FormControl>
                                <Input placeholder="Cod poștal" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={storeSettingsForm.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Țară</FormLabel>
                              <FormControl>
                                <Input placeholder="Țara" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Preferințe Regionale</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={storeSettingsForm.control}
                          name="currency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Monedă</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selectați moneda" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="RON">RON (Leu românesc)</SelectItem>
                                  <SelectItem value="EUR">EUR (Euro)</SelectItem>
                                  <SelectItem value="USD">USD (Dolar american)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={storeSettingsForm.control}
                          name="timezone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fus Orar</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selectați fusul orar" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Europe/Bucharest">Europa/București (GMT+3)</SelectItem>
                                  <SelectItem value="Europe/London">Europa/Londra (GMT+1)</SelectItem>
                                  <SelectItem value="America/New_York">America/New York (GMT-4)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Identitate Vizuală</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label>Logo Magazin</Label>
                          <div className="mt-2 flex items-center">
                            <div className="w-16 h-16 border rounded flex items-center justify-center bg-muted">
                              <PictureInPicture className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <Button variant="outline" size="sm" className="ml-4">
                              Încarcă Logo
                            </Button>
                          </div>
                        </div>
                        
                        <div>
                          <Label>Favicon</Label>
                          <div className="mt-2 flex items-center">
                            <div className="w-16 h-16 border rounded flex items-center justify-center bg-muted">
                              <PictureInPicture className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <Button variant="outline" size="sm" className="ml-4">
                              Încarcă Favicon
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex justify-between border-t px-6 py-4">
                <Button variant="outline">Anulează</Button>
                <Button 
                  variant="default"
                  onClick={storeSettingsForm.handleSubmit(onSubmitStoreSettings)}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Salvează Setările
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Payment Settings Tab */}
          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle>Setări Metode de Plată</CardTitle>
                <CardDescription>
                  Configurați metodele de plată disponibile în magazinul online
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...paymentSettingsForm}>
                  <form className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Metode de Plată Acceptate</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border p-4 rounded-md">
                          <div className="flex items-center">
                            <CreditCard className="h-10 w-10 text-primary mr-4" />
                            <div>
                              <h4 className="font-medium">Plată cu Card</h4>
                              <p className="text-sm text-muted-foreground">Acceptați plăți cu carduri de credit/debit prin Stripe</p>
                            </div>
                          </div>
                          <FormField
                            control={paymentSettingsForm.control}
                            name="cardPaymentEnabled"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between border p-4 rounded-md">
                          <div className="flex items-center">
                            <DollarSign className="h-10 w-10 text-primary mr-4" />
                            <div>
                              <h4 className="font-medium">PayPal</h4>
                              <p className="text-sm text-muted-foreground">Acceptați plăți prin PayPal</p>
                            </div>
                          </div>
                          <FormField
                            control={paymentSettingsForm.control}
                            name="paypalEnabled"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between border p-4 rounded-md">
                          <div className="flex items-center">
                            <Building2 className="h-10 w-10 text-primary mr-4" />
                            <div>
                              <h4 className="font-medium">Transfer Bancar</h4>
                              <p className="text-sm text-muted-foreground">Acceptați plăți prin transfer bancar</p>
                            </div>
                          </div>
                          <FormField
                            control={paymentSettingsForm.control}
                            name="bankTransferEnabled"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between border p-4 rounded-md">
                          <div className="flex items-center">
                            <Coins className="h-10 w-10 text-primary mr-4" />
                            <div>
                              <h4 className="font-medium">Ramburs</h4>
                              <p className="text-sm text-muted-foreground">Plata la livrare (cash)</p>
                            </div>
                          </div>
                          <FormField
                            control={paymentSettingsForm.control}
                            name="cashOnDeliveryEnabled"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Configurare Stripe</h3>
                      <div className="grid gap-4">
                        <FormField
                          control={paymentSettingsForm.control}
                          name="stripePublicKey"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Stripe Public Key</FormLabel>
                              <FormControl>
                                <Input placeholder="pk_test_..." {...field} />
                              </FormControl>
                              <FormDescription>
                                Cheia publică pentru integrarea Stripe
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={paymentSettingsForm.control}
                          name="stripeSecretKey"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Stripe Secret Key</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="sk_test_..." {...field} />
                              </FormControl>
                              <FormDescription>
                                Cheia secretă pentru integrarea Stripe. Aceasta nu ar trebui distribuită.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Configurare PayPal</h3>
                      <div className="grid gap-4">
                        <FormField
                          control={paymentSettingsForm.control}
                          name="paypalClientId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>PayPal Client ID</FormLabel>
                              <FormControl>
                                <Input placeholder="Client ID PayPal" {...field} />
                              </FormControl>
                              <FormDescription>
                                ID-ul client pentru integrarea PayPal
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={paymentSettingsForm.control}
                          name="paypalClientSecret"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>PayPal Client Secret</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Client Secret PayPal" {...field} />
                              </FormControl>
                              <FormDescription>
                                Secret-ul client pentru integrarea PayPal. Acesta nu ar trebui distribuit.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Detalii Bancare</h3>
                      <div className="grid gap-4">
                        <FormField
                          control={paymentSettingsForm.control}
                          name="bankDetails"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Detalii Transfer Bancar</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Introduceți detaliile bancare pentru transfer"
                                  className="min-h-[120px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Aceste detalii vor fi afișate clienților care aleg plata prin transfer bancar
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex justify-between border-t px-6 py-4">
                <Button variant="outline">Anulează</Button>
                <Button 
                  variant="default"
                  onClick={paymentSettingsForm.handleSubmit(onSubmitPaymentSettings)}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Salvează Setările
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Shipping Settings Tab */}
          <TabsContent value="shipping">
            <Card>
              <CardHeader>
                <CardTitle>Setări Livrare</CardTitle>
                <CardDescription>
                  Configurați metodele de livrare și politicile de expediere
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Metode de Livrare</h3>
                    <Button variant="outline" size="sm">
                      <Truck className="mr-2 h-4 w-4" />
                      Adaugă Metodă
                    </Button>
                  </div>
                  
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="px-4 py-3">Nume</TableHead>
                          <TableHead className="px-4 py-3">Preț</TableHead>
                          <TableHead className="px-4 py-3">Timp Estimat</TableHead>
                          <TableHead className="px-4 py-3 text-center">Status</TableHead>
                          <TableHead className="px-4 py-3 text-right">Acțiuni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {shippingMethods.map((method) => (
                          <TableRow key={method.id}>
                            <TableCell className="px-4 py-3">
                              <div className="font-medium">{method.name}</div>
                            </TableCell>
                            <TableCell className="px-4 py-3">{method.price} RON</TableCell>
                            <TableCell className="px-4 py-3">{method.estimatedDelivery}</TableCell>
                            <TableCell className="px-4 py-3 text-center">
                              <Switch checked={method.active} />
                            </TableCell>
                            <TableCell className="px-4 py-3 text-right">
                              <Button variant="ghost" size="sm">
                                Editează
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Politici de Livrare</h3>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="free-shipping-threshold">Prag Livrare Gratuită</Label>
                      <div className="flex">
                        <Input 
                          id="free-shipping-threshold" 
                          placeholder="Suma minimă" 
                          type="number"
                          defaultValue="300"
                        />
                        <Select defaultValue="RON">
                          <SelectTrigger className="w-[100px] ml-2">
                            <SelectValue placeholder="Monedă" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="RON">RON</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Clienții vor beneficia de livrare gratuită pentru comenzi peste această sumă
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Livrare Internațională</Label>
                      <div className="flex items-center space-x-2">
                        <Switch id="international-shipping" />
                        <Label htmlFor="international-shipping">Activată</Label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Activați pentru a permite livrarea în afara României
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="handling-time">Timp de Procesare</Label>
                      <div className="flex">
                        <Input 
                          id="handling-time" 
                          placeholder="Zile" 
                          type="number"
                          defaultValue="1"
                        />
                        <Select defaultValue="business_days">
                          <SelectTrigger className="w-[180px] ml-2">
                            <SelectValue placeholder="Tip zile" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="business_days">Zile Lucrătoare</SelectItem>
                            <SelectItem value="calendar_days">Zile Calendaristice</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Timpul necesar pentru procesarea comenzii înainte de expediere
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Expediere Parțială</Label>
                      <div className="flex items-center space-x-2">
                        <Switch id="partial-shipping" defaultChecked />
                        <Label htmlFor="partial-shipping">Permisă</Label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Permite expedierea parțială a comenzilor atunci când unele produse nu sunt disponibile
                      </p>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Zone de Livrare</h3>
                  
                  <div className="border rounded-md p-4">
                    <RadioGroup defaultValue="romania_only" className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="romania_only" id="romania_only" />
                        <Label htmlFor="romania_only">Doar România</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="eu" id="eu" />
                        <Label htmlFor="eu">Uniunea Europeană</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="worldwide" id="worldwide" />
                        <Label htmlFor="worldwide">Global</Label>
                      </div>
                    </RadioGroup>
                    
                    <div className="mt-4">
                      <Button variant="outline" size="sm">
                        Configurare Zone Personalizate
                      </Button>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Restricții Produse</h3>
                  
                  <div className="space-y-2">
                    <Label>Produse care necesită confirmare manuală</Label>
                    <Textarea 
                      placeholder="Introduceți SKU-urile produselor, separate prin virgulă"
                      className="min-h-[100px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      Produsele specificate aici vor necesita confirmare manuală înainte de expediere
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t px-6 py-4">
                <Button variant="outline">Anulează</Button>
                <Button variant="default">
                  <Save className="mr-2 h-4 w-4" />
                  Salvează Setările
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Tax Settings Tab */}
          <TabsContent value="tax">
            <Card>
              <CardHeader>
                <CardTitle>Setări Taxe</CardTitle>
                <CardDescription>
                  Configurați taxele și cotele de TVA pentru produsele din magazin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Cote de TVA</h3>
                    <Button variant="outline" size="sm">
                      <PercentSquare className="mr-2 h-4 w-4" />
                      Adaugă Cotă Nouă
                    </Button>
                  </div>
                  
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="px-4 py-3">Nume</TableHead>
                          <TableHead className="px-4 py-3">Rată (%)</TableHead>
                          <TableHead className="px-4 py-3">Țări</TableHead>
                          <TableHead className="px-4 py-3 text-center">Implicit</TableHead>
                          <TableHead className="px-4 py-3 text-right">Acțiuni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.values(taxSettings).map((tax, index) => (
                          <TableRow key={index}>
                            <TableCell className="px-4 py-3">
                              <div className="font-medium">{tax.name}</div>
                            </TableCell>
                            <TableCell className="px-4 py-3">{tax.rate}%</TableCell>
                            <TableCell className="px-4 py-3">{tax.countries.join(', ')}</TableCell>
                            <TableCell className="px-4 py-3 text-center">
                              <div className="flex justify-center">
                                <RadioGroupItem
                                  value={`tax-${index}`}
                                  checked={tax.default}
                                  id={`tax-${index}`}
                                />
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-right">
                              <Button variant="ghost" size="sm">
                                Editează
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Setări Generale Taxe</h3>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Prețuri includ TVA</Label>
                      <div className="flex items-center space-x-2">
                        <Switch id="prices-include-tax" defaultChecked />
                        <Label htmlFor="prices-include-tax">Da</Label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Dacă este activat, prețurile produselor includ deja TVA
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Calculează Taxe După</Label>
                      <Select defaultValue="shipping_address">
                        <SelectTrigger>
                          <SelectValue placeholder="Selectează" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="shipping_address">Adresa de Livrare</SelectItem>
                          <SelectItem value="billing_address">Adresa de Facturare</SelectItem>
                          <SelectItem value="store_address">Adresa Magazinului</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Adresa folosită pentru calculul taxelor
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Afișare Taxe în Coș</Label>
                      <Select defaultValue="itemized">
                        <SelectTrigger>
                          <SelectValue placeholder="Selectează" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="itemized">Detaliat (per produs)</SelectItem>
                          <SelectItem value="total">Doar Total</SelectItem>
                          <SelectItem value="both">Ambele</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Cum sunt afișate taxele în coșul de cumpărături
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Clasă Implicită de Taxe pentru Produse Noi</Label>
                      <Select defaultValue="standard">
                        <SelectTrigger>
                          <SelectValue placeholder="Selectează" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">TVA Standard (19%)</SelectItem>
                          <SelectItem value="reduced">TVA Redus (9%)</SelectItem>
                          <SelectItem value="super_reduced">TVA Super-redus (5%)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Clasa de taxe aplicată automat produselor noi
                      </p>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Date Fiscale</h3>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="company-name">Nume Companie</Label>
                      <Input id="company-name" defaultValue="SC ERP SRL" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="fiscal-code">Cod Fiscal</Label>
                      <Input id="fiscal-code" defaultValue="RO123456789" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="trade-register">Nr. Reg. Comerțului</Label>
                      <Input id="trade-register" defaultValue="J40/1234/2020" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="vat-number">Cod TVA</Label>
                      <Input id="vat-number" defaultValue="RO123456789" />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t px-6 py-4">
                <Button variant="outline">Anulează</Button>
                <Button variant="default">
                  <Save className="mr-2 h-4 w-4" />
                  Salvează Setările
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Advanced Settings Tab */}
          <TabsContent value="advanced">
            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem value="email-settings" className="border rounded-md">
                <AccordionTrigger className="px-4 py-2 hover:no-underline hover:bg-muted/50">
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 mr-2 text-primary" />
                    <span className="font-medium">Notificări Email</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label>Expeditor Email</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <Input placeholder="Nume Expeditor" defaultValue="ERP Online Shop" />
                        <Input placeholder="Email Expeditor" defaultValue="no-reply@erp.ro" type="email" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Template-uri Email</Label>
                      <div className="border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="px-4 py-2">Tipul Notificării</TableHead>
                              <TableHead className="px-4 py-2 text-center">Client</TableHead>
                              <TableHead className="px-4 py-2 text-center">Administrator</TableHead>
                              <TableHead className="px-4 py-2 text-right">Acțiuni</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {[
                              { name: 'Comandă Nouă', customerEnabled: true, adminEnabled: true },
                              { name: 'Comandă Confirmată', customerEnabled: true, adminEnabled: false },
                              { name: 'Comandă Expediată', customerEnabled: true, adminEnabled: true },
                              { name: 'Comandă Livrată', customerEnabled: true, adminEnabled: false },
                              { name: 'Comandă Anulată', customerEnabled: true, adminEnabled: true },
                            ].map((template, i) => (
                              <TableRow key={i}>
                                <TableCell className="px-4 py-2">{template.name}</TableCell>
                                <TableCell className="px-4 py-2 text-center">
                                  <Switch checked={template.customerEnabled} />
                                </TableCell>
                                <TableCell className="px-4 py-2 text-center">
                                  <Switch checked={template.adminEnabled} />
                                </TableCell>
                                <TableCell className="px-4 py-2 text-right">
                                  <Button variant="ghost" size="sm">
                                    Editează
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                    
                    <Button variant="outline" size="sm">
                      <Mail className="mr-2 h-4 w-4" />
                      Testează Email-uri
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="order-settings" className="border rounded-md">
                <AccordionTrigger className="px-4 py-2 hover:no-underline hover:bg-muted/50">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-primary" />
                    <span className="font-medium">Setări Comandă</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4 pt-2">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Format Număr Comandă</Label>
                        <Input placeholder="Format" defaultValue="ORD-{number}" />
                        <p className="text-xs text-muted-foreground">
                          Utilizați {'{number}'} pentru numărul secvențial
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Număr Start</Label>
                        <Input placeholder="Număr start" defaultValue="10000" type="number" />
                        <p className="text-xs text-muted-foreground">
                          Numărul de la care începe numerotarea comenzilor
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Status Implicit Comandă Nouă</Label>
                        <Select defaultValue="pending">
                          <SelectTrigger>
                            <SelectValue placeholder="Selectează" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">În așteptare</SelectItem>
                            <SelectItem value="processing">În procesare</SelectItem>
                            <SelectItem value="on_hold">În așteptare manuală</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Afișare Prețuri</Label>
                        <Select defaultValue="with_tax">
                          <SelectTrigger>
                            <SelectValue placeholder="Selectează" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="with_tax">Cu TVA</SelectItem>
                            <SelectItem value="without_tax">Fără TVA</SelectItem>
                            <SelectItem value="both">Ambele</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Ștergere Automată Coșuri Abandonate</Label>
                        <Switch id="auto-delete-carts" defaultChecked />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Șterge automat coșurile abandonate după o perioadă de inactivitate
                      </p>
                      <Select defaultValue="7d">
                        <SelectTrigger>
                          <SelectValue placeholder="Perioadă de inactivitate" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1d">1 zi</SelectItem>
                          <SelectItem value="3d">3 zile</SelectItem>
                          <SelectItem value="7d">7 zile</SelectItem>
                          <SelectItem value="14d">14 zile</SelectItem>
                          <SelectItem value="30d">30 zile</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="product-settings" className="border rounded-md">
                <AccordionTrigger className="px-4 py-2 hover:no-underline hover:bg-muted/50">
                  <div className="flex items-center">
                    <Tag className="h-5 w-5 mr-2 text-primary" />
                    <span className="font-medium">Setări Produse</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4 pt-2">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Unitate Implicită de Măsură</Label>
                        <Select defaultValue="piece">
                          <SelectTrigger>
                            <SelectValue placeholder="Selectează" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="piece">Bucată</SelectItem>
                            <SelectItem value="kg">Kilogram</SelectItem>
                            <SelectItem value="m">Metru</SelectItem>
                            <SelectItem value="l">Litru</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Dimensiuni Imagine Produse</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input placeholder="Lățime" defaultValue="800" type="number" />
                          <Input placeholder="Înălțime" defaultValue="800" type="number" />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Dimensiunile în pixeli pentru imaginile produselor
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Afișare Produse Fără Stoc</Label>
                        <Switch id="show-out-of-stock" defaultChecked />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Dacă este activat, produsele fără stoc vor fi vizibile în magazin dar marcate ca indisponibile
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Permiteți Pre-Comenzi</Label>
                        <Switch id="allow-preorders" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Permiteți clienților să pre-comande produse care nu sunt încă în stoc
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Dată și Stoc în Timp Real</Label>
                        <Switch id="realtime-stock" defaultChecked />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Actualizează stocul în timp real după plasarea comenzilor
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="security-settings" className="border rounded-md">
                <AccordionTrigger className="px-4 py-2 hover:no-underline hover:bg-muted/50">
                  <div className="flex items-center">
                    <ShieldCheck className="h-5 w-5 mr-2 text-primary" />
                    <span className="font-medium">Securitate și GDPR</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Protecție Anti-Fraudă</Label>
                        <Switch id="fraud-protection" defaultChecked />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Activează verificări anti-fraudă pentru comenzi
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Politică de Confidențialitate</Label>
                        <Switch id="privacy-policy" defaultChecked />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Afișează și cere acceptul pentru politica de confidențialitate la checkout
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Cookie Banner</Label>
                        <Switch id="cookie-banner" defaultChecked />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Afișează banner pentru acceptarea cookie-urilor conform GDPR
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Perioadă de Păstrare Date Client</Label>
                      <Select defaultValue="36m">
                        <SelectTrigger>
                          <SelectValue placeholder="Selectează" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="12m">12 luni</SelectItem>
                          <SelectItem value="24m">24 luni</SelectItem>
                          <SelectItem value="36m">36 luni</SelectItem>
                          <SelectItem value="60m">60 luni</SelectItem>
                          <SelectItem value="forever">Permanent</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Perioada după care datele clienților inactivi sunt anonimizate
                      </p>
                    </div>
                    
                    <Button variant="outline" size="sm">
                      <FileText className="mr-2 h-4 w-4" />
                      Editează Politici GDPR
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="api-settings" className="border rounded-md">
                <AccordionTrigger className="px-4 py-2 hover:no-underline hover:bg-muted/50">
                  <div className="flex items-center">
                    <Key className="h-5 w-5 mr-2 text-primary" />
                    <span className="font-medium">API și Integrări</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Chei API</Label>
                        <Button variant="outline" size="sm">
                          Generează Cheie Nouă
                        </Button>
                      </div>
                      
                      <div className="border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="px-4 py-2">Nume</TableHead>
                              <TableHead className="px-4 py-2">Cheie</TableHead>
                              <TableHead className="px-4 py-2">Permisiuni</TableHead>
                              <TableHead className="px-4 py-2 text-center">Status</TableHead>
                              <TableHead className="px-4 py-2 text-right">Acțiuni</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {[
                              { name: 'Integrare Shopify', key: '••••••••••••••••', permissions: 'Read/Write', active: true },
                              { name: 'Analiză Date', key: '••••••••••••••••', permissions: 'Read-only', active: true },
                              { name: 'Backup Automat', key: '••••••••••••••••', permissions: 'Read-only', active: false },
                            ].map((apiKey, i) => (
                              <TableRow key={i}>
                                <TableCell className="px-4 py-2">{apiKey.name}</TableCell>
                                <TableCell className="px-4 py-2 font-mono text-sm">{apiKey.key}</TableCell>
                                <TableCell className="px-4 py-2">{apiKey.permissions}</TableCell>
                                <TableCell className="px-4 py-2 text-center">
                                  <Switch checked={apiKey.active} />
                                </TableCell>
                                <TableCell className="px-4 py-2 text-right">
                                  <Button variant="ghost" size="sm">
                                    Revocă
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>API Webhook-uri</Label>
                        <Switch id="webhooks" defaultChecked />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Permite sistemelor externe să primească notificări despre evenimentele din magazin
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Limită Rate API</Label>
                      <div className="flex items-center space-x-2">
                        <Input defaultValue="100" type="number" />
                        <span className="text-sm text-muted-foreground">cereri / minut</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Limitează numărul de cereri API pe care un client le poate face într-un minut
                      </p>
                    </div>
                    
                    <div className="border rounded-md p-4 space-y-2">
                      <Label>Documentație API</Label>
                      <p className="text-sm">
                        Accesați documentația completă a API-ului pentru a integra alte sisteme cu magazinul dvs.
                      </p>
                      <Button variant="outline" size="sm">
                        Vizualizează Documentația
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <div className="mt-6 flex justify-end">
              <Button variant="default">
                <Save className="mr-2 h-4 w-4" />
                Salvează Toate Setările
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </EcommerceModuleLayout>
  );
}