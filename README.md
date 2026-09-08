# Prieskumník štruktúr pre logiku prvého rádu

Tento repozitár obsahuje zdrojové súbory aplikácie Prieskumník štruktúr,
ktorá umožňuje vytvárať a upravovať štruktúry pre jazyky logiky prvého
rádu a skúmať pravdivosť formúl a hodnoty termov v nich.

## Inštalácia

Aplikácia sa dá spustiť lokálne po vykonaní nasledovných krokov:

```shell
git clone https://github.com/FMFI-UK-1-AIN-412/structure-explorer.git
cd structure-explorer
npm install
```

Po úspešnom nainštalovaní spustíme virtuálny server pomocou príkazu:

```shell
npm run dev
```

Po tomto kroku bude aplikácia bežať na porte `localhost:5173`.

## Build

Existuje viacero spôsobov buildu:

- `npm run build` vytvorí _produkčnú_ verziu knižnice v adresári `dist`.
- `npm run build:demo` vytvorí v adresári `dist-demo` _ukážkovú_ verziu aplikácie.
- `npm run build:dev-lib` pri spustení a následne pri každej zmene zdrojových súborov vytvorí _vývojovú_
  verziu knižnice. Výstupná knižnica sa nachádza v susednom adresári `../structure-explorer-dev-lib/dist`.

Príkazy `npm pack` a `npm publish` cez script `prepack` najprv spustia `npm run build`.
Do npm balíka sa zahrnie knižnica z `dist`.

Vývojovú knižnicu z `build:dev-lib` možno použiť v inom projekte cez `npm link`:

```shell
cd ../iny-projekt
npm link ../structure-explorer-dev-lib
```

> Ukážkovú verziu je možné po builde spustiť lokálne príkazom `npm run preview`.
> Príkaz `npm run deploy` najprv spustí build ukážkovej aplikácie a následne ju zverejní na GitHub Pages.

## Migrácie

Každá zmena štruktúry exportovaného stavu vyžaduje vytvorenie migrácie zabezpečujúcej spätnú kompatibilitu s predchádzajúcimi verziami. 
Migrácie sa aplikujú automaticky pri načítaní staršej verzie stavu a prevedú ju na aktuálnu verziu.

### Pridanie migrácie

Napríklad na zmenu štruktúry exportovaného stavu `language` pri aktuálnej verzii 2 by bolo 
v `src/features/import/migrations` potrebné vykonať nasledujúce kroky:

1. Skopírovať pôvodnú validačnú schému stavu `language` do `oldSchemas/language.v2.ts`.
2. Vo `versions.ts` nasmerovať na kópiu z kroku 1 všetky schémy, ktoré doteraz odkazovali na pôvodnú schému `language`.
3. Aktualizovať validačnú schému stavu `language` v `src/features/language/validationSchema.ts`.
4. Vo `versions.ts` pridať `v3Fields = { ...v2Fields, language: serializedLanguageStateSchema }`, 
exportovať `V3Fields`/`V3State`, nastaviť `SERIALIZED_STATE_VERSION = 3` a `currentFields = v3Fields`.
5. Napísať samotnú migráciu do súboru `steps/v2_to_v3.ts` ako `Migration<V2Fields, V3Fields>` 
a pridať ju v `index.ts` do `migrationSteps` (`[..., step(2, v2Fields, <migrácia>)]`).
6. Ak sa zmenil default daného slice-u, upraviť aj defaulty vo `../validationSchema.ts`.

## História

Aplikácia vznikla v rokoch 2017–2018 v rámci bakalárskej práce Milana Cifru
<cite>Prieskumník sémantiky logiky prvého rádu</cite>.
V rokoch 2019–2020 ju Miroslav Baluch rozšíril o grafový pohľad na štruktúry
v rámci svojej bakalárskej práce s názvom <cite>Prieskumník grafových
štruktúr pre logiku prvého rádu</cite>. V rokoch 2020–2021 Richard Tóth
pridal do prieskumníka Henkinovu-Hintikkovu hru v rámci svojej bakalárskej
práce <cite>Henkinova-Hintikkova hra v prieskumníku štruktúr</cite>.

Neskôr aplikáciu nanovo implementoval Jozef Filip vo svojej bakalárskej práci 
<cite>Reimplementácia prieskumníka štruktúr pre logiku prvého rádu</cite> 
v rokoch 2024–2025, avšak bez pôvodného grafového pohľadu. Reimplementovanú verziu ďalej 
rozšíril Jakub Marček o grafové, ale aj iné alternatívne editory interpretácií predikátov a funkcií 
vo svojej bakalárskej práci <cite>Grafové editory pre prieskumník štruktúr 
logiky prvého rádu</cite> v rokoch 2025–2026.
