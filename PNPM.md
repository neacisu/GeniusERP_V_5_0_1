# ⚠️ IMPORTANT: Acest proiect folosește PNPM

Acest proiect folosește **pnpm** ca package manager, **NU npm sau yarn**.

## De ce pnpm?

- ⚡ **Mai rapid**: Instalări 2-3x mai rapide decât npm
- 💾 **Economisește spațiu**: Store global partajat între proiecte
- 🔒 **Mai sigur**: Strict dependency resolution
- 📦 **Workspace support**: Perfect pentru monorepo-uri

## Instalare pnpm

```bash
npm install -g pnpm@latest
```

## Comenzi uzuale

```bash
# Instalare dependențe
pnpm install

# Adăugare pachet
pnpm add <package-name>
pnpm add -D <package-name>  # dev dependency

# Rulare scripturi
pnpm run dev
pnpm run build
pnpm run test

# Actualizare dependențe
pnpm update
pnpm update <package-name>

# Curățare
pnpm store prune
```

## Prevenirea utilizării accidentale a npm

Proiectul include protecții automate:

1. **package.json** conține `"packageManager": "pnpm@10.19.0"`
2. **engines** specifică `"npm": "please-use-pnpm"`
3. **preinstall hook** blochează `npm install`

## Documentație

- [pnpm.io](https://pnpm.io)
- [pnpm CLI](https://pnpm.io/cli/install)
- [pnpm Workspaces](https://pnpm.io/workspaces)
