/**
 * UI Themes Settings Page
 * 
 * Manages theme customization, colors, and appearance settings
 */

import React, { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { HexColorPicker } from "react-colorful";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import PageHeader from "../../components/common/PageHeader";
import TabsNav, { TabItem } from "../../components/common/TabsNav";
import SettingCard from "../../components/cards/SettingCard";
import FormSection from "../../components/forms/FormSection";
import CustomFormField from "../../components/forms/FormField";
import SettingForm from "../../components/forms/SettingForm";
import { useSettingsApi } from "../../hooks/useSettingsApi";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Type definition for UITheme
interface UITheme {
  id: string;
  name: string;
  colors: {
    primary?: string;
    secondary?: string;
    accent?: string;
    [key: string]: string | undefined;
  };
  isDefault?: boolean;
  companyId?: string;
}
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
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Palette,
  Type,
  Image,
  Sun,
  Moon,
  Check,
  Plus,
  Edit,
  Loader2,
  CheckCircle,
} from "lucide-react";

// Define tabs for theme settings
const themeTabs: TabItem[] = [
  { id: "themes", label: "Teme Disponibile", icon: Palette },
  { id: "appearance", label: "Aspect General", icon: Sun },
  { id: "colors", label: "Culori Personalizate", icon: Palette },
  { id: "fonts", label: "Fonturi", icon: Type },
  { id: "logos", label: "Logo-uri", icon: Image },
];

// Schema for new theme
const themeSchema = z.object({
  name: z.string().min(3, "Numele temei trebuie să aibă cel puțin 3 caractere"),
  description: z.string().optional(),
  isDefault: z.boolean().default(false),
});

type ThemeFormValues = z.infer<typeof themeSchema>;

// Color presets
const colorPresets = [
  {
    name: "Albastru Corporativ",
    colors: {
      primary: "#0066cc",
      secondary: "#4d8ce0",
      accent: "#f8fafc",
      background: "#ffffff",
      foreground: "#15232d",
      muted: "#f1f5f9",
      border: "#e2e8f0"
    }
  },
  {
    name: "Verde Eco",
    colors: {
      primary: "#2e7d32",
      secondary: "#66bb6a",
      accent: "#f1f8e9",
      background: "#ffffff",
      foreground: "#263238",
      muted: "#e8f5e9",
      border: "#c8e6c9"
    }
  },
  {
    name: "Violet Modern",
    colors: {
      primary: "#673ab7",
      secondary: "#9575cd",
      accent: "#ede7f6",
      background: "#ffffff",
      foreground: "#212121",
      muted: "#f3e5f5",
      border: "#d1c4e9"
    }
  },
  {
    name: "Roșu Energic",
    colors: {
      primary: "#d32f2f",
      secondary: "#ef5350",
      accent: "#ffebee",
      background: "#ffffff",
      foreground: "#212121",
      muted: "#ffcdd2",
      border: "#ef9a9a"
    }
  },
  {
    name: "Portocaliu Vibrant",
    colors: {
      primary: "#f57c00",
      secondary: "#ffb74d",
      accent: "#fff3e0",
      background: "#ffffff",
      foreground: "#212121",
      muted: "#ffe0b2",
      border: "#ffcc80"
    }
  },
  {
    name: "Gri Neutru",
    colors: {
      primary: "#455a64",
      secondary: "#78909c",
      accent: "#eceff1",
      background: "#ffffff",
      foreground: "#263238",
      muted: "#cfd8dc",
      border: "#b0bec5"
    }
  }
];

