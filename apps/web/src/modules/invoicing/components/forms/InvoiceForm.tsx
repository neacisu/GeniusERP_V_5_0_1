/**
 * Invoice Form Component
 * 
 * Form for creating and editing invoices with validation and dynamic line items.
 */
import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarIcon, Trash2Icon, PlusIcon, CheckIcon, ChevronsUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { NewInvoiceData, PaymentMethod, Customer } from '../../types';
import { calculateSubtotal as calculateNetTotal, calculateTotalVAT as calculateVAT, calculateTotal } from '../../utils/invoiceCalculations';
import { useInvoiceCustomers } from '../../hooks/useCustomerApi';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { CompanyFormDialog } from '../../../crm/components/company/CompanyFormDialog';
import { useState as useCompanyDialogState } from 'react';
import { queryClient } from '@/lib/queryClient';
import { PlusCircle } from 'lucide-react';
import { CompanyFormValues } from '../../../crm/types';

// Schema for invoice form validation
const invoiceItemSchema = z.object({
  productName: z.string().min(1, 'Numele produsului este obligatoriu'),
  productCode: z.string().optional(),
  quantity: z.number().min(0.01, 'Cantitatea trebuie să fie mai mare decât 0'),
  unitPrice: z.number().min(0, 'Prețul unitar trebuie să fie mai mare sau egal cu 0'),
  vatRate: z.number().min(0, 'Rata TVA trebuie să fie mai mare sau egal cu 0'),
  discount: z.number().min(0, 'Discount-ul trebuie să fie mai mare sau egal cu 0').optional(),
  notes: z.string().optional(),
});

const invoiceFormSchema = z.object({
  customerId: z.string().min(1, 'Clientul este obligatoriu'),
  issueDate: z.date({
    message: 'Data emiterii este obligatorie',
  }),
  dueDate: z.date({
    message: 'Data scadenței este obligatorie',
  }),
  currency: z.string().optional(),
  exchangeRate: z.number().optional(),
  paymentMethod: z.enum([
    PaymentMethod.BANK_TRANSFER,
    PaymentMethod.CASH,
    PaymentMethod.CARD,
    PaymentMethod.CHECK,
    PaymentMethod.OTHER
  ]),
  paymentDetails: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'Factura trebuie să conțină cel puțin un produs'),
});

// Invoice form props
interface InvoiceFormProps {
  defaultValues?: Partial<NewInvoiceData>;
  onSubmit: (data: NewInvoiceData) => void;
  isSubmitting?: boolean;
}