export default function UIThemesPage() {
  const [activeTab, setActiveTab] = useState("themes");
  const [selectedColorKey, setSelectedColorKey] = useState("primary");
  const [selectedColor, setSelectedColor] = useState("#1e40af");
  const [editingTheme, setEditingTheme] = useState<UITheme | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [colorMode, setColorMode] = useState<"light" | "dark">("light");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  const { user } = useUser();
  const companyId = user?.companyId;

  const {
    useCompanyThemes,
    useDefaultTheme,
    useCreateTheme,
    useUpdateTheme,
    useSetDefaultTheme,
  } = useSettingsApi();

  const { data: themes, isLoading: isLoadingThemes } = useCompanyThemes(
    companyId || ""
  );
  const { data: defaultTheme } = useDefaultTheme(companyId || "");

  const createThemeMutation = useCreateTheme();
  const updateThemeMutation = useUpdateTheme();
  const setDefaultThemeMutation = useSetDefaultTheme();

  // Form for creating/editing themes
  const themeForm = useForm<ThemeFormValues>({
    resolver: zodResolver(themeSchema),
    defaultValues: {
      name: "",
      description: "",
      isDefault: false,
    },
  });

  // Reset form when editing theme changes
  React.useEffect(() => {
    if (editingTheme) {
      themeForm.reset({
        name: editingTheme.name,
        description: editingTheme.description || "",
        isDefault: editingTheme.isDefault,
      });
      setSelectedColor(editingTheme.colors.primary || "#1e40af");
    } else {
      themeForm.reset({
        name: "",
        description: "",
        isDefault: false,
      });
      setSelectedColor("#1e40af");
    }
  }, [editingTheme]);

  // Handle creating a new theme
  const handleCreateTheme = (data: ThemeFormValues) => {
    if (!companyId) return;

    let themeColors = {};
    
    if (selectedPreset !== null) {
      themeColors = colorPresets[selectedPreset].colors;
    } else {
      themeColors = {
        primary: selectedColor,
        secondary: selectedColor, // You could derive this from primary
        accent: "#eff6ff",
        background: colorMode === "light" ? "#ffffff" : "#1e293b",
        foreground: colorMode === "light" ? "#0f172a" : "#f8fafc",
        muted: colorMode === "light" ? "#f1f5f9" : "#334155",
        border: colorMode === "light" ? "#e2e8f0" : "#475569",
      };
    }

    if (editingTheme) {
      updateThemeMutation.mutate({
        id: editingTheme.id,
        data: {
          name: data.name,
          description: data.description,
          isDefault: data.isDefault,
          colors: themeColors,
          fonts: editingTheme.fonts || {
            sans: "Inter, sans-serif",
            serif: "Georgia, serif",
            mono: "Menlo, monospace",
          },
          logos: editingTheme.logos || {
            main: "/logo.svg",
            alt: "/logo-alt.svg",
          },
        },
      });
    } else {
      createThemeMutation.mutate({
        companyId,
        name: data.name,
        description: data.description,
        isDefault: data.isDefault,
        colors: themeColors,
        fonts: {
          sans: "Inter, sans-serif",
          serif: "Georgia, serif",
          mono: "Menlo, monospace",
        },
        logos: {
          main: "/logo.svg",
          alt: "/logo-alt.svg",
        },
      });
    }

    setIsDialogOpen(false);
    setEditingTheme(null);
    setSelectedPreset(null);
  };

  // Handle setting a theme as default
  const handleSetDefault = (theme: UITheme) => {
    setDefaultThemeMutation.mutate(theme.id);
  };

  // Open dialog for creating a new theme
  const openNewThemeDialog = () => {
    setEditingTheme(null);
    setIsDialogOpen(true);
    setSelectedPreset(null);
  };

  // Open dialog for editing a theme
  const openEditThemeDialog = (theme: UITheme) => {
    setEditingTheme(theme);
    setIsDialogOpen(true);
    setSelectedPreset(null);
    setSelectedColor(theme.colors.primary || "#1e40af");
  };

  // Select a color preset
  const selectPreset = (index: number) => {
    setSelectedPreset(index);
    setSelectedColor(colorPresets[index].colors.primary);
  };

  // Change a specific color
  const handleColorChange = (color: string) => {
    setSelectedColor(color);
  };

  // Generate a preview style based on selected colors
  const getPreviewStyle = (preset: number | null, customColor?: string) => {
    if (preset !== null) {
      const colors = colorPresets[preset].colors;
      return {
        backgroundColor: colors.background,
        color: colors.foreground,
        borderColor: colors.border,
        "--theme-primary": colors.primary,
        "--theme-secondary": colors.secondary,
      } as React.CSSProperties;
    }
    
    return {
      backgroundColor: colorMode === "light" ? "#ffffff" : "#1e293b",
      color: colorMode === "light" ? "#0f172a" : "#f8fafc",
      borderColor: colorMode === "light" ? "#e2e8f0" : "#475569",
      "--theme-primary": customColor || selectedColor,
      "--theme-secondary": customColor || selectedColor,
    } as React.CSSProperties;
  };

  const isSaving = createThemeMutation.isPending || updateThemeMutation.isPending || setDefaultThemeMutation.isPending;

  // Theme Creation/Editing Dialog
  const themeDialog = (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{editingTheme ? "Editare Temă" : "Creează Temă Nouă"}</DialogTitle>
          <DialogDescription>
            {editingTheme
              ? "Modificați setările pentru această temă"
              : "Creați o nouă temă personalizată"}
          </DialogDescription>
        </DialogHeader>

        <Form {...themeForm}>
          <form onSubmit={themeForm.handleSubmit(handleCreateTheme)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={themeForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nume Temă</FormLabel>
                    <FormControl>
                      <Input placeholder="ex: Tema Companiei" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={themeForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descriere</FormLabel>
                    <FormControl>
                      <Input placeholder="Descriere opțională" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={themeForm.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Setează ca temă implicită</FormLabel>
                      <FormDescription>
                        Această temă va fi folosită implicit pentru toți utilizatorii.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4"
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-base font-medium">Paleta de Culori</h3>
                <p className="text-sm text-muted-foreground">
                  Selectați un preset sau personalizați culorile temei.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {colorPresets.map((preset, index) => (
                  <div
                    key={index}
                    className={`p-2 border rounded-lg cursor-pointer hover:shadow transition-all ${
                      selectedPreset === index ? "border-primary ring-2 ring-primary/20" : ""
                    }`}
                    onClick={() => selectPreset(index)}
                  >
                    <div className="flex gap-1 mb-2">
                      {Object.values(preset.colors).map((color, i) => (
                        <div
                          key={i}
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: color }}
                        ></div>
                      ))}
                    </div>
                    <div className="text-xs font-medium">{preset.name}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-sm font-medium mb-2 block">Culoare Primară</label>
                  <HexColorPicker color={selectedColor} onChange={handleColorChange} />
                  <Input
                    value={selectedColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Previzualizare</label>
                  <div
                    className="w-full h-52 border rounded-lg p-4 flex flex-col gap-3 overflow-hidden"
                    style={getPreviewStyle(selectedPreset)}
                  >
                    <h4 className="text-lg font-bold" style={{ color: "var(--theme-primary)" }}>
                      Previzualizare temă
                    </h4>
                    <p>Text normal în tema selectată</p>
                    <div className="border p-2 rounded mt-auto">Chenar container</div>
                    <Button
                      className="mt-2 w-full"
                      style={{
                        backgroundColor: "var(--theme-primary)",
                        color: "#fff",
                      }}
                    >
                      Buton Acțiune
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Anulează
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvare...
                  </>
                ) : (
                  "Salvează Tema"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );

  // Render themes tab content
  const renderThemesTab = () => (
    <SettingCard
      title="Teme Disponibile"
      description="Gestionați temele disponibile și personalizați aspectul aplicației."
    >
      {isLoadingThemes ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {themes && themes.length > 0 ? (
            themes.map((theme) => (
              <div
                key={theme.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium text-base">{theme.name}</h3>
                    {theme.description && (
                      <p className="text-muted-foreground text-sm">
                        {theme.description}
                      </p>
                    )}
                  </div>
                  {theme.isDefault && (
                    <Badge variant="outline" className="text-green-600 bg-green-50 hover:bg-green-100">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Implicit
                    </Badge>
                  )}
                </div>

                <div className="h-16 mb-4 border rounded-md overflow-hidden flex">
                  <div
                    className="w-full p-2 flex flex-col justify-between"
                    style={{
                      backgroundColor: theme.colors.background || "#ffffff",
                      color: theme.colors.foreground || "#0f172a",
                    }}
                  >
                    <div className="text-xs">Previzualizare</div>
                    <div
                      className="w-24 h-5 rounded-sm"
                      style={{ backgroundColor: theme.colors.primary }}
                    ></div>
                  </div>
                </div>

                <div className="flex space-x-2 justify-end">
                  {!theme.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(theme)}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <Check className="mr-1 h-3 w-3" />
                          Setează Implicit
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditThemeDialog(theme)}
                  >
                    <Edit className="mr-1 h-3 w-3" />
                    Editează
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full flex justify-center items-center py-6 border rounded-lg bg-muted/20">
              <div className="text-center">
                <p className="text-muted-foreground mb-2">
                  Nu există teme definite.
                </p>
                <Button onClick={openNewThemeDialog} variant="outline">
                  <Plus className="mr-1 h-4 w-4" />
                  Adaugă Prima Temă
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </SettingCard>
  );

  // Render appearance tab content
  const renderAppearanceTab = () => (
    <SettingCard
      title="Aspect General"
      description="Configurați preferințele de afișare și aspectul general al aplicației."
    >
      <FormSection title="Mod de afișare" description="Alegeți între modul luminos și intunecat" columns={1}>
        <div className="grid grid-cols-2 gap-4">
          <div
            className={`border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow ${
              colorMode === "light" ? "border-primary ring-2 ring-primary/20" : ""
            }`}
            onClick={() => setColorMode("light")}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">Mod Luminos</h3>
              <Sun className="h-5 w-5 text-amber-500" />
            </div>
            <div className="bg-white border p-3 rounded-md text-slate-900 text-sm">
              Previzualizare conținut în mod luminos
            </div>
          </div>

          <div
            className={`border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow ${
              colorMode === "dark" ? "border-primary ring-2 ring-primary/20" : ""
            }`}
            onClick={() => setColorMode("dark")}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">Mod Întunecat</h3>
              <Moon className="h-5 w-5 text-indigo-400" />
            </div>
            <div className="bg-slate-800 border border-slate-700 p-3 rounded-md text-slate-200 text-sm">
              Previzualizare conținut în mod întunecat
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection title="Densitate Conținut" description="Ajustați spațierea elementelor din interfață" columns={1}>
        <div className="grid grid-cols-3 gap-4">
          <div className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow border-primary ring-2 ring-primary/20">
            <h3 className="font-medium mb-2">Normală</h3>
            <div className="space-y-3">
              <div className="h-4 bg-slate-200 rounded"></div>
              <div className="h-4 bg-slate-200 rounded"></div>
              <div className="h-4 bg-slate-200 rounded"></div>
            </div>
          </div>

          <div className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow">
            <h3 className="font-medium mb-2">Compactă</h3>
            <div className="space-y-2">
              <div className="h-3 bg-slate-200 rounded"></div>
              <div className="h-3 bg-slate-200 rounded"></div>
              <div className="h-3 bg-slate-200 rounded"></div>
            </div>
          </div>

          <div className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow">
            <h3 className="font-medium mb-2">Confortabilă</h3>
            <div className="space-y-4">
              <div className="h-5 bg-slate-200 rounded"></div>
              <div className="h-5 bg-slate-200 rounded"></div>
              <div className="h-5 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection title="Animații Interfață" description="Configurați animațiile din interfață" columns={2}>
        <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
          <input
            type="checkbox"
            id="enable-animations"
            className="h-4 w-4 mt-1"
            defaultChecked
          />
          <div className="space-y-1 leading-none">
            <label htmlFor="enable-animations" className="font-medium">Activează Animații</label>
            <p className="text-sm text-muted-foreground">
              Activează animațiile pentru tranziții și efecte vizuale
            </p>
          </div>
        </div>

        <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
          <input
            type="checkbox"
            id="reduce-motion"
            className="h-4 w-4 mt-1"
          />
          <div className="space-y-1 leading-none">
            <label htmlFor="reduce-motion" className="font-medium">Reduce Mișcările</label>
            <p className="text-sm text-muted-foreground">
              Reduce intensitatea animațiilor pentru accesibilitate
            </p>
          </div>
        </div>
      </FormSection>
    </SettingCard>
  );

  // Render colors tab content
  const renderColorsTab = () => (
    <SettingCard
      title="Culori Personalizate"
      description="Personalizați culorile interfeței și alegeți paleta de culori dorită."
    >
      <FormSection title="Presetări Culori" description="Alegeți o paletă predefinită de culori" columns={1}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {colorPresets.map((preset, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => selectPreset(index)}
            >
              <h3 className="font-medium mb-2">{preset.name}</h3>
              <div className="flex gap-2 mb-3">
                {Object.values(preset.colors).map((color, i) => (
                  <div
                    key={i}
                    className="h-6 w-6 rounded-full border"
                    style={{ backgroundColor: color }}
                  ></div>
                ))}
              </div>
              <div
                className="h-12 border rounded-md p-2 text-xs"
                style={getPreviewStyle(index)}
              >
                Previzualizare text
              </div>
            </div>
          ))}
        </div>
      </FormSection>

      <FormSection title="Personalizare Culori" description="Personalizați propriile culori pentru interfață" columns={1}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-3">Culoare Primară</h3>
            <HexColorPicker 
              color={selectedColor}
              onChange={handleColorChange}
              className="w-full"
            />
            <div className="mt-2">
              <Input 
                value={selectedColor}
                onChange={(e) => handleColorChange(e.target.value)}
              />
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-3">Previzualizare</h3>
            <div
              className="border rounded-lg p-4 h-64"
              style={getPreviewStyle(null, selectedColor)}
            >
              <h4 
                className="text-lg font-bold mb-2"
                style={{ color: "var(--theme-primary)" }}
              >
                Titlu cu Culoarea Primară
              </h4>
              <p className="mb-3">
                Text normal în tema personalizată. Culoarea textului este adaptată la fundalul ales.
              </p>
              <div className="border p-3 rounded-md mb-4">
                Acest container arată cum vor arăta containerele în tema aleasă.
              </div>
              <Button
                className="w-full"
                style={{
                  backgroundColor: "var(--theme-primary)",
                  color: "#fff",
                }}
              >
                Buton Acțiune
              </Button>
            </div>
          </div>
        </div>
      </FormSection>
    </SettingCard>
  );

  // Render fonts tab content
  const renderFontsTab = () => (
    <SettingCard
      title="Fonturi"
      description="Personalizați fonturile utilizate în aplicație."
    >
      <FormSection title="Font Principal" description="Alegeți fontul principal folosit în întreaga aplicație" columns={1}>
        <div className="space-y-4">
          <div className="w-full max-w-md">
            <Select defaultValue="inter">
              <SelectTrigger>
                <SelectValue placeholder="Selectează fontul" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inter">Inter</SelectItem>
                <SelectItem value="roboto">Roboto</SelectItem>
                <SelectItem value="opensans">Open Sans</SelectItem>
                <SelectItem value="poppins">Poppins</SelectItem>
                <SelectItem value="lato">Lato</SelectItem>
                <SelectItem value="system">Font Sistem</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">Previzualizare Font</h3>
            <div className="border rounded-lg p-4 space-y-4">
              <div className="space-y-1">
                <div className="text-2xl font-bold">Titlu Mare</div>
                <div className="text-muted-foreground text-sm">Font: Inter Bold 24px</div>
              </div>
              <div className="space-y-1">
                <div className="text-xl font-semibold">Titlu Secundar</div>
                <div className="text-muted-foreground text-sm">Font: Inter SemiBold 20px</div>
              </div>
              <div className="space-y-1">
                <div className="text-base">Text Normal</div>
                <div className="text-muted-foreground text-sm">Font: Inter Regular 16px</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm">Text Mic</div>
                <div className="text-muted-foreground text-sm">Font: Inter Regular 14px</div>
              </div>
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection title="Fonturi Adiționale" description="Personalizați fonturile pentru diferite tipuri de conținut" columns={2}>
        <div className="space-y-2">
          <h3 className="font-medium">Font pentru Titluri</h3>
          <Select defaultValue="inter">
            <SelectTrigger>
              <SelectValue placeholder="Selectează fontul" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inter">Inter</SelectItem>
              <SelectItem value="roboto">Roboto</SelectItem>
              <SelectItem value="playfair">Playfair Display</SelectItem>
              <SelectItem value="montserrat">Montserrat</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">Font pentru Text</h3>
          <Select defaultValue="inter">
            <SelectTrigger>
              <SelectValue placeholder="Selectează fontul" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inter">Inter</SelectItem>
              <SelectItem value="roboto">Roboto</SelectItem>
              <SelectItem value="opensans">Open Sans</SelectItem>
              <SelectItem value="lato">Lato</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">Font pentru Cod</h3>
          <Select defaultValue="menlo">
            <SelectTrigger>
              <SelectValue placeholder="Selectează fontul" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="menlo">Menlo</SelectItem>
              <SelectItem value="monospace">Monospace</SelectItem>
              <SelectItem value="firacode">Fira Code</SelectItem>
              <SelectItem value="consolas">Consolas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FormSection>
    </SettingCard>
  );

  // Render logos tab content
  const renderLogosTab = () => (
    <SettingCard
      title="Logo-uri"
      description="Gestionați logo-urile utilizate în aplicație."
    >
      <FormSection title="Logo Principal" description="Încărcați și gestionați logo-ul principal al aplicației" columns={1}>
        <div className="space-y-4">
          <div className="border rounded-lg p-6 flex flex-col items-center">
            <div className="w-32 h-32 bg-slate-100 rounded-lg flex items-center justify-center mb-6">
              <Image className="w-12 h-12 text-slate-400" />
            </div>
            <div className="space-y-3 w-full max-w-md">
              <Button className="w-full">Încarcă Logo</Button>
              <p className="text-xs text-muted-foreground text-center">
                Formate acceptate: SVG, PNG, JPG. Dimensiune maximă: 2MB.
                Recomandat: 200x200px, fundal transparent.
              </p>
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection title="Logo-uri Adiționale" description="Gestionați logo-uri alternative și favicon" columns={2}>
        <div className="border rounded-lg p-4 flex flex-col items-center">
          <h3 className="font-medium mb-3">Logo Monocrom</h3>
          <div className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
            <Image className="w-8 h-8 text-slate-400" />
          </div>
          <Button variant="outline" size="sm" className="w-full">Încarcă</Button>
        </div>

        <div className="border rounded-lg p-4 flex flex-col items-center">
          <h3 className="font-medium mb-3">Favicon</h3>
          <div className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
            <Image className="w-8 h-8 text-slate-400" />
          </div>
          <Button variant="outline" size="sm" className="w-full">Încarcă</Button>
        </div>
      </FormSection>
    </SettingCard>
  );

  // Render active tab content
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case "themes":
        return renderThemesTab();
      case "appearance":
        return renderAppearanceTab();
      case "colors":
        return renderColorsTab();
      case "fonts":
        return renderFontsTab();
      case "logos":
        return renderLogosTab();
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <PageHeader
        title="Aspect & Teme"
        description="Personalizați aspectul și tema aplicației."
        breadcrumbs={[{ title: "Aspect & Teme" }]}
        actions={
          <Button onClick={openNewThemeDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Temă Nouă
          </Button>
        }
      />

      <TabsNav
        tabs={themeTabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {renderActiveTabContent()}
      {themeDialog}
    </div>
  );
}