export function InvoiceForm({ defaultValues, onSubmit, isSubmitting = false }: InvoiceFormProps) {
  // Use our customer API hook
  const { crm_customers, isLoading: isLoadingCustomers } = useInvoiceCustomers();
  
  // State for customer search
  const [searchQuery, setSearchQuery] = useState("");
  
  // State for new customer dialog
  const [isNewCustomerDialogOpen, setIsNewCustomerDialogOpen] = useCompanyDialogState(false);
  
  // Filter customers based on search query
  const filteredCustomers = customers.filter(customer => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase().trim();
    const name = (customer.name || "").toLowerCase();
    
    // Extract fiscalCode with and without RO prefix
    const fiscalCode = (customer.fiscalCode || "").toLowerCase().replace(/\s/g, '');
    
    // Handle RO prefix variations
    const fiscalCodeWithoutRO = fiscalCode.startsWith("ro") ? fiscalCode.slice(2) : fiscalCode;
    const fiscalCodeWithRO = fiscalCode.startsWith("ro") ? fiscalCode : `ro${fiscalCode}`;
    
    // Clean the search query to match exact number patterns
    const queryClean = query.replace(/\s/g, '').replace(/^ro/i, '');
    
    // Match on name or fiscalCode (with or without RO prefix)
    return name.includes(query) || 
           fiscalCode.includes(query) || 
           fiscalCodeWithoutRO.includes(query) || 
           fiscalCodeWithRO.includes(query) || 
           fiscalCode.includes(queryClean) || 
           fiscalCodeWithoutRO === queryClean;
  });
  
  // Default payment methods in Romania
  const paymentMethods = [
    { id: PaymentMethod.BANK_TRANSFER, label: 'Transfer bancar' },
    { id: PaymentMethod.CASH, label: 'Numerar' },
    { id: PaymentMethod.CARD, label: 'Card' },
    { id: PaymentMethod.CHECK, label: 'CEC' },
    { id: PaymentMethod.OTHER, label: 'Altă metodă' },
  ];

  // Default VAT rates in Romania
  const vatRates = [
    { value: 19, label: '19% - Standard' },
    { value: 9, label: '9% - Redus' },
    { value: 5, label: '5% - Redus special' },
    { value: 0, label: '0% - Scutit de TVA' },
  ];

  // Form state
  const form = useForm<z.infer<typeof invoiceFormSchema>>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      customerId: defaultValues?.customerId || '',
      issueDate: defaultValues?.issueDate ? new Date(defaultValues.issueDate) : new Date(),
      dueDate: defaultValues?.dueDate ? new Date(defaultValues.dueDate) : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // Default to 15 days
      currency: defaultValues?.currency || 'RON',
      exchangeRate: 1,
      paymentMethod: defaultValues?.paymentMethod || PaymentMethod.BANK_TRANSFER,
      paymentDetails: '',
      notes: defaultValues?.notes || '',
      items: defaultValues?.items?.map(item => ({
        productName: item.productName,
        productCode: item.productCode || '',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate,
        discount: item.discount || 0,
        notes: '',
      })) || [
        {
          productName: '',
          productCode: '',
          quantity: 1,
          unitPrice: 0,
          vatRate: 19, // Default VAT rate in Romania
          discount: 0,
          notes: '',
        }
      ],
    },
  });

  // Field array for dynamic line items
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  // Form calculations
  const items = form.watch('items');
  const [totals, setTotals] = useState({
    subtotal: 0,
    vat: 0,
    total: 0
  });

  // Handler for new customer creation
  const handleNewCustomerSubmit = async (data: CompanyFormValues) => {
    try {
      // Import company service pentru a salva clientul nou
      const { saveCompany } = await import('../../../crm/services/company.service');
      
      console.log("Salvare client nou:", data);
      
      // Verificăm și ne asigurăm că toate proprietățile necesare sunt prezente
      const clientData = {
        ...data,
        type: 'customer' as const,       // Forțăm tipul ca fiind customer
        isCustomer: true,                // Marcăm explicit ca fiind client
        // Asigurăm-ne că CUI/fiscalCode este prezent în ambele formate pentru compatibilitate
        cui: data.cui || data.fiscalCode,
        fiscalCode: data.fiscalCode || data.cui || ''
      };
      
      console.log("Date client pregătite pentru salvare:", clientData);
      
      // Salvăm clientul nou în baza de date
      const savedCompany = await saveCompany(clientData);
      console.log("Client nou salvat cu succes:", savedCompany);
      
      // Dacă primim un răspuns valid și avem un ID, setăm direct clientul în formular
      if (savedCompany && savedCompany.id) {
        form.setValue('customerId', savedCompany.id);
      }
      
      // Invalidate the customers query to fetch the updated list
      await queryClient.invalidateQueries({ queryKey: ['/api/invoice-customers'] }); // Invalidăm lista de clienți factură
      await queryClient.invalidateQueries({ queryKey: ['/api/crm/companies'] });     // Invalidăm și lista de companii
      
      // Set search query to find the newly created customer
      if (clientData.name) {
        setSearchQuery(clientData.name);
      }
      
      // Close the dialog
      setIsNewCustomerDialogOpen(false);
      
      // Notificare de succes - nu avem toast în acest component
      console.log(`Client creat cu succes: ${clientData.name}`);
    } catch (error) {
      console.error("Eroare la crearea clientului nou:", error);
      // Folosim doar log în loc de toast
      console.error("Eroare la crearea clientului nou:", 
                   error instanceof Error ? error.message : "A apărut o eroare la salvarea clientului");
    }
  };
  
  // Update totals when items change
  useEffect(() => {
    // Map form items to InvoiceItem type
    const invoiceItems = items.map(item => ({
      id: '',
      invoiceId: '',
      productName: item.productName,
      productCode: item.productCode,
      quantity: item.quantity || 0,
      unitPrice: item.unitPrice || 0,
      vatRate: item.vatRate || 0,
      netAmount: 0,
      vatAmount: 0,
      grossAmount: 0,
      discount: item.discount,
      sequence: 0,
      notes: item.notes,
      createdAt: '',
      updatedAt: '',
    }));

    const subtotal = calculateNetTotal(invoiceItems);
    const vat = calculateVAT(invoiceItems);
    const total = calculateTotal(invoiceItems);

    setTotals({ subtotal, vat, total });
  }, [items]);

  // Form submission handler
  const handleSubmit = (values: z.infer<typeof invoiceFormSchema>) => {
    // Transform the form data to match the API expectations
    const formattedData: NewInvoiceData = {
      customerId: values.customerId,
      issueDate: format(values.issueDate, 'yyyy-MM-dd'),
      dueDate: format(values.dueDate, 'yyyy-MM-dd'),
      vatRate: 0, // This is calculated from items in the backend
      currency: values.currency || 'RON',
      exchangeRate: values.exchangeRate,
      paymentMethod: values.paymentMethod,
      paymentDetails: values.paymentDetails,
      notes: values.notes,
      items: values.items.map((item, index) => ({
        id: `temp-${index}`,
        invoiceId: '', // Will be set by backend
        productName: item.productName,
        productCode: item.productCode,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        netAmount: item.quantity * item.unitPrice,
        vatRate: item.vatRate,
        vatAmount: (item.quantity * item.unitPrice * item.vatRate) / 100,
        grossAmount: item.quantity * item.unitPrice * (1 + item.vatRate / 100),
        discount: item.discount,
        sequence: index + 1,
        notes: item.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })),
    };

    onSubmit(formattedData);
  };

  return (
    <>
      {/* Dialog pentru crearea unui client nou */}
      <CompanyFormDialog 
        isOpen={isNewCustomerDialogOpen}
        onOpenChange={setIsNewCustomerDialogOpen}
        onSubmit={handleNewCustomerSubmit}
        isEditing={false}
        initialData={{ 
          // Nu folosim ID temporar - pentru clienți noi, ID-ul va fi generat de server
          id: '', // ID gol pentru client nou
          name: '',
          fiscalCode: searchQuery.trim(), // Precompletăm CUI-ul cu valoarea căutată
          cui: searchQuery.trim(),        // Completăm ambele câmpuri pentru compatibilitate
          type: 'customer',
          isCustomer: true,
          // Nu presupunem nimic despre statusul de plătitor TVA
          // Acesta va fi determinat din datele ANAF prin interogare automată
          country: 'România',
        }}
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Client and invoice details section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Detalii client și factură</h3>
              
              {/* Customer selection with search */}
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Client</FormLabel>
                    <Popover onOpenChange={(open) => {
                      if (!open) {
                        // Reset search query when popover closes
                        setSearchQuery("");
                      }
                    }}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? customers.find((customer) => customer.id === field.value)?.name || "Selectează un client"
                              : "Selectează un client"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput 
                            placeholder="Caută client după nume sau CUI/CIF..." 
                            className="h-9" 
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                          />
                          <CommandList>
                            <CommandEmpty>
                              <div className="p-2 text-center">
                                <p className="mb-2">Client inexistent.</p>
                                <Button 
                                  variant="secondary" 
                                  size="sm" 
                                  className="flex items-center justify-center w-full"
                                  onClick={() => {
                                    // Activăm dialogul de creare client și transmitem CUI-ul căutat
                                    setIsNewCustomerDialogOpen(true);
                                    console.log("CUI transmis la deschiderea dialogului:", searchQuery);
                                  }}
                                >
                                  <PlusCircle className="h-4 w-4 mr-2" />
                                  Creează clientul acum
                                </Button>
                              </div>
                            </CommandEmpty>
                            <CommandGroup>
                              {isLoadingCustomers ? (
                                <CommandItem disabled>
                                  <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Se încarcă clienții...
                                  </span>
                                </CommandItem>
                              ) : Array.isArray(customers) && customers.length > 0 ? (
                                filteredCustomers.map((customer) => {
                                  // Prepare display data for fiscalCode (accepting with or without RO prefix)
                                  const fiscalCode = customer?.fiscalCode || '';
                                  
                                  return (
                                    <CommandItem
                                      key={customer?.id || 'unknown'}
                                      value={`${customer?.name || ''} ${fiscalCode}`}
                                      onSelect={() => {
                                        form.setValue("customerId", customer.id)
                                      }}
                                    >
                                      <CheckIcon
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          customer.id === field.value
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      <span className="font-medium">{customer?.name || 'Client necunoscut'}</span>
                                      {fiscalCode && (
                                        <span className="ml-2 text-muted-foreground">{fiscalCode}</span>
                                      )}
                                    </CommandItem>
                                  )
                                })
                              ) : (
                                <CommandItem disabled>
                                  Nu s-au găsit clienți în sistem. Vă rugăm să adăugați un client mai întâi.
                                </CommandItem>
                              )}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Issue Date */}
              <FormField
                control={form.control}
                name="issueDate"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Data emiterii</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd.MM.yyyy", { locale: ro })
                            ) : (
                              <span>Selectează data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Due Date */}
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Data scadenței</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd.MM.yyyy", { locale: ro })
                            ) : (
                              <span>Selectează data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Method */}
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Metodă de plată</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selectează metoda de plată" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method.id} value={method.id}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Details */}
              <FormField
                control={form.control}
                name="paymentDetails"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Detalii plată</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Detalii pentru plată" />
                    </FormControl>
                    <FormDescription>
                      De ex: cont bancar, detalii ordin de plată, etc.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Currency and Exchange Rate */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Monedă</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="RON" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="RON">RON</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="exchangeRate"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Curs valutar</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.0001"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
                          value={field.value || 1}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Note și observații</h3>
              
              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Adaugă note sau mențiuni speciale pentru această factură..."
                        className="min-h-[200px]"
                      />
                    </FormControl>
                    <FormDescription>
                      Notele vor fi afișate pe factură.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        {/* Invoice Items section */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Produse și servicii</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({
                  productName: '',
                  productCode: '',
                  quantity: 1,
                  unitPrice: 0,
                  vatRate: 19,
                  discount: 0,
                  notes: '',
                })}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Adaugă produs
              </Button>
            </div>

            {/* Table header */}
            <div className="grid grid-cols-12 gap-4 py-2 font-medium text-sm border-b">
              <div className="col-span-4">Produs/Serviciu</div>
              <div className="col-span-1 text-center">Cantitate</div>
              <div className="col-span-2 text-center">Preț unitar</div>
              <div className="col-span-1 text-center">TVA %</div>
              <div className="col-span-1 text-center">Discount %</div>
              <div className="col-span-2 text-center">Subtotal</div>
              <div className="col-span-1 text-center">Acțiuni</div>
            </div>

            {/* Line items */}
            {fields.map((field, index) => {
              // Calculate line item total
              const quantity = form.watch(`items.${index}.quantity`) || 0;
              const unitPrice = form.watch(`items.${index}.unitPrice`) || 0;
              const discount = form.watch(`items.${index}.discount`) || 0;
              const lineTotal = quantity * unitPrice * (1 - discount / 100);

              return (
                <div key={field.id} className="grid grid-cols-12 gap-4 py-4 border-b items-center">
                  {/* Product name and code */}
                  <div className="col-span-4 space-y-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.productName`}
                      render={({ field }) => (
                        <FormItem className="mb-0">
                          <FormControl>
                            <Input {...field} placeholder="Nume produs/serviciu" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.productCode`}
                      render={({ field }) => (
                        <FormItem className="mb-0">
                          <FormControl>
                            <Input {...field} placeholder="Cod produs (opțional)" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Quantity */}
                  <div className="col-span-1">
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem className="mb-0">
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              className="text-center"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Unit price */}
                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.unitPrice`}
                      render={({ field }) => (
                        <FormItem className="mb-0">
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              className="text-center"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* VAT rate */}
                  <div className="col-span-1">
                    <FormField
                      control={form.control}
                      name={`items.${index}.vatRate`}
                      render={({ field }) => (
                        <FormItem className="mb-0">
                          <Select
                            onValueChange={(value) => field.onChange(parseFloat(value))}
                            defaultValue={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger className="text-center">
                                <SelectValue placeholder="19%" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {vatRates.map((rate) => (
                                <SelectItem key={rate.value} value={rate.value.toString()}>
                                  {rate.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Discount */}
                  <div className="col-span-1">
                    <FormField
                      control={form.control}
                      name={`items.${index}.discount`}
                      render={({ field }) => (
                        <FormItem className="mb-0">
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              className="text-center"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Line total */}
                  <div className="col-span-2 text-center font-medium">
                    {lineTotal.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RON
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {/* Totals */}
            <div className="mt-6 space-y-2 text-right">
              <div className="text-sm">
                Subtotal: <span className="font-medium ml-2">
                  {totals.subtotal.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RON
                </span>
              </div>
              <div className="text-sm">
                TVA: <span className="font-medium ml-2">
                  {totals.vat.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RON
                </span>
              </div>
              <div className="text-lg font-bold">
                Total: <span className="ml-2">
                  {totals.total.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RON
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form actions */}
        <div className="flex justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => form.reset()}
          >
            Anulează
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Se salvează...' : defaultValues?.customerId ? 'Actualizează factura' : 'Creează factura'}
          </Button>
        </div>
      </form>
    </Form>
    </>
  );
}